const express = require("express");
const notificationController = require("../controllers/notificationController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, notificationController.getNotifications);
router.get("/unread-count", authenticate, notificationController.getUnreadCount);
router.patch("/:id/read", authenticate, notificationController.markAsRead);
router.patch("/mark-all-read", authenticate, notificationController.markAllAsRead);

module.exports = router;
