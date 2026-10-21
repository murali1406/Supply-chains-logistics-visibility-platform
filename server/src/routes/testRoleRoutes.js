const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/admin-only",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Admin-only route accessed successfully",
      user: req.user,
    });
  }
);

router.get(
  "/warehouse",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Warehouse route accessed successfully",
      user: req.user,
    });
  }
);

module.exports = router;