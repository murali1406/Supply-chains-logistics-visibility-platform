const Inventory = require("../models/Inventory");
const Warehouse = require("../models/Warehouse");
const { recordMovement } = require("./stockMovementService");
const { createNotification } = require("./notificationService");
const { logActivity } = require("./activityService");

const calculateStatus = (quantity, reorderLevel) => {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= reorderLevel) return "LOW_STOCK";
  return "IN_STOCK";
};

const checkAndNotifyLowStock = async (inventory) => {
  if (inventory.status === "LOW_STOCK") {
    await createNotification({
      type: "LOW_STOCK",
      title: "Low Stock Alert",
      message: `${inventory.productName} (${inventory.sku}) is running low. Current stock: ${inventory.quantity}, Reorder level: ${inventory.reorderLevel}`,
      severity: "WARNING",
      entityType: "INVENTORY",
      entityId: inventory._id,
    });
  } else if (inventory.status === "OUT_OF_STOCK") {
    await createNotification({
      type: "OUT_OF_STOCK",
      title: "Out of Stock Alert",
      message: `${inventory.productName} (${inventory.sku}) is out of stock.`,
      severity: "ERROR",
      entityType: "INVENTORY",
      entityId: inventory._id,
    });
  }
};

const createInventory = async (inventoryData, performedBy) => {
  const { sku, warehouse } = inventoryData;

  const existingInventory = await Inventory.findOne({
    sku: sku.toUpperCase(),
  });

  if (existingInventory) throw new Error("SKU already exists");

  const warehouseExists = await Warehouse.findById(warehouse);
  if (!warehouseExists) throw new Error("Warehouse not found");

  const status = calculateStatus(
    inventoryData.quantity || 0,
    inventoryData.reorderLevel || 10
  );

  const inventory = await Inventory.create({
    ...inventoryData,
    sku: sku.toUpperCase(),
    status,
  });

  // Record initial inbound movement if quantity > 0
  if ((inventoryData.quantity || 0) > 0 && performedBy) {
    await recordMovement({
      type: "INBOUND",
      inventoryId: inventory._id,
      warehouseId: warehouse,
      quantity: inventoryData.quantity,
      previousQuantity: 0,
      newQuantity: inventoryData.quantity,
      reason: "Initial stock",
      performedBy,
    });
  }

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "CREATE",
      entity: "INVENTORY",
      entityId: inventory._id,
      description: `Created inventory item ${inventory.productName} (${inventory.sku})`,
    });
  }

  return Inventory.findById(inventory._id)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");
};

const getAllInventory = async ({ warehouse, status, search, category, page, limit }) => {
  const filter = {};

  if (warehouse) filter.warehouse = warehouse;
  if (status) filter.status = status;
  if (category) filter.category = category;

  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  if (page && limit) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [inventory, total] = await Promise.all([
      Inventory.find(filter)
        .populate("warehouse", "name code location status")
        .populate("supplier", "name companyName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Inventory.countDocuments(filter),
    ]);
    return {
      inventory,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    };
  }

  const inventory = await Inventory.find(filter)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email")
    .sort({ createdAt: -1 });

  return { inventory, pagination: null };
};

const getInventoryById = async (inventoryId) => {
  const inventory = await Inventory.findById(inventoryId)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");

  if (!inventory) throw new Error("Inventory item not found");

  return inventory;
};

const updateInventory = async (inventoryId, updateData, performedBy) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  if (updateData.sku) {
    updateData.sku = updateData.sku.toUpperCase();
    const duplicate = await Inventory.findOne({
      sku: updateData.sku,
      _id: { $ne: inventoryId },
    });
    if (duplicate) throw new Error("SKU already exists");
  }

  if (updateData.warehouse) {
    const warehouseExists = await Warehouse.findById(updateData.warehouse);
    if (!warehouseExists) throw new Error("Warehouse not found");
  }

  Object.assign(inventory, updateData);
  inventory.status = calculateStatus(inventory.quantity, inventory.reorderLevel);
  await inventory.save();

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "UPDATE",
      entity: "INVENTORY",
      entityId: inventory._id,
      description: `Updated inventory item ${inventory.productName} (${inventory.sku})`,
    });
  }

  return Inventory.findById(inventory._id)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");
};

