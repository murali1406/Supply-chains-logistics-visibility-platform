const notificationService = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getNotifications({
      targetUser: req.user.userId,
      isRead: req.query.isRead,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve notifications" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    return res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    if (error.message === "Notification not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
