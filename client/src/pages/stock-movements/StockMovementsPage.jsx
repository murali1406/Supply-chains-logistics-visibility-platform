import { useState, useEffect, useCallback } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, SlidersHorizontal, Filter } from 'lucide-react';
import { stockMovementApi } from '../../services/stockMovementApi';
import { warehouseApi } from '../../services/warehouseApi';
import Badge from '../../components/Badge';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/StateComponents';

const MOVEMENT_TYPES = ['', 'INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT'];
const LIMIT = 20;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function MovementIcon({ type }) {
  const props = { size: 14, style: { flexShrink: 0 } };
  switch (type) {
    case 'INBOUND':     return <ArrowDownCircle  {...props} color="var(--green)"  />;
    case 'OUTBOUND':    return <ArrowUpCircle     {...props} color="var(--orange)" />;
    case 'TRANSFER':    return <ArrowLeftRight    {...props} color="var(--blue)"   />;
    case 'ADJUSTMENT':  return <SlidersHorizontal {...props} color="var(--purple)" />;
    default:            return null;
  }
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [warehouses, setWarehouses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    warehouse: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);

  // Load warehouse list for filter dropdown
  useEffect(() => {
    warehouseApi.getAll().then((res) => {
      setWarehouses(res.data?.warehouses || res.data || []);
    }).catch(() => {});
  }, []);

  const fetchMovements = useCallback(async (currentPage = 1, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(currentFilters.type      && { type:      currentFilters.type }),
        ...(currentFilters.warehouse && { warehouse:  currentFilters.warehouse }),
        ...(currentFilters.startDate && { startDate:  currentFilters.startDate }),
        ...(currentFilters.endDate   && { endDate:    currentFilters.endDate }),
      };
      const res = await stockMovementApi.getAll(params);
      setMovements(res.data?.movements || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load stock movements.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMovements(page, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleApplyFilters(e) {
    e.preventDefault();
    setPage(1);
    fetchMovements(1, filters);
  }

  function handleResetFilters() {
    const reset = { type: '', warehouse: '', startDate: '', endDate: '' };
    setFilters(reset);
    setPage(1);
    fetchMovements(1, reset);
  }

  const hasActiveFilters = filters.type || filters.warehouse || filters.startDate || filters.endDate;

  const startItem = (pagination.page - 1) * LIMIT + 1;
  const endItem   = Math.min(pagination.page * LIMIT, pagination.total);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Stock Movements</h1>
          <p className="page-subtitle">
            View all inventory movements — inbound, outbound, transfers and adjustments
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <form onSubmit={handleApplyFilters}>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              {/* Type filter */}
              <div className="form-group" style={{ minWidth: 150, flex: '1 1 140px' }}>
                <label className="form-label">Movement Type</label>
                <select
                  className="form-select"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  {MOVEMENT_TYPES.filter(Boolean).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Warehouse filter */}
              <div className="form-group" style={{ minWidth: 170, flex: '1 1 160px' }}>
                <label className="form-label">Warehouse</label>
                <select
                  className="form-select"
                  name="warehouse"
                  value={filters.warehouse}
                  onChange={handleFilterChange}
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.code ? `${w.code} – ${w.name}` : w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="form-group" style={{ minWidth: 150, flex: '1 1 140px' }}>
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-input"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>

              {/* End Date */}
              <div className="form-group" style={{ minWidth: 150, flex: '1 1 140px' }}>
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-input"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>

              {/* Actions */}
              <div className="form-group" style={{ justifyContent: 'flex-end', marginTop: 'auto' }}>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Filter size={13} /> Apply
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleResetFilters}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Movements
            {pagination.total > 0 && (
              <span className="text-muted font-medium text-sm" style={{ marginLeft: 8 }}>
                ({pagination.total.toLocaleString('en-IN')})
              </span>
            )}
          </span>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => fetchMovements(page, filters)} />
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Product (SKU)</th>
                    <th>Warehouse</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Prev Qty</th>
                    <th style={{ textAlign: 'right' }}>New Qty</th>
                    <th>Reason</th>
                    <th>Performed By</th>
                  </tr>
                </thead>

                {loading ? (
                  <TableSkeleton cols={9} rows={8} />
                ) : movements.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          title="No movements found"
                          message={
                            hasActiveFilters
                              ? 'No stock movements match the selected filters. Try adjusting or resetting them.'
                              : 'No stock movements have been recorded yet.'
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {movements.map((mv, idx) => (
                      <tr key={mv._id || idx}>
                        <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>
                          {formatDate(mv.createdAt)}
                        </td>
                        <td>
                          <span className="flex items-center gap-1">
                            <MovementIcon type={mv.type} />
                            <Badge status={mv.type} />
                          </span>
                        </td>
                        <td>
                          <div className="font-medium text-strong" style={{ fontSize: 13 }}>
                            {mv.inventory?.productName || '—'}
                          </div>
                          {mv.inventory?.sku && (
                            <div className="text-xs text-muted">{mv.inventory.sku}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>
                            {mv.warehouse?.name || '—'}
                          </div>
                          {mv.warehouse?.code && (
                            <div className="text-xs text-muted">{mv.warehouse.code}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          <span
                            style={{
                              color:
                                mv.type === 'INBOUND'
                                  ? 'var(--green)'
                                  : mv.type === 'OUTBOUND'
                                  ? 'var(--orange)'
                                  : mv.type === 'ADJUSTMENT' && mv.quantity < 0
                                  ? 'var(--red)'
                                  : 'var(--text-strong)',
                            }}
                          >
                            {mv.type === 'OUTBOUND' ? '-' : mv.type === 'ADJUSTMENT' && mv.quantity < 0 ? '' : '+'}
                            {Math.abs(mv.quantity ?? 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {mv.previousQuantity != null ? mv.previousQuantity.toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--text-strong)' }}>
                          {mv.newQuantity != null ? mv.newQuantity.toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={{ maxWidth: 180 }}>
                          <span className="truncate" style={{ display: 'block', fontSize: 13 }}>
                            {mv.reason || <span className="text-muted">—</span>}
                          </span>
                        </td>
                        <td>
                          {mv.performedBy?.name || <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {/* Pagination */}
            {!loading && pagination.total > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  Showing {startItem}–{endItem} of {pagination.total.toLocaleString('en-IN')} movements
                </span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === '...' ? (
                        <span key={`ellipsis-${i}`} className="pagination-btn" style={{ cursor: 'default', border: 'none' }}>
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          className={`pagination-btn${item === page ? ' active' : ''}`}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    className="pagination-btn"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
