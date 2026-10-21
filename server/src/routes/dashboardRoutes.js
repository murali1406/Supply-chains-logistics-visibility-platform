const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "PROCUREMENT_MANAGER",
    "STAFF"
  ),
  dashboardController.getDashboardStats
);

module.exports = router;
