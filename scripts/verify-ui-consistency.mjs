import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseURL = process.env.UI_BASE_URL ?? 'http://127.0.0.1:5178'
const baseline = process.argv.includes('--audit')
const output = 'output/playwright/ui-consistency'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, first: true, last: true }
const user = { id: 'ui-fixture-user', username: 'ui-review', fullName: 'Nguyễn Minh Anh', role: 'ADMIN' }
const legacyCommission = {
  id: 'legacy-commission', dealId: 'legacy-deal', salesId: user.id,
  contractValue: 3500000000, commissionRate: 2.5, commissionAmount: 87500000,
  bonusAmount: 0, totalExpected: 87500000, totalPaid: 0, status: 'APPROVED',
  createdAt: '2026-10-01T09:00:00', milestones: [],
}
const leaderboard = {
  period: 'MONTH', year: 2026, month: 10, teamTargetRevenue: 30000000000,
  teamAchievedRevenue: 18750000000, teamPacingRate: 62.5, totalDealsCount: 8,
  items: ['Nguyễn Minh Anh', 'Trần Hoàng Nam', 'Lê Thu Hà', 'Phạm Tuấn Anh'].map((name, i) => ({
    rank: i + 1, salesId: `fixture-${i}`, salesName: name, dealsCount: 4 - i,
    totalRevenue: [8250000000, 5100000000, 3400000000, 2000000000][i],
    totalCommission: [206250000, 127500000, 85000000, 50000000][i],
    badge: ['GOLD', 'SILVER', 'BRONZE', 'STANDARD'][i],
  })),
}

async function openPage({ role = 'ADMIN', width = 1440, mode = 'ready' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
  await context.addInitScript((account) => {
    sessionStorage.setItem('dxmt.access', 'ui-fixture-access')
    sessionStorage.setItem('dxmt.user', JSON.stringify(account))
  }, { ...user, role })
  let currentMode = mode
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.startsWith('/api/')) {
      const endpoint = url.pathname.split('/api')[1]
      if (endpoint === '/notifications/stream') return route.fulfill({ contentType: 'text/event-stream', body: 'event: init\ndata: {}\n\n' })
      assert.equal(route.request().method(), 'GET', `Unexpected API write: ${endpoint}`)
      if ((endpoint === '/reports/leaderboard' || endpoint === '/customers') && currentMode === 'loading') await new Promise((resolve) => setTimeout(resolve, 3500))
      if (endpoint === '/reports/leaderboard' && currentMode === 'error') return route.fulfill({ status: 500, json: { message: 'Không thể tải bảng xếp hạng' } })
      let body = emptyPage
      if (endpoint === '/users/me' || endpoint === '/users/ui-fixture-user') body = { ...user, role, email: 'ui@example.invalid', status: 'ACTIVE', createdAt: '2026-10-01T09:00:00' }
      else if (endpoint === '/users' || endpoint.includes('my-managed-user-ids') || endpoint.endsWith('/payments') || endpoint.endsWith('/schedules') || endpoint.endsWith('/sessions')) body = []
      else if (currentMode === 'legacy' && endpoint === '/deals/legacy-deal') body = {
        id: legacyCommission.dealId, salesId: user.id, contractCode: 'HD-LEGACY',
        contractValue: legacyCommission.contractValue, depositAmount: 0,
        status: 'ACTIVE', paymentStatus: 'UNPAID', approvalStatus: 'APPROVED',
        createdAt: legacyCommission.createdAt, updatedAt: legacyCommission.createdAt,
      }
      else if (currentMode === 'legacy' && endpoint === '/deals/legacy-deal/commission') body = legacyCommission
      else if (endpoint.startsWith('/commissions')) body = {
        commissions: currentMode === 'legacy' ? [legacyCommission] : [],
        summary: { totalExpected: currentMode === 'legacy' ? legacyCommission.totalExpected : 0, totalPaid: 0, totalEligible: 0, totalPending: 0 },
      }
      else if (endpoint === '/reports/leaderboard') body = currentMode === 'empty' ? { ...leaderboard, teamAchievedRevenue: 0, teamPacingRate: 0, totalDealsCount: 0, items: [] } : leaderboard
      else if (endpoint.includes('summary')) body = { totalOutstanding: 0, overdueAmount: 0, overdueDealsCount: 0, buckets: [], stages: [], items: [] }
      return route.fulfill({ json: body })
    }
    if (url.origin === baseURL || url.protocol === 'data:') return route.continue()
    return route.abort()
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  return { page, context, errors, setMode: (value) => { currentMode = value } }
}

