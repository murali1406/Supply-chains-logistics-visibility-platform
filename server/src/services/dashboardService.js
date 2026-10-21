const Inventory = require("../models/Inventory");
const Warehouse = require("../models/Warehouse");
const Supplier = require("../models/Supplier");
const Shipment = require("../models/Shipment");
const StockMovement = require("../models/StockMovement");
const User = require("../models/User");

/**
 * Calculate dashboard statistics with role-based scoping and real database aggregations.
 *
 * Role scoping:
 * - ADMIN: Entire organization
 * - LOGISTICS_MANAGER: Organization logistics network (warehouses, shipments, movements, catalog)
 * - WAREHOUSE_MANAGER: Scoped to their managed warehouse(s) if assigned, or all active
 * - PROCUREMENT_MANAGER / SUPPLIER: Procurement and supplier shipment scope
 */
const getDashboardStats = async (user = {}) => {
  const { userId, role } = user;

  // Build role-based query scopes
  let warehouseFilter = {};
  let inventoryFilter = {};
  let shipmentFilter = {};
  let movementFilter = {};

  if (role === "WAREHOUSE_MANAGER" && userId) {
    const managedWarehouses = await Warehouse.find({ manager: userId }).select("_id");
    if (managedWarehouses && managedWarehouses.length > 0) {
      const whIds = managedWarehouses.map((w) => w._id);
      warehouseFilter = { _id: { $in: whIds } };
      inventoryFilter = { warehouse: { $in: whIds } };
      shipmentFilter = { warehouse: { $in: whIds } };
      movementFilter = { warehouse: { $in: whIds } };
    }
  }

  // Define out-of-stock and low-stock filter criteria
  const outOfStockFilter = {
    ...inventoryFilter,
    $or: [{ quantity: { $lte: 0 } }, { status: "OUT_OF_STOCK" }],
  };

  const lowStockFilter = {
    ...inventoryFilter,
    $and: [
      { quantity: { $gt: 0 } },
      {
        $or: [
          { status: "LOW_STOCK" },
          {
            $expr: {
              $lte: ["$quantity", { $ifNull: ["$reorderLevel", 10] }],
            },
          },
        ],
      },
    ],
  };

  const [
    totalInventoryItems,
    totalWarehouses,
    totalActiveWarehouses,
    totalSuppliers,
    lowStockCount,
    outOfStockCount,
    pendingShipmentsCount,
    totalUsersCount,
    activeUsersCount,
    recentMovements,
    inventoryValueResult,
    stockByStatusResult,
    warehouseDistribution,
    recentShipments,
    movementTrend,
    lowStockProducts,
  ] = await Promise.all([
    // 1. Total Products count in scope
    Inventory.countDocuments(inventoryFilter),

    // 2. Total Warehouses in scope
    Warehouse.countDocuments(warehouseFilter),

    // 3. Active Warehouses in scope
    Warehouse.countDocuments({ ...warehouseFilter, status: "ACTIVE" }),

    // 4. Active Suppliers count
    Supplier.countDocuments({ status: "ACTIVE" }),

    // 5. Low Stock Items count
    Inventory.countDocuments(lowStockFilter),

    // 6. Out of Stock count
    Inventory.countDocuments(outOfStockFilter),

    // 7. Pending / In-Transit Shipments
    Shipment.countDocuments({
      ...shipmentFilter,
      status: { $in: ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
    }),

    // 7b. Total and active users count
    User.countDocuments(),
    User.countDocuments({ accountStatus: "ACTIVE" }),

    // 8. Recent 5 stock movements in scope
    StockMovement.find(movementFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("inventory", "productName sku")
      .populate("warehouse", "name code")
      .populate("performedBy", "name email role"),

    // 9. Total inventory value: sum(quantity * unitPrice) for non-negative stock
    Inventory.aggregate([
      { $match: inventoryFilter },
      {
        $group: {
          _id: null,
          totalValue: {
            $sum: {
              $multiply: [
                { $max: ["$quantity", 0] },
                { $ifNull: ["$unitPrice", 0] },
              ],
            },
          },
        },
      },
    ]),

    // 10. Stock by status aggregation
    Inventory.aggregate([
      { $match: inventoryFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    // 11. Inventory distribution per warehouse
    Inventory.aggregate([
      { $match: inventoryFilter },
      {
        $group: {
          _id: "$warehouse",
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$unitPrice"] } },
        },
      },
      {
        $lookup: {
          from: "warehouses",
          localField: "_id",
          foreignField: "_id",
          as: "warehouseInfo",
        },
      },
      {
        $unwind: { path: "$warehouseInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          warehouseName: "$warehouseInfo.name",
          warehouseCode: "$warehouseInfo.code",
          totalItems: 1,
          totalQuantity: 1,
          totalValue: 1,
        },
      },
      { $sort: { totalItems: -1 } },
      { $limit: 6 },
    ]),

    // 12. Recent shipments in scope
    Shipment.find(shipmentFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("supplier", "name companyName")
      .populate("warehouse", "name code")
      .select("shipmentNumber status shippingDate estimatedDelivery supplier warehouse carrier"),

    // 13. Stock movement trend (last 7 days by type)
    StockMovement.aggregate([
      {
        $match: {
          ...movementFilter,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            type: "$type",
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]),

    // 14. Low stock products list (top 10)
    Inventory.find(lowStockFilter)
      .sort({ quantity: 1 })
      .limit(10)
      .populate("warehouse", "name code location")
      .select("productName sku quantity reorderLevel status warehouse unitPrice category"),
  ]);

  const totalInventoryValue = inventoryValueResult[0]?.totalValue || 0;

  // Build stock by status dictionary with defaults
  const stockByStatus = {
    IN_STOCK: 0,
    LOW_STOCK: 0,
    OUT_OF_STOCK: 0,
  };
  (stockByStatusResult || []).forEach((item) => {
    if (item._id) {
      stockByStatus[item._id] = item.count;
    }
  });

  const kpis = {
    totalProducts: totalInventoryItems,
    totalInventoryValue,
    activeWarehouses: totalActiveWarehouses,
    totalWarehouses,
    lowStockItems: lowStockCount,
    outOfStock: outOfStockCount,
    outOfStockItems: outOfStockCount,
    activeSuppliers: totalSuppliers,
    pendingShipments: pendingShipmentsCount,
    totalUsers: totalUsersCount,
    activeUsers: activeUsersCount,
  };

  return {
    totalProducts: totalInventoryItems,
    totalInventoryValue,
    activeWarehouses: totalActiveWarehouses,
    totalWarehouses,
    lowStockItems: lowStockCount,
    outOfStock: outOfStockCount,
    outOfStockItems: outOfStockCount,
    activeSuppliers: totalSuppliers,
    pendingShipments: pendingShipmentsCount,
    totalUsers: totalUsersCount,
    activeUsers: activeUsersCount,
    kpis,
    stockByStatus,
    warehouseDistribution,
    lowStockProducts,
    recentMovements,
    recentShipments,
    movementTrend,
  };
};

module.exports = { getDashboardStats };
