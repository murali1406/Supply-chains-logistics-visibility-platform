const mongoose = require("mongoose");

const shipmentItemSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentNumber: {
      type: String,
      required: [true, "Shipment number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },

    trackingNumber: {
      type: String,
      required: [true, "Tracking number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 100,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse is required"],
    },

    destination: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      postalCode: {
        type: String,
        trim: true,
      },

      country: {
        type: String,
        default: "India",
        trim: true,
      },
    },

    carrier: {
      type: String,
      required: [true, "Carrier is required"],
      trim: true,
    },

    items: {
      type: [shipmentItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: "Shipment must contain at least one item",
      },
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    shippingDate: {
      type: Date,
      default: Date.now,
    },

    estimatedDelivery: {
      type: Date,
      required: true,
    },

    actualDelivery: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

shipmentSchema.index({ status: 1 });
shipmentSchema.index({ supplier: 1 });
shipmentSchema.index({ warehouse: 1 });
shipmentSchema.index({ estimatedDelivery: 1 });

module.exports = mongoose.model("Shipment", shipmentSchema);