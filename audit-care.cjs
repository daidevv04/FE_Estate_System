const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\206808c2-d296-4f91-a685-9d678d2711ee';
const BASE_URL = 'http://localhost:5173';

const SALES_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiU0FMRVMiLCJzdWIiOiJlNDRkNWM4OS04ZDFlLTQ1ODEtYmNmYS0yNGNiMTE4YTE0MWUiLCJleHAiOjE3OTIyMTk4MDYsImlhdCI6MTc5MjEzMzQwNn0.sampleSalesTokenSignature';
const SALES_USER = JSON.stringify({
  id: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
  username: 'demo1',
  fullName: 'Nguyễn Văn Sales',
  email: 'sales.demo1@dxmt.vn',
  role: 'SALES'
});

const MOCK_CUSTOMERS = {
  content: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      fullName: 'Trần Đình Trọng',
      phone: '0905123456',
      email: 'trong.td@gmail.com',
      demandType: 'BUY',
      source: 'Facebook Ads',
      ownerId: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      status: 'POTENTIAL',
      createdAt: '2026-03-10T08:30:00Z',
      updatedAt: '2026-03-15T14:20:00Z'
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      fullName: 'Võ Thị Mai Phương',
      phone: '0912345678',
      email: 'phuong.vo@yahoo.com',
      demandType: 'INVEST',
      source: 'Sự kiện mở bán',
      ownerId: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      status: 'CUSTOMER',
      createdAt: '2026-02-18T10:15:00Z',
      updatedAt: '2026-03-16T11:00:00Z'
    }
  ],
  totalElements: 2,
  totalPages: 1,
  size: 50,
  number: 0
};

const MOCK_CARES = {
  content: [
    {
      id: 'care-001',
      customerId: 'c1111111-1111-1111-1111-111111111111',
      customerName: 'Trần Đình Trọng',
      customerPhone: '0905123456',
      type: 'CALL',
      content: 'Gọi tư vấn tiến độ căn liền kề Regal Legend và chính sách chiết khấu 7% trong đợt thanh toán tháng 3. Khách hàng quan tâm và hẹn gặp trực tiếp tại sàn giao dịch.',
      createdBy: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      createdAt: '2026-10-17T09:15:00Z'
    },
    {
      id: 'care-002',
      customerId: 'c1111111-1111-1111-1111-111111111111',
      customerName: 'Trần Đình Trọng',
      customerPhone: '0905123456',
      type: 'MEETING',
      content: 'Gặp gỡ khách hàng tại văn phòng Đà Nẵng, phân tích tiềm năng tăng giá shophouse ven sông và bàn giao brochure chi tiết.',
      createdBy: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      createdAt: '2026-10-15T15:45:00Z'
    },
    {
      id: 'care-003',
      customerId: 'c2222222-2222-2222-2222-222222222222',
      customerName: 'Võ Thị Mai Phương',
      customerPhone: '0912345678',
      type: 'EMAIL',
      content: 'Gửi bảng tính dòng tiền và phương án hỗ trợ lãi suất 0% trong 24 tháng cho khách qua email phuong.vo@yahoo.com.',
      createdBy: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      createdAt: '2026-10-12T11:20:00Z'
    },
    {
      id: 'care-004',
      customerId: 'c2222222-2222-2222-2222-222222222222',
      customerName: 'Võ Thị Mai Phương',
      customerPhone: '0912345678',
      type: 'NOTE',
      content: 'Khách hàng có kế hoạch giải ngân nguồn vốn kinh doanh vào đầu quý 4 để đặt cọc thêm 1 lô đất nền biệt thự đảo.',
      createdBy: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      createdAt: '2026-10-10T16:00:00Z'
    }
  ],
  totalElements: 4,
  totalPages: 1,
  size: 50,
  number: 0
};

