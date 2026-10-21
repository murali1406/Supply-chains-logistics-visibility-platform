const stockMovementService = require("../services/stockMovementService");

const getAllMovements = async (req, res) => {
  try {
    const result = await stockMovementService.getAllMovements({
      type: req.query.type,
      warehouse: req.query.warehouse,
      inventory: req.query.inventory,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get movements error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve stock movements",
    });
  }
};

const getMovementById = async (req, res) => {
  try {
    const movement = await stockMovementService.getMovementById(req.params.id);
    return res.status(200).json({ success: true, movement });
  } catch (error) {
    if (error.message === "Stock movement not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Failed to retrieve movement" });
  }
};

const getInventoryMovements = async (req, res) => {
  try {
    const movements = await stockMovementService.getInventoryMovements(req.params.inventoryId);
    return res.status(200).json({ success: true, count: movements.length, movements });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve inventory movements" });
  }
};

module.exports = { getAllMovements, getMovementById, getInventoryMovements };
