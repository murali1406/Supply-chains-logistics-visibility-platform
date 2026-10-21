// Badge component deriving color from status/type values
export const Badge = ({ status, children, className = "" }) => {
  const colorMap = {
    // Inventory statuses
    IN_STOCK: "green",
    LOW_STOCK: "yellow",
    OUT_OF_STOCK: "red",
    // Warehouse statuses
    ACTIVE: "green",
    INACTIVE: "gray",
    MAINTENANCE: "yellow",
    SUSPENDED: "red",
    // Shipment statuses
    PENDING: "yellow",
    PICKED_UP: "blue",
    IN_TRANSIT: "blue",
    OUT_FOR_DELIVERY: "purple",
    DELIVERED: "green",
    CANCELLED: "red",
    // Supplier statuses
    // Notification severity
    INFO: "blue",
    WARNING: "yellow",
    ERROR: "red",
    SUCCESS: "green",
    // Movement types
    INBOUND: "green",
    OUTBOUND: "orange",
    TRANSFER: "blue",
    ADJUSTMENT: "purple",
    // Roles
    ADMIN: "purple",
    WAREHOUSE_MANAGER: "blue",
    LOGISTICS_MANAGER: "blue",
    PROCUREMENT_MANAGER: "orange",
    SUPPLIER: "green",
    STAFF: "gray",
    // Account status
    // (ACTIVE, INACTIVE, SUSPENDED already covered)
  };

  const color = colorMap[status] || "gray";

  const display = children || (status || "").replace(/_/g, " ");

  return (
    <span className={`badge badge-${color} ${className}`}>
      {display}
    </span>
  );
};

export default Badge;
