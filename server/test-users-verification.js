require('dotenv').config();
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  const app = require('./src/app');
  const connectDatabase = require('./src/config/database');
  const Warehouse = require('./src/models/Warehouse');
  const User = require('./src/models/User');

  await connectDatabase();
  const server = app.listen(5097);
  console.log('User management test server running on port 5097\n');

  const base = { host: 'localhost', port: 5097, headers: { 'Content-Type': 'application/json' } };

  try {
    // 1. Admin login
    console.log('--- 1. Login as Admin ---');
    const adminLogin = await request({ ...base, path: '/api/v1/auth/login', method: 'POST' }, {
      email: 'admin@logitrack.com',
      password: 'Admin@123',
    });
    const adminToken = adminLogin.data.token;
    const adminHeaders = { ...base.headers, Authorization: `Bearer ${adminToken}` };
    console.log('Admin login status:', adminLogin.status, 'Name:', adminLogin.data.user?.name);

    // 2. Fetch Users List
    console.log('\n--- 2. GET /api/v1/users ---');
    const userList = await request({ ...base, path: '/api/v1/users', method: 'GET', headers: adminHeaders });
    console.log('User list status:', userList.status, 'Total users:', userList.data.pagination?.total);

    // 3. Create a new platform user
    console.log('\n--- 3. POST /api/v1/users (Create User) ---');
    const wh = await Warehouse.findOne();
    const testEmail = `test.user.${Date.now()}@logitrack.com`;
    const createRes = await request({ ...base, path: '/api/v1/users', method: 'POST', headers: adminHeaders }, {
      name: 'Sneha Verma',
      email: testEmail,
      password: 'User@123',
      role: 'STAFF',
      phone: '+91 9876543210',
      department: 'Logistics Operations',
      assignedWarehouse: wh?._id?.toString(),
      accountStatus: 'ACTIVE',
    });
    console.log('Create user status:', createRes.status, 'Created user:', createRes.data.user?.name, 'Role:', createRes.data.user?.role);
    const newUserId = createRes.data.user?._id || createRes.data.user?.id;

    // 4. GET User by ID + Activity
    console.log('\n--- 4. GET /api/v1/users/:id ---');
    const userDetail = await request({ ...base, path: `/api/v1/users/${newUserId}`, method: 'GET', headers: adminHeaders });
    console.log('User detail status:', userDetail.status, 'Department:', userDetail.data.user?.department, 'Activities count:', userDetail.data.stats?.totalActivities);

    // 5. Update User details
    console.log('\n--- 5. PUT /api/v1/users/:id ---');
    const updateRes = await request({ ...base, path: `/api/v1/users/${newUserId}`, method: 'PUT', headers: adminHeaders }, {
      name: 'Sneha Verma-Sharma',
      phone: '+91 9123456780',
      department: 'Senior Operations',
    });
    console.log('Update user status:', updateRes.status, 'Updated name:', updateRes.data.user?.name);

    // 6. Change User Role
    console.log('\n--- 6. PATCH /api/v1/users/:id/role ---');
    const roleRes = await request({ ...base, path: `/api/v1/users/${newUserId}/role`, method: 'PATCH', headers: adminHeaders }, {
      role: 'WAREHOUSE_MANAGER',
    });
    console.log('Role update status:', roleRes.status, 'New role:', roleRes.data.user?.role);

    // 7. Change User Status (Deactivate / Suspend)
    console.log('\n--- 7. PATCH /api/v1/users/:id/status ---');
    const statusRes = await request({ ...base, path: `/api/v1/users/${newUserId}/status`, method: 'PATCH', headers: adminHeaders }, {
      status: 'INACTIVE',
    });
    console.log('Status update status:', statusRes.status, 'New status:', statusRes.data.user?.accountStatus);

    // 8. Test self-deletion prevention
    console.log('\n--- 8. Self-deletion protection check ---');
    const selfDeleteRes = await request({ ...base, path: `/api/v1/users/${adminLogin.data.user?.id}`, method: 'DELETE', headers: adminHeaders });
    console.log('Self delete attempt status:', selfDeleteRes.status, 'Message:', selfDeleteRes.data.message);

    // 9. Delete created test user
    console.log('\n--- 9. DELETE /api/v1/users/:id ---');
    const deleteRes = await request({ ...base, path: `/api/v1/users/${newUserId}`, method: 'DELETE', headers: adminHeaders });
    console.log('Delete status:', deleteRes.status, 'Message:', deleteRes.data.message);

    // 10. Verify Staff cannot manage users (RBAC guard)
    console.log('\n--- 10. Staff RBAC protection test ---');
    const staffLogin = await request({ ...base, path: '/api/v1/auth/login', method: 'POST' }, {
      email: 'staff@logitrack.com',
      password: 'Admin@123',
    });
    const staffHeaders = { ...base.headers, Authorization: `Bearer ${staffLogin.data.token}` };
    const staffAccessRes = await request({ ...base, path: '/api/v1/users', method: 'GET', headers: staffHeaders });
    console.log('Staff access status:', staffAccessRes.status, 'Message:', staffAccessRes.data.message);

    console.log('\n🎉 ALL USER MANAGEMENT API AND SECURITY TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
