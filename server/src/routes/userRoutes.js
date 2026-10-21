const express = require("express");
const userController = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// View routes: accessible to Admin, Logistics Manager, Warehouse Manager
router.get(
  "/",
  authorizeRoles("ADMIN", "LOGISTICS_MANAGER", "WAREHOUSE_MANAGER"),
  userController.getAllUsers
);

router.get(
  "/:id",
  authorizeRoles("ADMIN", "LOGISTICS_MANAGER", "WAREHOUSE_MANAGER"),
  userController.getUserById
);

// Management routes: Admin and Managers for user creation, Admin only for sensitive mutations
router.post(
  "/",
  authorizeRoles("ADMIN", "LOGISTICS_MANAGER"),
  userController.createUser
);

router.put(
  "/:id",
  authorizeRoles("ADMIN"),
  userController.updateUser
);

router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  userController.updateUserStatus
);

router.patch(
  "/:id/role",
  authorizeRoles("ADMIN"),
  userController.updateUserRole
);

router.delete(
  "/:id",
  authorizeRoles("ADMIN"),
  userController.deleteUser
);

module.exports = router;
