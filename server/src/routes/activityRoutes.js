const express = require("express");
const activityController = require("../controllers/activityController");
const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER", "LOGISTICS_MANAGER"),
  activityController.getAllActivity
);

module.exports = router;
