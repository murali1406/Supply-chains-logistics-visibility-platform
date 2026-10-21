import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  DollarSign,
  Warehouse,
  AlertTriangle,
  XCircle,
  Users,
  Truck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  BarChart2,
  Activity,
  Layers,
  Bell,
  ArrowLeftRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

import { dashboardApi } from "../../services/dashboardApi";
import Badge from "../../components/Badge";
import {
  ErrorState,
  EmptyState,
  TableSkeleton,
} from "../../components/StateComponents";
import { useAuth } from "../../context/AuthContext";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const KpiSkeleton = () => (
  <div className="grid-4" style={{ gap: 16 }}>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="stat-card">
        <div className="stat-card-header">
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton" style={{ height: 12, width: "55%", borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 28, width: "70%", borderRadius: 4 }} />
          </div>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        </div>
      </div>
    ))}
  </div>
);

const ChartSkeleton = () => (
  <div className="skeleton" style={{ height: 220, borderRadius: 8, margin: "16px 0" }} />
);

const KpiCard = ({ label, value, icon: Icon, iconBg, iconColor, linkTo }) => {
  const inner = (
    <div className="stat-card" style={linkTo ? { cursor: "pointer" } : {}}>
      <div className="stat-card-header">
        <div>
          <p className="stat-card-label">{label}</p>
          <p className="stat-card-value" style={{ marginTop: 6 }}>
            {value !== undefined && value !== null ? value : "0"}
          </p>
        </div>
        <div className="stat-card-icon" style={{ background: iconBg, color: iconColor }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: "8px 12px", fontSize: 12, minWidth: 120, boxShadow: "var(--shadow-md)" }}>
      <p className="font-semibold text-strong" style={{ marginBottom: 4 }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: <strong>{p.value?.toLocaleString("en-IN")}</strong>
        </p>
      ))}
    </div>
  );
};

