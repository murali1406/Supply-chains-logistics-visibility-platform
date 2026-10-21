const express = require("express");

const warehouseController = require("../controllers/warehouseController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create warehouse
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  warehouseController.createWarehouse
);

// Get all warehouses
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  warehouseController.getAllWarehouses
);

// Get warehouse by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  warehouseController.getWarehouseById
);

// Update warehouse
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  warehouseController.updateWarehouse
);

// Delete warehouse
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  warehouseController.deleteWarehouse
);

module.exports = router;