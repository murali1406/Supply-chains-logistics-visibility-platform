require("dotenv").config();

const mongoose = require("mongoose");

const Warehouse = require("./src/models/Warehouse");
const Inventory = require("./src/models/Inventory");

const testInventoryModel = async () => {
  let warehouse;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    // Create temporary warehouse
    warehouse = await Warehouse.create({
      name: "Inventory Test Warehouse",
      code: "INV-TEST-WH",
      location: {
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
      },
      capacity: 1000,
      currentOccupancy: 100,
      status: "ACTIVE",
    });

    console.log("Test warehouse created");

    // Create inventory
    const inventory = await Inventory.create({
      productName: "Test Laptop",
      sku: "TEST-LAPTOP-001",
      warehouse: warehouse._id,
      quantity: 100,
      reservedQuantity: 20,
      reorderLevel: 10,
      unitPrice: 50000,
      status: "IN_STOCK",
    });

    console.log("Inventory created successfully:");

    console.log({
      id: inventory._id,
      productName: inventory.productName,
      sku: inventory.sku,
      warehouse: inventory.warehouse,
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: inventory.availableQuantity,
      reorderLevel: inventory.reorderLevel,
      unitPrice: inventory.unitPrice,
      status: inventory.status,
    });

    // Delete test inventory
    await Inventory.findByIdAndDelete(inventory._id);

    console.log("Test inventory deleted successfully");

    // Delete test warehouse
    await Warehouse.findByIdAndDelete(warehouse._id);

    console.log("Test warehouse deleted successfully");
  } catch (error) {
    console.error("Inventory model test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

testInventoryModel();