const updateStock = async (inventoryId, quantityChange, performedBy, reason) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  const previousQuantity = inventory.quantity;
  const newQuantity = inventory.quantity + quantityChange;

  if (newQuantity < 0) throw new Error("Insufficient stock");

  inventory.quantity = newQuantity;
  inventory.status = calculateStatus(inventory.quantity, inventory.reorderLevel);
  await inventory.save();

  // Record stock movement
  if (performedBy) {
    const movementType = quantityChange > 0 ? "INBOUND" : "OUTBOUND";
    await recordMovement({
      type: movementType,
      inventoryId: inventory._id,
      warehouseId: inventory.warehouse,
      quantity: Math.abs(quantityChange),
      previousQuantity,
      newQuantity,
      reason: reason || (quantityChange > 0 ? "Stock addition" : "Stock removal"),
      performedBy,
    });

    await logActivity({
      userId: performedBy,
      action: quantityChange > 0 ? "STOCK_IN" : "STOCK_OUT",
      entity: "INVENTORY",
      entityId: inventory._id,
      description: `${quantityChange > 0 ? "Added" : "Removed"} ${Math.abs(quantityChange)} units of ${inventory.productName} (${inventory.sku})`,
    });

    await checkAndNotifyLowStock(inventory);
  }

  return Inventory.findById(inventory._id)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");
};

const getLowStockInventory = async () => {
  return Inventory.find({
    $expr: {
      $and: [
        { $gt: ["$quantity", 0] },
        { $lte: ["$quantity", "$reorderLevel"] },
      ],
    },
  })
    .populate("warehouse", "name code location")
    .populate("supplier", "name companyName email")
    .sort({ quantity: 1 });
};

const getOutOfStockInventory = async () => {
  return Inventory.find({ quantity: 0 })
    .populate("warehouse", "name code location")
    .populate("supplier", "name companyName email")
    .sort({ updatedAt: -1 });
};

const deleteInventory = async (inventoryId, performedBy) => {
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  const name = inventory.productName;
  const sku = inventory.sku;

  await inventory.deleteOne();

  if (performedBy) {
    await logActivity({
      userId: performedBy,
      action: "DELETE",
      entity: "INVENTORY",
      entityId: inventoryId,
      description: `Deleted inventory item ${name} (${sku})`,
    });
  }

  return { id: inventoryId, message: "Inventory item deleted successfully" };
};

const reserveInventory = async (inventoryId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Reservation quantity must be a positive integer");
  }

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  const availableQuantity = inventory.quantity - inventory.reservedQuantity;
  if (availableQuantity < quantity) {
    throw new Error(`Insufficient available stock. Available: ${Math.max(availableQuantity, 0)}`);
  }

  inventory.reservedQuantity += quantity;
  await inventory.save();

  return Inventory.findById(inventory._id)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");
};

const releaseInventoryReservation = async (inventoryId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Release quantity must be a positive integer");
  }

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  if (inventory.reservedQuantity < quantity) {
    throw new Error(`Cannot release ${quantity}. Reserved quantity is only ${inventory.reservedQuantity}`);
  }

  inventory.reservedQuantity -= quantity;
  await inventory.save();

  return Inventory.findById(inventory._id)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");
};

const deductInventory = async (inventoryId, quantity) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Deduction quantity must be a positive integer");
  }

  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) throw new Error("Inventory item not found");

  if (inventory.reservedQuantity < quantity) {
    throw new Error(`Cannot deduct ${quantity}. Reserved quantity is only ${inventory.reservedQuantity}`);
  }

  if (inventory.quantity < quantity) throw new Error("Insufficient stock");

  inventory.quantity -= quantity;
  inventory.reservedQuantity -= quantity;
  inventory.status = calculateStatus(inventory.quantity, inventory.reorderLevel);
  await inventory.save();

  return Inventory.findById(inventory._id)
    .populate("warehouse", "name code location status")
    .populate("supplier", "name companyName email");
};

module.exports = {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
  updateStock,
  getLowStockInventory,
  getOutOfStockInventory,
  deleteInventory,
  reserveInventory,
  releaseInventoryReservation,
  deductInventory,
};