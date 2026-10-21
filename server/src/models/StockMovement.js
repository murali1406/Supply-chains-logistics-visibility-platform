const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Movement type is required"],
      enum: ["INBOUND", "OUTBOUND", "TRANSFER", "ADJUSTMENT"],
    },

    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Inventory item is required"],
    },

    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse is required"],
    },

    // For TRANSFER movements
    destinationWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    reference: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

stockMovementSchema.index({ inventory: 1 });
stockMovementSchema.index({ warehouse: 1 });
stockMovementSchema.index({ type: 1 });
stockMovementSchema.index({ performedBy: 1 });
stockMovementSchema.index({ createdAt: -1 });

module.exports = mongoose.model("StockMovement", stockMovementSchema);
