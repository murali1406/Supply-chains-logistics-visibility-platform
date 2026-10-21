const express = require("express");

const shipmentTrackingController = require("../controllers/shipmentTrackingController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create tracking event
router.post(
  "/:shipmentId",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "LOGISTICS_MANAGER",
    "WAREHOUSE_MANAGER"
  ),
  shipmentTrackingController.createTrackingEvent
);

// Get complete tracking history
router.get(
  "/:shipmentId",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  shipmentTrackingController.getShipmentTrackingHistory
);

// Get latest tracking event
router.get(
  "/:shipmentId/latest",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  shipmentTrackingController.getLatestTrackingEvent
);

// Delete tracking history
router.delete(
  "/:shipmentId",
  authenticate,
  authorizeRoles("ADMIN"),
  shipmentTrackingController.deleteShipmentTrackingHistory
);

module.exports = router;