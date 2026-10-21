import { useState, useEffect, useCallback } from 'react';
import { Activity, LayoutList, TableProperties } from 'lucide-react';
import { activityApi } from '../../services/activityApi';
import Badge from '../../components/Badge';
import { ErrorState, EmptyState, TableSkeleton } from '../../components/StateComponents';

const ENTITY_TYPES = ['', 'USER', 'WAREHOUSE', 'INVENTORY', 'SUPPLIER', 'SHIPMENT', 'STOCK_MOVEMENT'];
const ACTION_OPTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STATUS_CHANGE', 'MARK_READ'];
const LIMIT = 20;

/** Returns a relative time string like "2 hours ago" */
function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60)        return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)          return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30)           return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12)         return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? 's' : ''} ago`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** User avatar with initials */
function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Deterministic hue from name
  let hue = 200;
  for (let i = 0; i < (name || '').length; i++) hue = (hue + (name || '').charCodeAt(i) * 17) % 360;

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `hsl(${hue}, 60%, 50%)`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/** Colorize action labels */
function ActionBadge({ action }) {
  const colorMap = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN:  'purple',
    LOGOUT: 'gray',
    STATUS_CHANGE: 'yellow',
    MARK_READ: 'gray',
  };
  const color = colorMap[action] || 'gray';
  return <span className={`badge badge-${color}`}>{(action || '').replace(/_/g, ' ')}</span>;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'table'

  const [filters, setFilters] = useState({ entity: '', action: '' });
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async (currentPage = 1, currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(currentFilters.entity && { entity: currentFilters.entity }),
        ...(currentFilters.action && { action: currentFilters.action }),
      };
      const res = await activityApi.getAll(params);
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(page, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function handleApplyFilters(e) {
    e.preventDefault();
    setPage(1);
    fetchLogs(1, filters);
  }

  function handleResetFilters() {
    const reset = { entity: '', action: '' };
    setFilters(reset);
    setPage(1);
    fetchLogs(1, reset);
  }

  const hasActiveFilters = filters.entity || filters.action;
  const startItem = (pagination.page - 1) * LIMIT + 1;
  const endItem   = Math.min(pagination.page * LIMIT, pagination.total);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Track all actions performed in the system</p>
        </div>
        {/* View toggle */}
        <div className="page-actions">
          <button
            className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('timeline')}
          >
            <LayoutList size={14} /> Timeline
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('table')}
          >
            <TableProperties size={14} /> Table
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <form onSubmit={handleApplyFilters}>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ minWidth: 160, flex: '1 1 150px' }}>
                <label className="form-label">Entity Type</label>
                <select
                  className="form-select"
                  name="entity"
                  value={filters.entity}
                  onChange={handleFilterChange}
                >
                  {ENTITY_TYPES.map((e) => (
                    <option key={e} value={e}>{e || 'All Entities'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ minWidth: 160, flex: '1 1 150px' }}>
                <label className="form-label">Action</label>
                <select
                  className="form-select"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                >
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a ? a.replace(/_/g, ' ') : 'All Actions'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ justifyContent: 'flex-end', marginTop: 'auto' }}>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Apply
                  </button>
                  {hasActiveFilters && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Content Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Activity size={16} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--primary)' }} />
            Activity
            {pagination.total > 0 && (
              <span className="text-muted font-medium text-sm" style={{ marginLeft: 8 }}>
                ({pagination.total.toLocaleString('en-IN')})
              </span>
            )}
          </span>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => fetchLogs(page, filters)} />
        ) : viewMode === 'timeline' ? (
          /* ── Timeline View ── */
          <div className="card-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
                      <div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                title="No activity found"
                message={
                  hasActiveFilters
                    ? 'No activity matches the selected filters.'
                    : 'No activity has been recorded yet.'
                }
              />
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Vertical line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 17,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: 'var(--border)',
                    borderRadius: 2,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {logs.map((log, idx) => {
                    const isLast = idx === logs.length - 1;
                    return (
                      <div
                        key={log._id || idx}
                        style={{
                          display: 'flex',
                          gap: 16,
                          paddingBottom: isLast ? 0 : 20,
                          position: 'relative',
                        }}
                      >
                        {/* Avatar over the line */}
                        <div style={{ zIndex: 1, flexShrink: 0 }}>
                          <Avatar name={log.user?.name} />
                        </div>

                        {/* Content */}
                        <div
                          style={{
                            flex: 1,
                            background: 'var(--bg)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '10px 14px',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2" style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold" style={{ fontSize: 13, color: 'var(--text-strong)' }}>
                                {log.user?.name || 'System'}
                              </span>
                              {log.user?.role && <Badge status={log.user.role} />}
                            </div>
                            <span
                              className="text-xs text-muted"
                              title={formatDateTime(log.createdAt)}
                            >
                              {relativeTime(log.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                            <ActionBadge action={log.action} />
                            {log.entity && (
                              <span className="badge badge-gray" style={{ fontSize: 11 }}>
                                {log.entity.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>

                          {log.description && (
                            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                              {log.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Table View ── */
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                  </tr>
                </thead>

                {loading ? (
                  <TableSkeleton cols={6} rows={8} />
                ) : logs.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="No activity found"
                          message={
                            hasActiveFilters
                              ? 'No activity matches the selected filters.'
                              : 'No activity has been recorded yet.'
                          }
                        />
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log._id || idx}>
                        <td className="text-sm" style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          <div>{formatDate(log.createdAt)}</div>
                          <div className="text-xs">{relativeTime(log.createdAt)}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={log.user?.name} />
                            <span className="font-medium" style={{ color: 'var(--text-strong)', fontSize: 13 }}>
                              {log.user?.name || '—'}
                            </span>
                          </div>
                        </td>
                        <td>{log.user?.role ? <Badge status={log.user.role} /> : '—'}</td>
                        <td><ActionBadge action={log.action} /></td>
                        <td>
                          {log.entity ? (
                            <span className="badge badge-gray">{log.entity.replace(/_/g, ' ')}</span>
                          ) : '—'}
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          <span style={{ fontSize: 13, lineHeight: 1.4 }}>
                            {log.description || <span className="text-muted">—</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {startItem}–{endItem} of {pagination.total.toLocaleString('en-IN')} entries
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
      </div>
    </div>
  );
}
