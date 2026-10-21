const Supplier = require("../models/Supplier");

const createSupplier = async (supplierData) => {
  const existingSupplier = await Supplier.findOne({
    supplierCode: supplierData.supplierCode.toUpperCase(),
  });

  if (existingSupplier) {
    throw new Error("Supplier code already exists");
  }

  const supplier = await Supplier.create({
    ...supplierData,
    supplierCode: supplierData.supplierCode.toUpperCase(),
  });

  return supplier;
};

const getAllSuppliers = async ({ status, category, search }) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (category) {
    filter.category = category;
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        companyName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        supplierCode: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return Supplier.find(filter).sort({
    createdAt: -1,
  });
};

const getSupplierById = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
};

const updateSupplier = async (supplierId, updateData) => {
  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  if (updateData.supplierCode) {
    updateData.supplierCode =
      updateData.supplierCode.toUpperCase();

    const duplicate = await Supplier.findOne({
      supplierCode: updateData.supplierCode,
      _id: { $ne: supplierId },
    });

    if (duplicate) {
      throw new Error("Supplier code already exists");
    }
  }

  Object.assign(supplier, updateData);

  await supplier.save();

  return supplier;
};

const deleteSupplier = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  await supplier.deleteOne();

  return {
    id: supplierId,
    message: "Supplier deleted successfully",
  };
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};