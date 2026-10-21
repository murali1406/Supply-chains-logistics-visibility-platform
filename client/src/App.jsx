import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AdminDashboardPage from "./pages/dashboard/AdminDashboardPage";
import UserDashboardPage from "./pages/dashboard/UserDashboardPage";
import WarehousesPage from "./pages/warehouses/WarehousesPage";
import WarehouseDetailPage from "./pages/warehouses/WarehouseDetailPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import SuppliersPage from "./pages/suppliers/SuppliersPage";
import SupplierDetailPage from "./pages/suppliers/SupplierDetailPage";
import ShipmentsPage from "./pages/shipments/ShipmentsPage";
import ShipmentDetailPage from "./pages/shipments/ShipmentDetailPage";
import StockMovementsPage from "./pages/stock-movements/StockMovementsPage";
import ActivityPage from "./pages/activity/ActivityPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import UsersPage from "./pages/users/UsersPage";
import NotFoundPage from "./pages/NotFoundPage";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <span className="spinner spinner-lg" />
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading LogiTrack...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin-only route wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

// Guest-only route (redirect to appropriate dashboard if logged in)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard"} replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route path="/user/dashboard" element={<UserDashboardPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/warehouses/:id" element={<WarehouseDetailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
        <Route path="/shipments" element={<ShipmentsPage />} />
        <Route path="/shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="/stock-movements" element={<StockMovementsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}