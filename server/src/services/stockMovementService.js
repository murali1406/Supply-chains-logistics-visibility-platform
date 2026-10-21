const StockMovement = require("../models/StockMovement");
const Inventory = require("../models/Inventory");
const Warehouse = require("../models/Warehouse");

const createMovement = async ({
  type,
  inventoryId,
  warehouseId,
  destinationWarehouseId,
  quantity,
  reason,
  reference,
  performedBy,
  shipmentId,
}) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) throw new Error("Warehouse not found");

  const movement = await StockMovement.create({
    type,
    inventory: inventoryId,
    warehouse: warehouseId,
    destinationWarehouse: destinationWarehouseId || null,
    quantity,
    previousQuantity: inventory.quantity,
    newQuantity: inventory.quantity,
    reason,
    reference,
    performedBy,
    shipment: shipmentId || null,
  });

  return StockMovement.findById(movement._id)
    .populate("inventory", "productName sku")
    .populate("warehouse", "name code")
    .populate("destinationWarehouse", "name code")
    .populate("performedBy", "name email role");
};

const recordMovement = async ({
  type,
  inventoryId,
  warehouseId,
  destinationWarehouseId,
  quantity,
  previousQuantity,
  newQuantity,
  reason,
  reference,
  performedBy,
  shipmentId,
}) => {
  const movement = await StockMovement.create({
    type,
    inventory: inventoryId,
    warehouse: warehouseId,
    destinationWarehouse: destinationWarehouseId || null,
    quantity,
    previousQuantity,
    newQuantity,
    reason,
    reference,
    performedBy,
    shipment: shipmentId || null,
  });

  return movement;
};

const getAllMovements = async ({ type, warehouse, inventory, startDate, endDate, search, page = 1, limit = 20 }) => {
  const filter = {};

  if (type) filter.type = type;
  if (warehouse) filter.warehouse = warehouse;
  if (inventory) filter.inventory = inventory;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [movements, total] = await Promise.all([
    StockMovement.find(filter)
      .populate("inventory", "productName sku")
      .populate("warehouse", "name code")
      .populate("destinationWarehouse", "name code")
      .populate("performedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    StockMovement.countDocuments(filter),
  ]);

  return {
    movements,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  };
};

const getMovementById = async (movementId) => {
  const movement = await StockMovement.findById(movementId)
    .populate("inventory", "productName sku unitPrice")
    .populate("warehouse", "name code location")
    .populate("destinationWarehouse", "name code location")
    .populate("performedBy", "name email role")
    .populate("shipment", "shipmentNumber trackingNumber");

  if (!movement) throw new Error("Stock movement not found");

  return movement;
};

const getInventoryMovements = async (inventoryId) => {
  return StockMovement.find({ inventory: inventoryId })
    .populate("warehouse", "name code")
    .populate("destinationWarehouse", "name code")
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50);
};

module.exports = {
  createMovement,
  recordMovement,
  getAllMovements,
  getMovementById,
  getInventoryMovements,
};
