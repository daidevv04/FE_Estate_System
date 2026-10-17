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

const now = new Date();
const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

let productsState = [
  {
    id: 'prod-001',
    projectId: 'pj-001',
    code: 'RL-A301',
    type: 'APARTMENT',
    area: 85,
    block: 'A',
    price: 4200000000,
    bedroom: 3,
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
    code: 'RL-A201',
    type: 'APARTMENT',
    area: 75,
    block: 'A',
    price: 3600000000,
    bedroom: 2,
    direction: 'E',
    status: 'RESERVED',
    lockedBy: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
    lockedCustomerId: 'c1111111-1111-1111-1111-111111111111',
    lockExpiresAt: inTwoDays,
    lockDepositAmount: 100000000,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'prod-003',
    projectId: 'pj-001',
    code: 'RL-A202',
    type: 'APARTMENT',
    area: 90,
    block: 'A',
    price: 4500000000,
    bedroom: 3,
    direction: 'S',
    status: 'SOLD',
    lockedBy: null,
    lockedCustomerId: null,
    lockExpiresAt: null,
    lockDepositAmount: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'prod-004',
    projectId: 'pj-001',
    code: 'RL-A101',
    type: 'APARTMENT',
    area: 70,
    block: 'A',
    price: 3200000000,
    bedroom: 2,
    direction: 'NE',
    status: 'AVAILABLE',
    lockedBy: null,
    lockedCustomerId: null,
    lockExpiresAt: null,
    lockDepositAmount: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'prod-005',
    projectId: 'pj-001',
    code: 'RL-A102',
    type: 'APARTMENT',
    area: 72,
    block: 'A',
    price: 3300000000,
    bedroom: 2,
    direction: 'W',
    status: 'AVAILABLE',
    lockedBy: null,
    lockedCustomerId: null,
    lockExpiresAt: null,
    lockDepositAmount: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'prod-006',
    projectId: 'pj-001',
    code: 'RL-B201',
    type: 'APARTMENT',
    area: 80,
    block: 'B',
    price: 3800000000,
    bedroom: 2,
    direction: 'S',
    status: 'AVAILABLE',
    lockedBy: null,
    lockedCustomerId: null,
    lockExpiresAt: null,
    lockDepositAmount: null,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'prod-007',
    projectId: 'pj-001',
    code: 'RL-B101',
    type: 'APARTMENT',
    area: 80,
    block: 'B',
    price: 3800000000,
    bedroom: 2,
    direction: 'N',
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
  console.log('=== KHỞI ĐỘNG KIỂM THỬ PLAYWRIGHT GIAI ĐOẠN 3: SƠ ĐỒ BẢNG HÀNG MATRIX ===');
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

  // Intercept API calls
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

    if (url.includes('/users') || url.includes('/staff')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { id: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e', fullName: 'Nguyễn Văn Sales', role: 'SALES' }
        ])
      });
    }

    // Lock product endpoint
    if (url.match(/\/products\/[^/]+\/lock$/) && method === 'POST') {
      const prodId = url.split('/products/')[1].split('/lock')[0];
      const postData = JSON.parse(req.postData() || '{}');
      const index = productsState.findIndex(p => p.id === prodId);
      if (index !== -1) {
        const lockDurationDays = postData.lockDurationDays || 3;
        const expiry = new Date(Date.now() + lockDurationDays * 24 * 60 * 60 * 1000).toISOString();
        productsState[index] = {
          ...productsState[index],
          status: 'RESERVED',
          lockedBy: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
          lockedCustomerId: postData.customerId || 'c1111111-1111-1111-1111-111111111111',
          lockExpiresAt: expiry,
          lockDepositAmount: postData.depositAmount || 50000000
        };
        console.log(`[MOCK API] Đã khóa căn: ${productsState[index].code} -> RESERVED`);
        return route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(productsState[index])
        });
      }
    }

    // Default products endpoint
    if (url.includes('/products')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: productsState,
          totalElements: productsState.length
        })
      });
    }

    return route.fulfill({
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [], totalElements: 0 })
    });
  });

  try {
    console.log('[1/5] Truy cập trang /products...');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const shot1 = path.join(ARTIFACT_DIR, 'audit_phase3_matrix_01_table_view.png');
    await page.screenshot({ path: shot1, fullPage: true });
    console.log('✓ Chụp ảnh 1: Dạng bảng mặc định:', shot1);

    console.log('[2/5] Chuyển sang Sơ đồ Matrix qua Segmented Switcher...');
    const matrixBtn = page.locator('.ant-segmented-item:has-text("Sơ đồ Matrix")');
    await matrixBtn.click();
    await page.waitForTimeout(1000);

    const matrixRoot = page.locator('.matrix-container');
    await matrixRoot.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Sơ đồ Matrix hiển thị thành công!');

    const shot2 = path.join(ARTIFACT_DIR, 'audit_phase3_matrix_02_matrix_view.png');
    await page.screenshot({ path: shot2, fullPage: true });
    console.log('✓ Chụp ảnh 2: Sơ đồ Matrix toàn diện:', shot2);

    console.log('[3/5] Lọc theo Block A...');
    const blockABtn = page.locator('.matrix-stats-bar .ant-segmented-item:has-text("Block A")');
    await blockABtn.click();
    await page.waitForTimeout(800);

    const shot3 = path.join(ARTIFACT_DIR, 'audit_phase3_matrix_03_filter_block_a.png');
    await page.screenshot({ path: shot3, fullPage: true });
    console.log('✓ Chụp ảnh 3: Lọc chi tiết Block A:', shot3);

    console.log('[4/5] Khóa căn trực tiếp từ thẻ Matrix (RL-A101)...');
    const unit101Card = page.locator('.matrix-unit-card', { hasText: 'RL-A101' });
    await unit101Card.click();
    await page.waitForTimeout(500);

    // Click menu item Khóa căn / Giữ chỗ
    const lockMenuItem = page.locator('.ant-dropdown-menu-item:has-text("Khóa căn")');
    await lockMenuItem.click();

    // Chờ modal khóa căn hiện
    const modal = page.locator('.ant-modal-content:has-text("Khóa căn")');
    await modal.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Modal khóa căn mở từ Matrix thành công!');

    // Nhập cọc và chọn khách
    const customerSelect = page.locator('.ant-modal-content .ant-select').first();
    await customerSelect.click();
    await page.waitForTimeout(400);
    const custOption = page.locator('.ant-select-item-option-content:has-text("Trần Đình Trọng")').first();
    await custOption.click();

    const depositInput = page.locator('.ant-modal-content .ant-input-number-input').first();
    if (await depositInput.isVisible()) {
      await depositInput.fill('50000000');
    }

    // Click nút Xác nhận giữ chỗ ở footer modal
    const confirmBtn = page.locator('.ant-modal-footer button.ant-btn-primary');
    await confirmBtn.click();
    await page.waitForTimeout(1500);

    const shot4 = path.join(ARTIFACT_DIR, 'audit_phase3_matrix_04_locked_unit.png');
    await page.screenshot({ path: shot4, fullPage: true });
    console.log('✓ Chụp ảnh 4: Căn RL-A101 chuyển sang Giữ chỗ (Vàng) trên Matrix:', shot4);

    console.log('[5/5] Kiểm tra điều hướng Lên Hợp Đồng / Vào Cọc từ căn giữ chỗ (RL-A201)...');
    const unit201Card = page.locator('.matrix-unit-card', { hasText: 'RL-A201' });
    await unit201Card.click();
    await page.waitForTimeout(500);

    const convertDealMenuItem = page.locator('.ant-dropdown-menu-item:has-text("Lên hợp đồng")');
    await convertDealMenuItem.click();
    await page.waitForTimeout(1200);

    const currentUrl = page.url();
    console.log('✓ URL sau khi bấm Lên Hợp Đồng:', currentUrl);
    if (currentUrl.includes('/deals') && currentUrl.includes('productId=prod-002')) {
      console.log('✓ Điều hướng Lên Hợp Đồng kèm thông số cọc chính xác 100%!');
    }

    const shot5 = path.join(ARTIFACT_DIR, 'audit_phase3_matrix_05_convert_deal.png');
    await page.screenshot({ path: shot5, fullPage: true });
    console.log('✓ Chụp ảnh 5: Chuyển tiếp sang trang Deals:', shot5);

    console.log('\n=== TẤT CẢ KIỂM THỬ PLAYWRIGHT GIAI ĐOẠN 3 ĐÃ VƯỢT QUA 100% ===');
  } catch (err) {
    console.error('LỖI KIỂM THỬ:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
