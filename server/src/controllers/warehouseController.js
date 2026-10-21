const warehouseService = require("../services/warehouseService");

const createWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error.message);

    if (error.message === "Warehouse code already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create warehouse",
    });
  }
};

const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await warehouseService.getAllWarehouses({
      status: req.query.status,
      city: req.query.city,
    });

    return res.status(200).json({
      success: true,
      count: warehouses.length,
      warehouses,
    });
  } catch (error) {
    console.error("Get warehouses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve warehouses",
    });
  }
};

const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error("Get warehouse error:", error.message);

    if (error.message === "Warehouse not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve warehouse",
    });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await warehouseService.updateWarehouse(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      warehouse,
    });
  } catch (error) {
    console.error("Update warehouse error:", error.message);

    if (error.message === "Warehouse not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Warehouse code already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update warehouse",
    });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const result = await warehouseService.deleteWarehouse(req.params.id);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Delete warehouse error:", error.message);

    if (error.message === "Warehouse not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete warehouse",
    });
  }
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};