const ShipmentTracking = require("../models/ShipmentTracking");
const Shipment = require("../models/Shipment");

/**
 * Create a tracking event
 */
const createTrackingEvent = async ({
  shipmentId,
  status,
  location,
  description,
  userId,
}) => {
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const trackingEvent = await ShipmentTracking.create({
    shipment: shipmentId,
    status,
    location,
    description,
    updatedBy: userId,
  });

  return trackingEvent;
};

/**
 * Get tracking history for a shipment
 */
const getShipmentTrackingHistory = async (shipmentId) => {
  const shipment = await Shipment.findById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const history = await ShipmentTracking.find({
    shipment: shipmentId,
  })
    .populate("updatedBy", "name email role")
    .sort({ timestamp: 1 });

  return history;
};

/**
 * Get latest tracking event
 */
const getLatestTrackingEvent = async (shipmentId) => {
  const trackingEvent = await ShipmentTracking.findOne({
    shipment: shipmentId,
  })
    .populate("updatedBy", "name email role")
    .sort({ timestamp: -1 });

  return trackingEvent;
};

/**
 * Delete tracking history
 */
const deleteShipmentTrackingHistory = async (shipmentId) => {
  await ShipmentTracking.deleteMany({
    shipment: shipmentId,
  });

  return true;
};

module.exports = {
  createTrackingEvent,
  getShipmentTrackingHistory,
  getLatestTrackingEvent,
  deleteShipmentTrackingHistory,
};