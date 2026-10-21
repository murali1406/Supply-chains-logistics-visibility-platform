const activityService = require("../services/activityService");

const getAllActivity = async (req, res) => {
  try {
    const result = await activityService.getAllActivity({
      entity: req.query.entity,
      action: req.query.action,
      user: req.query.user,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get activity error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs",
    });
  }
};

module.exports = { getAllActivity };
