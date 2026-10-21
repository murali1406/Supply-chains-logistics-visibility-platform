const express = require("express");

const shipmentController = require("../controllers/shipmentController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create shipment
router.post(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  shipmentController.createShipment
);

// Get all shipments
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  shipmentController.getAllShipments
);

// Get shipment by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  shipmentController.getShipmentById
);

// Update shipment
router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  shipmentController.updateShipment
);

// Update shipment status
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  shipmentController.updateShipmentStatus
);

// Delete shipment
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  shipmentController.deleteShipment
);

module.exports = router;