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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, *',
};

const MOCK_PROJECTS = {
  content: [
    { id: 'pj-001', name: 'Regal Legend Quảng Bình', status: 'ACTIVE' },
    { id: 'pj-002', name: 'Castia Palm Đà Nẵng', status: 'ACTIVE' }
  ],
  totalElements: 2
};

let productsState = [
  {
    id: 'prod-001',
    projectId: 'pj-001',
    code: 'RL-A101',
    type: 'APARTMENT',
    area: 75,
    block: 'A',
    price: 3500000000,
    bedroom: 2,
    direction: 'SE',
    status: 'AVAILABLE',
    lockedBy: null,
    lockedCustomerId: null,
    lockExpiresAt: null,
    lockDepositAmount: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'prod-002',
    projectId: 'pj-001',
    code: 'RL-A102',
    type: 'APARTMENT',
    area: 90,
    block: 'A',
    price: 4200000000,
    bedroom: 3,
    direction: 'E',
    status: 'SOLD',
    lockedBy: null,
    lockedCustomerId: null,
    lockExpiresAt: null,
    lockDepositAmount: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  }
];

const MOCK_CUSTOMERS = {
  content: [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      fullName: 'Trần Đình Trọng',
      phone: '0905123456',
      email: 'trong.td@gmail.com',
      demandType: 'BUY',
      ownerId: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
      status: 'POTENTIAL',
      createdAt: '2026-03-10T08:30:00Z',
      updatedAt: '2026-03-15T14:20:00Z'
    }
  ],
  totalElements: 1
};

