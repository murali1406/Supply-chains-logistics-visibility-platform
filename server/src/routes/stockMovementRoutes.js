const express = require("express");
const stockMovementController = require("../controllers/stockMovementController");
const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all movements
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER", "LOGISTICS_MANAGER", "STAFF"),
  stockMovementController.getAllMovements
);

// Get movements for a specific inventory item
router.get(
  "/inventory/:inventoryId",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER", "LOGISTICS_MANAGER", "STAFF"),
  stockMovementController.getInventoryMovements
);

// Get movement by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER", "LOGISTICS_MANAGER", "STAFF"),
  stockMovementController.getMovementById
);

module.exports = router;
