const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Route imports
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/authRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const shipmentTrackingRoutes = require("./routes/shipmentTrackingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const stockMovementRoutes = require("./routes/stockMovementRoutes");
const activityRoutes = require("./routes/activityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const testAuthRoutes = require("./routes/testAuthRoutes");
const testRoleRoutes = require("./routes/testRoleRoutes");

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// CORS — support configured client URLs, Vite ports (5173, 5174, etc.), React ports (3000), and dynamic development origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:3000",
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server or tools without origin header
  if (allowedOrigins.includes(origin)) return true;
  // In development, permit any localhost or 127.0.0.1 port
  if (process.env.NODE_ENV !== "production") {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests. Please try again later." },
});

app.use("/api", apiLimiter);

// Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/shipments", shipmentRoutes);
app.use("/api/v1/shipment-tracking", shipmentTrackingRoutes);
app.use("/api/v1/stock-movements", stockMovementRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/users", userRoutes);

// Development test routes
if (process.env.NODE_ENV === "development") {
  app.use("/api/v1/test", testAuthRoutes);
  app.use("/api/v1/test/roles", testRoleRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

module.exports = app;
