import { useState, useEffect } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Warehouse,
  Package,
  Building2,
  ShoppingCart,
  ArrowLeftRight,
  Bell,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    to: "/users",
    icon: UserCheck,
    label: "Manage Users",
    roles: ["ADMIN", "LOGISTICS_MANAGER", "WAREHOUSE_MANAGER"],
  },
  { to: "/warehouses", icon: Warehouse, label: "Warehouses" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/suppliers", icon: Building2, label: "Suppliers" },
  { to: "/shipments", icon: ShoppingCart, label: "Purchase Orders" },
  { to: "/stock-movements", icon: ArrowLeftRight, label: "Stock Movements" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/activity", icon: Activity, label: "Activity Log" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const PAGE_TITLES = {
  "/admin/dashboard": "Admin Dashboard",
  "/user/dashboard": "User Dashboard",
  "/dashboard": "Dashboard",
  "/users": "Manage Users",
  "/warehouses": "Warehouses",
  "/inventory": "Inventory",
  "/suppliers": "Suppliers",
  "/shipments": "Purchase Orders",
  "/stock-movements": "Stock Movements",
  "/notifications": "Notifications",
  "/activity": "Activity Log",
  "/settings": "Settings",
};

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const match = Object.entries(PAGE_TITLES).find(([path]) =>
      location.pathname.startsWith(path)
    );
    return match ? match[1] : "LogiTrack";
  };

  const getRoleLabel = (role) => {
    const map = {
      ADMIN: "Administrator",
      WAREHOUSE_MANAGER: "Warehouse Manager",
      LOGISTICS_MANAGER: "Logistics Manager",
      PROCUREMENT_MANAGER: "Procurement Manager",
      SUPPLIER: "Supplier",
      STAFF: "Staff",
    };
    return map[role] || role;
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const dashboardPath = user?.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";

  const visibleNavItems = navItems
    .map((item) => {
      if (item.label === "Dashboard") {
        return { ...item, to: dashboardPath };
      }
      return item;
    })
    .filter((item) => {
      if (!item.roles) return true;
      return hasRole(...item.roles);
    });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
          background: "var(--sidebar-bg)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: "width var(--transition-slow)",
          overflow: "hidden",
          position: "relative",
          zIndex: 100,
        }}
        className={mobileOpen ? "" : "hide-sidebar-mobile"}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "20px 16px" : "20px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            minHeight: "var(--topbar-height)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                LogiTrack
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.06em",
                  marginTop: 2,
                }}
              >
                SUPPLY CHAIN
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto", overflowX: "hidden" }}>
          {visibleNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              data-tooltip={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 16px" : "10px 20px",
                margin: "1px 8px",
                borderRadius: 8,
                color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                textDecoration: "none",
                transition: "all var(--transition)",
                whiteSpace: "nowrap",
                overflow: "hidden",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.style.background.includes("active")) {
                  e.currentTarget.style.background = "var(--sidebar-hover-bg)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.background = e.currentTarget.getAttribute("aria-current")
                    ? "var(--sidebar-active-bg)"
                    : "transparent";
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    color={isActive ? "#fff" : "var(--sidebar-text)"}
                    style={{ flexShrink: 0 }}
                  />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + collapse */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {/* User profile */}
          <div
            style={{
              padding: collapsed ? "14px 16px" : "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.name || "User"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {getRoleLabel(user?.role)}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            data-tooltip={collapsed ? "Logout" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "10px 20px" : "10px 24px",
              width: "100%",
              background: "none",
              border: "none",
              color: "var(--sidebar-text)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 400,
              transition: "all var(--transition)",
              marginBottom: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--sidebar-text)";
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "none",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              color: "var(--sidebar-text)",
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={16}
              style={{
                transform: collapsed ? "rotate(180deg)" : "none",
                transition: "transform var(--transition-slow)",
              }}
            />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            height: "var(--topbar-height)",
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: 16,
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Mobile menu button */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setMobileOpen((o) => !o)}
            style={{ display: "none" }}
            id="mobile-menu-btn"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-heading)", flex: 1 }}>
            {getPageTitle()}
          </h1>

          <NavLink to="/notifications" style={{ textDecoration: "none" }}>
            <button className="btn btn-ghost btn-icon" title="Notifications">
              <Bell size={18} />
            </button>
          </NavLink>

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
            title={user?.name}
          >
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { position: fixed !important; left: ${
            mobileOpen ? "0" : "-300px"
          } !important; top: 0; bottom: 0; width: var(--sidebar-width) !important; transition: left var(--transition-slow) !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
