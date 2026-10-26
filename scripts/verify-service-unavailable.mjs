import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseURL = process.env.UI_BASE_URL ?? 'http://127.0.0.1:5181'
const friendly = 'Hệ thống tạm thời chưa sẵn sàng. Vui lòng thử lại sau ít phút.'
const output = 'output/playwright/service-unavailable'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []

async function scenario(name, reply, expected, twoFactor = false) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  try {
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/')) {
        if (twoFactor && url.pathname.endsWith('/auth/login')) return route.fulfill({ status: 401, json: { detail: 'Invalid TOTP code' } })
        return reply(route)
      }
      return url.origin === baseURL ? route.continue() : route.abort()
    })
    const page = await context.newPage()
    await page.goto(`${baseURL}/login`)
    await page.locator('input[autocomplete="username"]').fill('ui-fixture-user')
    await page.locator('input[autocomplete="current-password"]').fill('ui-fixture-password')
    await page.locator('button[type="submit"]').click()
    if (twoFactor) {
      await page.locator('input[autocomplete="one-time-code"]').fill('123456')
      await page.locator('button[type="submit"]').click()
    }
    await page.locator('.login-banner--error').waitFor()
    const text = await page.locator('.login-banner--error').innerText()
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true })
    assert.equal(text.trim(), expected, name)
    assert.equal(await page.locator('.login-banner--error > span:last-child').evaluate((element) => element.scrollWidth <= element.clientWidth), true, `${name}: message must not be clipped`)
    assert.doesNotMatch(text, /https?:|localhost|\.internal|CORS|Render|5432/i, name)
    results.push({ name, passed: true })
  } finally {
    await context.close()
  }
}

try {
  await scenario('network-down', (route) => route.abort('connectionrefused'), friendly)
  for (const status of [500, 502, 503, 504]) {
    await scenario(`upstream-${status}`, (route) => route.fulfill({ status, json: { detail: 'Connection refused: private-db.internal:5432 http://private-upstream.internal' } }), friendly)
  }
  await scenario('html-gateway-error', (route) => route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Gateway at private-upstream.internal is unavailable</html>' }), friendly)
  await scenario('wrong-credentials', (route) => route.fulfill({ status: 401, json: { detail: 'Invalid credentials' } }), 'Tên đăng nhập hoặc mật khẩu không đúng')
  await scenario('rate-limit', (route) => route.fulfill({ status: 429, json: { detail: 'Too many requests' } }), 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.')
  await scenario('2fa-unavailable', (route) => route.fulfill({ status: 503, json: { detail: 'private-upstream.internal is offline' } }), friendly, true)
  await scenario('2fa-invalid', (route) => route.fulfill({ status: 401, json: { detail: 'Invalid TOTP code' } }), 'Mã xác thực 2FA không chính xác hoặc đã hết hạn.', true)
  const context = await browser.newContext()
  const page = await context.newPage()
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return url.origin === baseURL ? route.continue() : route.abort()
    return url.pathname.endsWith('/qa-validation')
      ? route.fulfill({ status: 400, json: { detail: 'Tiền cọc vượt giới hạn của mẫu này', errors: ['Vui lòng dùng tiến độ tùy chỉnh'] } })
      : route.fulfill({ status: 500, json: { detail: 'private-db.internal:5432' } })
  })
  await page.goto(`${baseURL}/login`)
  const errors = await page.evaluate(async () => {
    const { api } = await import('/src/api/client.ts')
    const { apiErrorMessage } = await import('/src/features/projects/api.ts')
    const request = async (url, body) => {
      try { await api.post(url, body) } catch (error) {
        return { status: error.response?.status, message: error.message, displayed: apiErrorMessage(error), data: error.response?.data }
      }
    }
    return { server: await request('/qa-unavailable', {}), validation: await request('/qa-validation', {}) }
  })
  assert.equal(errors.server.status, 500)
  assert.equal(errors.server.message, friendly)
  assert.equal(errors.server.displayed, friendly)
  results.push({ name: 'shared-client-server-error', passed: true })
  assert.equal(errors.validation.status, 400)
  assert.deepEqual(errors.validation.data, { detail: 'Tiền cọc vượt giới hạn của mẫu này', errors: ['Vui lòng dùng tiến độ tùy chỉnh'] })
  results.push({ name: 'business-validation-preserved', passed: true })
  await context.close()
  console.log(JSON.stringify({ checks: results.length, results }, null, 2))
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
