const Warehouse = require("../models/Warehouse");

const createWarehouse = async (warehouseData) => {
  const existingWarehouse = await Warehouse.findOne({
    code: warehouseData.code.toUpperCase(),
  });

  if (existingWarehouse) {
    throw new Error("Warehouse code already exists");
  }

  const warehouse = await Warehouse.create({
    ...warehouseData,
    code: warehouseData.code.toUpperCase(),
  });

  return warehouse;
};

const getAllWarehouses = async ({ status, city }) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (city) {
    filter["location.city"] = city;
  }

  return Warehouse.find(filter)
    .populate("manager", "name email role")
    .sort({ createdAt: -1 });
};

const getWarehouseById = async (warehouseId) => {
  const warehouse = await Warehouse.findById(warehouseId).populate(
    "manager",
    "name email role"
  );

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  return warehouse;
};

const updateWarehouse = async (warehouseId, updateData) => {
  const warehouse = await Warehouse.findById(warehouseId);

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();

    const duplicate = await Warehouse.findOne({
      code: updateData.code,
      _id: { $ne: warehouseId },
    });

    if (duplicate) {
      throw new Error("Warehouse code already exists");
    }
  }

  Object.assign(warehouse, updateData);

  await warehouse.save();

  return warehouse;
};

const deleteWarehouse = async (warehouseId) => {
  const warehouse = await Warehouse.findById(warehouseId);

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  await warehouse.deleteOne();

  return {
    id: warehouseId,
    message: "Warehouse deleted successfully",
  };
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
};