const shipmentService = require("../services/shipmentService");

// Create shipment
const createShipment = async (req, res) => {
  try {
    const shipment = await shipmentService.createShipment(req.body);

    res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      shipment,
    });
  } catch (error) {
    let statusCode = 500;

    if (error.message.includes("already exists")) {
      statusCode = 409;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.name === "ValidationError") {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all shipments
const getAllShipments = async (req, res) => {
  try {
    const shipments = await shipmentService.getAllShipments({
      status: req.query.status,
      supplier: req.query.supplier,
      warehouse: req.query.warehouse,
      search: req.query.search,
    });

    res.status(200).json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get shipment by ID
const getShipmentById = async (req, res) => {
  try {
    const shipment = await shipmentService.getShipmentById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      shipment,
    });
  } catch (error) {
    const statusCode =
      error.message === "Shipment not found" ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Update shipment
const updateShipment = async (req, res) => {
  try {
    const shipment = await shipmentService.updateShipment(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Shipment updated successfully",
      shipment,
    });
  } catch (error) {
    let statusCode = 500;

    if (error.message.includes("already exists")) {
      statusCode = 409;
    } else if (error.message.includes("not found")) {
      statusCode = 404;
    } else if (error.name === "ValidationError") {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Update shipment status
const updateShipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const shipment = await shipmentService.updateShipmentStatus(
      req.params.id,
      status,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Shipment status updated successfully",
      shipment,
    });
  } catch (error) {
    let statusCode = 500;

    if (error.message === "Shipment not found") {
      statusCode = 404;
    } else if (error.message === "Invalid shipment status") {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete shipment
const deleteShipment = async (req, res) => {
  try {
    const result = await shipmentService.deleteShipment(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode =
      error.message === "Shipment not found" ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createShipment,
  getAllShipments,
  getShipmentById,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
};
