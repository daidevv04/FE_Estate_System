import http from 'http';
import crypto from 'crypto';

const SECRET_B64 = 'DnTExkdmjizKelp9d3YyKia1oTnY/jSZFAarWy6JDSM=';
const SECRET_BYTES = Buffer.from(SECRET_B64, 'base64');

function makeToken(sub, username, role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub,
    username,
    role,
    iss: 'EstateCRM',
    iat: now,
    exp: now + 7200
  })).toString('base64url');

  const sig = crypto.createHmac('sha256', SECRET_BYTES).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

const ROLES = {
  ADMIN: {
    id: '5cdd2737-4102-461f-80ad-9bf58e917fc4',
    username: 'admin',
    role: 'ADMIN',
    token: makeToken('5cdd2737-4102-461f-80ad-9bf58e917fc4', 'admin', 'ADMIN')
  },
  MANAGER: {
    id: 'c639be9e-5c73-4d00-8f09-4301a87fb371',
    username: 'demo3',
    role: 'MANAGER',
    token: makeToken('c639be9e-5c73-4d00-8f09-4301a87fb371', 'demo3', 'MANAGER')
  },
  SALES: {
    id: '9ccbd505-4bc5-47ee-bd6f-1e2426b8f282',
    username: 'extra20260925-231213',
    role: 'SALES',
    token: makeToken('9ccbd505-4bc5-47ee-bd6f-1e2426b8f282', 'extra20260925-231213', 'SALES')
  }
};

