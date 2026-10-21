import { useState, useEffect, useCallback } from 'react';
import { BellOff, CheckCheck, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { notificationApi } from '../../services/notificationApi';
import Badge from '../../components/Badge';
import { ErrorState, EmptyState } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';

const LIMIT = 20;

const SEVERITY_ICONS = {
  INFO:    <Info    size={18} color="var(--blue)"   />,
  WARNING: <AlertTriangle size={18} color="var(--yellow)" />,
  ERROR:   <XCircle   size={18} color="var(--red)"    />,
  SUCCESS: <CheckCircle size={18} color="var(--green)"  />,
};

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60)        return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)        return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)          return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30)           return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const [readFilter, setReadFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async (currentPage = 1, currentFilter = readFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(currentFilter === 'unread' && { isRead: false }),
        ...(currentFilter === 'read'   && { isRead: true }),
      };
      const res = await notificationApi.getAll(params);
      setNotifications(res.data?.notifications || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [readFilter]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page, readFilter);
    fetchUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilterChange(value) {
    setReadFilter(value);
    setPage(1);
    fetchNotifications(1, value);
  }

  async function handleMarkAsRead(id) {
    if (markingId === id) return;
    setMarkingId(id);
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark notification as read');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  const startItem = (pagination.page - 1) * LIMIT + 1;
  const endItem   = Math.min(pagination.page * LIMIT, pagination.total);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="flex items-center gap-2">
            <h1 className="page-title">Notifications</h1>
            {unreadCount > 0 && (
              <span
                className="badge badge-red"
                style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100 }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="page-subtitle">System alerts, stock warnings and activity notifications</p>
        </div>
        <div className="page-actions">
          {unreadCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
            >
              {markingAll ? (
                <span className="spinner spinner-sm" />
              ) : (
                <CheckCheck size={15} />
              )}
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2" style={{ marginBottom: 16 }}>
        {[
          { value: 'all',    label: 'All' },
          { value: 'unread', label: 'Unread' },
          { value: 'read',   label: 'Read' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`btn btn-sm ${readFilter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleFilterChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card">
        {loading ? (
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 'var(--radius)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 12, width: '75%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchNotifications(page, readFilter)} />
        ) : notifications.length === 0 ? (
          <EmptyState
            title={readFilter === 'unread' ? 'No unread notifications' : 'No notifications'}
            message={
              readFilter === 'unread'
                ? "You're all caught up! No unread notifications."
                : 'No notifications have been generated yet.'
            }
            icon={BellOff}
          />
        ) : (
          <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {notifications.map((notif, idx) => {
                const isLast = idx === notifications.length - 1;
                const isUnread = !notif.isRead;
                const severity = notif.type || notif.severity || 'INFO';
                const isMarking = markingId === notif._id;

                return (
                  <li
                    key={notif._id || idx}
                    onClick={() => isUnread && !isMarking && handleMarkAsRead(notif._id)}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '16px 20px',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      background: isUnread ? 'var(--blue-bg)' : 'var(--bg-card)',
                      cursor: isUnread ? 'pointer' : 'default',
                      transition: 'background var(--transition)',
                      position: 'relative',
                    }}
                    title={isUnread ? 'Click to mark as read' : ''}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 7,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: 'var(--blue)',
                        }}
                      />
                    )}

                    {/* Severity icon */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius)',
                        background: isUnread ? 'rgba(255,255,255,0.7)' : 'var(--bg)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isMarking
                        ? <span className="spinner spinner-sm" />
                        : (SEVERITY_ICONS[severity] || SEVERITY_ICONS.INFO)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between gap-2" style={{ marginBottom: 2 }}>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: 13,
                              color: 'var(--text-strong)',
                            }}
                          >
                            {notif.title || 'Notification'}
                          </span>
                          <Badge status={severity} />
                        </div>
                        <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {relativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                        {notif.message || '—'}
                      </p>

                      {isUnread && (
                        <span className="text-xs" style={{ color: 'var(--blue)', marginTop: 4, display: 'inline-block' }}>
                          Click to mark as read
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="pagination">
                <span className="pagination-info">
                  Showing {startItem}–{endItem} of {pagination.total.toLocaleString('en-IN')} notifications
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