async function run() {
  console.log('--- KHỞI CHẠY AUDIT KIỂM THỬ NHẬT KÝ CHĂM SÓC KHÁCH HÀNG (SALES) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Inject token before any page load
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('dxmt.access', token);
    localStorage.setItem('dxmt.refresh', token);
    localStorage.setItem('dxmt.user', user);
    sessionStorage.setItem('dxmt.access', token);
    sessionStorage.setItem('dxmt.refresh', token);
    sessionStorage.setItem('dxmt.user', user);
  }, { token: SALES_TOKEN, user: SALES_USER });

  const page = await context.newPage();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, *',
  };

  // Intercept all cross-origin requests to API Gateway
  await page.route(/http:\/\/localhost:8080\/api\/.*/, async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
      return;
    }

    if (url.includes('/customers/cares')) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CARES),
      });
      return;
    }

    if (url.includes('/customers') && url.includes('/cares')) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CARES),
      });
      return;
    }

    if (url.includes('/users')) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { id: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e', fullName: 'Nguyễn Văn Sales', role: 'SALES' },
          { id: 'm1111111-1111-1111-1111-111111111111', fullName: 'Trưởng Phòng Kinh Doanh', role: 'MANAGER' }
        ]),
      });
      return;
    }

    if (url.match(/\/customers\/[a-zA-Z0-9-]+$/)) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CUSTOMERS.content[0]),
      });
      return;
    }

    if (url.includes('/customers')) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CUSTOMERS),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [] }),
    });
  });

  // Step 1: Open Customer Care Page
  console.log('[Step 1] Mở trang /customer-cares...');
  await page.goto(`${BASE_URL}/customer-cares`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const screenshot1 = path.join(ARTIFACT_DIR, 'care_1_page_table.png');
  await page.screenshot({ path: screenshot1, fullPage: false });
  console.log('-> Đã chụp:', screenshot1);

  // Step 2: Switch to Timeline View
  console.log('[Step 2] Chuyển view sang Dòng thời gian...');
  await page.locator('.ant-segmented-item:has-text("Dòng thời gian")').click();
  await page.waitForTimeout(1000);

  const screenshot2 = path.join(ARTIFACT_DIR, 'care_2_page_timeline.png');
  await page.screenshot({ path: screenshot2, fullPage: false });
  console.log('-> Đã chụp:', screenshot2);

  // Step 3: Open create modal
  console.log('[Step 3] Mở modal Ghi nhận chăm sóc...');
  await page.click('button:has-text("Ghi nhận chăm sóc")');
  await page.waitForTimeout(1000);

  const screenshot3 = path.join(ARTIFACT_DIR, 'care_3_modal_create.png');
  await page.screenshot({ path: screenshot3, fullPage: false });
  console.log('-> Đã chụp:', screenshot3);

  // Close create modal
  await page.click('.ant-modal-close');
  await page.waitForTimeout(500);

  // Step 4: Switch back to table and click customer link
  console.log('[Step 4] Mở chi tiết khách hàng và kiểm tra Timeline trong modal...');
  await page.locator('.ant-segmented-item:has-text("Bảng dữ liệu")').click();
  await page.waitForTimeout(500);

  const customerLink = page.locator('.customer-care-page__customer-link').first();
  if (await customerLink.isVisible()) {
    await customerLink.click();
    await page.waitForTimeout(1000);
    // Scroll modal body down to show timeline
    await page.evaluate(() => {
      const modalBody = document.querySelector('.customer-detail-modal .ant-modal-body');
      if (modalBody) modalBody.scrollTop = modalBody.scrollHeight;
    });
    await page.waitForTimeout(600);
    const screenshot4 = path.join(ARTIFACT_DIR, 'care_4_customer_detail_timeline.png');
    await page.screenshot({ path: screenshot4, fullPage: false });
    console.log('-> Đã chụp:', screenshot4);
  }

  await browser.close();
  console.log('--- HOÀN THÀNH AUDIT THÀNH CÔNG ---');
}

run().catch((err) => {
  console.error('Audit thất bại:', err);
  process.exit(1);
});