async function visit(page, path) {
  await page.goto(`${baseURL}${path}`)
  try {
    await page.locator('.app-shell').waitFor({ timeout: 10000 })
  } catch {
    await page.screenshot({ path: `${output}/failure-${path.replaceAll('/', '-')}.png`, fullPage: true })
    throw new Error(`${path}: app shell missing. ${await page.locator('body').innerText()}`)
  }
  await page.waitForTimeout(600)
}

try {
  for (const width of [1440, 390]) {
    const { page, context, errors } = await openPage({ width })
    for (const path of ['/dashboard', '/customers', '/customer-cares', '/appointments', '/projects', '/products', '/leads', '/deals', '/commissions', '/email-templates', '/reports/leaderboard', '/reports/sales-performance', '/reports/pipeline-summary', '/reports/revenue', '/reports/project-performance', '/notifications', '/admin/users']) {
      await visit(page, path)
      await page.screenshot({ path: `${output}/${baseline ? 'audit' : 'after'}-${path.replaceAll('/', '-').slice(1)}-${width}.png`, fullPage: true })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      const offenders = overflow > 1 ? await page.evaluate(() => [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed')
        .slice(0, 8).map((el) => ({ tag: el.tagName, class: String(el.className), right: el.getBoundingClientRect().right }))) : []
      results.push({ path, width, overflow, offenders, errors: [...errors] })
      if (!baseline) {
        assert.deepEqual(errors, [], `${path} runtime errors`)
        assert.ok(overflow <= 1, `${path} overflows viewport by ${overflow}px at ${width}`)
      }
    }
    await context.close()
  }
  if (!baseline) {
    const { page, context } = await openPage({ width: 390 })
    await visit(page, '/email-templates')
    assert.ok((await page.locator('body').innerText()).includes('0 - 0'), 'Empty pagination must show 0 - 0')
    await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
    const navigation = page.getByRole('dialog', { name: 'Điều hướng' })
    await navigation.waitFor()
    await navigation.getByText('Dự án', { exact: true }).click()
    await page.waitForURL('**/projects')
    await navigation.waitFor({ state: 'hidden' })
    results.push({ check: 'mobile-drawer-navigation', passed: true })
    await context.close()

    for (const role of ['ADMIN', 'MANAGER', 'SALES']) {
      const { page, context, errors } = await openPage({ role })
      await visit(page, '/reports/leaderboard')
      assert.equal(await page.locator('.app-sidebar-menu').getByText('Doanh thu', { exact: true }).count(), role === 'ADMIN' ? 1 : 0)
      assert.equal(await page.locator('.app-sidebar-menu').getByText('Hiệu suất Sales', { exact: true }).count(), role === 'SALES' ? 0 : 1)
      assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1)
      await page.getByRole('button', { name: 'Tài khoản Nguyễn Minh Anh', exact: true }).focus()
      await page.keyboard.press('Enter')
      await page.getByRole('menuitem', { name: 'Hồ sơ cá nhân' }).waitFor()
      await page.keyboard.press('Escape')
      await page.locator('.page-header__breadcrumb').getByRole('link', { name: 'Tổng quan', exact: true }).click()
      await page.waitForURL('**/dashboard')
      assert.deepEqual(errors, [])
      results.push({ check: 'role-navigation-keyboard-breadcrumb', role, passed: true })
      await context.close()
    }

    for (const mode of ['loading', 'error', 'empty']) {
      const { page, context, errors, setMode } = await openPage({ mode })
      await visit(page, '/reports/leaderboard')
      if (mode === 'loading') {
        await page.getByLabel('Đang tải bảng xếp hạng').waitFor()
        assert.equal(await page.locator('.crm-leaderboard__content').count(), 0)
        await page.screenshot({ path: `${output}/state-loading.png`, fullPage: true })
        await page.getByText('Nhân viên dẫn đầu', { exact: true }).waitFor()
      } else if (mode === 'error') {
        await page.getByRole('alert').filter({ hasText: 'Không thể tải bảng xếp hạng' }).waitFor()
        assert.equal(await page.locator('.crm-leaderboard__content').count(), 0)
        assert.equal(await page.getByRole('button', { name: /Xuất CSV/ }).isDisabled(), true)
        await page.screenshot({ path: `${output}/state-error.png`, fullPage: true })
        setMode('ready')
        await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
        await page.getByText('Nhân viên dẫn đầu', { exact: true }).waitFor()
      } else {
        await page.getByText('Chưa có doanh số được ghi nhận trong kỳ này', { exact: true }).waitFor()
        assert.equal(await page.locator('.crm-podium-entry').count(), 0)
        await page.screenshot({ path: `${output}/state-empty.png`, fullPage: true })
      }
      assert.deepEqual(errors, [])
      results.push({ check: 'leaderboard-state', mode, passed: true })
      await context.close()
    }

    for (const role of ['ADMIN', 'SALES']) {
      const { page, context, errors } = await openPage({ role, mode: 'legacy' })
      await visit(page, '/commissions')
      await page.getByRole('alert').filter({ hasText: 'Có 1 khoản hoa hồng cũ chưa có lịch giải ngân' }).waitFor()
      assert.equal(await page.getByText('Không thể tải dữ liệu hoa hồng', { exact: true }).count(), 0)
      for (const label of ['Đủ điều kiện, chờ chi', 'Chờ khách thanh toán']) {
        assert.equal(await page.locator('.crm-kpi').filter({ hasText: label }).getByText('—', { exact: true }).count(), 1)
      }
      assert.equal(await page.getByRole('button', { name: /^(Duyệt chi|Chi trả tiền)$/ }).count(), 0)
      if (role === 'SALES') await page.getByText('Đã duyệt (dữ liệu cũ)', { exact: true }).waitFor()
      await page.screenshot({ path: `${output}/legacy-commissions-${role.toLowerCase()}.png`, fullPage: true })
      assert.deepEqual(errors, [])
      results.push({ check: 'legacy-commissions-preserve-state', role, passed: true })
      await visit(page, '/deals/legacy-deal')
      await page.getByText('Đã duyệt (dữ liệu cũ)', { exact: true }).waitFor()
      await page.getByText('Khoản hoa hồng cũ chưa có lịch giải ngân; cần đối soát trước khi duyệt chi.', { exact: true }).waitFor()
      assert.equal(await page.getByRole('button', { name: /^(Duyệt chi|Chi trả)$/ }).count(), 0)
      assert.deepEqual(errors, [])
      await page.screenshot({ path: `${output}/legacy-deal-commission-${role.toLowerCase()}.png`, fullPage: true })
      results.push({ check: 'legacy-deal-commission-preserve-state', role, passed: true })
      await context.close()
    }

    const security = await openPage()
    await visit(security.page, '/profile/security')
    await security.page.waitForURL('**/profile#security')
    await security.page.locator('#security').waitFor()
    assert.equal(await security.page.locator('#security').evaluate((element) => document.activeElement === element), true)
    results.push({ check: 'security-route-focus', passed: true })
    await security.context.close()

    const loadingKpis = await openPage({ mode: 'loading' })
    await visit(loadingKpis.page, '/customers')
    assert.equal(await loadingKpis.page.locator('.crm-kpi[aria-busy="true"]').count(), 4)
    await loadingKpis.page.locator('.crm-kpi[aria-busy="true"]').first().waitFor({ state: 'hidden' })
    results.push({ check: 'kpi-loading', passed: true })
    await loadingKpis.context.close()
  }
  await writeFile(`${output}/${baseline ? 'audit' : 'results'}.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify({ auditOnly: baseline, viewports: results.filter((result) => result.path).length, checks: results.length, results }, null, 2))
} finally {
  await writeFile(`${output}/${baseline ? 'audit' : 'results'}.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
