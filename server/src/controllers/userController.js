const userService = require("../services/userService");

const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, warehouse, sortBy, sortOrder, page, limit } = req.query;

    const result = await userService.getAllUsers({
      search,
      role,
      status,
      warehouse,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve users",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const result = await userService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get user by ID error:", error.message);
    const status = error.message === "User not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve user details",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body, req.user?.userId);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user?.userId);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Account status is required",
      });
    }

    const user = await userService.updateUserStatus(req.params.id, status, req.user?.userId);

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    console.error("Update user status error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update user status",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const user = await userService.updateUserRole(req.params.id, role, req.user?.userId);

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    console.error("Update user role error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update user role",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user?.userId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
