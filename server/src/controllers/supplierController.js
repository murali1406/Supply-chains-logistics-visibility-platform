const supplierService = require("../services/supplierService");

const createSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.createSupplier(req.body);

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error.message);

    if (error.message === "Supplier code already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier data",
        errors: Object.values(error.errors).map(
          (err) => err.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier",
    });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierService.getAllSuppliers({
      status: req.query.status,
      category: req.query.category,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      count: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("Get suppliers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve suppliers",
    });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      supplier,
    });
  } catch (error) {
    console.error("Get supplier error:", error.message);

    if (error.message === "Supplier not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve supplier",
    });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.updateSupplier(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error.message);

    if (error.message === "Supplier not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Supplier code already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier data",
        errors: Object.values(error.errors).map(
          (err) => err.message
        ),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update supplier",
    });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const result = await supplierService.deleteSupplier(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Delete supplier error:", error.message);

    if (error.message === "Supplier not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
    });
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};