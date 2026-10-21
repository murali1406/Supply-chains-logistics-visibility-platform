import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Eye, Pencil, Trash2, PackagePlus,
  Package, ChevronLeft, ChevronRight, RefreshCw, X,
} from 'lucide-react';

import { inventoryApi } from '../../services/inventoryApi';
import { warehouseApi }  from '../../services/warehouseApi';
import { supplierApi }   from '../../services/supplierApi';
import Badge             from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import {
  ErrorState, EmptyState, TableSkeleton,
} from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth }  from '../../context/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

const fmtCurrency = (v) =>
  v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

/** Derive status from quantity vs reorderLevel */
const deriveStatus = (qty, reorderLevel) => {
  if (qty == null) return 'OUT_OF_STOCK';
  if (qty <= 0)           return 'OUT_OF_STOCK';
  if (qty <= (reorderLevel ?? 0)) return 'LOW_STOCK';
  return 'IN_STOCK';
};


// ─── blank form defaults ───────────────────────────────────────────────────────

const BLANK_FORM = {
  productName:      '',
  sku:              '',
  category:         '',
  warehouse:        '',
  quantity:         '',
  reservedQuantity: '',
  reorderLevel:     '',
  maxStock:         '',
  unitPrice:        '',
  supplier:         '',
};

const BLANK_ADJUST = { quantityChange: '', reason: '' };

// ─── Row highlight styles (inline only because no CSS class exists for these) ─
const ROW_STYLE = {
  LOW_STOCK:    { background: 'var(--yellow-bg)' },
  OUT_OF_STOCK: { background: 'var(--red-bg)' },
  IN_STOCK:     {},
};

