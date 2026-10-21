const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: [
        "ADMIN",
        "WAREHOUSE_MANAGER",
        "LOGISTICS_MANAGER",
        "PROCUREMENT_MANAGER",
        "SUPPLIER",
        "STAFF",
      ],
      default: "STAFF",
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      default: "Operations",
    },

    assignedWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ assignedWarehouse: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;