const http = require("http");

function request(options, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const headers = { ...(options.headers || {}) };
    if (postData) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postData);
    }
    const req = http.request({ ...options, headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runLiveVerification() {
  console.log("==================================================");
  console.log("LOGITRACK LIVE SYSTEM VERIFICATION (PORT 5001)");
  console.log("==================================================\n");

  const base = { host: "localhost", port: 5001 };
  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details) => {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ->`, details);
      failed++;
    }
  };

  // ── 1. Backend Server & Health Check ──────────────────────────────────────
  console.log("--- SECTION 1: SYSTEM HEALTH ---");
  const health = await request({ ...base, path: "/api/v1/health", method: "GET" });
  assert(health.status === 200 && health.data.success === true, "Health check responds with 200 OK", health.data);

  // ── 2. Authentication: Admin & User Login Modes ──────────────────────────
  console.log("\n--- SECTION 2: AUTHENTICATION & LOGIN MODES ---");

  // Admin login via Admin Login
  const adminLogin = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
    email: "admin@logitrack.com",
    password: "Admin@123",
    loginType: "admin",
  });
  assert(adminLogin.status === 200 && adminLogin.data.user?.role === "ADMIN", "Valid Admin Login via Admin Login succeeds", adminLogin.data);
  const adminToken = adminLogin.data?.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Regular user login via User Login
  const userLogin = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
    email: "staff@logitrack.com",
    password: "Admin@123",
    loginType: "user",
  });
  assert(userLogin.status === 200 && userLogin.data.user?.role === "STAFF", "Valid Regular User Login via User Login succeeds", userLogin.data);
  const userToken = userLogin.data?.token;
  const userHeaders = { Authorization: `Bearer ${userToken}` };

  // Reject regular user on Admin Login
  const rejectUserOnAdmin = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
    email: "staff@logitrack.com",
    password: "Admin@123",
    loginType: "admin",
  });
  assert(rejectUserOnAdmin.status === 403 && rejectUserOnAdmin.data.message.includes("Access denied"), "Regular user rejected on Admin Login (403 Forbidden)", rejectUserOnAdmin.data);

  // Reject admin on User Login
  const rejectAdminOnUser = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
    email: "admin@logitrack.com",
    password: "Admin@123",
    loginType: "user",
  });
  assert(rejectAdminOnUser.status === 403 && rejectAdminOnUser.data.message.includes("Access denied"), "Admin rejected on User Login (403 Forbidden)", rejectAdminOnUser.data);

  // Invalid password rejected
  const badPass = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
    email: "admin@logitrack.com",
    password: "IncorrectPassword123",
    loginType: "admin",
  });
  assert(badPass.status === 401, "Invalid password rejected (401 Unauthorized)", badPass.data);

  // Nonexistent email rejected
  const badEmail = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
    email: "unknown_person@logitrack.com",
    password: "Password123",
    loginType: "user",
  });
  assert(badEmail.status === 401, "Nonexistent email rejected (401 Unauthorized)", badEmail.data);

  // ── 3. Public Registration & Privileged Role Defense ─────────────────────
  console.log("\n--- SECTION 3: REGISTRATION & PRIVILEGE ENFORCEMENT ---");

  const testEmail = `verify.user.${Date.now()}@logitrack.com`;
  const regRes = await request({ ...base, path: "/api/v1/auth/register", method: "POST" }, {
    name: "Verification User",
    email: testEmail,
    phone: "+919876543210",
    password: "Password@123",
    role: "ADMIN", // Attacker role injection attempt
  });
  assert(regRes.status === 201 && regRes.data.user?.role === "STAFF", "Public registration locks role to STAFF (disallows ADMIN elevation)", regRes.data);

  // Duplicate email rejected
  const dupRes = await request({ ...base, path: "/api/v1/auth/register", method: "POST" }, {
    name: "Duplicate User",
    email: testEmail,
    password: "Password@123",
  });
  assert(dupRes.status === 409, "Duplicate email registration rejected (409 Conflict)", dupRes.data);

  // Missing required fields rejected
  const missingRes = await request({ ...base, path: "/api/v1/auth/register", method: "POST" }, {
    name: "",
    email: "bad-format",
  });
  assert(missingRes.status === 400, "Missing required fields rejected (400 Bad Request)", missingRes.data);

  // ── 4. Role-Based Authorization & Protected Endpoints ────────────────────
  console.log("\n--- SECTION 4: AUTHORIZATION & RBAC GUARDS ---");

  // Unauthenticated access rejected
  const unauthWh = await request({ ...base, path: "/api/v1/warehouses", method: "GET" });
  assert(unauthWh.status === 401, "Unauthenticated access rejected on /api/v1/warehouses", unauthWh.data);

  const unauthUsers = await request({ ...base, path: "/api/v1/users", method: "GET" });
  assert(unauthUsers.status === 401, "Unauthenticated access rejected on /api/v1/users", unauthUsers.data);

  // Regular user (STAFF) cannot access admin user management API
  const staffUsers = await request({ ...base, path: "/api/v1/users", method: "GET", headers: userHeaders });
  assert(staffUsers.status === 403, "Regular user (STAFF) blocked from /api/v1/users (403 Forbidden)", staffUsers.data);

  // Administrator can access user management API
  const adminUsers = await request({ ...base, path: "/api/v1/users", method: "GET", headers: adminHeaders });
  assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.users), "Administrator successfully accesses /api/v1/users", adminUsers.data);

  // ── 5. Application Modules Integrity ─────────────────────────────────────
  console.log("\n--- SECTION 5: APPLICATION MODULES INTEGRITY ---");

  // Dashboard Stats
  const dashStats = await request({ ...base, path: "/api/v1/dashboard/stats", method: "GET", headers: adminHeaders });
  assert(dashStats.status === 200 && dashStats.data?.kpis !== undefined, "Dashboard stats API functional", dashStats.data);

  // Warehouses
  const warehouses = await request({ ...base, path: "/api/v1/warehouses", method: "GET", headers: adminHeaders });
  assert(warehouses.status === 200 && warehouses.data.warehouses?.length > 0, "Warehouses module functional", warehouses.data);

  // Inventory
  const inventory = await request({ ...base, path: "/api/v1/inventory", method: "GET", headers: adminHeaders });
  assert(inventory.status === 200 && inventory.data.inventory?.length > 0, "Inventory module functional", inventory.data);

  // Suppliers
  const suppliers = await request({ ...base, path: "/api/v1/suppliers", method: "GET", headers: adminHeaders });
  assert(suppliers.status === 200 && suppliers.data.suppliers?.length > 0, "Suppliers module functional", suppliers.data);

  // Shipments (Purchase Orders)
  const shipments = await request({ ...base, path: "/api/v1/shipments", method: "GET", headers: adminHeaders });
  assert(shipments.status === 200 && shipments.data.shipments?.length > 0, "Shipments module functional", shipments.data);

  // Stock Movements
  const movements = await request({ ...base, path: "/api/v1/stock-movements", method: "GET", headers: adminHeaders });
  assert(movements.status === 200 && movements.data.movements?.length > 0, "Stock movements module functional", movements.data);

  // Activity Log
  const activities = await request({ ...base, path: "/api/v1/activity", method: "GET", headers: adminHeaders });
  assert(activities.status === 200 && activities.data.logs?.length > 0, "Activity log module functional", activities.data);

  // Notifications
  const notifications = await request({ ...base, path: "/api/v1/notifications", method: "GET", headers: adminHeaders });
  assert(notifications.status === 200 && notifications.data.notifications !== undefined, "Notifications module functional", notifications.data);

  // Stock adjustment lifecycle verification
  if (inventory.data.inventory?.length > 0) {
    const targetItem = inventory.data.inventory[0];
    const prevQty = targetItem.quantity;
    const adjustRes = await request(
      { ...base, path: `/api/v1/inventory/${targetItem._id}/stock`, method: "PATCH", headers: adminHeaders },
      { quantityChange: 2, reason: "Live audit verification adjustment" }
    );
    assert(adjustRes.status === 200 && adjustRes.data.inventory?.quantity === prevQty + 2, "Stock adjustment updates quantity and logs movement", adjustRes.data);
  }

  // Cleanup test user
  if (regRes.data?.user?.id) {
    await request({ ...base, path: `/api/v1/users/${regRes.data.user.id}`, method: "DELETE", headers: adminHeaders });
  }

  console.log("\n==================================================");
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification().catch((e) => {
  console.error("Verification execution error:", e);
  process.exit(1);
});
