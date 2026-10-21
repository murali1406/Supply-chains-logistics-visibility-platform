import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Star, Building2 } from 'lucide-react';
import { supplierApi } from '../../services/supplierApi';
import Badge from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_TERMS = ['ADVANCE', 'NET_15', 'NET_30', 'NET_45', 'NET_60'];

const CATEGORIES = [
  'Electronics',
  'Raw Materials',
  'Packaging',
  'Chemicals',
  'Machinery',
  'Office Supplies',
  'Food & Beverage',
  'Textiles',
  'Automotive',
  'Other',
];

const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

const EMPTY_FORM = {
  name: '',
  companyName: '',
  supplierCode: '',
  email: '',
  phone: '',
  address: {
    street: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  category: '',
  paymentTerms: 'NET_30',
  status: 'ACTIVE',
  rating: 0,
  notes: '',
};

// ─── Star Rating Display ───────────────────────────────────────────────────────

const StarRating = ({ value = 0, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(null);
  const display = hovered !== null ? hovered : value;

  return (
    <span className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={readOnly ? 14 : 16}
          fill={star <= display ? 'var(--yellow)' : 'none'}
          color={star <= display ? 'var(--yellow)' : 'var(--border-strong)'}
          style={{ cursor: readOnly ? 'default' : 'pointer', flexShrink: 0 }}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(null)}
          onClick={() => !readOnly && onChange && onChange(star === value ? 0 : star)}
        />
      ))}
      {!readOnly && (
        <span className="text-xs text-muted" style={{ marginLeft: 4 }}>
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      )}
    </span>
  );
};

// ─── Validation ────────────────────────────────────────────────────────────────

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Contact name is required.';
  if (!form.companyName.trim()) errors.companyName = 'Company name is required.';
  if (!form.supplierCode.trim()) errors.supplierCode = 'Supplier code is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.phone.trim()) errors.phone = 'Phone is required.';
  if (!form.address.city.trim()) errors['address.city'] = 'City is required.';
  return errors;
}

// ─── Supplier Form ─────────────────────────────────────────────────────────────

