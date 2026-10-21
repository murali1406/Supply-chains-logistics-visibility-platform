const express = require("express");

const inventoryController = require("../controllers/inventoryController");

const authenticate = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Low Stock
|--------------------------------------------------------------------------
*/

router.get(
  "/low-stock",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  inventoryController.getLowStockInventory
);

/*
|--------------------------------------------------------------------------
| Out of Stock
|--------------------------------------------------------------------------
*/

router.get(
  "/out-of-stock",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  inventoryController.getOutOfStockInventory
);

/*
|--------------------------------------------------------------------------
| Create Inventory
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  inventoryController.createInventory
);

/*
|--------------------------------------------------------------------------
| Get All Inventory
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  inventoryController.getAllInventory
);

/*
|--------------------------------------------------------------------------
| Get Inventory By ID
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER",
    "STAFF"
  ),
  inventoryController.getInventoryById
);

/*
|--------------------------------------------------------------------------
| Update Inventory Details
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE_MANAGER"),
  inventoryController.updateInventory
);

/*
|--------------------------------------------------------------------------
| Update Stock
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/stock",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  inventoryController.updateStock
);

/*
|--------------------------------------------------------------------------
| Reserve Inventory
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/reserve",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  inventoryController.reserveInventory
);

/*
|--------------------------------------------------------------------------
| Release Inventory Reservation
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/release",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  inventoryController.releaseInventoryReservation
);

/*
|--------------------------------------------------------------------------
| Deduct Inventory
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/deduct",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "LOGISTICS_MANAGER"
  ),
  inventoryController.deductInventory
);

/*
|--------------------------------------------------------------------------
| Delete Inventory
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN"),
  inventoryController.deleteInventory
);

module.exports = router;