function request(path, options = {}) {
  return new Promise((resolve) => {
    const roleKey = options.role || 'ADMIN';
    const token = options.token || (roleKey ? ROLES[roleKey]?.token : null);

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
      ...(options.headers || {})
    };

    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json || data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const testResults = [];

function recordTest(domain, testName, passed, details = '') {
  testResults.push({ domain, testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${domain}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('   STARTING COMPREHENSIVE MULTI-ROLE & END-TO-END TEST SUITE   ');
  console.log('===============================================================\n');

  // 1. HEALTH & CONNECTIVITY
  for (const [svc, port] of [['gateway', 8080]]) {
    const res = await request('/actuator/health', { role: null });
    recordTest('INFRA', `Gateway Healthcheck :${port}`, res.status === 200, `status=${res.status}`);
  }

  // 2. USER SERVICE - RBAC & SCOPING
  {
    // Admin list all users
    const adminUsers = await request('/api/users', { role: 'ADMIN' });
    const adminPass = adminUsers.status === 200 && Array.isArray(adminUsers.data) && adminUsers.data.length > 5;
    recordTest('USER_RBAC', 'ADMIN can list all users', adminPass, `count=${adminUsers.data?.length || 0}`);

    // Manager list users (scoped)
    const mgrUsers = await request('/api/users', { role: 'MANAGER' });
    const mgrPass = mgrUsers.status === 200 && Array.isArray(mgrUsers.data);
    recordTest('USER_RBAC', 'MANAGER gets scoped user list', mgrPass, `count=${mgrUsers.data?.length || 0}`);

    // Sales list users (only self)
    const salesUsers = await request('/api/users', { role: 'SALES' });
    const salesPass = salesUsers.status === 200 && Array.isArray(salesUsers.data) && salesUsers.data.length === 1 && salesUsers.data[0].id === ROLES.SALES.id;
    recordTest('USER_RBAC', 'SALES listing users returns ONLY self', salesPass, `count=${salesUsers.data?.length || 0}`);

    // Sales directory endpoint
    const salesDir = await request('/api/users/sales', { role: 'SALES' });
    const dirPass = salesDir.status === 200 && Array.isArray(salesDir.data) && salesDir.data.length >= 4;
    recordTest('USER_RBAC', 'SALES can access active sales directory (/users/sales)', dirPass, `count=${salesDir.data?.length || 0}`);

    // Sales forbidden to update role
    const salesForbidden = await request(`/api/users/${ROLES.SALES.id}/role`, {
      method: 'PATCH',
      role: 'SALES',
      body: { role: 'ADMIN' }
    });
    recordTest('USER_RBAC', 'SALES cannot escalate role to ADMIN (403 Forbidden)', salesForbidden.status === 403, `status=${salesForbidden.status}`);

    // Self profile endpoint
    const meRes = await request('/api/users/me', { role: 'SALES' });
    recordTest('USER_PROFILE', 'SALES can read /api/users/me', meRes.status === 200 && meRes.data?.id === ROLES.SALES.id, `username=${meRes.data?.username}`);
  }

  // 3. CUSTOMER SERVICE - SCOPING & CARE LOGS
  {
    // Admin customer list
    const adminCust = await request('/api/customers?page=0&size=10', { role: 'ADMIN' });
    recordTest('CUSTOMER', 'ADMIN can list all customers', adminCust.status === 200, `total=${adminCust.data?.totalElements ?? adminCust.data?.length ?? 'OK'}`);

    // Sales customer list
    const salesCust = await request('/api/customers?page=0&size=10', { role: 'SALES' });
    recordTest('CUSTOMER', 'SALES can list own customers', salesCust.status === 200, `total=${salesCust.data?.totalElements ?? salesCust.data?.length ?? 'OK'}`);

    // Customer care history
    const careHistory = await request('/api/customers/cares?page=0&size=10', { role: 'SALES' });
    recordTest('CUSTOMER_CARE', 'SALES can view customer care history logs', careHistory.status === 200, `status=${careHistory.status}`);

    // Appointments list
    const appts = await request('/api/appointments?page=0&size=10', { role: 'SALES' });
    recordTest('APPOINTMENT', 'SALES can view scheduled appointments', appts.status === 200, `status=${appts.status}`);
  }

  // 4. CRM SERVICE - DEALS & RBAC
  {
    // Admin list all deals
    const adminDeals = await request('/api/deals?page=0&size=50', { role: 'ADMIN' });
    const countAdminDeals = adminDeals.data?.content?.length || 0;
    recordTest('DEALS_RBAC', 'ADMIN can list all system deals', adminDeals.status === 200 && countAdminDeals >= 20, `count=${countAdminDeals}`);

    // Sales list deals (only own)
    const salesDeals = await request('/api/deals?page=0&size=50', { role: 'SALES' });
    const countSalesDeals = salesDeals.data?.content?.length || 0;
    const allMatchSales = salesDeals.data?.content?.every(d => d.salesId === ROLES.SALES.id) ?? false;
    recordTest('DEALS_RBAC', 'SALES can only see own deals', salesDeals.status === 200 && allMatchSales, `count=${countSalesDeals}`);
  }

  // 5. COMMISSIONS - ADMIN vs SALES
  {
    // Admin commission dashboard
    const adminComm = await request('/api/commissions', { role: 'ADMIN' });
    recordTest('COMMISSIONS', 'ADMIN can access overall commission dashboard', adminComm.status === 200 && adminComm.data?.summary != null, `totalExpected=${adminComm.data?.summary?.totalExpected}`);

    // Sales personal commission
    const salesComm = await request('/api/commissions/my', { role: 'SALES' });
    recordTest('COMMISSIONS', 'SALES can view personal commissions (/commissions/my)', salesComm.status === 200, `deals=${salesComm.data?.commissions?.length ?? 'OK'}`);
  }

  // 6. LEADERBOARD - ALL ROLES & ALL TIME PERIODS
  {
    const periods = ['MONTH', 'QUARTER', 'YEAR', 'ALL'];
    for (const p of periods) {
      const res = await request(`/api/reports/leaderboard?period=${p}&year=2026&month=10`, { role: 'SALES' });
      const items = res.data?.items || [];
      const pass = res.status === 200 && items.length >= 4 && items[0].badge === 'GOLD';
      recordTest('LEADERBOARD', `SALES viewing leaderboard [${p}]`, pass, `rank1=${items[0]?.salesName}, items=${items.length}`);
    }

    // Check that ADMIN and MANAGER also get the leaderboard
    const adminLb = await request('/api/reports/leaderboard?period=MONTH&year=2026&month=10', { role: 'ADMIN' });
    recordTest('LEADERBOARD', 'ADMIN can view sales leaderboard', adminLb.status === 200 && adminLb.data?.items?.length >= 4, `items=${adminLb.data?.items?.length}`);

    const mgrLb = await request('/api/reports/leaderboard?period=MONTH&year=2026&month=10', { role: 'MANAGER' });
    recordTest('LEADERBOARD', 'MANAGER can view sales leaderboard', mgrLb.status === 200 && mgrLb.data?.items?.length >= 4, `items=${mgrLb.data?.items?.length}`);
  }

  // 7. PROJECTS & PRODUCTS & SALES POLICIES
  {
    const projects = await request('/api/projects?page=0&size=10', { role: 'SALES' });
    recordTest('CATALOG', 'SALES can list active projects', projects.status === 200, `count=${projects.data?.content?.length ?? 'OK'}`);

    const products = await request('/api/products?page=0&size=10', { role: 'SALES' });
    recordTest('CATALOG', 'SALES can list products', products.status === 200, `count=${products.data?.content?.length ?? 'OK'}`);

    const policies = await request('/api/sales-policies?page=0&size=10', { role: 'SALES' });
    recordTest('CATALOG', 'SALES can list sales policies', policies.status === 200, `count=${policies.data?.content?.length ?? 'OK'}`);
  }

  // SUMMARY
  console.log('\n===============================================================');
  console.log('                     TEST EXECUTION SUMMARY                    ');
  console.log('===============================================================');
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASSED:      ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`FAILED:      ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
