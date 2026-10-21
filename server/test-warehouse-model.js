require("dotenv").config();

const mongoose = require("mongoose");
const Warehouse = require("./src/models/Warehouse");

const testWarehouseModel = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    const warehouse = await Warehouse.create({
      name: "Test Chennai Warehouse",
      code: "TEST-WH-001",
      location: {
        address: "Test Address",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        postalCode: "600001",
      },
      capacity: 1000,
      currentOccupancy: 250,
      status: "ACTIVE",
      contactPhone: "9876543210",
      contactEmail: "warehouse@logitrack.local",
    });

    console.log("Warehouse created successfully:");
    console.log({
      id: warehouse._id,
      name: warehouse.name,
      code: warehouse.code,
      city: warehouse.location.city,
      capacity: warehouse.capacity,
      currentOccupancy: warehouse.currentOccupancy,
      status: warehouse.status,
    });

    await Warehouse.findByIdAndDelete(warehouse._id);

    console.log("Test warehouse deleted successfully");
  } catch (error) {
    console.error("Warehouse model test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

testWarehouseModel();