async function run() {
  console.log('--- KHỞI ĐỘNG KIỂM THỬ PLAYWRIGHT GIAI ĐOẠN 2: KHÓA CĂN THEO NGÀY ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('dxmt.access', token);
    localStorage.setItem('dxmt.refresh', token);
    localStorage.setItem('dxmt.user', user);
    sessionStorage.setItem('dxmt.access', token);
    sessionStorage.setItem('dxmt.refresh', token);
    sessionStorage.setItem('dxmt.user', user);
  }, { token: SALES_TOKEN, user: SALES_USER });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  // Mock API routes for localhost:8080/api
  await page.route(/http:\/\/localhost:8080\/api\/.*/, async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    if (url.includes('/projects/my-assigned-ids')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(['pj-001', 'pj-002'])
      });
    }

    if (url.includes('/projects') && !url.includes('/products')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_PROJECTS)
      });
    }

    if (url.includes('/customers')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CUSTOMERS)
      });
    }

    // Lock product API
    if (url.includes('/products/') && url.includes('/lock') && method === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      const prodId = url.split('/products/')[1].split('/lock')[0];
      const prod = productsState.find(p => p.id === prodId);
      if (prod) {
        prod.status = 'RESERVED';
        prod.lockedBy = 'e44d5c89-8d1e-4581-bcfa-24cb118a141e';
        prod.lockedCustomerId = body.customerId;
        prod.lockExpiresAt = body.expiryDate || '2026-10-20';
        prod.lockDepositAmount = body.depositAmount || 0;
      }
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(prod)
      });
    }

    // Unlock product API
    if (url.includes('/products/') && url.includes('/unlock') && method === 'POST') {
      const prodId = url.split('/products/')[1].split('/unlock')[0];
      const prod = productsState.find(p => p.id === prodId);
      if (prod) {
        prod.status = 'AVAILABLE';
        prod.lockedBy = null;
        prod.lockedCustomerId = null;
        prod.lockExpiresAt = null;
        prod.lockDepositAmount = null;
      }
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(prod)
      });
    }

    // Get single product detail
    if (url.match(/\/products\/prod-[0-9]+$/) && method === 'GET') {
      const prodId = url.split('/products/')[1].split('?')[0];
      const prod = productsState.find(p => p.id === prodId);
      if (prod) {
        return route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(prod)
        });
      }
    }

    // Get products list
    if (url.includes('/products')) {
      const statusMatch = url.match(/status=([A-Z_]+)/);
      let filtered = productsState;
      if (statusMatch) {
        filtered = productsState.filter(p => p.status === statusMatch[1]);
      }
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: filtered,
          totalElements: filtered.length
        })
      });
    }

    return route.continue();
  });

  console.log('1. Điều hướng tới trang Quản lý Sản phẩm...');
  await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('2. Kiểm tra căn RL-A101 có trạng thái AVAILABLE và nút Giữ chỗ...');
  const rowA101 = page.locator('tr').filter({ hasText: 'RL-A101' });
  await rowA101.waitFor({ state: 'visible', timeout: 5000 });

  const lockBtn = rowA101.locator('button').filter({ hasText: 'Giữ chỗ' });
  console.log('3. Bấm nút Giữ chỗ trên căn RL-A101...');
  await lockBtn.click();
  await page.waitForTimeout(500);

  // Modal Giữ chỗ xuất hiện
  const modal = page.locator('.ant-modal').filter({ hasText: 'Khóa căn: RL-A101' });
  await modal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Modal Giữ chỗ mở thành công!');

  // Chọn khách hàng
  console.log('4. Chọn khách hàng Trần Đình Trọng...');
  await modal.locator('.ant-select').first().click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-item-option').filter({ hasText: 'Trần Đình Trọng' }).first().click();
  await page.waitForTimeout(300);

  // Chụp ảnh Modal giữ chỗ
  const ss1 = path.join(ARTIFACT_DIR, 'phase2_01_lock_modal.png');
  await page.screenshot({ path: ss1 });
  console.log('Đã lưu ảnh:', ss1);

  // Bấm Xác nhận giữ chỗ
  console.log('5. Bấm Xác nhận giữ chỗ...');
  await modal.locator('button.ant-btn-primary').filter({ hasText: 'Xác nhận giữ chỗ' }).click();
  await page.waitForTimeout(1000);

  // Kiểm tra căn chuyển sang RESERVED và hiện hạn giữ chỗ
  console.log('6. Kiểm tra căn chuyển sang Đang giữ chỗ (RESERVED) kèm hạn...');
  const reservedBadge = page.locator('tr').filter({ hasText: 'RL-A101' }).locator('text=Đang giữ chỗ');
  await reservedBadge.waitFor({ state: 'visible', timeout: 5000 });

  const expiryText = page.locator('tr').filter({ hasText: 'RL-A101' }).locator('text=Hạn:');
  await expiryText.waitFor({ state: 'visible', timeout: 5000 });

  // Kiểm tra nút Mở khóa xuất hiện
  const unlockBtn = page.locator('tr').filter({ hasText: 'RL-A101' }).locator('button').filter({ hasText: 'Mở khóa' });
  await unlockBtn.waitFor({ state: 'visible', timeout: 5000 });

  const ss2 = path.join(ARTIFACT_DIR, 'phase2_02_product_locked.png');
  await page.screenshot({ path: ss2 });
  console.log('Đã lưu ảnh:', ss2);

  // Bấm xem chi tiết căn hộ
  console.log('7. Bấm xem chi tiết căn RL-A101...');
  await page.locator('tr').filter({ hasText: 'RL-A101' }).locator('.product-code').click();
  await page.waitForTimeout(800);

  const detailModal = page.locator('.product-detail-modal');
  await detailModal.waitFor({ state: 'visible', timeout: 5000 });

  const reservedBanner = detailModal.locator('text=Căn đang được giữ chỗ');
  await reservedBanner.waitFor({ state: 'visible', timeout: 5000 });

  const ss3 = path.join(ARTIFACT_DIR, 'phase2_03_product_detail_reserved.png');
  await page.screenshot({ path: ss3 });
  console.log('Đã lưu ảnh:', ss3);

  // Đóng modal chi tiết
  console.log('8. Đóng modal chi tiết...');
  await detailModal.locator('button').filter({ hasText: 'Đóng' }).click();
  await page.waitForTimeout(500);

  // Bấm Mở khóa căn
  console.log('9. Bấm nút Mở khóa trên căn RL-A101...');
  const currentUnlockBtn = page.locator('tr').filter({ hasText: 'RL-A101' }).locator('button').filter({ hasText: 'Mở khóa' });
  await currentUnlockBtn.click();
  await page.waitForTimeout(600);

  // Modal Confirm mở ra
  const confirmModal = page.locator('.ant-modal').filter({ hasText: 'Mở khóa căn RL-A101' });
  await confirmModal.waitFor({ state: 'visible', timeout: 5000 });

  const ss4 = path.join(ARTIFACT_DIR, 'phase2_04_unlock_confirm.png');
  await page.screenshot({ path: ss4 });
  console.log('Đã lưu ảnh:', ss4);

  // Xác nhận mở khóa
  console.log('10. Xác nhận mở khóa...');
  await confirmModal.locator('button.ant-btn-dangerous').click();
  await page.waitForTimeout(1000);

  // Kiểm tra căn trở về AVAILABLE
  console.log('11. Kiểm tra căn trở về trạng thái Còn trống (AVAILABLE)...');
  const availableBadge = page.locator('tr').filter({ hasText: 'RL-A101' }).locator('text=Còn trống');
  await availableBadge.waitFor({ state: 'visible', timeout: 5000 });

  const lockBtnAgain = page.locator('tr').filter({ hasText: 'RL-A101' }).locator('button').filter({ hasText: 'Giữ chỗ' });
  await lockBtnAgain.waitFor({ state: 'visible', timeout: 5000 });

  const ss5 = path.join(ARTIFACT_DIR, 'phase2_05_product_unlocked.png');
  await page.screenshot({ path: ss5 });
  console.log('Đã lưu ảnh:', ss5);

  console.log('--- TOÀN BỘ KỊCH BẢN E2E GIAI ĐOẠN 2 ĐÃ THÀNH CÔNG 100%! ---');
  await browser.close();
}

run().catch((err) => {
  console.error('LỖI THỬ NGHIỆM PLAYWRIGHT:', err);
  process.exit(1);
});
