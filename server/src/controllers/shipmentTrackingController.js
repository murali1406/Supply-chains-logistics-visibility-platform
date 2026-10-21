const shipmentTrackingService = require("../services/shipmentTrackingService");

/**
 * Create a tracking event
 */
const createTrackingEvent = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, location, description } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Tracking status is required",
      });
    }

    const trackingEvent =
      await shipmentTrackingService.createTrackingEvent({
        shipmentId,
        status,
        location,
        description,
        userId: req.user.userId,
      });

    return res.status(201).json({
      success: true,
      message: "Tracking event created successfully",
      trackingEvent,
    });
  } catch (error) {
    console.error(
      "Create tracking event error:",
      error.message
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get complete tracking history
 */
const getShipmentTrackingHistory = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const history =
      await shipmentTrackingService.getShipmentTrackingHistory(
        shipmentId
      );

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error(
      "Get tracking history error:",
      error.message
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get latest tracking event
 */
const getLatestTrackingEvent = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const trackingEvent =
      await shipmentTrackingService.getLatestTrackingEvent(
        shipmentId
      );

    if (!trackingEvent) {
      return res.status(404).json({
        success: false,
        message: "No tracking history found",
      });
    }

    return res.status(200).json({
      success: true,
      trackingEvent,
    });
  } catch (error) {
    console.error(
      "Get latest tracking event error:",
      error.message
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete tracking history
 */
const deleteShipmentTrackingHistory = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    await shipmentTrackingService.deleteShipmentTrackingHistory(
      shipmentId
    );

    return res.status(200).json({
      success: true,
      message: "Shipment tracking history deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete tracking history error:",
      error.message
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTrackingEvent,
  getShipmentTrackingHistory,
  getLatestTrackingEvent,
  deleteShipmentTrackingHistory,
};