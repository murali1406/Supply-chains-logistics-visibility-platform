require("dotenv").config();
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

async function run() {
  const app = require("./src/app");
  const connectDatabase = require("./src/config/database");
  const User = require("./src/models/User");

  await connectDatabase();
  const server = app.listen(5095);
  console.log("Auth verification server running on port 5095\n");

  const base = { host: "localhost", port: 5095, headers: { "Content-Type": "application/json" } };

  try {
    let passed = 0;
    let failed = 0;

    const assert = (condition, desc, detail) => {
      if (condition) {
        console.log(`✅ PASS: ${desc}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${desc} - Detail:`, detail);
        failed++;
      }
    };

    // 1. Valid Admin Login with Admin Login type
    const adminRes = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
      email: "admin@logitrack.com",
      password: "Admin@123",
      loginType: "admin",
    });
    assert(adminRes.status === 200 && adminRes.data.user?.role === "ADMIN", "Valid Admin Login via Admin Login", adminRes.data);

    // 2. Valid Regular User Login with User Login type
    const userRes = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
      email: "staff@logitrack.com",
      password: "Admin@123",
      loginType: "user",
    });
    assert(userRes.status === 200 && userRes.data.user?.role === "STAFF", "Valid Regular User Login via User Login", userRes.data);

    // 3. Regular user attempting Admin Login (Must be rejected with 403)
    const rejectUserOnAdmin = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
      email: "staff@logitrack.com",
      password: "Admin@123",
      loginType: "admin",
    });
    assert(rejectUserOnAdmin.status === 403 && rejectUserOnAdmin.data.message.includes("Access denied"), "Regular user rejected on Admin Login", rejectUserOnAdmin.data);

    // 4. Admin attempting User Login (Must be rejected with 403)
    const rejectAdminOnUser = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
      email: "admin@logitrack.com",
      password: "Admin@123",
      loginType: "user",
    });
    assert(rejectAdminOnUser.status === 403 && rejectAdminOnUser.data.message.includes("Access denied"), "Admin rejected on User Login", rejectAdminOnUser.data);

    // 5. Invalid password
    const badPass = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
      email: "admin@logitrack.com",
      password: "WrongPassword123",
      loginType: "admin",
    });
    assert(badPass.status === 401 && badPass.data.message.includes("Invalid email or password"), "Invalid password rejected with 401", badPass.data);

    // 6. Nonexistent email
    const noUser = await request({ ...base, path: "/api/v1/auth/login", method: "POST" }, {
      email: "nobody_nonexistent@logitrack.com",
      password: "SomePassword123",
      loginType: "user",
    });
    assert(noUser.status === 401 && noUser.data.message.includes("Invalid email or password"), "Nonexistent email rejected with 401", noUser.data);

    // 7. Public Registration assigns STAFF role even if ADMIN role is attempted
    const testRegEmail = `test.reg.${Date.now()}@example.com`;
    const regRes = await request({ ...base, path: "/api/v1/auth/register", method: "POST" }, {
      name: "Registration Test User",
      email: testRegEmail,
      password: "Password@123",
      phone: "+919876543210",
      role: "ADMIN", // Attacker trying to elevate to ADMIN
    });
    assert(regRes.status === 201 && regRes.data.user?.role === "STAFF", "Public registration enforces regular STAFF role (attacker cannot elevate to ADMIN)", regRes.data);

    // 8. Duplicate email registration rejected
    const dupRes = await request({ ...base, path: "/api/v1/auth/register", method: "POST" }, {
      name: "Duplicate User",
      email: testRegEmail,
      password: "Password@123",
    });
    assert(dupRes.status === 409 && dupRes.data.message.includes("already exists"), "Duplicate email registration rejected with 409", dupRes.data);

    // 9. Missing required fields rejected
    const badReg = await request({ ...base, path: "/api/v1/auth/register", method: "POST" }, {
      name: "",
      email: "not-an-email",
    });
    assert(badReg.status === 400, "Missing / invalid fields rejected with 400", badReg.data);

    // Clean up test registered user
    if (regRes.data?.user?.id) {
      await User.findByIdAndDelete(regRes.data.user.id);
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

run().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
