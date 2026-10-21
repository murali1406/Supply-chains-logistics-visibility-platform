const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Warehouse name is required"],
      trim: true,
      maxlength: 100,
    },

    code: {
      type: String,
      required: [true, "Warehouse code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },

    location: {
      address: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },

      state: {
        type: String,
        trim: true,
      },

      country: {
        type: String,
        default: "India",
        trim: true,
      },

      postalCode: {
        type: String,
        trim: true,
      },
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    capacity: {
      type: Number,
      required: [true, "Warehouse capacity is required"],
      min: [0, "Capacity cannot be negative"],
    },

    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, "Occupancy cannot be negative"],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
      default: "ACTIVE",
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

warehouseSchema.index({ status: 1 });
warehouseSchema.index({ "location.city": 1 });

module.exports = mongoose.model("Warehouse", warehouseSchema);