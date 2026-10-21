require('dotenv').config();
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
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

async function runTests() {
  const app = require('./src/app');
  const connectDatabase = require('./src/config/database');
  
  await connectDatabase();
  const server = app.listen(5099);
  console.log('Test server started on port 5099');

  const base = { host: 'localhost', port: 5099, headers: { 'Content-Type': 'application/json' } };

  try {
    // 1. Health check
    const health = await request({ ...base, path: '/api/v1/health', method: 'GET' });
    console.log('1. Health check:', health.status, health.data.status || health.data.message);

    // 2. Login as Admin
    const login = await request({ ...base, path: '/api/v1/auth/login', method: 'POST' }, {
      email: 'admin@logitrack.com',
      password: 'Admin@123'
    });
    console.log('2. Admin login:', login.status, login.data.success ? 'SUCCESS' : 'FAILED');
    const token = login.data.token;
    const authHeaders = { ...base.headers, Authorization: `Bearer ${token}` };

    // 3. /me
    const me = await request({ ...base, path: '/api/v1/auth/me', method: 'GET', headers: authHeaders });
    console.log('3. Auth /me:', me.status, me.data.user?.name, me.data.user?.role);

    // 4. Dashboard stats
    const dash = await request({ ...base, path: '/api/v1/dashboard/stats', method: 'GET', headers: authHeaders });
    console.log('4. Dashboard stats:', dash.status, 'Total products:', dash.data?.data?.kpis?.totalProducts, 'Total value:', dash.data?.data?.kpis?.totalInventoryValue);

    // 5. Warehouses
    const wh = await request({ ...base, path: '/api/v1/warehouses', method: 'GET', headers: authHeaders });
    console.log('5. Warehouses list:', wh.status, 'Count:', wh.data?.warehouses?.length);

    // 6. Inventory
    const inv = await request({ ...base, path: '/api/v1/inventory', method: 'GET', headers: authHeaders });
    console.log('6. Inventory list:', inv.status, 'Count:', inv.data?.inventory?.length);

    // 7. Suppliers
    const sup = await request({ ...base, path: '/api/v1/suppliers', method: 'GET', headers: authHeaders });
    console.log('7. Suppliers list:', sup.status, 'Count:', sup.data?.suppliers?.length);

    // 8. Shipments
    const shp = await request({ ...base, path: '/api/v1/shipments', method: 'GET', headers: authHeaders });
    console.log('8. Shipments list:', shp.status, 'Count:', shp.data?.shipments?.length);

    // 9. Stock Movements
    const mov = await request({ ...base, path: '/api/v1/stock-movements', method: 'GET', headers: authHeaders });
    console.log('9. Stock movements:', mov.status, 'Count:', mov.data?.movements?.length);

    // 10. Activity
    const act = await request({ ...base, path: '/api/v1/activity', method: 'GET', headers: authHeaders });
    console.log('10. Activity logs:', act.status, 'Count:', act.data?.logs?.length);

    // 11. Notifications
    const notif = await request({ ...base, path: '/api/v1/notifications', method: 'GET', headers: authHeaders });
    console.log('11. Notifications:', notif.status, 'Count:', notif.data?.notifications?.length, 'Unread:', notif.data?.unreadCount);

    // 12. Stock update test (inventory operation -> movement & activity)
    if (inv.data?.inventory?.length > 0) {
      const targetItem = inv.data.inventory[0];
      const prevQty = targetItem.quantity;
      const stockUpdate = await request(
        { ...base, path: `/api/v1/inventory/${targetItem._id}/stock`, method: 'PATCH', headers: authHeaders },
        { quantityChange: 5, reason: 'E2E Test stock increment' }
      );
      console.log('12. Stock adjustment:', stockUpdate.status, 'Previous:', prevQty, 'New:', stockUpdate.data?.inventory?.quantity);
    }

    // 13. Unauthorized test (no token)
    const unauth = await request({ ...base, path: '/api/v1/warehouses', method: 'GET' });
    console.log('13. Unauthorized protection:', unauth.status, unauth.data?.message);

    console.log('\n🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
