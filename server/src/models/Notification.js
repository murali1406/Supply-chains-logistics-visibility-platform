const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "LOW_STOCK",
        "OUT_OF_STOCK",
        "SHIPMENT_RECEIVED",
        "SHIPMENT_DELAYED",
        "NEW_SHIPMENT",
        "STOCK_ADJUSTMENT",
        "SYSTEM",
      ],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 1000,
    },

    severity: {
      type: String,
      enum: ["INFO", "WARNING", "ERROR", "SUCCESS"],
      default: "INFO",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Target user (null = broadcast to all admins/managers)
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    entityType: {
      type: String,
      enum: ["INVENTORY", "SHIPMENT", "WAREHOUSE", "SUPPLIER", "SYSTEM", null],
      default: null,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ isRead: 1 });
notificationSchema.index({ targetUser: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
