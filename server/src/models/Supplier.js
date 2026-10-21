const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      maxlength: 150,
    },

    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 150,
    },

    supplierCode: {
      type: String,
      required: [true, "Supplier code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },

    email: {
      type: String,
      required: [true, "Supplier email is required"],
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Supplier phone is required"],
      trim: true,
    },

    address: {
      street: {
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

    category: {
      type: String,
      trim: true,
    },

    paymentTerms: {
      type: String,
      enum: [
        "ADVANCE",
        "NET_15",
        "NET_30",
        "NET_45",
        "NET_60",
      ],
      default: "NET_30",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
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

supplierSchema.index({ status: 1 });
supplierSchema.index({ companyName: 1 });

module.exports = mongoose.model("Supplier", supplierSchema);