const SupplierForm = ({ form, setForm, errors }) => {
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setAddr = (field, value) =>
    setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">
            Contact Name <span className="required">*</span>
          </label>
          <input
            className={`form-input${errors.name ? ' error' : ''}`}
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">
            Company Name <span className="required">*</span>
          </label>
          <input
            className={`form-input${errors.companyName ? ' error' : ''}`}
            placeholder="Acme Corp"
            value={form.companyName}
            onChange={(e) => set('companyName', e.target.value)}
          />
          {errors.companyName && <span className="form-error">{errors.companyName}</span>}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">
            Supplier Code <span className="required">*</span>
          </label>
          <input
            className={`form-input${errors.supplierCode ? ' error' : ''}`}
            placeholder="SUP-001"
            value={form.supplierCode}
            onChange={(e) => set('supplierCode', e.target.value)}
          />
          {errors.supplierCode && <span className="form-error">{errors.supplierCode}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">
            Email <span className="required">*</span>
          </label>
          <input
            className={`form-input${errors.email ? ' error' : ''}`}
            type="email"
            placeholder="supplier@example.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">
            Phone <span className="required">*</span>
          </label>
          <input
            className={`form-input${errors.phone ? ' error' : ''}`}
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          {errors.phone && <span className="form-error">{errors.phone}</span>}
        </div>
      </div>

      {/* Address */}
      <div className="form-group">
        <label className="form-label">Street Address</label>
        <input
          className="form-input"
          placeholder="123 Industrial Area"
          value={form.address.street}
          onChange={(e) => setAddr('street', e.target.value)}
        />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">
            City <span className="required">*</span>
          </label>
          <input
            className={`form-input${errors['address.city'] ? ' error' : ''}`}
            placeholder="Mumbai"
            value={form.address.city}
            onChange={(e) => setAddr('city', e.target.value)}
          />
          {errors['address.city'] && (
            <span className="form-error">{errors['address.city']}</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input
            className="form-input"
            placeholder="Maharashtra"
            value={form.address.state}
            onChange={(e) => setAddr('state', e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Country</label>
          <input
            className="form-input"
            placeholder="India"
            value={form.address.country}
            onChange={(e) => setAddr('country', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Postal Code</label>
          <input
            className="form-input"
            placeholder="400001"
            value={form.address.postalCode}
            onChange={(e) => setAddr('postalCode', e.target.value)}
          />
        </div>
      </div>

      {/* Payment Terms + Status */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Payment Terms</label>
          <select
            className="form-select"
            value={form.paymentTerms}
            onChange={(e) => set('paymentTerms', e.target.value)}
          >
            {PAYMENT_TERMS.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rating */}
      <div className="form-group">
        <label className="form-label">Rating</label>
        <StarRating
          value={form.rating}
          onChange={(val) => set('rating', val)}
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          className="form-textarea"
          placeholder="Any additional notes about this supplier..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();

  const canWrite = hasRole('ADMIN', 'WAREHOUSE_MANAGER');
  const canDelete = hasRole('ADMIN');

  // Data state
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await supplierApi.getAll(params);
      setSuppliers(res.data?.suppliers || res.data?.data || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(timer);
  }, [fetchSuppliers]);

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditTarget(supplier);
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
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditTarget(null);
    setFormErrors({});
  };

  const handleSave = async () => {
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await supplierApi.update(editTarget._id, form);
        toast.success('Supplier updated', `${form.companyName} has been updated.`);
      } else {
        await supplierApi.create(form);
        toast.success('Supplier added', `${form.companyName} has been added.`);
      }
      closeModal();
      fetchSuppliers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save supplier.';
      toast.error('Save failed', msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supplierApi.delete(deleteTarget._id);
      toast.success('Supplier deleted', `${deleteTarget.companyName} has been removed.`);
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (err) {
      toast.error('Delete failed', err?.response?.data?.message || 'Could not delete supplier.');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Client-side filter fallback ─────────────────────────────────────────

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (s.companyName || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.supplierCode || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">Manage your supplier network and contact information</p>
        </div>
        <div className="page-actions">
          {canWrite && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} />
              Add Supplier
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar flex-1" style={{ minWidth: 220 }}>
              <Search size={15} className="search-icon" />
              <input
                className="form-input"
                placeholder="Search by company, name, code or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(search || statusFilter) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSearch(''); setStatusFilter(''); }}
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
                <th>Supplier Code</th>
                <th>Company Name</th>
                <th>Contact Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Category</th>
                <th>Payment Terms</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            {loading ? (
              <TableSkeleton cols={10} rows={6} />
            ) : error ? (
              <tbody>
                <tr>
                  <td colSpan={10}>
                    <ErrorState message={error} onRetry={fetchSuppliers} />
                  </td>
                </tr>
              </tbody>
            ) : filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={Building2}
                      title="No suppliers found"
                      message={
                        search || statusFilter
                          ? 'Try adjusting your search or filter.'
                          : 'Get started by adding your first supplier.'
                      }
                      action={
                        canWrite && !search && !statusFilter ? (
                          <button className="btn btn-primary" onClick={openCreate}>
                            <Plus size={15} /> Add Supplier
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <span
                        className="font-medium"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}
                      >
                        {s.supplierCode || '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', fontWeight: 600, color: 'var(--primary)' }}
                        onClick={() => navigate(`/suppliers/${s._id}`)}
                      >
                        {s.companyName || '—'}
                      </button>
                    </td>
                    <td>{s.name || '—'}</td>
                    <td>
                      <a href={`mailto:${s.email}`} className="text-sm" style={{ color: 'var(--text)' }}>
                        {s.email || '—'}
                      </a>
                    </td>
                    <td className="text-sm">{s.phone || '—'}</td>
                    <td>
                      {s.category ? (
                        <Badge status="INFO">{s.category}</Badge>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-sm">
                        {s.paymentTerms ? s.paymentTerms.replace('_', ' ') : '—'}
                      </span>
                    </td>
                    <td>
                      <StarRating value={s.rating || 0} readOnly />
                    </td>
                    <td>
                      <Badge status={s.status || 'INACTIVE'} />
                    </td>
                    <td>
                      <div className="actions-cell">
                        {canWrite && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            data-tooltip="Edit"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            data-tooltip="Delete"
                            style={{ color: 'var(--red)' }}
                            onClick={() => setDeleteTarget(s)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!canWrite && !canDelete && (
                          <span className="text-muted text-xs">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Footer count */}
        {!loading && !error && filtered.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
              {(search || statusFilter) && ` matching current filters`}
            </span>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? `Edit — ${editTarget.companyName}` : 'Add New Supplier'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving && <span className="spinner spinner-sm" />}
              {editTarget ? 'Save Changes' : 'Add Supplier'}
            </button>
          </>
        }
      >
        <SupplierForm form={form} setForm={setForm} errors={formErrors} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Supplier"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.companyName}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
