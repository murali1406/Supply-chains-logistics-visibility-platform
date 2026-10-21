const dashboardService = require("../services/dashboardService");

const getDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user);

    return res.status(200).json({
      success: true,
      ...stats,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
    });
  }
};

module.exports = { getDashboardStats };
