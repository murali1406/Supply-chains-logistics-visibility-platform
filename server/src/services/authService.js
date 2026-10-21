const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const registerUser = async ({ name, email, password, phone }) => {
  // 1. Check whether user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // 2. Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Create user — public registration always assigns the regular user role (STAFF)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "STAFF",
    phone: phone || null,
  });

  // 4. Return safe user data
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
};

const loginUser = async ({ email, password, loginType }) => {
  // 1. Find user and explicitly include password
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 2. Check account status
  if (user.accountStatus !== "ACTIVE") {
    throw new Error("Account is not active");
  }

  // 3. Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // 4. Verify role against requested login type
  if (loginType === "admin") {
    if (user.role !== "ADMIN") {
      const err = new Error("Access denied: Regular users cannot login via Admin Login. Please use User Login.");
      err.statusCode = 403;
      throw err;
    }
  } else if (loginType === "user") {
    if (user.role === "ADMIN") {
      const err = new Error("Access denied: Administrator accounts must use Admin Login. Please switch to Admin Login.");
      err.statusCode = 403;
      throw err;
    }
  }

  // 5. Update last login
  user.lastLogin = new Date();
  await user.save();

  // 5. Generate JWT
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );

  // 6. Return safe response
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      accountStatus: user.accountStatus,
      lastLogin: user.lastLogin,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};