import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, CreditCard,
  Star, Edit2, Trash2, Package, Clock, ExternalLink
} from 'lucide-react';
import { supplierApi } from '../../services/supplierApi';
import { inventoryApi } from '../../services/inventoryApi';
import Badge from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const PAYMENT_TERMS = ['ADVANCE', 'NET_15', 'NET_30', 'NET_45', 'NET_60'];
const CATEGORIES = [
  'Electronics', 'Raw Materials', 'Packaging', 'Chemicals',
  'Machinery', 'Office Supplies', 'Food & Beverage', 'Textiles', 'Automotive', 'Other'
];
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtCurrency = (v) =>
  v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();

  const canWrite = hasRole('ADMIN', 'WAREHOUSE_MANAGER');
  const canDelete = hasRole('ADMIN');

  const [supplier, setSupplier] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [supRes, invRes] = await Promise.allSettled([
        supplierApi.getById(id),
        inventoryApi.getAll({}),
      ]);

      if (supRes.status === 'fulfilled') {
        const s = supRes.value.data?.supplier || supRes.value.data;
        setSupplier(s);
      } else {
        throw new Error(supRes.reason?.response?.data?.message || 'Supplier not found');
      }

      if (invRes.status === 'fulfilled') {
        const allInv = invRes.value.data?.inventory || invRes.value.data?.data || invRes.value.data || [];
        const supplierItems = Array.isArray(allInv)
          ? allInv.filter((item) => item.supplier?._id === id || item.supplier === id)
          : [];
        setItems(supplierItems);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = () => {
    if (!supplier) return;
    setForm({
      name: supplier.name || '',
      companyName: supplier.companyName || '',
      supplierCode: supplier.supplierCode || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: {
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        country: supplier.address?.country || 'India',
        postalCode: supplier.address?.postalCode || '',
      },
      category: supplier.category || '',
      paymentTerms: supplier.paymentTerms || 'NET_30',
      status: supplier.status || 'ACTIVE',
      rating: supplier.rating || 0,
      notes: supplier.notes || '',
    });
    setFormErrors({});
    setEditOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Contact name is required';
    if (!form.companyName.trim()) errs.companyName = 'Company name is required';
    if (!form.supplierCode.trim()) errs.supplierCode = 'Supplier code is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.address.city.trim()) errs['address.city'] = 'City is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await supplierApi.update(id, form);
      toast.success('Supplier updated', 'Changes have been saved successfully.');
      setEditOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Update failed', err?.response?.data?.message || 'Could not update supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supplierApi.delete(id);
      toast.success('Supplier deleted', `${supplier.companyName} was removed.`);
      navigate('/suppliers');
    } catch (err) {
      toast.error('Delete failed', err?.response?.data?.message || 'Could not delete supplier');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading supplier profile..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!supplier) return <EmptyState title="Supplier not found" message="This supplier could not be located." />;

  const fullAddress = [
    supplier.address?.street,
    supplier.address?.city,
    supplier.address?.state,
    supplier.address?.postalCode,
    supplier.address?.country
  ].filter(Boolean).join(', ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 8, paddingLeft: 0 }}
            onClick={() => navigate('/suppliers')}
          >
            <ArrowLeft size={16} /> Back to Suppliers
          </button>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{supplier.companyName}</h1>
            <Badge status={supplier.status || 'ACTIVE'} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'var(--bg-hover)',
                color: 'var(--text-muted)'
              }}
            >
              {supplier.supplierCode}
            </span>
          </div>
          <p className="page-subtitle">Contact Person: {supplier.name}</p>
        </div>

        <div className="page-actions">
          {canWrite && (
            <button className="btn btn-secondary" onClick={openEdit}>
              <Edit2 size={15} /> Edit Supplier
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Info Grid Cards */}
      <div className="grid-3">
        {/* Contact Info Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Building2 size={16} color="var(--primary)" /> Contact Details
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-field">
              <div className="detail-label">Contact Person</div>
              <div className="detail-value">{supplier.name || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Email Address</div>
              <div className="detail-value">
                <a href={`mailto:${supplier.email}`} style={{ color: 'var(--primary)' }}>
                  {supplier.email || '—'}
                </a>
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Phone Number</div>
              <div className="detail-value">{supplier.phone || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Location Address</div>
              <div className="detail-value text-sm" style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                <MapPin size={15} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{fullAddress || 'No address specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Terms Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <CreditCard size={16} color="var(--primary)" /> Business Terms
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-field">
              <div className="detail-label">Category</div>
              <div className="detail-value">
                {supplier.category ? <Badge status="INFO">{supplier.category}</Badge> : 'General'}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Payment Terms</div>
              <div className="detail-value font-semibold">
                {supplier.paymentTerms ? supplier.paymentTerms.replace('_', ' ') : 'NET 30'}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Performance Rating</div>
              <div className="detail-value flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= (supplier.rating || 0) ? 'var(--yellow)' : 'none'}
                    color={star <= (supplier.rating || 0) ? 'var(--yellow)' : 'var(--border-strong)'}
                  />
                ))}
                <span className="text-sm text-muted" style={{ marginLeft: 6 }}>
                  {supplier.rating ? `${supplier.rating}/5` : 'Unrated'}
                </span>
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Registered Since</div>
              <div className="detail-value text-sm">{fmtDate(supplier.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Notes / Summary Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Clock size={16} color="var(--primary)" /> Operational Notes
            </span>
          </div>
          <div className="card-body">
            <div className="detail-field" style={{ marginBottom: 14 }}>
              <div className="detail-label">Supplied Products Count</div>
              <div className="stat-card-value" style={{ fontSize: 24 }}>
                {items.length}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Notes & Comments</div>
              <p className="text-sm" style={{ color: 'var(--text)', background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius)', minHeight: 60 }}>
                {supplier.notes || 'No special operational notes recorded for this supplier.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supplied Products Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Package size={16} color="var(--primary)" /> Associated Inventory Items ({items.length})
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inventory')}>
            View All Inventory <ExternalLink size={14} />
          </button>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Status</th>
                <th>Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ padding: '32px 0', textAlign: 'center' }}>
                      <p className="text-muted text-sm">No inventory items are currently associated with this supplier.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span className="font-mono text-xs font-semibold">{item.sku}</span>
                    </td>
                    <td className="font-medium text-strong">{item.productName}</td>
                    <td><Badge status="INFO">{item.category || 'General'}</Badge></td>
                    <td className="font-semibold">{item.quantity}</td>
                    <td>{fmtCurrency(item.unitPrice)}</td>
                    <td><Badge status={item.status} /></td>
                    <td>{item.warehouse?.name || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {form && (
        <Modal
          open={editOpen}
          onClose={() => !saving && setEditOpen(false)}
          title={`Edit Supplier — ${supplier.companyName}`}
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
          <div className="flex flex-col gap-4">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Contact Name <span className="required">*</span></label>
                <input
                  className={`form-input${formErrors.name ? ' error' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Company Name <span className="required">*</span></label>
                <input
                  className={`form-input${formErrors.companyName ? ' error' : ''}`}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
                {formErrors.companyName && <span className="form-error">{formErrors.companyName}</span>}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Supplier Code <span className="required">*</span></label>
                <input
                  className={`form-input${formErrors.supplierCode ? ' error' : ''}`}
                  value={form.supplierCode}
                  onChange={(e) => setForm({ ...form, supplierCode: e.target.value })}
                />
                {formErrors.supplierCode && <span className="form-error">{formErrors.supplierCode}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input
                  className={`form-input${formErrors.email ? ' error' : ''}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span className="required">*</span></label>
                <input
                  className={`form-input${formErrors.phone ? ' error' : ''}`}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {formErrors.phone && <span className="form-error">{formErrors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                className="form-input"
                value={form.address.street}
                onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">City <span className="required">*</span></label>
                <input
                  className={`form-input${formErrors['address.city'] ? ' error' : ''}`}
                  value={form.address.city}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                />
                {formErrors['address.city'] && <span className="form-error">{formErrors['address.city']}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  className="form-input"
                  value={form.address.state}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <select
                  className="form-select"
                  value={form.paymentTerms}
                  onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                >
                  {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Supplier"
        message={`Are you sure you want to delete ${supplier.companyName}? All associated supplier details will be removed.`}
        confirmText="Delete Supplier"
        variant="danger"
      />
    </div>
  );
}
