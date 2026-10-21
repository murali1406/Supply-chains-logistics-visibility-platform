require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const connectDatabase = require("../config/database");

/**
 * Ensures at least one administrator account exists in the database.
 * If an admin user is already present, no action is taken.
 * If no admin user exists, a secure administrator is initialized.
 */
async function ensureAdminExists() {
  const existingAdmin = await User.findOne({ role: "ADMIN" });
  if (existingAdmin) {
    return {
      created: false,
      message: `Admin account already exists: ${existingAdmin.email}`,
      admin: {
        id: existingAdmin._id,
        email: existingAdmin.email,
        name: existingAdmin.name,
      },
    };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@logitrack.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.ADMIN_NAME || "System Administrator";

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  const newAdmin = await User.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "ADMIN",
    accountStatus: "ACTIVE",
    department: "Executive Management",
  });

  console.log(`🛡️ Initialized default administrator: ${newAdmin.email}`);

  return {
    created: true,
    message: `Initialized administrator account: ${newAdmin.email}`,
    admin: {
      id: newAdmin._id,
      email: newAdmin.email,
      name: newAdmin.name,
    },
  };
}

// Support CLI execution: node src/utils/bootstrapAdmin.js
if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      const res = await ensureAdminExists();
      console.log("Bootstrap result:", res.message);
      process.exit(0);
    } catch (err) {
      console.error("❌ Administrator bootstrap failed:", err.message);
      process.exit(1);
    }
  })();
}

module.exports = ensureAdminExists;
