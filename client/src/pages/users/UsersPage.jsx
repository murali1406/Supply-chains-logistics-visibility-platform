import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Shield,
  Building2,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { userApi } from "../../services/userApi";
import { warehouseApi } from "../../services/warehouseApi";
import Badge from "../../components/Badge";
import { Modal, ConfirmDialog } from "../../components/Modal";
import {
  ErrorState,
  EmptyState,
  TableSkeleton,
} from "../../components/StateComponents";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "LOGISTICS_MANAGER",
  "PROCUREMENT_MANAGER",
  "SUPPLIER",
  "STAFF",
];

const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
  phone: "",
  department: "Operations",
  assignedWarehouse: "",
  accountStatus: "ACTIVE",
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

export default function UsersPage() {
  const toast = useToast();
  const { user: currentUser, isAdmin, hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "LOGISTICS_MANAGER");

  // Data state
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });

  // Detail Modal State
  const [detailUser, setDetailUser] = useState(null);
  const [detailStats, setDetailStats] = useState(null);
  const [detailActivities, setDetailActivities] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add / Edit Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Status Change Dialog State
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ── Fetch Users ──────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (warehouseFilter) params.warehouse = warehouseFilter;

      const res = await userApi.getAll(params);
      setUsers(res.data?.users || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, warehouseFilter, sortBy, sortOrder]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const res = await warehouseApi.getAll();
      const list = res.data?.warehouses || res.data || [];
      setWarehouses(Array.isArray(list) ? list : []);
    } catch {
      // Non-critical reference data
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // ── User Details ──────────────────────────────────────────────────────────

  const openDetails = async (u) => {
    setDetailUser(u);
    setDetailStats(null);
    setDetailActivities([]);
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const res = await userApi.getById(u._id);
      setDetailUser(res.data.user || u);
      setDetailStats(res.data.stats || {});
      setDetailActivities(res.data.recentActivities || []);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load user details");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Create / Edit Form ───────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "", // blank unless changing
      role: u.role || "STAFF",
      phone: u.phone || "",
      department: u.department || "Operations",
      assignedWarehouse: u.assignedWarehouse?._id || u.assignedWarehouse || "",
      accountStatus: u.accountStatus || "ACTIVE",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!editTarget) {
      if (!form.password) {
        errs.password = "Password is required";
      } else if (form.password.length < 6) {
        errs.password = "Password must be at least 6 characters";
      }
    } else if (form.password && form.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    if (!form.role) errs.role = "Role is required";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.assignedWarehouse) delete payload.assignedWarehouse;
      if (!payload.password) delete payload.password;

      if (editTarget) {
        await userApi.update(editTarget._id, payload);
        toast.success("User updated", `${form.name} was successfully updated.`);
      } else {
        await userApi.create(payload);
        toast.success("User created", `New user ${form.name} was successfully created.`);
      }
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Save failed", err?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  // ── Status Change ────────────────────────────────────────────────────────

  const handleStatusChange = async () => {
    if (!statusTarget || !newStatus) return;
    setStatusUpdating(true);
    try {
      await userApi.updateStatus(statusTarget._id, newStatus);
      toast.success("Status updated", `${statusTarget.name} is now ${newStatus}.`);
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error("Status update failed", err?.response?.data?.message || "Could not update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userApi.delete(deleteTarget._id);
      toast.success("User deleted", `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error("Delete failed", err?.response?.data?.message || "Could not delete user");
    } finally {
      setDeleting(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <h1 className="page-title">Manage Users</h1>
            <span className="badge badge-blue font-semibold" style={{ fontSize: 12 }}>
              {pagination.total} Registered Users
            </span>
          </div>
          <p className="page-subtitle">
            View, onboard, and manage platform operators and warehouse personnel.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh user list"
          >
            <RefreshCw size={14} className={loading ? "spinner-sm" : ""} />
            Refresh
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={openCreate}>
              <UserPlus size={15} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: "14px 20px" }}>
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
            {/* Search */}
            <div className="search-bar flex-1" style={{ minWidth: 220 }}>
              <Search size={15} className="search-icon" />
              <input
                className="form-input"
                placeholder="Search by name, email, phone, or department…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Role Filter */}
            <select
              className="form-select"
              style={{ width: 170 }}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Warehouse Filter */}
            <select
              className="form-select"
              style={{ width: 180 }}
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              className="form-select"
              style={{ width: 150 }}
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split("-");
                setSortBy(by);
                setSortOrder(ord);
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="lastLogin-desc">Recently Active</option>
            </select>

            {(search || roleFilter || statusFilter || warehouseFilter) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                  setWarehouseFilter("");
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Department</th>
                <th>Assigned Warehouse</th>
                <th>Phone</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton cols={8} rows={6} />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <ErrorState message={error} onRetry={fetchUsers} />
                  </td>
                </tr>
              </tbody>
            ) : users.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={Users}
                      title="No users found"
                      message={
                        search || roleFilter || statusFilter || warehouseFilter
                          ? "Try adjusting your search criteria or filters."
                          : "No user accounts are currently registered."
                      }
                      action={
                        canManage && !search && !roleFilter ? (
                          <button className="btn btn-primary" onClick={openCreate}>
                            <UserPlus size={15} /> Add User
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?._id === u._id || currentUser?.id === u._id;
                  return (
                    <tr key={u._id}>
                      {/* User Avatar + Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background:
                                u.role === "ADMIN"
                                  ? "var(--purple)"
                                  : u.role === "WAREHOUSE_MANAGER"
                                  ? "var(--blue)"
                                  : "var(--primary)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getUserInitials(u.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="font-semibold text-strong truncate flex items-center gap-2">
                              {u.name}
                              {isSelf && (
                                <span
                                  className="badge badge-gray"
                                  style={{ fontSize: 10, padding: "1px 6px" }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-muted text-xs truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <Badge status={u.role} />
                      </td>

                      {/* Status */}
                      <td>
                        <Badge status={u.accountStatus} />
                      </td>

                      {/* Department */}
                      <td>
                        <span className="text-sm font-medium">{u.department || "Operations"}</span>
                      </td>

                      {/* Assigned Warehouse */}
                      <td>
                        {u.assignedWarehouse ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 size={13} color="var(--text-muted)" />
                            <span className="font-medium text-strong">
                              {u.assignedWarehouse.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td>
                        <span className="text-sm">{u.phone || "—"}</span>
                      </td>

                      {/* Last Login */}
                      <td>
                        <span className="text-xs text-muted">{fmtDate(u.lastLogin)}</span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="actions-cell">
                          {/* View details */}
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="View User Details"
                            onClick={() => openDetails(u)}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          {isAdmin && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit User"
                              onClick={() => openEdit(u)}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {/* Toggle Status */}
                          {isAdmin && !isSelf && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title={u.accountStatus === "ACTIVE" ? "Deactivate User" : "Activate User"}
                              onClick={() => {
                                setStatusTarget(u);
                                setNewStatus(u.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE");
                              }}
                            >
                              {u.accountStatus === "ACTIVE" ? (
                                <XCircle size={14} color="var(--orange)" />
                              ) : (
                                <CheckCircle size={14} color="var(--green)" />
                              )}
                            </button>
                          )}

                          {/* Delete */}
                          {isAdmin && !isSelf && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Delete User"
                              style={{ color: "var(--red)" }}
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && !error && users.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {users.length} of {pagination.total} users (Page {pagination.page} of{" "}
              {pagination.pages})
            </span>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── User Details Modal ── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailUser ? `${detailUser.name} — Profile & Activity` : "User Details"}
        size="lg"
        footer={
          <button className="btn btn-secondary" onClick={() => setDetailOpen(false)}>
            Close
          </button>
        }
      >
        {detailUser && (
          <div className="flex flex-col gap-5">
            {/* Top overview card */}
            <div
              className="card"
              style={{
                background: "var(--bg)",
                padding: 16,
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getUserInitials(detailUser.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-strong">{detailUser.name}</h3>
                    <Badge status={detailUser.role} />
                    <Badge status={detailUser.accountStatus} />
                  </div>
                  <p className="text-muted text-sm" style={{ marginTop: 2 }}>
                    {detailUser.email} · {detailUser.department || "Operations"}
                  </p>
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="card" style={{ padding: 14 }}>
                <h4 className="font-semibold text-sm text-strong mb-3 flex items-center gap-2">
                  <Shield size={15} color="var(--primary)" /> Account & Credentials
                </h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="detail-field">
                    <div className="detail-label">Role</div>
                    <div className="detail-value font-medium">
                      {detailUser.role.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Status</div>
                    <div className="detail-value">
                      <Badge status={detailUser.accountStatus} />
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Phone Number</div>
                    <div className="detail-value">{detailUser.phone || "Not specified"}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Registered On</div>
                    <div className="detail-value">{fmtDate(detailUser.createdAt)}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Last Login</div>
                    <div className="detail-value font-semibold">{fmtDate(detailUser.lastLogin)}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 14 }}>
                <h4 className="font-semibold text-sm text-strong mb-3 flex items-center gap-2">
                  <Building2 size={15} color="var(--orange)" /> Operational Assignment
                </h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="detail-field">
                    <div className="detail-label">Assigned Facility</div>
                    <div className="detail-value font-semibold">
                      {detailUser.assignedWarehouse?.name || "All Facilities / Unassigned"}
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Department</div>
                    <div className="detail-value">{detailUser.department || "Operations"}</div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Managed Warehouses</div>
                    <div className="detail-value font-semibold">
                      {detailStats?.managedWarehousesCount ?? 0} Facilities
                    </div>
                  </div>
                  <div className="detail-field">
                    <div className="detail-label">Audit Actions Recorded</div>
                    <div className="detail-value font-semibold">
                      {detailStats?.totalActivities ?? 0} Events
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities Timeline */}
            <div>
              <h4 className="font-semibold text-sm text-strong mb-2 flex items-center gap-2">
                <Activity size={15} color="var(--purple)" /> Recent User Activity Log
              </h4>
              <div
                className="card"
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  padding: "6px 14px",
                }}
              >
                {detailLoading ? (
                  <div style={{ padding: 16, textAlign: "center" }}>
                    <span className="spinner spinner-sm" />
                  </div>
                ) : detailActivities.length === 0 ? (
                  <p className="text-muted text-xs" style={{ padding: "12px 0", textAlign: "center" }}>
                    No audit actions recorded for this user yet.
                  </p>
                ) : (
                  detailActivities.map((act) => (
                    <div
                      key={act._id}
                      className="flex items-center justify-between gap-3"
                      style={{
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 12,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Badge status={act.action} />
                        <span className="text-strong">{act.description}</span>
                      </div>
                      <span className="text-muted text-xs" style={{ flexShrink: 0 }}>
                        {fmtDate(act.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add / Edit User Modal ── */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editTarget ? `Edit User — ${editTarget.name}` : "Create New Platform User"}
        size="md"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving && <span className="spinner spinner-sm" />}
              {editTarget ? "Save Changes" : "Create User"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              className={`form-input${formErrors.name ? " error" : ""}`}
              placeholder="e.g. Ramesh Patel"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              className={`form-input${formErrors.email ? " error" : ""}`}
              type="email"
              placeholder="user@logitrack.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {formErrors.email && <span className="form-error">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">
              {editTarget ? "Password (leave blank to keep existing)" : "Password"}{" "}
              {!editTarget && <span className="required">*</span>}
            </label>
            <input
              className={`form-input${formErrors.password ? " error" : ""}`}
              type="password"
              placeholder={editTarget ? "Enter new password if updating" : "Min 6 characters"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {formErrors.password && <span className="form-error">{formErrors.password}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                Role <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={form.accountStatus}
                onChange={(e) => setForm({ ...form, accountStatus: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                className="form-input"
                placeholder="e.g. Inbound Logistics"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Warehouse Facility</label>
            <select
              className="form-select"
              value={form.assignedWarehouse}
              onChange={(e) => setForm({ ...form, assignedWarehouse: e.target.value })}
            >
              <option value="">None / All Facilities</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* ── Status Toggle Confirmation Dialog ── */}
      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => !statusUpdating && setStatusTarget(null)}
        onConfirm={handleStatusChange}
        loading={statusUpdating}
        title={`Confirm Status Change`}
        message={
          statusTarget
            ? `Are you sure you want to change ${statusTarget.name}'s account status to ${newStatus}? ${
                newStatus === "INACTIVE" || newStatus === "SUSPENDED"
                  ? "The user will be immediately blocked from signing in."
                  : "The user will be able to access the system."
              }`
            : ""
        }
        confirmText={`Set as ${newStatus}`}
        variant={newStatus === "ACTIVE" ? "primary" : "danger"}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User Account"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete user "${deleteTarget.name}" (${deleteTarget.email})? This operation cannot be undone.`
            : ""
        }
        confirmText="Delete User"
        variant="danger"
      />
    </div>
  );
}
