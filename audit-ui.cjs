const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\206808c2-d296-4f91-a685-9d678d2711ee';
const BASE_URL = 'http://localhost:5173';

const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiI1Y2RkMjczNy00MTAyLTQ2MWYtODBhZC05YmY1OGU5MTdmYzQiLCJleHAiOjE3OTIyMTk4MDYsImlhdCI6MTc5MjEzMzQwNn0.li8t31UT4gMMDL5pB4jCbq3XFQKjJcrSPvN2GE2trM8';
const ADMIN_USER = JSON.stringify({
  id: '5cdd2737-4102-461f-80ad-9bf58e917fc4',
  username: 'admin',
  fullName: 'Quản trị viên Hệ thống',
  email: 'trananhdai.itqnu@gmail.com',
  role: 'ADMIN'
});

async function runAudit() {
  console.log('--- KHỞI ĐỘNG BROWSER SUBAGENT AUDIT UI/UX ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Listen to console errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Step 0: Set local storage credentials before navigation
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('dxmt.access', token);
    localStorage.setItem('dxmt.refresh', token);
    localStorage.setItem('dxmt.user', user);
    sessionStorage.setItem('dxmt.access', token);
    sessionStorage.setItem('dxmt.refresh', token);
    sessionStorage.setItem('dxmt.user', user);
  }, { token: ADMIN_TOKEN, user: ADMIN_USER });

  console.log('[Task 1] Review Dashboard & AppShell...');
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_1_dashboard.png'), fullPage: false });

  console.log('[Task 2] Review Customers & Marquee Selection...');
  await page.goto(`${BASE_URL}/customers`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  // Perform mouse drag to select rows
  const table = await page.$('.ant-table-tbody');
  if (table) {
    const box = await table.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 180, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_2_customers_selection.png'), fullPage: false });

  console.log('[Task 3] Review Deals & Pipeline...');
  await page.goto(`${BASE_URL}/deals`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  // Test drag on Deals
  const dealsTable = await page.$('.ant-table-tbody');
  if (dealsTable) {
    const box = await dealsTable.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 160, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_3_deals_selection.png'), fullPage: false });

  // Appointments calendar
  await page.goto(`${BASE_URL}/appointments`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_3_appointments.png'), fullPage: false });

  // Leads pipeline
  await page.goto(`${BASE_URL}/leads`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_3_leads_pipeline.png'), fullPage: false });

  console.log('[Task 4] Review Users / Staff & Projects...');
  await page.goto(`${BASE_URL}/admin/users`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  const usersTable = await page.$('.ant-table-tbody');
  if (usersTable) {
    const box = await usersTable.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 150, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_4_users.png'), fullPage: false });

  await page.goto(`${BASE_URL}/projects`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_4_projects.png'), fullPage: false });

  console.log('[Task 5] Review Notifications & Email Templates...');
  await page.goto(`${BASE_URL}/notifications`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);

  const notifTable = await page.$('.ant-table-tbody');
  if (notifTable) {
    const box = await notifTable.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 150, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(800);
    }
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_5_notifications.png'), fullPage: false });

  await page.goto(`${BASE_URL}/email-templates`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_5_email_templates.png'), fullPage: false });

  console.log('--- AUDIT FINISHED ---');
  console.log('Console Errors found:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log(consoleErrors.slice(0, 10));
  }

  await browser.close();
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
