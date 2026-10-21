const express = require("express");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/protected", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

module.exports = router;