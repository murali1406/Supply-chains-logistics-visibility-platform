const Notification = require("../models/Notification");

const createNotification = async ({
  type,
  title,
  message,
  severity = "INFO",
  targetUser = null,
  entityType = null,
  entityId = null,
}) => {
  try {
    await Notification.create({
      type,
      title,
      message,
      severity,
      targetUser,
      entityType,
      entityId,
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }
};

const getNotifications = async ({ targetUser, isRead, page = 1, limit = 20 }) => {
  const filter = {
    $or: [{ targetUser: null }, { targetUser }],
  };

  if (isRead !== undefined) filter.isRead = isRead === "true";

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  };
};

const markAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new Error("Notification not found");
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { $or: [{ targetUser: null }, { targetUser: userId }], isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { message: "All notifications marked as read" };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    $or: [{ targetUser: null }, { targetUser: userId }],
    isRead: false,
  });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
