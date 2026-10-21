const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({
  userId,
  action,
  entity,
  entityId,
  description,
  metadata,
  ipAddress,
}) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      entity,
      entityId: entityId || null,
      description,
      metadata: metadata || {},
      ipAddress: ipAddress || null,
    });
  } catch (err) {
    // Never let activity logging crash the main operation
    console.error("Activity log error:", err.message);
  }
};

const getAllActivity = async ({ entity, action, user, page = 1, limit = 20 }) => {
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  if (user) filter.user = user;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ActivityLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  };
};

module.exports = { logActivity, getAllActivity };
