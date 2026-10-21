import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Warehouse, MapPin, Edit2, Trash2, Package } from 'lucide-react';
import { warehouseApi } from '../../services/warehouseApi';
import { inventoryApi } from '../../services/inventoryApi';
import Badge from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { ErrorState, EmptyState } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────
const STATUS_OPTIONS = ['', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'];

const EMPTY_FORM = {
  name: '',
  code: '',
  location: {
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  capacity: '',
  status: 'ACTIVE',
  contactPhone: '',
  contactEmail: '',
};

// ─── Utilization bar ──────────────────────────────────────────
function UtilizationBar({ current, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((current / capacity) * 100)) : 0;
  const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div>
      <div className="flex items-center justify-between gap-2" style={{ marginBottom: 4 }}>
        <span className="text-sm text-muted">Utilization</span>
        <span className="text-sm font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <div className="flex items-center justify-between gap-2" style={{ marginTop: 4 }}>
        <span className="text-xs text-muted">{(current ?? 0).toLocaleString('en-IN')} occupied</span>
        <span className="text-xs text-muted">{(capacity ?? 0).toLocaleString('en-IN')} total</span>
      </div>
    </div>
  );
}

// ─── Warehouse Form ───────────────────────────────────────────
function WarehouseForm({ form, errors, onChange, onLocationChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Name <span className="required">*</span></label>
          <input
            className={`form-input${errors.name ? ' error' : ''}`}
            placeholder="e.g. Mumbai Central"
            value={form.name}
            onChange={e => onChange('name', e.target.value)}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Code <span className="required">*</span></label>
          <input
            className={`form-input${errors.code ? ' error' : ''}`}
            placeholder="e.g. MUM-C1"
            value={form.code}
            onChange={e => onChange('code', e.target.value.toUpperCase())}
          />
          {errors.code && <span className="form-error">{errors.code}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <input
          className="form-input"
          placeholder="Street address"
          value={form.location.address}
          onChange={e => onLocationChange('address', e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">City <span className="required">*</span></label>
          <input
            className={`form-input${errors.city ? ' error' : ''}`}
            placeholder="e.g. Mumbai"
            value={form.location.city}
            onChange={e => onLocationChange('city', e.target.value)}
          />
          {errors.city && <span className="form-error">{errors.city}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input
            className="form-input"
            placeholder="e.g. Maharashtra"
            value={form.location.state}
            onChange={e => onLocationChange('state', e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Country</label>
          <input
            className="form-input"
            placeholder="India"
            value={form.location.country}
            onChange={e => onLocationChange('country', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Postal Code</label>
          <input
            className="form-input"
            placeholder="e.g. 400001"
            value={form.location.postalCode}
            onChange={e => onLocationChange('postalCode', e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Capacity (units) <span className="required">*</span></label>
          <input
            type="number"
            min="1"
            className={`form-input${errors.capacity ? ' error' : ''}`}
            placeholder="e.g. 10000"
            value={form.capacity}
            onChange={e => onChange('capacity', e.target.value)}
          />
          {errors.capacity && <span className="form-error">{errors.capacity}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={e => onChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Contact Phone</label>
          <input
            className="form-input"
            placeholder="+91 98765 43210"
            value={form.contactPhone}
            onChange={e => onChange('contactPhone', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Contact Email</label>
          <input
            type="email"
            className={`form-input${errors.contactEmail ? ' error' : ''}`}
            placeholder="contact@warehouse.com"
            value={form.contactEmail}
            onChange={e => onChange('contactEmail', e.target.value)}
          />
          {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Warehouse Card ───────────────────────────────────────────
function WarehouseCard({ warehouse, inventoryCount, onEdit, onDelete, canEdit, canDelete, onClick }) {
  const locationStr = [warehouse.location?.city, warehouse.location?.state]
    .filter(Boolean)
    .join(', ') || '—';

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', transition: 'box-shadow 0.15s ease' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      onClick={onClick}
    >
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Warehouse size={18} color="var(--primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="font-semibold text-strong truncate" style={{ fontSize: 14 }}>{warehouse.name}</div>
              <div className="text-xs text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{warehouse.code}</div>
            </div>
          </div>
          <Badge status={warehouse.status} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted">
          <MapPin size={13} />
          <span className="truncate">{locationStr}</span>
        </div>

        {/* Utilization bar */}
        <UtilizationBar current={warehouse.currentOccupancy ?? 0} capacity={warehouse.capacity ?? 0} />

        {/* Inventory count */}
        <div className="flex items-center gap-2 text-sm text-muted">
          <Package size={13} />
          <span>
            {inventoryCount === undefined ? (
              <span className="skeleton" style={{ display: 'inline-block', width: 48, height: 12, borderRadius: 4 }} />
            ) : (
              `${inventoryCount} product${inventoryCount !== 1 ? 's' : ''} in inventory`
            )}
          </span>
        </div>

        {/* Actions */}
        {(canEdit || canDelete) && (
          <div
            className="flex items-center gap-2"
            style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            {canEdit && (
              <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={onEdit}>
                <Edit2 size={13} /> Edit
              </button>
            )}
            {canDelete && (
              <button className="btn btn-danger btn-sm flex items-center gap-2" onClick={onDelete}>
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function WarehousesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();

  const canCreate = hasRole('ADMIN', 'WAREHOUSE_MANAGER');
  const canDelete = hasRole('ADMIN');

  const [warehouses, setWarehouses] = useState([]);
  const [inventoryCounts, setInventoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch warehouses ──
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await warehouseApi.getAll();
      const list = res.data?.warehouses ?? res.data ?? [];
      setWarehouses(list);
      // Fetch inventory counts in parallel
      fetchInventoryCounts(list);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInventoryCounts = async (list) => {
    const counts = {};
    await Promise.allSettled(
      list.map(async (w) => {
        try {
          const res = await inventoryApi.getAll({ warehouse: w._id });
          const items = res.data?.inventory ?? res.data ?? [];
          counts[w._id] = Array.isArray(items) ? items.length : 0;
        } catch {
          counts[w._id] = 0;
        }
      })
    );
    setInventoryCounts({ ...counts });
  };

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  // ── Filter ──
  const filtered = warehouses.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      (w.name ?? '').toLowerCase().includes(q) ||
      (w.code ?? '').toLowerCase().includes(q) ||
      (w.location?.city ?? '').toLowerCase().includes(q)
    );
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Form helpers ──
  const openAdd = () => {
    setEditingWarehouse(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditingWarehouse(w);
    setForm({
      name: w.name ?? '',
      code: w.code ?? '',
      location: {
        address: w.location?.address ?? '',
        city: w.location?.city ?? '',
        state: w.location?.state ?? '',
        country: w.location?.country ?? 'India',
        postalCode: w.location?.postalCode ?? '',
      },
      capacity: w.capacity ?? '',
      status: w.status ?? 'ACTIVE',
      contactPhone: w.contactPhone ?? '',
      contactEmail: w.contactEmail ?? '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleLocationChange = (field, value) => {
    setForm(prev => ({ ...prev, location: { ...prev.location, [field]: value } }));
    if (field === 'city') setFormErrors(prev => ({ ...prev, city: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.code.trim()) errs.code = 'Code is required.';
    if (!form.location.city.trim()) errs.city = 'City is required.';
    if (!form.capacity || Number(form.capacity) <= 0) errs.capacity = 'Capacity must be a positive number.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errs.contactEmail = 'Invalid email address.';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    const payload = {
      ...form,
      capacity: Number(form.capacity),
    };

    try {
      setSaving(true);
      if (editingWarehouse) {
        await warehouseApi.update(editingWarehouse._id, payload);
        toast.success('Warehouse updated', `${form.name} has been updated.`);
      } else {
        await warehouseApi.create(payload);
        toast.success('Warehouse created', `${form.name} has been added.`);
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error('Save failed', err?.response?.data?.message ?? 'Could not save warehouse.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await warehouseApi.delete(deleteTarget._id);
      toast.success('Warehouse deleted', `${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
      fetchWarehouses();
    } catch (err) {
      toast.error('Delete failed', err?.response?.data?.message ?? 'Could not delete warehouse.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ──
  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouses</h1>
          <p className="page-subtitle">Manage your warehouse network and capacity</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Warehouse
            </button>
          </div>
        )}
      </div>

      {/* Search & filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar flex-1" style={{ minWidth: 220 }}>
          <Search className="search-icon" size={15} />
          <input
            className="form-input w-full"
            placeholder="Search by name, code or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* States */}
      {loading ? (
        <div className="grid-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[80, 60, 100, 40].map((w, j) => (
                  <div key={j} className="skeleton" style={{ height: j === 0 ? 36 : 16, width: `${w}%`, borderRadius: 6 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchWarehouses} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No warehouses found"
          message={search || statusFilter ? 'Try adjusting your search or filters.' : 'Add your first warehouse to get started.'}
          icon={Warehouse}
          action={canCreate && !search && !statusFilter ? (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={15} /> Add Warehouse
            </button>
          ) : null}
        />
      ) : (
        <div className="grid-3">
          {filtered.map(w => (
            <WarehouseCard
              key={w._id}
              warehouse={w}
              inventoryCount={inventoryCounts[w._id]}
              canEdit={canCreate}
              canDelete={canDelete}
              onEdit={() => openEdit(w)}
              onDelete={() => setDeleteTarget(w)}
              onClick={() => navigate(`/warehouses/${w._id}`)}
            />
          ))}
        </div>
      )}

      {/* Summary footer */}
      {!loading && !error && filtered.length > 0 && (
        <p className="text-sm text-muted" style={{ marginTop: 16, textAlign: 'right' }}>
          Showing {filtered.length} of {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingWarehouse ? `Edit — ${editingWarehouse.name}` : 'Add Warehouse'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving && <span className="spinner spinner-sm" />}
              {editingWarehouse ? 'Save Changes' : 'Create Warehouse'}
            </button>
          </>
        }
      >
        <WarehouseForm
          form={form}
          errors={formErrors}
          onChange={handleFormChange}
          onLocationChange={handleLocationChange}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Warehouse"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Warehouse"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
