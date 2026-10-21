const Shipment = require("../models/Shipment");
const Supplier = require("../models/Supplier");
const Warehouse = require("../models/Warehouse");
const Inventory = require("../models/Inventory");
const shipmentTrackingService = require("./shipmentTrackingService");

const createShipment = async (shipmentData) => {
  // Check shipment number
  const existingShipment = await Shipment.findOne({
    shipmentNumber: shipmentData.shipmentNumber.toUpperCase(),
  });

  if (existingShipment) {
    throw new Error("Shipment number already exists");
  }

  // Check tracking number
  const existingTracking = await Shipment.findOne({
    trackingNumber: shipmentData.trackingNumber.toUpperCase(),
  });

  if (existingTracking) {
    throw new Error("Tracking number already exists");
  }

  // Verify supplier
  const supplier = await Supplier.findById(shipmentData.supplier);

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // Verify warehouse
  const warehouse = await Warehouse.findById(shipmentData.warehouse);

  if (!warehouse) {
    throw new Error("Warehouse not found");
  }

  // Verify inventory items
  for (const item of shipmentData.items) {
    const inventory = await Inventory.findById(item.inventory);

    if (!inventory) {
      throw new Error(
        `Inventory item not found: ${item.inventory}`
      );
    }
  }

  const shipment = await Shipment.create({
    ...shipmentData,
    shipmentNumber: shipmentData.shipmentNumber.toUpperCase(),
    trackingNumber: shipmentData.trackingNumber.toUpperCase(),
  });

  return Shipment.findById(shipment._id)
    .populate("supplier", "name companyName supplierCode email")
    .populate("warehouse", "name code location status")
    .populate("items.inventory", "sku productName quantity");
};

const getAllShipments = async ({
  status,
  supplier,
  warehouse,
  search,
}) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (supplier) {
    filter.supplier = supplier;
  }

  if (warehouse) {
    filter.warehouse = warehouse;
  }

  if (search) {
    filter.$or = [
      {
        shipmentNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        trackingNumber: {
          $regex: search,
          $options: "i",
        },
      },
      {
        carrier: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  return Shipment.find(filter)
    .populate(
      "supplier",
      "name companyName supplierCode email"
    )
    .populate("warehouse", "name code location status")
    .populate(
      "items.inventory",
      "sku productName quantity"
    )
    .sort({ createdAt: -1 });
};

const getShipmentById = async (shipmentId) => {
  const shipment = await Shipment.findById(shipmentId)
    .populate(
      "supplier",
      "name companyName supplierCode email"
    )
    .populate("warehouse", "name code location status")
    .populate(
      "items.inventory",
      "sku productName quantity"
    );

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  return shipment;
};
const updateShipment = async (shipmentId, updateData) => {
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  // Normalize shipment number
  if (updateData.shipmentNumber) {
    updateData.shipmentNumber =
      updateData.shipmentNumber.toUpperCase();

    const duplicateShipment = await Shipment.findOne({
      shipmentNumber: updateData.shipmentNumber,
      _id: { $ne: shipmentId },
    });

    if (duplicateShipment) {
      throw new Error("Shipment number already exists");
    }
  }

  // Normalize tracking number
  if (updateData.trackingNumber) {
    updateData.trackingNumber =
      updateData.trackingNumber.toUpperCase();

    const duplicateTracking = await Shipment.findOne({
      trackingNumber: updateData.trackingNumber,
      _id: { $ne: shipmentId },
    });

    if (duplicateTracking) {
      throw new Error("Tracking number already exists");
    }
  }

  // Verify supplier if being changed
  if (updateData.supplier) {
    const supplier = await Supplier.findById(updateData.supplier);

    if (!supplier) {
      throw new Error("Supplier not found");
    }
  }

  // Verify warehouse if being changed
  if (updateData.warehouse) {
    const warehouse = await Warehouse.findById(updateData.warehouse);

    if (!warehouse) {
      throw new Error("Warehouse not found");
    }
  }

  // Verify inventory items if being changed
  if (updateData.items) {
    for (const item of updateData.items) {
      const inventory = await Inventory.findById(item.inventory);

      if (!inventory) {
        throw new Error(
          `Inventory item not found: ${item.inventory}`
        );
      }
    }
  }

  // Apply updates
  Object.assign(shipment, updateData);

  await shipment.save();

  // Return populated shipment
  return Shipment.findById(shipment._id)
    .populate(
      "supplier",
      "name companyName supplierCode email"
    )
    .populate(
      "warehouse",
      "name code location status"
    )
    .populate(
      "items.inventory",
      "sku productName quantity availableQuantity"
    );
};

const updateShipmentStatus = async (
  shipmentId,
  status,
  userId
) => {
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const validStatuses = [
    "PENDING",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid shipment status");
  }

  shipment.status = status;

  if (status === "DELIVERED") {
    shipment.actualDelivery = new Date();
  }

  await shipment.save();

  // Automatically create shipment tracking history
  await shipmentTrackingService.createTrackingEvent({
  shipmentId: shipment._id,
  status,
  userId,
  description: `Shipment status changed to ${status}`,
});

  return Shipment.findById(shipment._id)
    .populate(
      "supplier",
      "name companyName supplierCode email"
    )
    .populate(
      "warehouse",
      "name code status location"
    )
        .populate(
      "items.inventory",
      "productName sku quantity availableQuantity"
    );
};
const deleteShipment = async (shipmentId) => {
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  await Shipment.findByIdAndDelete(shipmentId);

  // Remove associated tracking history
  await shipmentTrackingService.deleteShipmentTrackingHistory(
    shipmentId
  );

  return {
    message: "Shipment deleted successfully",
  };
};
module.exports = {
  createShipment,
  getAllShipments,
  getShipmentById,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
};