// ─── InventoryPage ─────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const toast     = useToast();
  const { hasRole } = useAuth();

  const canManage = hasRole('ADMIN', 'WAREHOUSE_MANAGER');
  const canDelete = hasRole('ADMIN');

  // ── list state ──
  const [inventory,   setInventory]   = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, pages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── filter state ──
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter,  setCategoryFilter]  = useState('');
  const [page,         setPage]         = useState(1);

  // ── lookup data ──
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);

  // ── modal state ──
  const [viewItem,   setViewItem]   = useState(null);   // detail modal
  const [editItem,   setEditItem]   = useState(null);   // null = closed, {} = add, {...} = edit
  const [adjustItem, setAdjustItem] = useState(null);   // stock adjustment modal
  const [deleteItem, setDeleteItem] = useState(null);   // confirm dialog

  // ── form state ──
  const [form,        setForm]        = useState(BLANK_FORM);
  const [formErrors,  setFormErrors]  = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const [adjustForm,        setAdjustForm]        = useState(BLANK_ADJUST);
  const [adjustErrors,      setAdjustErrors]      = useState({});
  const [adjustLoading,     setAdjustLoading]     = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // debounce search
  const searchTimer = useRef(null);

  // ── fetch inventory ──────────────────────────────────────────────────────────
  const fetchInventory = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.getAll({
        search:    opts.search    ?? search,
        status:    opts.status    ?? statusFilter,
        warehouse: opts.warehouse ?? warehouseFilter,
        category:  opts.category  ?? categoryFilter,
        page:      opts.page      ?? page,
        limit:     PAGE_LIMIT,
      });
      setInventory(res.data.inventory ?? []);
      setPagination(res.data.pagination ?? { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, warehouseFilter, categoryFilter, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // ── fetch lookup lists once ──────────────────────────────────────────────────
  useEffect(() => {
    warehouseApi.getAll({ limit: 200 })
      .then((r) => setWarehouses(r.data.warehouses ?? r.data.data ?? []))
      .catch(() => {});
    supplierApi.getAll({ limit: 200 })
      .then((r) => setSuppliers(r.data.suppliers ?? r.data.data ?? []))
      .catch(() => {});
  }, []);

  // ── search debounce ──────────────────────────────────────────────────────────
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchInventory({ search: val, page: 1 });
    }, 400);
  };

  const handleFilterChange = (key, val) => {
    if (key === 'status')    { setStatusFilter(val); }
    if (key === 'warehouse') { setWarehouseFilter(val); }
    if (key === 'category')  { setCategoryFilter(val); }
    setPage(1);
    fetchInventory({
      search,
      status:    key === 'status'    ? val : statusFilter,
      warehouse: key === 'warehouse' ? val : warehouseFilter,
      category:  key === 'category'  ? val : categoryFilter,
      page: 1,
    });
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchInventory({ page: p });
  };

  // ── clear all filters ────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setWarehouseFilter('');
    setCategoryFilter('');
    setPage(1);
    fetchInventory({ search: '', status: '', warehouse: '', category: '', page: 1 });
  };

  const hasActiveFilters = search || statusFilter || warehouseFilter || categoryFilter;

  // ── open add/edit modal ──────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(BLANK_FORM);
    setFormErrors({});
    setEditItem({});   // empty obj = "add" mode
  };

  const openEdit = (item) => {
    setForm({
      productName:      item.productName      ?? '',
      sku:              item.sku              ?? '',
      category:         item.category         ?? '',
      warehouse:        item.warehouse?._id   ?? item.warehouse ?? '',
      quantity:         item.quantity         ?? 0,
      reservedQuantity: item.reservedQuantity ?? 0,
      reorderLevel:     item.reorderLevel     ?? 0,
      maxStock:         item.maxStock         ?? '',
      unitPrice:        item.unitPrice        ?? '',
      supplier:         item.supplier?._id    ?? item.supplier ?? '',
    });
    setFormErrors({});
    setEditItem(item);
  };

  // ── form validation ──────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!form.productName.trim()) errs.productName = 'Product name is required.';
    if (!form.sku.trim())         errs.sku         = 'SKU is required.';
    if (!form.warehouse)          errs.warehouse   = 'Warehouse is required.';
    if (form.quantity === '' || isNaN(Number(form.quantity)))
      errs.quantity = 'Valid quantity is required.';
    if (form.unitPrice === '' || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 0)
      errs.unitPrice = 'Valid unit price is required.';
    return errs;
  };

  // ── submit add/edit ──────────────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setFormLoading(true);
    const payload = {
      productName:      form.productName.trim(),
      sku:              form.sku.trim(),
      category:         form.category.trim() || undefined,
      warehouse:        form.warehouse,
      quantity:         Number(form.quantity),
      reservedQuantity: form.reservedQuantity !== '' ? Number(form.reservedQuantity) : undefined,
      reorderLevel:     form.reorderLevel     !== '' ? Number(form.reorderLevel)     : undefined,
      maxStock:         form.maxStock         !== '' ? Number(form.maxStock)         : undefined,
      unitPrice:        Number(form.unitPrice),
      supplier:         form.supplier || undefined,
    };

    try {
      const isEdit = editItem?._id;
      if (isEdit) {
        await inventoryApi.update(editItem._id, payload);
        toast.success('Inventory updated', `${payload.productName} has been updated.`);
      } else {
        await inventoryApi.create(payload);
        toast.success('Item added', `${payload.productName} has been added.`);
      }
      setEditItem(null);
      fetchInventory();
    } catch (err) {
      toast.error('Save failed', err?.response?.data?.message ?? 'An error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── stock adjustment ─────────────────────────────────────────────────────────
  const openAdjust = (item) => {
    setAdjustForm(BLANK_ADJUST);
    setAdjustErrors({});
    setAdjustItem(item);
  };

  const validateAdjust = () => {
    const errs = {};
    if (adjustForm.quantityChange === '' || isNaN(Number(adjustForm.quantityChange)))
      errs.quantityChange = 'Enter a valid number (positive or negative).';
    if (Number(adjustForm.quantityChange) === 0)
      errs.quantityChange = 'Change cannot be zero.';
    if (!adjustForm.reason.trim())
      errs.reason = 'Reason is required.';
    return errs;
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const errs = validateAdjust();
    if (Object.keys(errs).length) { setAdjustErrors(errs); return; }

    setAdjustLoading(true);
    try {
      await inventoryApi.updateStock(adjustItem._id, {
        quantityChange: Number(adjustForm.quantityChange),
        reason:         adjustForm.reason.trim(),
      });
      toast.success('Stock adjusted', `${adjustItem.productName} stock has been updated.`);
      setAdjustItem(null);
      fetchInventory();
    } catch (err) {
      toast.error('Adjustment failed', err?.response?.data?.message ?? 'An error occurred.');
    } finally {
      setAdjustLoading(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      await inventoryApi.delete(deleteItem._id);
      toast.success('Item deleted', `${deleteItem.productName} has been removed.`);
      setDeleteItem(null);
      fetchInventory();
    } catch (err) {
      toast.error('Delete failed', err?.response?.data?.message ?? 'An error occurred.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── view detail ──────────────────────────────────────────────────────────────
  const openView = (item) => setViewItem(item);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            Manage stock levels, item details, and adjustments across all warehouses.
          </p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={15} />
              Add Item
            </button>
          </div>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>

            {/* Search */}
            <div className="search-bar flex-1" style={{ minWidth: 200 }}>
              <Search size={14} className="search-icon" />
              <input
                className="form-input"
                style={{ paddingLeft: 34 }}
                placeholder="Search SKU, product, category…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="form-select"
              style={{ width: 160 }}
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            {/* Warehouse filter */}
            <select
              className="form-select"
              style={{ width: 180 }}
              value={warehouseFilter}
              onChange={(e) => handleFilterChange('warehouse', e.target.value)}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>

            {/* Category filter */}
            <input
              className="form-input"
              style={{ width: 150 }}
              placeholder="Category…"
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            />

            {/* Refresh */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => fetchInventory()}
              data-tooltip="Refresh"
            >
              <RefreshCw size={15} />
            </button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table card ───────────────────────────────────────── */}
      <div className="card">
        {loading ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>Qty</th>
                  <th>Reserved</th>
                  <th>Reorder Lvl</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <TableSkeleton cols={11} rows={8} />
            </table>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchInventory} />
        ) : inventory.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items"
            message={
              hasActiveFilters
                ? 'No items match your current filters. Try adjusting or clearing them.'
                : 'Get started by adding your first inventory item.'
            }
            action={
              canManage && !hasActiveFilters ? (
                <button className="btn btn-primary" onClick={openAdd}>
                  <Plus size={14} /> Add Item
                </button>
              ) : hasActiveFilters ? (
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Warehouse</th>
                    <th>Qty</th>
                    <th>Reserved</th>
                    <th>Reorder Lvl</th>
                    <th>Unit Price</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const status = item.status ?? deriveStatus(item.quantity, item.reorderLevel);
                    const isLow  = status === 'LOW_STOCK';
                    const isOut  = status === 'OUT_OF_STOCK';
                    return (
                      <tr key={item._id} style={ROW_STYLE[status] ?? {}}>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {item.sku ?? '—'}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium text-strong" style={{ fontSize: 13 }}>
                            {item.productName ?? '—'}
                          </span>
                        </td>
                        <td>{item.category ?? <span className="text-muted">—</span>}</td>
                        <td>
                          {item.warehouse?.name ?? item.warehouseName ?? '—'}
                        </td>
                        {/* Qty — red if 0, yellow if low */}
                        <td>
                          <span
                            className="font-semibold"
                            style={{
                              color: isOut
                                ? 'var(--red)'
                                : isLow
                                ? 'var(--yellow)'
                                : 'var(--text-strong)',
                            }}
                          >
                            {item.quantity ?? 0}
                          </span>
                        </td>
                        <td>{item.reservedQuantity ?? 0}</td>
                        <td>{item.reorderLevel ?? 0}</td>
                        <td>{fmtCurrency(item.unitPrice)}</td>
                        <td>
                          <Badge status={status} />
                        </td>
                        <td className="text-sm text-muted">{fmtDate(item.updatedAt)}</td>
                        <td>
                          <div className="actions-cell">
                            {/* View */}
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              data-tooltip="View details"
                              onClick={() => openView(item)}
                            >
                              <Eye size={14} />
                            </button>

                            {/* Edit */}
                            {canManage && (
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                data-tooltip="Edit item"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}

                            {/* Adjust stock */}
                            {canManage && (
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                data-tooltip="Adjust stock"
                                onClick={() => openAdjust(item)}
                              >
                                <PackagePlus size={14} />
                              </button>
                            )}

                            {/* Delete */}
                            {canDelete && (
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                data-tooltip="Delete item"
                                style={{ color: 'var(--red)' }}
                                onClick={() => setDeleteItem(item)}
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
              </table>
            </div>

            {/* ── Pagination ─────────────────────────────────── */}
            <div className="pagination">
              <span className="pagination-info">
                Showing{' '}
                {Math.min((pagination.page - 1) * PAGE_LIMIT + 1, pagination.total)}–
                {Math.min(pagination.page * PAGE_LIMIT, pagination.total)} of{' '}
                {pagination.total} items
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((p) =>
                    p === 1 ||
                    p === pagination.pages ||
                    Math.abs(p - pagination.page) <= 1
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-btn${pagination.page === p ? ' active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  className="pagination-btn"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          Add / Edit Modal
          ════════════════════════════════════════════════════════ */}
      <Modal
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        title={editItem?._id ? 'Edit Inventory Item' : 'Add Inventory Item'}
        size="lg"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setEditItem(null)}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFormSubmit}
              disabled={formLoading}
            >
              {formLoading && <span className="spinner spinner-sm" />}
              {editItem?._id ? 'Save Changes' : 'Add Item'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} noValidate>
          <div className="grid-2" style={{ gap: 16 }}>

            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">
                Product Name <span className="required">*</span>
              </label>
              <input
                className={`form-input${formErrors.productName ? ' error' : ''}`}
                placeholder="e.g. Industrial Bearing Kit"
                value={form.productName}
                onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              />
              {formErrors.productName && (
                <span className="form-error">{formErrors.productName}</span>
              )}
            </div>

            {/* SKU */}
            <div className="form-group">
              <label className="form-label">
                SKU <span className="required">*</span>
              </label>
              <input
                className={`form-input${formErrors.sku ? ' error' : ''}`}
                placeholder="e.g. IBK-2024-001"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
              {formErrors.sku && (
                <span className="form-error">{formErrors.sku}</span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                className="form-input"
                placeholder="e.g. Mechanical Parts"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>

            {/* Warehouse */}
            <div className="form-group">
              <label className="form-label">
                Warehouse <span className="required">*</span>
              </label>
              <select
                className={`form-select${formErrors.warehouse ? ' error' : ''}`}
                value={form.warehouse}
                onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))}
              >
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
              {formErrors.warehouse && (
                <span className="form-error">{formErrors.warehouse}</span>
              )}
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                min="0"
                className={`form-input${formErrors.quantity ? ' error' : ''}`}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
              {formErrors.quantity && (
                <span className="form-error">{formErrors.quantity}</span>
              )}
            </div>

            {/* Reserved Quantity */}
            <div className="form-group">
              <label className="form-label">Reserved Quantity</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={form.reservedQuantity}
                onChange={(e) => setForm((f) => ({ ...f, reservedQuantity: e.target.value }))}
              />
            </div>

            {/* Reorder Level */}
            <div className="form-group">
              <label className="form-label">Reorder Level</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={form.reorderLevel}
                onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
              />
            </div>

            {/* Max Stock */}
            <div className="form-group">
              <label className="form-label">Max Stock</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 1000"
                value={form.maxStock}
                onChange={(e) => setForm((f) => ({ ...f, maxStock: e.target.value }))}
              />
            </div>

            {/* Unit Price */}
            <div className="form-group">
              <label className="form-label">
                Unit Price (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`form-input${formErrors.unitPrice ? ' error' : ''}`}
                placeholder="0.00"
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
              />
              {formErrors.unitPrice && (
                <span className="form-error">{formErrors.unitPrice}</span>
              )}
            </div>

            {/* Supplier */}
            <div className="form-group">
              <label className="form-label">Supplier</label>
              <select
                className="form-select"
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              >
                <option value="">None</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

          </div>
        </form>
      </Modal>

      {/* ════════════════════════════════════════════════════════
          Stock Adjustment Modal
          ════════════════════════════════════════════════════════ */}
      <Modal
        open={adjustItem !== null}
        onClose={() => setAdjustItem(null)}
        title="Adjust Stock"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setAdjustItem(null)}
              disabled={adjustLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAdjustSubmit}
              disabled={adjustLoading}
            >
              {adjustLoading && <span className="spinner spinner-sm" />}
              Apply Adjustment
            </button>
          </>
        }
      >
        {adjustItem && (
          <form onSubmit={handleAdjustSubmit} noValidate>
            {/* Summary */}
            <div
              className="flex items-center gap-3"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                marginBottom: 20,
              }}
            >
              <Package size={18} color="var(--primary)" />
              <div>
                <div className="font-semibold text-strong" style={{ fontSize: 13 }}>
                  {adjustItem.productName}
                </div>
                <div className="text-sm text-muted">
                  SKU: {adjustItem.sku} &nbsp;·&nbsp; Current qty:{' '}
                  <span className="font-medium" style={{ color: 'var(--text-strong)' }}>
                    {adjustItem.quantity ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity change */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">
                Quantity Change <span className="required">*</span>
              </label>
              <input
                type="number"
                className={`form-input${adjustErrors.quantityChange ? ' error' : ''}`}
                placeholder="e.g. +50 or -10"
                value={adjustForm.quantityChange}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, quantityChange: e.target.value }))
                }
              />
              {adjustErrors.quantityChange ? (
                <span className="form-error">{adjustErrors.quantityChange}</span>
              ) : (
                <span className="form-hint">
                  Positive to add stock, negative to remove.
                  {adjustForm.quantityChange !== '' && !isNaN(Number(adjustForm.quantityChange)) && (
                    <> New qty will be{' '}
                      <strong>
                        {(adjustItem.quantity ?? 0) + Number(adjustForm.quantityChange)}
                      </strong>.
                    </>
                  )}
                </span>
              )}
            </div>

            {/* Reason */}
            <div className="form-group">
              <label className="form-label">
                Reason <span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea${adjustErrors.reason ? ' error' : ''}`}
                placeholder="e.g. Received shipment from supplier, damaged goods removed…"
                rows={3}
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
              {adjustErrors.reason && (
                <span className="form-error">{adjustErrors.reason}</span>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* ════════════════════════════════════════════════════════
          View Detail Modal
          ════════════════════════════════════════════════════════ */}
      <Modal
        open={viewItem !== null}
        onClose={() => setViewItem(null)}
        title="Item Details"
        size="lg"
        footer={
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setViewItem(null); openAdjust(viewItem); }}
                >
                  <PackagePlus size={14} /> Adjust Stock
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setViewItem(null); openEdit(viewItem); }}
                >
                  <Pencil size={14} /> Edit
                </button>
              </>
            )}
            <button className="btn btn-primary" onClick={() => setViewItem(null)}>
              Close
            </button>
          </div>
        }
      >
        {viewItem && (
          <>
            {/* Status header */}
            <div
              className="flex items-center gap-3"
              style={{ marginBottom: 24 }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Package size={20} color="var(--primary)" />
              </div>
              <div>
                <div className="font-semibold text-strong" style={{ fontSize: 16 }}>
                  {viewItem.productName ?? '—'}
                </div>
                <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {viewItem.sku}
                  </span>
                  <Badge
                    status={
                      viewItem.status ??
                      deriveStatus(viewItem.quantity, viewItem.reorderLevel)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-field">
                <div className="detail-label">Category</div>
                <div className="detail-value">{viewItem.category ?? '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Warehouse</div>
                <div className="detail-value">
                  {viewItem.warehouse?.name ?? viewItem.warehouseName ?? '—'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Quantity</div>
                <div
                  className="detail-value"
                  style={{
                    color:
                      (viewItem.quantity ?? 0) <= 0
                        ? 'var(--red)'
                        : (viewItem.quantity ?? 0) <=
                          (viewItem.reorderLevel ?? 0)
                        ? 'var(--yellow)'
                        : 'var(--text-strong)',
                  }}
                >
                  {viewItem.quantity ?? 0}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Reserved</div>
                <div className="detail-value">{viewItem.reservedQuantity ?? 0}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Reorder Level</div>
                <div className="detail-value">{viewItem.reorderLevel ?? 0}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Max Stock</div>
                <div className="detail-value">{viewItem.maxStock ?? '—'}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Unit Price</div>
                <div className="detail-value">{fmtCurrency(viewItem.unitPrice)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Total Value</div>
                <div className="detail-value">
                  {fmtCurrency((viewItem.quantity ?? 0) * (viewItem.unitPrice ?? 0))}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Supplier</div>
                <div className="detail-value">
                  {viewItem.supplier?.name ?? '—'}
                </div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Created</div>
                <div className="detail-value">{fmtDate(viewItem.createdAt)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Last Updated</div>
                <div className="detail-value">{fmtDate(viewItem.updatedAt)}</div>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ════════════════════════════════════════════════════════
          Delete Confirm Dialog
          ════════════════════════════════════════════════════════ */}
      <ConfirmDialog
        open={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Inventory Item"
        message={
          deleteItem
            ? `Are you sure you want to delete "${deleteItem.productName}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Item"
        variant="danger"
      />
    </div>
  );
}
