import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTI0MDc4ODAsInN1YiI6IjljY2JkNTA1LTRiYzUtNDdlZS1iZDZmLTFlMjQyNmI4ZjI4MiIsInVzZXJuYW1lIjoiZXh0cmEyMDI2MDkyNS0yMzEyMTMiLCJyb2xlIjoiU0FMRVMiLCJpc3MiOiJFc3RhdGVDUk0iLCJpYXQiOjE3OTIzMjE0ODB9.7-ijXvDYXDBmLjPaTQR1n_LoufsOcJUq3J1NLhdgnig';

  await page.evaluate((tok) => {
    localStorage.setItem('dxmt.access', tok);
    localStorage.setItem('dxmt.refresh', tok);
    localStorage.setItem('dxmt.user', JSON.stringify({
      id: '9ccbd505-4bc5-47ee-bd6f-1e2426b8f282',
      username: 'extra20260925-231213',
      fullName: 'Nguyễn Văn Sales',
      role: 'SALES'
    }));
  }, token);

  console.log('Navigating to leaderboard page...');
  await page.goto('http://localhost:5173/reports/leaderboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const outPath = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\206808c2-d296-4f91-a685-9d678d2711ee\\leaderboard_current.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Screenshot saved to:', outPath);

  await browser.close();
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
