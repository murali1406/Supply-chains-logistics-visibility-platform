const inventoryService = require("../services/inventoryService");

const createInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.createInventory(req.body, req.user.userId);

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      inventory,
    });
  } catch (error) {
    console.error("Create inventory error:", error.message);

    if (error.message === "SKU already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.message === "Warehouse not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory data",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    return res.status(500).json({ success: false, message: "Failed to create inventory" });
  }
};

const getAllInventory = async (req, res) => {
  try {
    const result = await inventoryService.getAllInventory({
      warehouse: req.query.warehouse,
      status: req.query.status,
      category: req.query.category,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      count: result.inventory.length,
      ...result,
    });
  } catch (error) {
    console.error("Get inventory error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to retrieve inventory" });
  }
};

const getInventoryById = async (req, res) => {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
    return res.status(200).json({ success: true, inventory });
  } catch (error) {
    if (error.message === "Inventory item not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to retrieve inventory item" });
  }
};

const updateInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.updateInventory(req.params.id, req.body, req.user.userId);
    return res.status(200).json({ success: true, message: "Inventory updated successfully", inventory });
  } catch (error) {
    if (error.message === "Inventory item not found" || error.message === "Warehouse not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "SKU already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to update inventory" });
  }
};

const updateStock = async (req, res) => {
  try {
    const { quantityChange, reason } = req.body;

    if (quantityChange === undefined || typeof quantityChange !== "number" || quantityChange === 0) {
      return res.status(400).json({ success: false, message: "quantityChange must be a non-zero number" });
    }

    const inventory = await inventoryService.updateStock(req.params.id, quantityChange, req.user.userId, reason);
    return res.status(200).json({ success: true, message: "Stock updated successfully", inventory });
  } catch (error) {
    if (error.message === "Inventory item not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "Insufficient stock") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to update stock" });
  }
};

const getLowStockInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.getLowStockInventory();
    return res.status(200).json({ success: true, count: inventory.length, inventory });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve low-stock inventory" });
  }
};

const getOutOfStockInventory = async (req, res) => {
  try {
    const inventory = await inventoryService.getOutOfStockInventory();
    return res.status(200).json({ success: true, count: inventory.length, inventory });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve out-of-stock inventory" });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const result = await inventoryService.deleteInventory(req.params.id, req.user.userId);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error.message === "Inventory item not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to delete inventory" });
  }
};

const reserveInventory = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
    }

    const inventory = await inventoryService.reserveInventory(req.params.id, quantity);
    return res.status(200).json({ success: true, message: "Inventory reserved successfully", inventory });
  } catch (error) {
    if (error.message === "Inventory item not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Insufficient available stock")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to reserve inventory" });
  }
};

const releaseInventoryReservation = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
    }

    const inventory = await inventoryService.releaseInventoryReservation(req.params.id, quantity);
    return res.status(200).json({ success: true, message: "Inventory reservation released successfully", inventory });
  } catch (error) {
    if (error.message === "Inventory item not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Cannot release")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to release inventory reservation" });
  }
};

const deductInventory = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "quantity must be a positive integer" });
    }

    const inventory = await inventoryService.deductInventory(req.params.id, quantity);
    return res.status(200).json({ success: true, message: "Inventory deducted successfully", inventory });
  } catch (error) {
    if (error.message === "Inventory item not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "Insufficient stock" || error.message.startsWith("Cannot deduct")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to deduct inventory" });
  }
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