require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./src/models/User");
const Warehouse = require("./src/models/Warehouse");
const Supplier = require("./src/models/Supplier");
const Inventory = require("./src/models/Inventory");
const Shipment = require("./src/models/Shipment");
const StockMovement = require("./src/models/StockMovement");
const ActivityLog = require("./src/models/ActivityLog");
const Notification = require("./src/models/Notification");

const connectDatabase = require("./src/config/database");

async function seed() {
  await connectDatabase();
  console.log("🌱 Starting seed...");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Warehouse.deleteMany({}),
    Supplier.deleteMany({}),
    Inventory.deleteMany({}),
    Shipment.deleteMany({}),
    StockMovement.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log("✅ Cleared existing data");

  // Create users
  const password = await bcrypt.hash("Admin@123", 12);

  const [admin, manager, staff] = await User.insertMany([
    { name: "Arjun Mehta", email: "admin@logitrack.com", password, role: "ADMIN", accountStatus: "ACTIVE" },
    { name: "Priya Sharma", email: "manager@logitrack.com", password, role: "WAREHOUSE_MANAGER", accountStatus: "ACTIVE" },
    { name: "Rahul Singh", email: "staff@logitrack.com", password, role: "STAFF", accountStatus: "ACTIVE" },
    { name: "Deepa Nair", email: "logistics@logitrack.com", password, role: "LOGISTICS_MANAGER", accountStatus: "ACTIVE" },
  ]);
  console.log("✅ Created users");

  // Create warehouses
  const warehouses = await Warehouse.insertMany([
    {
      name: "Mumbai Central Warehouse",
      code: "MUM-01",
      location: { address: "Plot 12, MIDC Industrial Area", city: "Mumbai", state: "Maharashtra", country: "India", postalCode: "400093" },
      capacity: 5000,
      currentOccupancy: 3200,
      status: "ACTIVE",
      contactPhone: "+91-22-4567-8901",
      contactEmail: "mumbai@logitrack.com",
      manager: manager._id,
    },
    {
      name: "Delhi NCR Distribution Hub",
      code: "DEL-01",
      location: { address: "NH-58, Industrial Sector 65", city: "Gurugram", state: "Haryana", country: "India", postalCode: "122001" },
      capacity: 8000,
      currentOccupancy: 5100,
      status: "ACTIVE",
      contactPhone: "+91-124-3456-789",
      contactEmail: "delhi@logitrack.com",
      manager: manager._id,
    },
    {
      name: "Bengaluru South Warehouse",
      code: "BLR-01",
      location: { address: "44, Electronic City Phase 1", city: "Bengaluru", state: "Karnataka", country: "India", postalCode: "560100" },
      capacity: 4000,
      currentOccupancy: 1800,
      status: "ACTIVE",
      contactPhone: "+91-80-2345-6789",
      contactEmail: "blr@logitrack.com",
    },
    {
      name: "Chennai Port Warehouse",
      code: "CHN-01",
      location: { address: "12, Kattupalli Port Road", city: "Chennai", state: "Tamil Nadu", country: "India", postalCode: "600119" },
      capacity: 6000,
      currentOccupancy: 2400,
      status: "ACTIVE",
      contactPhone: "+91-44-5678-9012",
      contactEmail: "chennai@logitrack.com",
    },
    {
      name: "Pune Logistics Park",
      code: "PNE-01",
      location: { address: "Plot 7, Chakan MIDC", city: "Pune", state: "Maharashtra", country: "India", postalCode: "410501" },
      capacity: 3000,
      currentOccupancy: 0,
      status: "MAINTENANCE",
      contactPhone: "+91-20-3456-7890",
      contactEmail: "pune@logitrack.com",
    },
  ]);
  console.log("✅ Created warehouses");

  // Create suppliers
  const suppliers = await Supplier.insertMany([
    {
      name: "Rajesh Kumar",
      companyName: "TechParts India Pvt Ltd",
      supplierCode: "SUP-001",
      email: "rajesh@techparts.in",
      phone: "+91-98765-43210",
      address: { street: "45, Industrial Area", city: "Pune", state: "Maharashtra", country: "India", postalCode: "411019" },
      category: "Electronics",
      paymentTerms: "NET_30",
      status: "ACTIVE",
      rating: 4.5,
    },
    {
      name: "Anita Desai",
      companyName: "Global Packaging Solutions",
      supplierCode: "SUP-002",
      email: "anita@gps.com",
      phone: "+91-87654-32109",
      address: { street: "78, Trade Zone", city: "Surat", state: "Gujarat", country: "India", postalCode: "395003" },
      category: "Packaging",
      paymentTerms: "NET_15",
      status: "ACTIVE",
      rating: 4.2,
    },
    {
      name: "Mohammed Iqbal",
      companyName: "Iqbal Hardware & Components",
      supplierCode: "SUP-003",
      email: "iqbal@hardware.com",
      phone: "+91-76543-21098",
      address: { street: "22, Metal Works District", city: "Ludhiana", state: "Punjab", country: "India", postalCode: "141001" },
      category: "Hardware",
      paymentTerms: "NET_45",
      status: "ACTIVE",
      rating: 3.8,
    },
    {
      name: "Sunita Reddy",
      companyName: "Reddy Chemicals & Raw Materials",
      supplierCode: "SUP-004",
      email: "sunita@reddychem.com",
      phone: "+91-65432-10987",
      address: { street: "Plot 15, Chemical Zone", city: "Hyderabad", state: "Telangana", country: "India", postalCode: "500072" },
      category: "Chemicals",
      paymentTerms: "ADVANCE",
      status: "ACTIVE",
      rating: 4.0,
    },
    {
      name: "Vikram Patel",
      companyName: "Patel Textiles & Fibres",
      supplierCode: "SUP-005",
      email: "vikram@pateltextiles.com",
      phone: "+91-54321-09876",
      address: { street: "Textile Market, Ring Road", city: "Ahmedabad", state: "Gujarat", country: "India", postalCode: "380002" },
      category: "Textiles",
      paymentTerms: "NET_60",
      status: "INACTIVE",
      rating: 3.5,
    },
  ]);
  console.log("✅ Created suppliers");

  // Create inventory items
  const inventoryData = [
    { productName: "Industrial Motor 5HP", sku: "MOT-5HP-001", category: "Electronics", warehouse: warehouses[0]._id, quantity: 45, reorderLevel: 15, maxStock: 100, unitPrice: 12500, supplier: suppliers[0]._id, status: "IN_STOCK" },
    { productName: "Control Panel Unit", sku: "CPU-V2-002", category: "Electronics", warehouse: warehouses[0]._id, quantity: 8, reorderLevel: 10, maxStock: 50, unitPrice: 45000, supplier: suppliers[0]._id, status: "LOW_STOCK" },
    { productName: "Corrugated Box 60x40", sku: "BOX-6040-003", category: "Packaging", warehouse: warehouses[1]._id, quantity: 1200, reorderLevel: 200, maxStock: 3000, unitPrice: 45, supplier: suppliers[1]._id, status: "IN_STOCK" },
    { productName: "Bubble Wrap Roll 100m", sku: "BWR-100M-004", category: "Packaging", warehouse: warehouses[1]._id, quantity: 0, reorderLevel: 20, maxStock: 100, unitPrice: 850, supplier: suppliers[1]._id, status: "OUT_OF_STOCK" },
    { productName: "M10 Hex Bolt Set (100pc)", sku: "HB-M10-005", category: "Hardware", warehouse: warehouses[2]._id, quantity: 350, reorderLevel: 50, maxStock: 1000, unitPrice: 280, supplier: suppliers[2]._id, status: "IN_STOCK" },
    { productName: "Stainless Steel Sheet 2mm", sku: "SS-2MM-006", category: "Hardware", warehouse: warehouses[2]._id, quantity: 5, reorderLevel: 10, maxStock: 50, unitPrice: 8500, supplier: suppliers[2]._id, status: "LOW_STOCK" },
    { productName: "Chemical Solvent Grade-A", sku: "CHM-SOL-007", category: "Chemicals", warehouse: warehouses[3]._id, quantity: 200, reorderLevel: 30, maxStock: 500, unitPrice: 1200, supplier: suppliers[3]._id, status: "IN_STOCK" },
    { productName: "Safety Gloves (Pair)", sku: "SFG-STD-008", category: "Safety", warehouse: warehouses[3]._id, quantity: 180, reorderLevel: 50, maxStock: 500, unitPrice: 95, status: "IN_STOCK" },
    { productName: "Cotton Fabric Roll 50m", sku: "CTN-50M-009", category: "Textiles", warehouse: warehouses[1]._id, quantity: 25, reorderLevel: 30, maxStock: 150, unitPrice: 3500, supplier: suppliers[4]._id, status: "LOW_STOCK" },
    { productName: "LED Driver 24V", sku: "LED-24V-010", category: "Electronics", warehouse: warehouses[0]._id, quantity: 120, reorderLevel: 25, maxStock: 300, unitPrice: 750, supplier: suppliers[0]._id, status: "IN_STOCK" },
    { productName: "Pallet 1200x1000 Wood", sku: "PAL-WD-011", category: "Logistics", warehouse: warehouses[1]._id, quantity: 85, reorderLevel: 20, maxStock: 200, unitPrice: 550, status: "IN_STOCK" },
    { productName: "Shrink Wrap Film 500g", sku: "SWF-500-012", category: "Packaging", warehouse: warehouses[2]._id, quantity: 0, reorderLevel: 15, maxStock: 80, unitPrice: 420, supplier: suppliers[1]._id, status: "OUT_OF_STOCK" },
    { productName: "Industrial Lubricant 5L", sku: "LUB-5L-013", category: "Maintenance", warehouse: warehouses[3]._id, quantity: 60, reorderLevel: 12, maxStock: 120, unitPrice: 650, supplier: suppliers[3]._id, status: "IN_STOCK" },
    { productName: "Digital Multimeter", sku: "DMM-PRO-014", category: "Electronics", warehouse: warehouses[0]._id, quantity: 18, reorderLevel: 5, maxStock: 40, unitPrice: 2200, supplier: suppliers[0]._id, status: "IN_STOCK" },
    { productName: "Steel Wire Rope 10mm", sku: "SWR-10MM-015", category: "Hardware", warehouse: warehouses[2]._id, quantity: 40, reorderLevel: 10, maxStock: 100, unitPrice: 3800, supplier: suppliers[2]._id, status: "IN_STOCK" },
  ];

  const inventories = await Inventory.insertMany(inventoryData);
  console.log("✅ Created inventory items");

  // Create shipments (purchase orders)
  const now = new Date();
  const shipments = await Shipment.insertMany([
    {
      shipmentNumber: "SHP-2026-001",
      trackingNumber: "TRK-IN-20260901-001",
      supplier: suppliers[0]._id,
      warehouse: warehouses[0]._id,
      destination: { address: "Plot 12, MIDC", city: "Mumbai", state: "Maharashtra", postalCode: "400093", country: "India" },
      carrier: "BlueDart Express",
      items: [{ inventory: inventories[0]._id, quantity: 20 }],
      status: "DELIVERED",
      shippingDate: new Date(now - 30 * 86400000),
      estimatedDelivery: new Date(now - 25 * 86400000),
      actualDelivery: new Date(now - 24 * 86400000),
    },
    {
      shipmentNumber: "SHP-2026-002",
      trackingNumber: "TRK-IN-20260910-002",
      supplier: suppliers[1]._id,
      warehouse: warehouses[1]._id,
      destination: { address: "NH-58, Sector 65", city: "Gurugram", state: "Haryana", postalCode: "122001", country: "India" },
      carrier: "DTDC Courier",
      items: [{ inventory: inventories[2]._id, quantity: 500 }, { inventory: inventories[3]._id, quantity: 30 }],
      status: "IN_TRANSIT",
      shippingDate: new Date(now - 5 * 86400000),
      estimatedDelivery: new Date(now + 2 * 86400000),
    },
    {
      shipmentNumber: "SHP-2026-003",
      trackingNumber: "TRK-IN-20260915-003",
      supplier: suppliers[2]._id,
      warehouse: warehouses[2]._id,
      destination: { address: "44, Electronic City", city: "Bengaluru", state: "Karnataka", postalCode: "560100", country: "India" },
      carrier: "Delhivery",
      items: [{ inventory: inventories[4]._id, quantity: 200 }, { inventory: inventories[5]._id, quantity: 10 }],
      status: "PENDING",
      shippingDate: new Date(now + 1 * 86400000),
      estimatedDelivery: new Date(now + 7 * 86400000),
    },
    {
      shipmentNumber: "SHP-2026-004",
      trackingNumber: "TRK-IN-20260920-004",
      supplier: suppliers[3]._id,
      warehouse: warehouses[3]._id,
      destination: { address: "Kattupalli Port Road", city: "Chennai", state: "Tamil Nadu", postalCode: "600119", country: "India" },
      carrier: "FedEx India",
      items: [{ inventory: inventories[6]._id, quantity: 80 }],
      status: "PICKED_UP",
      shippingDate: new Date(now - 2 * 86400000),
      estimatedDelivery: new Date(now + 3 * 86400000),
    },
    {
      shipmentNumber: "SHP-2026-005",
      trackingNumber: "TRK-IN-20260925-005",
      supplier: suppliers[0]._id,
      warehouse: warehouses[0]._id,
      destination: { address: "Plot 12, MIDC", city: "Mumbai", state: "Maharashtra", postalCode: "400093", country: "India" },
      carrier: "BlueDart Express",
      items: [{ inventory: inventories[1]._id, quantity: 15 }, { inventory: inventories[9]._id, quantity: 50 }],
      status: "CANCELLED",
      shippingDate: new Date(now - 10 * 86400000),
      estimatedDelivery: new Date(now - 5 * 86400000),
    },
  ]);
  console.log("✅ Created shipments");

  // Create stock movements
  const movementsData = [];
  const movementTypes = ["INBOUND", "OUTBOUND", "ADJUSTMENT", "TRANSFER"];

  for (let i = 0; i < 30; i++) {
    const inv = inventories[i % inventories.length];
    const type = movementTypes[i % 4];
    const qty = Math.floor(Math.random() * 50) + 1;
    const prev = inv.quantity;
    const next = type === "OUTBOUND" ? Math.max(0, prev - qty) : prev + qty;

    movementsData.push({
      type,
      inventory: inv._id,
      warehouse: inv.warehouse,
      quantity: qty,
      previousQuantity: prev,
      newQuantity: next,
      reason: type === "INBOUND" ? "Restocking" : type === "OUTBOUND" ? "Order fulfillment" : type === "ADJUSTMENT" ? "Cycle count correction" : "Warehouse rebalancing",
      performedBy: i % 2 === 0 ? admin._id : manager._id,
      createdAt: new Date(now - (30 - i) * 86400000),
    });
  }

  await StockMovement.insertMany(movementsData);
  console.log("✅ Created stock movements");

  // Create activity logs
  await ActivityLog.insertMany([
    { user: admin._id, action: "LOGIN", entity: "USER", entityId: admin._id, description: "Admin logged in", createdAt: new Date(now - 1 * 86400000) },
    { user: manager._id, action: "CREATE", entity: "WAREHOUSE", entityId: warehouses[0]._id, description: "Created warehouse Mumbai Central Warehouse", createdAt: new Date(now - 2 * 86400000) },
    { user: admin._id, action: "CREATE", entity: "SUPPLIER", entityId: suppliers[0]._id, description: "Created supplier TechParts India Pvt Ltd", createdAt: new Date(now - 3 * 86400000) },
    { user: manager._id, action: "STOCK_IN", entity: "INVENTORY", entityId: inventories[0]._id, description: "Added 20 units of Industrial Motor 5HP (MOT-5HP-001)", createdAt: new Date(now - 4 * 86400000) },
    { user: admin._id, action: "STATUS_CHANGE", entity: "SHIPMENT", entityId: shipments[0]._id, description: "Changed shipment SHP-2026-001 status to DELIVERED", createdAt: new Date(now - 5 * 86400000) },
    { user: staff._id, action: "STOCK_OUT", entity: "INVENTORY", entityId: inventories[4]._id, description: "Removed 50 units of M10 Hex Bolt Set (HB-M10-005)", createdAt: new Date(now - 1 * 3600000) },
  ]);
  console.log("✅ Created activity logs");

  // Create notifications
  await Notification.insertMany([
    { type: "LOW_STOCK", title: "Low Stock Alert", message: "Control Panel Unit (CPU-V2-002) is running low. Current: 8, Reorder: 10", severity: "WARNING", entityType: "INVENTORY", entityId: inventories[1]._id, isRead: false },
    { type: "LOW_STOCK", title: "Low Stock Alert", message: "Stainless Steel Sheet (SS-2MM-006) is running low. Current: 5, Reorder: 10", severity: "WARNING", entityType: "INVENTORY", entityId: inventories[5]._id, isRead: false },
    { type: "OUT_OF_STOCK", title: "Out of Stock Alert", message: "Bubble Wrap Roll 100m (BWR-100M-004) is out of stock.", severity: "ERROR", entityType: "INVENTORY", entityId: inventories[3]._id, isRead: false },
    { type: "OUT_OF_STOCK", title: "Out of Stock Alert", message: "Shrink Wrap Film (SWF-500-012) is out of stock.", severity: "ERROR", entityType: "INVENTORY", entityId: inventories[11]._id, isRead: true },
    { type: "SHIPMENT_RECEIVED", title: "Shipment Delivered", message: "Shipment SHP-2026-001 from TechParts India has been delivered.", severity: "SUCCESS", entityType: "SHIPMENT", entityId: shipments[0]._id, isRead: true },
    { type: "NEW_SHIPMENT", title: "New Shipment In Transit", message: "Shipment SHP-2026-002 from Global Packaging is in transit. ETA: 2 days.", severity: "INFO", entityType: "SHIPMENT", entityId: shipments[1]._id, isRead: false },
  ]);
  console.log("✅ Created notifications");

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:    admin@logitrack.com / Admin@123");
  console.log("   Manager:  manager@logitrack.com / Admin@123");
  console.log("   Logistics: logistics@logitrack.com / Admin@123");
  console.log("   Staff:    staff@logitrack.com / Admin@123");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
