const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "STOCK_IN",
        "STOCK_OUT",
        "TRANSFER",
        "ADJUSTMENT",
        "STATUS_CHANGE",
        "RECEIVE",
      ],
    },

    entity: {
      type: String,
      required: [true, "Entity is required"],
      enum: [
        "USER",
        "WAREHOUSE",
        "INVENTORY",
        "SUPPLIER",
        "SHIPMENT",
        "STOCK_MOVEMENT",
      ],
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 500,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ entity: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
