const express = require("express");

const supplierController = require("../controllers/supplierController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create supplier
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  supplierController.createSupplier
);

// Get all suppliers
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  supplierController.getAllSuppliers
);

// Get supplier by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  supplierController.getSupplierById
);

// Update supplier
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  supplierController.updateSupplier
);

// Delete supplier
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  supplierController.deleteSupplier
);

module.exports = router;