const MovementItem = ({ mv }) => {
  const typeIcon = {
    INBOUND: <TrendingUp size={14} color="var(--green)" />,
    OUTBOUND: <TrendingDown size={14} color="var(--orange)" />,
    TRANSFER: <ArrowRight size={14} color="var(--blue)" />,
    ADJUSTMENT: <RefreshCw size={14} color="var(--purple)" />,
  };

  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius)",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {typeIcon[mv.type] ?? <Activity size={14} color="var(--text-muted)" />}
      </div>
      <div className="flex-1" style={{ minWidth: 0 }}>
        <p className="font-medium text-strong truncate" style={{ fontSize: 13 }}>
          {mv.inventory?.productName ?? "—"}{" "}
          <span className="text-muted" style={{ fontWeight: 400 }}>
            ({mv.inventory?.sku ?? "—"})
          </span>
        </p>
        <p className="text-muted text-sm truncate">
          {mv.warehouse?.name ?? "—"} · {mv.performedBy?.name ?? "System"}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1" style={{ flexShrink: 0, textAlign: "right" }}>
        <Badge status={mv.type} />
        <span className="text-muted text-xs">{fmtDate(mv.createdAt)}</span>
      </div>
      <div
        style={{
          width: 52,
          textAlign: "right",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--text-strong)",
          flexShrink: 0,
        }}
      >
        {mv.quantity > 0 ? "+" : ""}
        {mv.quantity?.toLocaleString("en-IN") ?? "0"}
      </div>
    </div>
  );
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStats();
      const payload = res.data?.data || res.data;
      setStats(payload);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = stats?.kpis || stats || {};
  const stockByStatus = stats?.stockByStatus ?? {};
  const warehouseDistribution = stats?.warehouseDistribution ?? [];
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const recentShipments = stats?.recentShipments ?? [];
  const recentMovements = stats?.recentMovements ?? [];

  const totalProducts = kpis.totalProducts ?? stats?.totalProducts ?? 0;
  const totalInventoryValue = kpis.totalInventoryValue ?? stats?.totalInventoryValue ?? 0;
  const activeWarehouses = kpis.activeWarehouses ?? stats?.activeWarehouses ?? 0;
  const lowStockItems = kpis.lowStockItems ?? stats?.lowStockItems ?? 0;
  const outOfStock = kpis.outOfStock ?? kpis.outOfStockItems ?? stats?.outOfStock ?? stats?.outOfStockItems ?? 0;
  const activeSuppliers = kpis.activeSuppliers ?? stats?.activeSuppliers ?? 0;
  const pendingShipments = kpis.pendingShipments ?? stats?.pendingShipments ?? 0;

  const stockStatusData = [
    { name: "In Stock", value: stockByStatus.IN_STOCK ?? 0, fill: "var(--green)" },
    { name: "Low Stock", value: stockByStatus.LOW_STOCK ?? 0, fill: "var(--yellow)" },
    { name: "Out of Stock", value: stockByStatus.OUT_OF_STOCK ?? 0, fill: "var(--red)" },
  ];

  const warehouseData = warehouseDistribution.map((w) => ({
    name: w.warehouseCode ?? w.warehouseName ?? "—",
    fullName: w.warehouseName ?? "—",
    Items: w.totalItems ?? 0,
    Qty: w.totalQuantity ?? 0,
  }));

  const getRoleLabel = () => {
    switch (user?.role) {
      case "WAREHOUSE_MANAGER":
        return "Warehouse Manager";
      case "LOGISTICS_MANAGER":
        return "Logistics Manager";
      case "PROCUREMENT_MANAGER":
        return "Procurement Manager";
      case "STAFF":
      default:
        return "Operations Staff";
    }
  };

  const kpiCards = [
    {
      label: "Total Products",
      value: Number(totalProducts).toLocaleString("en-IN"),
      icon: Package,
      iconBg: "var(--blue-bg)",
      iconColor: "var(--blue)",
      linkTo: "/inventory",
    },
    {
      label: "Total Inventory Value",
      value: fmt(totalInventoryValue),
      icon: DollarSign,
      iconBg: "var(--green-bg)",
      iconColor: "var(--green)",
    },
    {
      label: "Active Warehouses",
      value: Number(activeWarehouses).toLocaleString("en-IN"),
      icon: Warehouse,
      iconBg: "var(--orange-bg)",
      iconColor: "var(--orange)",
      linkTo: "/warehouses",
    },
    {
      label: "Low Stock Items",
      value: Number(lowStockItems).toLocaleString("en-IN"),
      icon: AlertTriangle,
      iconBg: "var(--yellow-bg)",
      iconColor: "var(--yellow)",
      linkTo: "/inventory?status=LOW_STOCK",
    },
    {
      label: "Out of Stock",
      value: Number(outOfStock).toLocaleString("en-IN"),
      icon: XCircle,
      iconBg: "var(--red-bg)",
      iconColor: "var(--red)",
      linkTo: "/inventory?status=OUT_OF_STOCK",
    },
    {
      label: "Active Suppliers",
      value: Number(activeSuppliers).toLocaleString("en-IN"),
      icon: Users,
      iconBg: "var(--purple-bg)",
      iconColor: "var(--purple)",
      linkTo: "/suppliers",
    },
    {
      label: "Pending Shipments",
      value: Number(pendingShipments).toLocaleString("en-IN"),
      icon: Truck,
      iconBg: "var(--blue-bg)",
      iconColor: "var(--blue)",
      linkTo: "/shipments",
    },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <h1 className="page-title">
              Operations Dashboard
            </h1>
            <span
              className="badge badge-green"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}
            >
              <Layers size={12} /> {getRoleLabel()}
            </span>
          </div>
          <p className="page-subtitle">
            Welcome back, {user?.name || "User"}. Monitor warehouse stock, shipments, and inventory in real time.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spinner-sm" : ""} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── User Quick Actions ── */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: "16px 20px",
          background: "linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)",
          border: "1px solid #a7f3d0",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="font-semibold text-strong" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#047857" }}>
              Operational Quick Actions
            </span>
            <p className="text-muted text-xs" style={{ marginTop: 2 }}>
              Fast shortcuts for daily warehouse and inventory tasks
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/inventory" className="btn btn-primary btn-sm">
              <Package size={14} /> View Inventory
            </Link>
            <Link to="/stock-movements" className="btn btn-secondary btn-sm">
              <ArrowLeftRight size={14} /> Stock Movements
            </Link>
            <Link to="/shipments" className="btn btn-secondary btn-sm">
              <Truck size={14} /> Purchase Orders
            </Link>
            <Link to="/notifications" className="btn btn-secondary btn-sm">
              <Bell size={14} /> Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* ── Full-page error ── */}
      {error && !loading && (
        <div className="card" style={{ marginBottom: 24 }}>
          <ErrorState message={error} onRetry={fetchStats} />
        </div>
      )}

      {/* ── KPI Cards ── */}
      <section style={{ marginBottom: 24 }}>
        {loading ? (
          <KpiSkeleton />
        ) : (
          <div className="grid-4" style={{ gap: 16 }}>
            {kpiCards.map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
          </div>
        )}
      </section>

      {/* ── Charts Row ── */}
      <section className="grid-2" style={{ marginBottom: 24, gap: 16 }}>
        {/* Stock by Status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <BarChart2 size={16} color="var(--primary)" />
              Stock Breakdown by Status
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <ChartSkeleton />
            ) : stockStatusData.every((d) => d.value === 0) ? (
              <EmptyState
                title="No inventory recorded"
                message="Stock status breakdown will appear here once inventory items are added."
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockStatusData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
                  <Bar dataKey="value" name="Products" radius={[6, 6, 0, 0]}>
                    {stockStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Warehouse Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Warehouse size={16} color="var(--orange)" />
              Warehouse Distribution
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <ChartSkeleton />
            ) : warehouseData.length === 0 ? (
              <EmptyState
                title="No warehouse distribution data"
                message="Warehouse inventory data will appear here once items are stored."
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={warehouseData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
                  <Bar dataKey="Items" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Qty" fill="var(--blue-border)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ── Bottom row: Low Stock + Recent Shipments ── */}
      <section className="grid-2" style={{ marginBottom: 24, gap: 16 }}>
        {/* Low Stock Products */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <AlertTriangle size={16} color="var(--yellow)" />
              Low Stock Products
            </span>
            <Link to="/inventory?status=LOW_STOCK" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="data-table-wrap">
            {loading ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Reorder</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <TableSkeleton cols={5} rows={4} />
              </table>
            ) : lowStockProducts.length === 0 ? (
              <EmptyState title="No low stock items" message="All products are sufficiently stocked." icon={Package} />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Reorder</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p, i) => (
                    <tr key={p._id ?? i}>
                      <td>
                        <span className="font-medium text-strong">{p.productName ?? "—"}</span>
                        {p.warehouse?.name && <p className="text-muted text-xs" style={{ marginTop: 1 }}>{p.warehouse.name}</p>}
                      </td>
                      <td>
                        <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg)", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--border)" }}>
                          {p.sku ?? "—"}
                        </code>
                      </td>
                      <td className="font-semibold text-strong">{Number(p.quantity ?? 0).toLocaleString("en-IN")}</td>
                      <td className="text-muted">{Number(p.reorderLevel ?? 10).toLocaleString("en-IN")}</td>
                      <td><Badge status={p.status ?? "LOW_STOCK"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Truck size={16} color="var(--blue)" />
              Recent Purchase Orders & Shipments
            </span>
            <Link to="/shipments" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="data-table-wrap">
            {loading ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shipment #</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <TableSkeleton cols={4} rows={4} />
              </table>
            ) : recentShipments.length === 0 ? (
              <EmptyState title="No recent shipments" message="Shipments will appear here once created." icon={Truck} />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shipment #</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((s, i) => (
                    <tr key={s._id ?? i}>
                      <td>
                        <Link to={`/shipments/${s._id}`} className="font-medium" style={{ color: "var(--primary)" }}>
                          {s.shipmentNumber ?? "—"}
                        </Link>
                      </td>
                      <td className="text-strong">{s.supplier?.companyName ?? s.supplier?.name ?? "—"}</td>
                      <td><Badge status={s.status ?? "PENDING"} /></td>
                      <td className="text-muted text-sm">{fmtDate(s.shippingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* ── Recent Stock Movements ── */}
      <section>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Activity size={16} color="var(--purple)" />
              Recent Stock Movements
            </span>
            <Link to="/stock-movements" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {loading ? (
              <div style={{ paddingTop: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="skeleton" style={{ height: 13, width: "45%", borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 11, width: "30%", borderRadius: 4 }} />
                    </div>
                    <div className="skeleton" style={{ height: 20, width: 64, borderRadius: 12 }} />
                    <div className="skeleton" style={{ height: 13, width: 36, borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : recentMovements.length === 0 ? (
              <EmptyState title="No stock movements" message="Recent movements will appear here once inventory adjustments occur." icon={Activity} />
            ) : (
              <div>
                {recentMovements.slice(0, 5).map((mv, i) => (
                  <MovementItem key={mv._id ?? i} mv={mv} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
