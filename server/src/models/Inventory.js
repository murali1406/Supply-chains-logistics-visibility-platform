const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 150,
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },

    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "General",
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse is required"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Reserved quantity cannot be negative"],
    },

    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, "Reorder level cannot be negative"],
    },

    maxStock: {
      type: Number,
      default: null,
      min: [0, "Max stock cannot be negative"],
    },

    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    status: {
      type: String,
      enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"],
      default: "IN_STOCK",
    },
  },
  {
    timestamps: true,
  }
);

inventorySchema.index({ warehouse: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ warehouse: 1, status: 1 });

inventorySchema.virtual("availableQuantity").get(function () {
  return Math.max(this.quantity - this.reservedQuantity, 0);
});

inventorySchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Inventory", inventorySchema);