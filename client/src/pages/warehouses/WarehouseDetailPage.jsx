import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Warehouse, MapPin, Edit2, Trash2,
  Package, ArrowDownCircle, ArrowUpCircle, RefreshCw, SlidersHorizontal,
} from 'lucide-react';
import { warehouseApi } from '../../services/warehouseApi';
import { inventoryApi } from '../../services/inventoryApi';
import { stockMovementApi } from '../../services/stockMovementApi';
import Badge from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { LoadingState, ErrorState, TableSkeleton } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtCurrency = (v) =>
  v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'];

const EMPTY_FORM = {
  name: '',
  code: '',
  location: { address: '', city: '', state: '', country: 'India', postalCode: '' },
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
      <div className="flex items-center justify-between gap-2" style={{ marginBottom: 6 }}>
        <span className="text-sm text-muted">Storage utilization</span>
        <span className="font-semibold" style={{ color, fontSize: 13 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <div className="flex items-center justify-between gap-2" style={{ marginTop: 6 }}>
        <span className="text-xs text-muted">{(current ?? 0).toLocaleString('en-IN')} units occupied</span>
        <span className="text-xs text-muted">Capacity: {(capacity ?? 0).toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

// ─── Movement type icon ───────────────────────────────────────
function MovementTypeIcon({ type }) {
  if (type === 'INBOUND') return <ArrowDownCircle size={14} color="var(--green)" />;
  if (type === 'OUTBOUND') return <ArrowUpCircle size={14} color="var(--orange)" />;
  if (type === 'TRANSFER') return <RefreshCw size={14} color="var(--blue)" />;
  return <SlidersHorizontal size={14} color="var(--purple)" />;
}

// ─── Edit Warehouse Form ──────────────────────────────────────
function WarehouseForm({ form, errors, onChange, onLocationChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Name <span className="required">*</span></label>
          <input
            className={`form-input${errors.name ? ' error' : ''}`}
            value={form.name}
            onChange={e => onChange('name', e.target.value)}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Code <span className="required">*</span></label>
          <input
            className={`form-input${errors.code ? ' error' : ''}`}
            value={form.code}
            onChange={e => onChange('code', e.target.value.toUpperCase())}
          />
          {errors.code && <span className="form-error">{errors.code}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <input className="form-input" value={form.location.address} onChange={e => onLocationChange('address', e.target.value)} />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">City <span className="required">*</span></label>
          <input
            className={`form-input${errors.city ? ' error' : ''}`}
            value={form.location.city}
            onChange={e => onLocationChange('city', e.target.value)}
          />
          {errors.city && <span className="form-error">{errors.city}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={form.location.state} onChange={e => onLocationChange('state', e.target.value)} />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="form-input" value={form.location.country} onChange={e => onLocationChange('country', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Postal Code</label>
          <input className="form-input" value={form.location.postalCode} onChange={e => onLocationChange('postalCode', e.target.value)} />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Capacity (units) <span className="required">*</span></label>
          <input
            type="number"
            min="1"
            className={`form-input${errors.capacity ? ' error' : ''}`}
            value={form.capacity}
            onChange={e => onChange('capacity', e.target.value)}
          />
          {errors.capacity && <span className="form-error">{errors.capacity}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => onChange('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Contact Phone</label>
          <input className="form-input" value={form.contactPhone} onChange={e => onChange('contactPhone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Contact Email</label>
          <input
            type="email"
            className={`form-input${errors.contactEmail ? ' error' : ''}`}
            value={form.contactEmail}
            onChange={e => onChange('contactEmail', e.target.value)}
          />
          {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();

  const canEdit = hasRole('ADMIN', 'WAREHOUSE_MANAGER');
  const canDelete = hasRole('ADMIN');

  // ── State ──
  const [warehouse, setWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invLoading, setInvLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(true);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch warehouse ──
  const fetchWarehouse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await warehouseApi.getById(id);
      setWarehouse(res.data?.warehouse ?? res.data);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load warehouse.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Fetch inventory ──
  const fetchInventory = useCallback(async () => {
    try {
      setInvLoading(true);
      const res = await inventoryApi.getAll({ warehouse: id });
      setInventory(res.data?.inventory ?? res.data ?? []);
    } catch {
      setInventory([]);
    } finally {
      setInvLoading(false);
    }
  }, [id]);

  // ── Fetch movements ──
  const fetchMovements = useCallback(async () => {
    try {
      setMovLoading(true);
      const res = await stockMovementApi.getAll({ warehouse: id, limit: 10 });
      setMovements(res.data?.movements ?? res.data ?? []);
    } catch {
      setMovements([]);
    } finally {
      setMovLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWarehouse();
    fetchInventory();
    fetchMovements();
  }, [fetchWarehouse, fetchInventory, fetchMovements]);

  // ── Open edit modal ──
  const openEdit = () => {
    if (!warehouse) return;
    setForm({
      name: warehouse.name ?? '',
      code: warehouse.code ?? '',
      location: {
        address: warehouse.location?.address ?? '',
        city: warehouse.location?.city ?? '',
        state: warehouse.location?.state ?? '',
        country: warehouse.location?.country ?? 'India',
        postalCode: warehouse.location?.postalCode ?? '',
      },
      capacity: warehouse.capacity ?? '',
      status: warehouse.status ?? 'ACTIVE',
      contactPhone: warehouse.contactPhone ?? '',
      contactEmail: warehouse.contactEmail ?? '',
    });
    setFormErrors({});
    setEditOpen(true);
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
    try {
      setSaving(true);
      await warehouseApi.update(id, { ...form, capacity: Number(form.capacity) });
      toast.success('Warehouse updated', `${form.name} has been updated.`);
      setEditOpen(false);
      fetchWarehouse();
    } catch (err) {
      toast.error('Save failed', err?.response?.data?.message ?? 'Could not save warehouse.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await warehouseApi.delete(id);
      toast.success('Warehouse deleted', `${warehouse?.name} has been removed.`);
      navigate('/warehouses');
    } catch (err) {
      toast.error('Delete failed', err?.response?.data?.message ?? 'Could not delete warehouse.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render loading / error ──
  if (loading) return <LoadingState message="Loading warehouse details…" />;
  if (error) return <ErrorState message={error} onRetry={fetchWarehouse} />;
  if (!warehouse) return <ErrorState message="Warehouse not found." />;

  const locationStr = [
    warehouse.location?.address,
    warehouse.location?.city,
    warehouse.location?.state,
    warehouse.location?.country,
    warehouse.location?.postalCode,
  ].filter(Boolean).join(', ') || '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Back button + page header */}
      <div>
        <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginBottom: 12 }} onClick={() => navigate('/warehouses')}>
          <ArrowLeft size={15} /> Back to Warehouses
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Warehouse size={22} color="var(--primary)" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="page-title" style={{ marginBottom: 0 }}>{warehouse.name}</h1>
                <Badge status={warehouse.status} />
              </div>
              <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)' }}>{warehouse.code}</p>
            </div>
          </div>
          <div className="page-actions">
            {canEdit && (
              <button className="btn btn-secondary flex items-center gap-2" onClick={openEdit}>
                <Edit2 size={15} /> Edit
              </button>
            )}
            {canDelete && (
              <button className="btn btn-danger flex items-center gap-2" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={15} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Warehouse Information</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Location */}
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
            <MapPin size={14} color="var(--text-muted)" />
            <span>{locationStr}</span>
          </div>

          {/* Utilization */}
          <UtilizationBar current={warehouse.currentOccupancy ?? 0} capacity={warehouse.capacity ?? 0} />

          {/* Detail grid */}
          <div className="detail-grid">
            <div className="detail-field">
              <div className="detail-label">Capacity</div>
              <div className="detail-value">{(warehouse.capacity ?? 0).toLocaleString('en-IN')} units</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Current Occupancy</div>
              <div className="detail-value">{(warehouse.currentOccupancy ?? 0).toLocaleString('en-IN')} units</div>
            </div>
            {warehouse.contactPhone && (
              <div className="detail-field">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{warehouse.contactPhone}</div>
              </div>
            )}
            {warehouse.contactEmail && (
              <div className="detail-field">
                <div className="detail-label">Email</div>
                <div className="detail-value">{warehouse.contactEmail}</div>
              </div>
            )}
            <div className="detail-field">
              <div className="detail-label">Created</div>
              <div className="detail-value">{fmtDate(warehouse.createdAt)}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Last Updated</div>
              <div className="detail-value">{fmtDate(warehouse.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Package size={16} />
            Inventory
            {!invLoading && (
              <span className="badge badge-blue" style={{ marginLeft: 4 }}>{inventory.length}</span>
            )}
          </span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
                <th>Unit Price</th>
                <th>Status</th>
              </tr>
            </thead>
            {invLoading ? (
              <TableSkeleton cols={7} rows={5} />
            ) : (
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                      No inventory items for this warehouse.
                    </td>
                  </tr>
                ) : (
                  inventory.map(item => (
                    <tr key={item._id}>
                      <td>
                        <span className="font-medium text-strong">
                          {item.product?.name ?? item.productName ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {item.product?.sku ?? item.sku ?? '—'}
                        </span>
                      </td>
                      <td>{item.product?.category ?? item.category ?? '—'}</td>
                      <td>
                        <span className="font-semibold">{(item.quantity ?? 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td>{(item.reorderLevel ?? 0).toLocaleString('en-IN')}</td>
                      <td>{fmtCurrency(item.product?.unitPrice ?? item.unitPrice)}</td>
                      <td><Badge status={item.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Recent movements */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <RefreshCw size={16} />
            Recent Stock Movements
            <span className="text-sm text-muted font-medium" style={{ marginLeft: 2 }}>(last 10)</span>
          </span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Reference</th>
                <th>Performed By</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            {movLoading ? (
              <TableSkeleton cols={7} rows={5} />
            ) : (
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                      No stock movements recorded for this warehouse.
                    </td>
                  </tr>
                ) : (
                  movements.map(mov => (
                    <tr key={mov._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <MovementTypeIcon type={mov.type} />
                          <Badge status={mov.type} />
                        </div>
                      </td>
                      <td>
                        <span className="font-medium text-strong">
                          {mov.inventory?.product?.name ?? mov.productName ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`font-semibold ${mov.type === 'OUTBOUND' ? '' : ''}`}>
                          {mov.type === 'OUTBOUND' ? '-' : '+'}{(mov.quantity ?? 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                          {mov.referenceNumber ?? '—'}
                        </span>
                      </td>
                      <td>{mov.performedBy?.name ?? mov.performedBy ?? '—'}</td>
                      <td>{fmtDate(mov.createdAt)}</td>
                      <td>
                        <span className="text-sm text-muted truncate" style={{ maxWidth: 160, display: 'block' }}>
                          {mov.notes ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        title={`Edit — ${warehouse.name}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving && <span className="spinner spinner-sm" />}
              Save Changes
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
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Warehouse"
        message={`Are you sure you want to delete "${warehouse?.name}"? All associated data will be permanently removed.`}
        confirmText="Delete Warehouse"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
