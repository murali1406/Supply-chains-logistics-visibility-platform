require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");
const ensureAdminExists = require("./src/utils/bootstrapAdmin");

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDatabase();
    await ensureAdminExists();

    app.listen(PORT, () => {
      console.log(`✅ LogiTrack server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
