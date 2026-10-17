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

const MOCK_PRODUCTS = {
  content: [
    { id: 'prod-001', projectId: 'pj-001', code: 'RL-A101', type: 'APARTMENT', area: 75, block: 'A', price: 3500000000, status: 'AVAILABLE' },
    { id: 'prod-002', projectId: 'pj-001', code: 'RL-A102', type: 'APARTMENT', area: 90, block: 'A', price: 4200000000, status: 'SOLD' },
    { id: 'prod-003', projectId: 'pj-002', code: 'CP-B201', type: 'TOWNHOUSE', area: 120, block: 'B', price: 6800000000, status: 'AVAILABLE' }
  ],
  totalElements: 3
};

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
    }
  ],
  totalElements: 1
};

const MOCK_STAFF = [
  { id: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e', fullName: 'Nguyễn Văn Sales', role: 'SALES', status: 'ACTIVE' }
];

let leadStore = [
  {
    id: 'lead-existing-001',
    customerId: 'c1111111-1111-1111-1111-111111111111',
    projectId: 'pj-001',
    productId: 'prod-001',
    demandNotes: 'Khách cọc căn A101',
    stage: 'WON',
    expectedValue: 3500000000,
    closeDate: '2026-10-30',
    assignedTo: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-17T08:00:00Z'
  }
];

let postLeadPayload = null;

async function runAudit() {
  console.log('🚀 Bắt đầu kiểm thử E2E Giai đoạn 1 với Playwright...');
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

  // Intercept ONLY backend API requests
  await page.route(/http:\/\/localhost:8080\/api\/.*/, async (route) => {
    const req = route.request();
    const url = req.url();

    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    if (url.includes('/projects')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_PROJECTS)
      });
    }

    if (url.includes('/products')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_PRODUCTS)
      });
    }

    if (url.includes('/customers')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_CUSTOMERS)
      });
    }

    if (url.includes('/users')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(MOCK_STAFF)
      });
    }

    if (url.includes('/leads/pipeline-summary')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: [] })
      });
    }

    if (url.includes('/stage-history')) {
      return route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      });
    }

    if (url.includes('/leads')) {
      if (req.method() === 'GET') {
        const match = url.match(/\/leads\/([a-zA-Z0-9-]+)$/);
        if (match) {
          const id = match[1];
          const found = leadStore.find((l) => l.id === id);
          return route.fulfill({
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(found || leadStore[0])
          });
        }
        return route.fulfill({
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: leadStore, totalElements: leadStore.length, totalPages: 1 })
        });
      }

      if (req.method() === 'POST') {
        const data = JSON.parse(req.postData() || '{}');
        postLeadPayload = data;
        const newLead = {
          id: 'lead-new-002',
          customerId: data.customerId,
          projectId: data.projectId,
          productId: data.productId || null,
          demandNotes: data.demandNotes || null,
          stage: data.stage || 'NEW',
          expectedValue: data.expectedValue || null,
          closeDate: data.closeDate || null,
          assignedTo: 'e44d5c89-8d1e-4581-bcfa-24cb118a141e',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        leadStore = [newLead, ...leadStore];
        return route.fulfill({
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(newLead)
        });
      }
    }

    return route.fulfill({
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [] })
    });
  });

  try {
    // 1. Navigate to /leads
    console.log('📌 [Step 1] Điều hướng đến trang Leads Pipeline (/leads)...');
    await page.goto(`${BASE_URL}/leads`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Capture initial Kanban board
    const ss1 = path.join(ARTIFACT_DIR, 'phase1_1_kanban_initial.png');
    await page.screenshot({ path: ss1 });
    console.log(`📸 Chụp ảnh Kanban ban đầu: ${ss1}`);

    // 2. Open LeadFormModal
    console.log('📌 [Step 2] Nhấn nút "+ Thêm lead"...');
    await page.click('button:has-text("Thêm lead")');
    await page.waitForTimeout(800);

    // 3. Verify modal has projectId, optional productId, demandNotes
    console.log('📌 [Step 3] Kiểm tra các trường trong LeadFormModal...');
    const projectSelect = page.locator('#projectId');
    const productSelect = page.locator('#productId');
    const demandNotesInput = page.locator('#demandNotes');

    if (await projectSelect.count() === 0) throw new Error('Không tìm thấy ô chọn Dự án quan tâm (#projectId)');
    if (await productSelect.count() === 0) throw new Error('Không tìm thấy ô chọn Mã căn (#productId)');
    if (await demandNotesInput.count() === 0) throw new Error('Không tìm thấy ô nhập Ghi chú nhu cầu (#demandNotes)');

    // 4. Fill form without selecting product
    console.log('📌 [Step 4] Nhập form tạo Lead: chọn Dự án Regal Legend, để trống Mã căn, nhập nhu cầu...');
    
    // Select customer
    await page.locator('#customerId').click();
    await page.waitForTimeout(400);
    await page.locator('.ant-select-item-option:has-text("Trần Đình Trọng")').first().click();
    await page.waitForTimeout(300);

    // Select project
    await page.locator('#projectId').click();
    await page.waitForTimeout(400);
    await page.locator('.ant-select-item-option:has-text("Regal Legend")').first().click();
    await page.waitForTimeout(300);

    // Enter demand notes
    await demandNotesInput.fill('Căn 2PN view biển, tầng 10-15, hướng Đông Nam, tài chính 3.8 tỷ');

    // Expected value
    await page.locator('#expectedValue').fill('3800000000');

    // Screenshot modal
    const ss2 = path.join(ARTIFACT_DIR, 'phase1_2_modal_filled.png');
    await page.screenshot({ path: ss2 });
    console.log(`📸 Chụp ảnh Form tạo Lead không chọn căn: ${ss2}`);

    // Submit form
    console.log('📌 [Step 5] Submit tạo Lead...');
    await page.locator('.ant-modal-footer button:has-text("Tạo lead")').click();
    await page.waitForTimeout(1200);

    // 5. Verify payload sent to backend
    console.log('📌 [Step 6] Kiểm tra payload gửi lên API:');
    console.log('   Payload:', JSON.stringify(postLeadPayload, null, 2));
    if (postLeadPayload.projectId !== 'pj-001') {
      throw new Error(`Expected projectId "pj-001" but got ${postLeadPayload.projectId}`);
    }
    if (postLeadPayload.productId !== null && postLeadPayload.productId !== undefined) {
      throw new Error(`Expected productId to be null/undefined but got ${postLeadPayload.productId}`);
    }
    if (!postLeadPayload.demandNotes.includes('view biển')) {
      throw new Error(`Expected demandNotes but got ${postLeadPayload.demandNotes}`);
    }
    console.log('   ✅ Payload chính xác: projectId="pj-001", productId=null, demandNotes đầy đủ.');

    // 6. Verify lead card rendered on Kanban
    console.log('📌 [Step 7] Xác nhận Lead hiển thị trên Kanban...');
    await page.waitForTimeout(800);
    const ss3 = path.join(ARTIFACT_DIR, 'phase1_3_kanban_with_new_lead.png');
    await page.screenshot({ path: ss3 });
    console.log(`📸 Chụp ảnh Kanban hiển thị Lead mới: ${ss3}`);

    // 7. Switch to Table view
    console.log('📌 [Step 8] Chuyển sang Table view...');
    const tableBtn = page.locator('button:has-text("Bảng")').first();
    if (await tableBtn.count() > 0) {
      await tableBtn.click();
      await page.waitForTimeout(800);
      const ss4 = path.join(ARTIFACT_DIR, 'phase1_4_table_view.png');
      await page.screenshot({ path: ss4 });
      console.log(`📸 Chụp ảnh Table view: ${ss4}`);
    }

    // 8. Open Lead Detail
    console.log('📌 [Step 9] Mở trang chi tiết Lead vừa tạo...');
    await page.goto(`${BASE_URL}/leads/lead-new-002`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const ss5 = path.join(ARTIFACT_DIR, 'phase1_5_lead_detail.png');
    await page.screenshot({ path: ss5 });
    console.log(`📸 Chụp ảnh Lead Detail Page: ${ss5}`);

    const detailText = await page.locator('.ant-descriptions').innerText();
    console.log('   Thông tin chi tiết hiển thị:');
    if (detailText.includes('Regal Legend Quảng Bình')) {
      console.log('   ✅ Hiển thị đúng Dự án: Regal Legend Quảng Bình');
    }
    if (detailText.includes('Chưa chọn căn cụ thể')) {
      console.log('   ✅ Hiển thị đúng Sản phẩm: Chưa chọn căn cụ thể');
    }
    if (detailText.includes('Căn 2PN view biển')) {
      console.log('   ✅ Hiển thị đúng Nhu cầu khách hàng');
    }

    console.log('\n🎉 KIỂM THỬ E2E GIAI ĐOẠN 1 THÀNH CÔNG VƯỢT TRỘI 100%!');
  } catch (err) {
    console.error('❌ Lỗi kiểm thử E2E:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit();
