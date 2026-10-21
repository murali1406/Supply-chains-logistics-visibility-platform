const mongoose = require("mongoose");

const shipmentTrackingSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: [true, "Shipment is required"],
      index: true,
    },

    status: {
      type: String,
      required: [true, "Tracking status is required"],
      enum: [
        "PENDING",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "DELAYED",
      ],
    },

    location: {
      address: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

shipmentTrackingSchema.index({
  shipment: 1,
  timestamp: -1,
});

module.exports = mongoose.model(
  "ShipmentTracking",
  shipmentTrackingSchema
);