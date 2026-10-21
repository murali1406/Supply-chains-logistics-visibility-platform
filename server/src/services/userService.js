const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Warehouse = require("../models/Warehouse");
const ActivityLog = require("../models/ActivityLog");
const { logActivity } = require("./activityService");

/**
 * Get all users with search, filtering, sorting, and pagination
 */
const getAllUsers = async ({
  search,
  role,
  status,
  warehouse,
  sortBy = "createdAt",
  sortOrder = "desc",
  page = 1,
  limit = 20,
}) => {
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.accountStatus = status;
  if (warehouse) filter.assignedWarehouse = warehouse;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .populate("assignedWarehouse", "name code location status")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)) || 1,
      limit: parseInt(limit),
    },
  };
};

/**
 * Get user by ID along with operational stats and recent activity
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select("-password")
    .populate("assignedWarehouse", "name code location status capacity");

  if (!user) {
    throw new Error("User not found");
  }

  // Fetch recent activity for this user
  const [recentActivities, totalActivities] = await Promise.all([
    ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10),
    ActivityLog.countDocuments({ user: userId }),
  ]);

  // Check if this user manages any warehouses
  const managedWarehouses = await Warehouse.find({ manager: userId }).select("name code location status");

  return {
    user,
    stats: {
      totalActivities,
      managedWarehousesCount: managedWarehouses.length,
      managedWarehouses,
    },
    recentActivities,
  };
};

/**
 * Create a new user with secure password hashing and activity logging
 */
const createUser = async (userData, performedBy) => {
  const { name, email, password, role, phone, department, assignedWarehouse, accountStatus } = userData;

  if (!email || !password || !name) {
    throw new Error("Name, email, and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new Error("User with this email already exists");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Validate assigned warehouse if provided
  if (assignedWarehouse) {
    const whExists = await Warehouse.findById(assignedWarehouse);
    if (!whExists) {
      throw new Error("Assigned warehouse not found");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: role || "STAFF",
    phone: phone ? phone.trim() : null,
    department: department ? department.trim() : "Operations",
    assignedWarehouse: assignedWarehouse || null,
    accountStatus: accountStatus || "ACTIVE",
  });

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "CREATE",
      entity: "USER",
      entityId: newUser._id,
      description: `Created new user ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
      metadata: { role: newUser.role, department: newUser.department },
    });
  }

  return User.findById(newUser._id)
    .select("-password")
    .populate("assignedWarehouse", "name code location");
};

/**
 * Update user details with last-active-admin self-protection
 */
const updateUser = async (userId, updateData, performedBy) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Email duplicate validation if changing email
  if (updateData.email && updateData.email.toLowerCase().trim() !== user.email) {
    const existing = await User.findOne({
      email: updateData.email.toLowerCase().trim(),
      _id: { $ne: userId },
    });
    if (existing) {
      throw new Error("User with this email already exists");
    }
    user.email = updateData.email.toLowerCase().trim();
  }

  // If changing role from ADMIN or deactivating, ensure we do not disable the last active ADMIN
  if (
    (updateData.role && updateData.role !== "ADMIN" && user.role === "ADMIN") ||
    (updateData.accountStatus && updateData.accountStatus !== "ACTIVE" && user.role === "ADMIN")
  ) {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      accountStatus: "ACTIVE",
      _id: { $ne: userId },
    });
    if (activeAdminCount === 0) {
      throw new Error("Cannot modify or deactivate the only active Administrator");
    }
  }

  if (updateData.name) user.name = updateData.name.trim();
  if (updateData.phone !== undefined) user.phone = updateData.phone ? updateData.phone.trim() : null;
  if (updateData.department !== undefined) user.department = updateData.department ? updateData.department.trim() : "";
  if (updateData.role) user.role = updateData.role;
  if (updateData.accountStatus) user.accountStatus = updateData.accountStatus;
  if (updateData.assignedWarehouse !== undefined) {
    user.assignedWarehouse = updateData.assignedWarehouse || null;
  }

  // Optional password update
  if (updateData.password && updateData.password.trim().length >= 6) {
    user.password = await bcrypt.hash(updateData.password.trim(), 12);
  }

  await user.save();

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "UPDATE",
      entity: "USER",
      entityId: user._id,
      description: `Updated user details for ${user.name} (${user.email})`,
      metadata: { role: user.role, status: user.accountStatus },
    });
  }

  return User.findById(user._id)
    .select("-password")
    .populate("assignedWarehouse", "name code location");
};

/**
 * Update user status with active administrator protection
 */
const updateUserStatus = async (userId, accountStatus, performedBy) => {
  if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(accountStatus)) {
    throw new Error("Invalid account status");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN" && accountStatus !== "ACTIVE") {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      accountStatus: "ACTIVE",
      _id: { $ne: userId },
    });
    if (activeAdminCount === 0) {
      throw new Error("Cannot deactivate the only active Administrator");
    }
  }

  const prevStatus = user.accountStatus;
  user.accountStatus = accountStatus;
  await user.save();

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "STATUS_CHANGE",
      entity: "USER",
      entityId: user._id,
      description: `Changed user ${user.name} status from ${prevStatus} to ${accountStatus}`,
      metadata: { previousStatus: prevStatus, newStatus: accountStatus },
    });
  }

  return User.findById(user._id)
    .select("-password")
    .populate("assignedWarehouse", "name code location");
};

/**
 * Update user role
 */
const updateUserRole = async (userId, role, performedBy) => {
  const allowedRoles = [
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "PROCUREMENT_MANAGER",
    "SUPPLIER",
    "STAFF",
  ];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid role specified");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN" && role !== "ADMIN") {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      accountStatus: "ACTIVE",
      _id: { $ne: userId },
    });
    if (activeAdminCount === 0) {
      throw new Error("Cannot demote the only active Administrator");
    }
  }

  const prevRole = user.role;
  user.role = role;
  await user.save();

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "UPDATE",
      entity: "USER",
      entityId: user._id,
      description: `Changed user ${user.name} role from ${prevRole} to ${role}`,
      metadata: { previousRole: prevRole, newRole: role },
    });
  }

  return User.findById(user._id)
    .select("-password")
    .populate("assignedWarehouse", "name code location");
};

/**
 * Delete a user with self-protection and last active admin protection
 */
const deleteUser = async (userId, performedBy) => {
  if (performedBy && performedBy.toString() === userId.toString()) {
    throw new Error("You cannot delete your own account while logged in");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN") {
    const activeAdminCount = await User.countDocuments({
      role: "ADMIN",
      accountStatus: "ACTIVE",
      _id: { $ne: userId },
    });
    if (activeAdminCount === 0) {
      throw new Error("Cannot delete the only active Administrator");
    }
  }

  const { name, email, role } = user;
  await user.deleteOne();

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "DELETE",
      entity: "USER",
      entityId: userId,
      description: `Deleted user ${name} (${email}) with role ${role}`,
    });
  }

  return { id: userId, message: `User ${name} deleted successfully` };
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
