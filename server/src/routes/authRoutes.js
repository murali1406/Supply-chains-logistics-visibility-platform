const express = require("express");
const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../validators/authValidator");
const validateRequest = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", registerValidation, validateRequest, authController.register);
router.post("/login", loginValidation, validateRequest, authController.login);
router.get("/me", authenticate, authController.getMe);

module.exports = router;