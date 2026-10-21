const authService = require("../services/authService");
const User = require("../models/User");

const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    return res.status(201).json({ success: true, message: "User registered successfully", user });
  } catch (error) {
    console.error("Register error:", error.message);
    if (error.message === "User with this email already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    return res.status(200).json({ success: true, message: "Login successful", ...result });
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.statusCode === 403 || error.message.startsWith("Access denied")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === "Invalid email or password" || error.message === "Account is not active") {
      return res.status(401).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("GetMe error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve user" });
  }
};

module.exports = { register, login, getMe };