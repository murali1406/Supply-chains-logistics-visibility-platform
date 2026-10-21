import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Edit2, Trash2, Eye, Package, ArrowUpDown } from 'lucide-react';
import { shipmentApi } from '../../services/shipmentApi';
import { supplierApi } from '../../services/supplierApi';
import { warehouseApi } from '../../services/warehouseApi';
import { inventoryApi } from '../../services/inventoryApi';
import Badge from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ──────────────────────────────────────────────
const ALL_STATUSES = [
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

// Valid next statuses per current status
const VALID_TRANSITIONS = {
  PENDING:          ['PICKED_UP', 'CANCELLED'],
  PICKED_UP:        ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

const EMPTY_FORM = {
  shipmentNumber:    '',
  trackingNumber:    '',
  supplier:          '',
  warehouse:         '',
  carrier:           '',
  shippingDate:      '',
  estimatedDelivery: '',
  notes:             '',
  destination: {
    address:    '',
    city:       '',
    state:      '',
    postalCode: '',
    country:    '',
  },
  items: [{ inventory: '', quantity: 1 }],
};

const EMPTY_ERRORS = {
  shipmentNumber:    '',
  trackingNumber:    '',
  supplier:          '',
  warehouse:         '',
  carrier:           '',
  estimatedDelivery: '',
  items:             '',
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── Main Component ──────────────────────────────────────────
export default function ShipmentsPage() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const { isManager, isAdmin } = useAuth();

  // ── Data state
  const [shipments,   setShipments]   = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [warehouses,  setWarehouses]  = useState([]);
  const [inventory,   setInventory]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [refLoading,  setRefLoading]  = useState(false); // reference data

  // ── Filters
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [search,         setSearch]         = useState('');

  // ── Modals
  const [formOpen,      setFormOpen]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null); // shipment being edited
  const [statusOpen,    setStatusOpen]    = useState(false);
  const [statusTarget,  setStatusTarget]  = useState(null);
  const [newStatus,     setNewStatus]     = useState('');
  const [deleteOpen,    setDeleteOpen]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // ── Form state
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState(EMPTY_ERRORS);

  // ── Fetch shipments
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterStatus)   params.status   = filterStatus;
      if (filterSupplier) params.supplier  = filterSupplier;
      if (search)         params.search   = search;
      const res = await shipmentApi.getAll(params);
      setShipments(res.data?.shipments || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSupplier, search]);

  // ── Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    setRefLoading(true);
    try {
      const [supRes, whRes, invRes] = await Promise.all([
        supplierApi.getAll(),
        warehouseApi.getAll(),
        inventoryApi.getAll(),
      ]);
      setSuppliers(supRes.data?.suppliers || supRes.data || []);
      setWarehouses(whRes.data?.warehouses || whRes.data || []);
      setInventory(invRes.data?.inventory || invRes.data || []);
    } catch {
      toast.warning('Warning', 'Could not load reference data. Dropdowns may be incomplete.');
    } finally {
      setRefLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);
  useEffect(() => { fetchReferenceData(); }, [fetchReferenceData]);

  // ─── Form helpers ────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors(EMPTY_ERRORS);
    setFormOpen(true);
  };

  const openEdit = (e, shipment) => {
    e.stopPropagation();
    setEditTarget(shipment);
    setForm({
      shipmentNumber:    shipment.shipmentNumber    || '',
      trackingNumber:    shipment.trackingNumber    || '',
      supplier:          shipment.supplier?._id     || shipment.supplier || '',
      warehouse:         shipment.warehouse?._id    || shipment.warehouse || '',
      carrier:           shipment.carrier           || '',
      shippingDate:      shipment.shippingDate      ? shipment.shippingDate.slice(0, 10) : '',
      estimatedDelivery: shipment.estimatedDelivery ? shipment.estimatedDelivery.slice(0, 10) : '',
      notes:             shipment.notes             || '',
      destination: {
        address:    shipment.destination?.address    || '',
        city:       shipment.destination?.city       || '',
        state:      shipment.destination?.state      || '',
        postalCode: shipment.destination?.postalCode || '',
        country:    shipment.destination?.country    || '',
      },
      items: shipment.items?.length
        ? shipment.items.map((it) => ({
            inventory: it.inventory?._id || it.inventory || '',
            quantity:  it.quantity || 1,
          }))
        : [{ inventory: '', quantity: 1 }],
    });
    setFormErrors(EMPTY_ERRORS);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleDestChange = (field, value) => {
    setForm((prev) => ({ ...prev, destination: { ...prev.destination, [field]: value } }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: field === 'quantity' ? Math.max(1, Number(value)) : value };
      return { ...prev, items };
    });
    if (formErrors.items) setFormErrors((prev) => ({ ...prev, items: '' }));
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { inventory: '', quantity: 1 }] }));
  };

  const removeItem = (idx) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  // ─── Validation ──────────────────────────────────────────
  const validate = () => {
    const errs = { ...EMPTY_ERRORS };
    let valid = true;
    if (!form.shipmentNumber.trim()) { errs.shipmentNumber = 'Shipment number is required.'; valid = false; }
    if (!form.supplier)              { errs.supplier       = 'Supplier is required.';        valid = false; }
    if (!form.warehouse)             { errs.warehouse      = 'Warehouse is required.';       valid = false; }
    if (!form.estimatedDelivery)     { errs.estimatedDelivery = 'Estimated delivery date is required.'; valid = false; }
    if (form.items.length === 0)     { errs.items = 'At least one item is required.'; valid = false; }
    const hasInvalidItem = form.items.some((it) => !it.inventory || it.quantity < 1);
    if (hasInvalidItem)              { errs.items = 'Each item must have a product and quantity ≥ 1.'; valid = false; }
    setFormErrors(errs);
    return valid;
  };

  // ─── Submit form ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        shippingDate:      form.shippingDate      || undefined,
        estimatedDelivery: form.estimatedDelivery || undefined,
      };
      if (editTarget) {
        await shipmentApi.update(editTarget._id, payload);
        toast.success('Order Updated', `Purchase order ${form.shipmentNumber} was updated.`);
      } else {
        await shipmentApi.create(payload);
        toast.success('Order Created', `Purchase order ${form.shipmentNumber} was created.`);
      }
      setFormOpen(false);
      fetchShipments();
    } catch (err) {
      toast.error('Save Failed', err?.response?.data?.message || 'Could not save the order.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Status update ───────────────────────────────────────
  const openStatusModal = (e, shipment) => {
    e.stopPropagation();
    setStatusTarget(shipment);
    const options = VALID_TRANSITIONS[shipment.status] || [];
    setNewStatus(options[0] || '');
    setStatusOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !statusTarget) return;
    setSaving(true);
    try {
      await shipmentApi.updateStatus(statusTarget._id, newStatus);
      toast.success('Status Updated', `Order ${statusTarget.shipmentNumber} → ${newStatus.replace(/_/g, ' ')}`);
      setStatusOpen(false);
      fetchShipments();
    } catch (err) {
      toast.error('Update Failed', err?.response?.data?.message || 'Could not update status.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────
  const openDelete = (e, shipment) => {
    e.stopPropagation();
    setDeleteTarget(shipment);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await shipmentApi.delete(deleteTarget._id);
      toast.success('Order Deleted', `Purchase order ${deleteTarget.shipmentNumber} was deleted.`);
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchShipments();
    } catch (err) {
      toast.error('Delete Failed', err?.response?.data?.message || 'Could not delete the order.');
    } finally {
      setDeleting(false);
    }
  };

  const validStatusOptions = statusTarget ? (VALID_TRANSITIONS[statusTarget.status] || []) : [];

  // ─── Render ──────────────────────────────────────────────
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Manage inbound shipments and supplier purchase orders</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={fetchShipments}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          </button>
          {isManager && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} />
              Create Order
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-bar flex-1" style={{ minWidth: 200 }}>
              <Search size={14} className="search-icon" />
              <input
                className="form-input"
                placeholder="Search shipment # or tracking #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="form-select"
              style={{ width: 180 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {/* Supplier filter */}
            <select
              className="form-select"
              style={{ width: 200 }}
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.companyName || s.name || s._id}
                </option>
              ))}
            </select>

            {(filterStatus || filterSupplier || search) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setFilterStatus(''); setFilterSupplier(''); setSearch(''); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shipment #</th>
                <th>Tracking #</th>
                <th>Supplier</th>
                <th>Warehouse</th>
                <th>Carrier</th>
                <th>Status</th>
                <th>Shipping Date</th>
                <th>Est. Delivery</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={9} rows={6} />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={9}>
                    <ErrorState message={error} onRetry={fetchShipments} />
                  </td>
                </tr>
              </tbody>
            ) : shipments.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Package}
                      title="No Purchase Orders"
                      message="No orders match your current filters. Create a new order to get started."
                      action={
                        isManager ? (
                          <button className="btn btn-primary btn-sm" onClick={openCreate}>
                            <Plus size={14} /> Create Order
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {shipments.map((shipment) => {
                  const canTransition = (VALID_TRANSITIONS[shipment.status] || []).length > 0;
                  return (
                    <tr
                      key={shipment._id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/shipments/${shipment._id}`)}
                    >
                      <td>
                        <span className="font-semibold text-strong">
                          {shipment.shipmentNumber || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {shipment.trackingNumber || '—'}
                        </span>
                      </td>
                      <td>
                        {shipment.supplier
                          ? (shipment.supplier.companyName || shipment.supplier.name || '—')
                          : '—'}
                      </td>
                      <td>
                        {shipment.warehouse
                          ? `${shipment.warehouse.name || ''}${shipment.warehouse.code ? ` (${shipment.warehouse.code})` : ''}`
                          : '—'}
                      </td>
                      <td>{shipment.carrier || '—'}</td>
                      <td>
                        <Badge status={shipment.status} />
                      </td>
                      <td>{fmtDate(shipment.shippingDate)}</td>
                      <td>{fmtDate(shipment.estimatedDelivery)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="actions-cell">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="View Details"
                            onClick={() => navigate(`/shipments/${shipment._id}`)}
                          >
                            <Eye size={14} />
                          </button>
                          {isManager && canTransition && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Update Status"
                              onClick={(e) => openStatusModal(e, shipment)}
                            >
                              <ArrowUpDown size={14} />
                            </button>
                          )}
                          {isManager && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit Order"
                              onClick={(e) => openEdit(e, shipment)}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Delete Order"
                              style={{ color: 'var(--red)' }}
                              onClick={(e) => openDelete(e, shipment)}
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

        {/* Table footer count */}
        {!loading && !error && shipments.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {shipments.length} order{shipments.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────── */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editTarget ? `Edit Order — ${editTarget.shipmentNumber}` : 'Create Purchase Order'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || refLoading}>
              {saving ? <span className="spinner spinner-sm" /> : null}
              {editTarget ? 'Save Changes' : 'Create Order'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Row 1: Shipment # + Tracking # */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                Shipment # <span className="required">*</span>
              </label>
              <input
                className={`form-input${formErrors.shipmentNumber ? ' error' : ''}`}
                placeholder="e.g. SHP-2026-001"
                value={form.shipmentNumber}
                onChange={(e) => handleFieldChange('shipmentNumber', e.target.value)}
              />
              {formErrors.shipmentNumber && (
                <span className="form-error">{formErrors.shipmentNumber}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Tracking #</label>
              <input
                className="form-input"
                placeholder="Carrier tracking number"
                value={form.trackingNumber}
                onChange={(e) => handleFieldChange('trackingNumber', e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Supplier + Warehouse */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                Supplier <span className="required">*</span>
              </label>
              <select
                className={`form-select${formErrors.supplier ? ' error' : ''}`}
                value={form.supplier}
                onChange={(e) => handleFieldChange('supplier', e.target.value)}
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.companyName || s.name}
                  </option>
                ))}
              </select>
              {formErrors.supplier && <span className="form-error">{formErrors.supplier}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">
                Warehouse <span className="required">*</span>
              </label>
              <select
                className={`form-select${formErrors.warehouse ? ' error' : ''}`}
                value={form.warehouse}
                onChange={(e) => handleFieldChange('warehouse', e.target.value)}
              >
                <option value="">— Select Warehouse —</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}{w.code ? ` (${w.code})` : ''}
                  </option>
                ))}
              </select>
              {formErrors.warehouse && <span className="form-error">{formErrors.warehouse}</span>}
            </div>
          </div>

          {/* Row 3: Carrier + Dates */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Carrier</label>
              <input
                className="form-input"
                placeholder="e.g. FedEx, DHL, BlueDart"
                value={form.carrier}
                onChange={(e) => handleFieldChange('carrier', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Date</label>
              <input
                type="date"
                className="form-input"
                value={form.shippingDate}
                onChange={(e) => handleFieldChange('shippingDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">
                Estimated Delivery <span className="required">*</span>
              </label>
              <input
                type="date"
                className={`form-input${formErrors.estimatedDelivery ? ' error' : ''}`}
                value={form.estimatedDelivery}
                onChange={(e) => handleFieldChange('estimatedDelivery', e.target.value)}
              />
              {formErrors.estimatedDelivery && (
                <span className="form-error">{formErrors.estimatedDelivery}</span>
              )}
            </div>
          </div>

          {/* Destination */}
          <div>
            <p className="card-title" style={{ marginBottom: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Destination Address
            </p>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Street Address</label>
              <input
                className="form-input"
                placeholder="123 Warehouse Road"
                value={form.destination.address}
                onChange={(e) => handleDestChange('address', e.target.value)}
              />
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  placeholder="Mumbai"
                  value={form.destination.city}
                  onChange={(e) => handleDestChange('city', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  className="form-input"
                  placeholder="Maharashtra"
                  value={form.destination.state}
                  onChange={(e) => handleDestChange('state', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  className="form-input"
                  placeholder="400001"
                  value={form.destination.postalCode}
                  onChange={(e) => handleDestChange('postalCode', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  className="form-input"
                  placeholder="India"
                  value={form.destination.country}
                  onChange={(e) => handleDestChange('country', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Items
              </p>
              <button className="btn btn-secondary btn-sm" type="button" onClick={addItem}>
                <Plus size={13} /> Add Item
              </button>
            </div>

            {formErrors.items && (
              <div className="form-error" style={{ marginBottom: 10 }}>{formErrors.items}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2"
                  style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: '10px 12px', border: '1px solid var(--border)' }}
                >
                  <span className="text-sm text-muted" style={{ minWidth: 24, textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <select
                      className="form-select"
                      value={item.inventory}
                      onChange={(e) => handleItemChange(idx, 'inventory', e.target.value)}
                    >
                      <option value="">— Select Product —</option>
                      {inventory.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.productName}{inv.sku ? ` [${inv.sku}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 100 }}>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                    />
                  </div>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--red)', flexShrink: 0 }}
                      onClick={() => removeItem(idx)}
                      title="Remove item"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Additional notes or instructions…"
              value={form.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── Status Update Modal ─────────────────────────────── */}
      <Modal
        open={statusOpen}
        onClose={() => { if (!saving) setStatusOpen(false); }}
        title={`Update Status — ${statusTarget?.shipmentNumber || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleStatusUpdate}
              disabled={saving || !newStatus}
            >
              {saving ? <span className="spinner spinner-sm" /> : null}
              Update Status
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Current:</span>
            {statusTarget && <Badge status={statusTarget.status} />}
          </div>
          <div className="form-group">
            <label className="form-label">New Status <span className="required">*</span></label>
            {validStatusOptions.length === 0 ? (
              <p className="text-sm text-muted">
                This order cannot be transitioned to any further status.
              </p>
            ) : (
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">— Select Status —</option>
                {validStatusOptions.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ──────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteTarget(null); } }}
        onConfirm={handleDelete}
        title="Delete Purchase Order"
        message={`Are you sure you want to permanently delete order "${deleteTarget?.shipmentNumber}"? This action cannot be undone.`}
        confirmText="Delete Order"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
