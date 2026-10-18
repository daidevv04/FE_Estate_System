import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
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

  console.log('Navigating to commissions page...');
  await page.goto('http://localhost:5173/commissions', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Click expand buttons via DOM evaluation
  const clickedCount = await page.evaluate(() => {
    const btns = document.querySelectorAll('.ant-table-row-expand-icon');
    let count = 0;
    btns.forEach(b => {
      b.click();
      count++;
    });
    return count;
  });
  console.log(`Clicked ${clickedCount} expand buttons.`);

  await page.waitForTimeout(1500);

  const outPath = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\206808c2-d296-4f91-a685-9d678d2711ee\\sales_commission_expanded.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Expanded screenshot saved to:', outPath);

  await browser.close();
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
