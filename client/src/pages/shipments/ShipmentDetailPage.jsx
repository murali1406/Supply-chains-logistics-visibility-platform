import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Package, Building2, Warehouse, MapPin,
  Calendar, Clock, CheckCircle, RefreshCw, Trash2
} from 'lucide-react';
import { shipmentApi } from '../../services/shipmentApi';
import Badge from '../../components/Badge';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/StateComponents';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const VALID_TRANSITIONS = {
  PENDING:          ['PICKED_UP', 'CANCELLED'],
  PICKED_UP:        ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isManager, isAdmin } = useAuth();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Change Modal
  const [statusOpen, setStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchShipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await shipmentApi.getById(id);
      setShipment(res.data?.shipment || res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load purchase order / shipment details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  const handleStatusUpdate = async () => {
    if (!targetStatus) return;
    setUpdatingStatus(true);
    try {
      await shipmentApi.updateStatus(id, targetStatus);
      toast.success('Status updated', `Order status updated to ${targetStatus}`);
      setStatusOpen(false);
      fetchShipment();
    } catch (err) {
      toast.error('Status update failed', err?.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await shipmentApi.delete(id);
      toast.success('Order deleted', 'Purchase order was successfully removed.');
      navigate('/shipments');
    } catch (err) {
      toast.error('Delete failed', err?.response?.data?.message || 'Could not delete order');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState message="Loading order details..." />;
  if (error) return <ErrorState message={error} onRetry={fetchShipment} />;
  if (!shipment) return <EmptyState title="Order not found" message="This purchase order could not be located." />;

  const allowedNextStatuses = VALID_TRANSITIONS[shipment.status] || [];

  const fullDest = [
    shipment.destination?.address,
    shipment.destination?.city,
    shipment.destination?.state,
    shipment.destination?.postalCode,
    shipment.destination?.country
  ].filter(Boolean).join(', ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 8, paddingLeft: 0 }}
            onClick={() => navigate('/shipments')}
          >
            <ArrowLeft size={16} /> Back to Purchase Orders
          </button>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{shipment.shipmentNumber}</h1>
            <Badge status={shipment.status} />
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
              Tracking: {shipment.trackingNumber}
            </span>
          </div>
          <p className="page-subtitle">
            Carrier: <strong>{shipment.carrier}</strong> | Created: {fmtDate(shipment.createdAt)}
          </p>
        </div>

        <div className="page-actions">
          {isManager && allowedNextStatuses.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setTargetStatus(allowedNextStatuses[0]);
                setStatusOpen(true);
              }}
            >
              <RefreshCw size={15} /> Update Status
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={15} /> Delete Order
            </button>
          )}
        </div>
      </div>

      {/* Grid of Info Cards */}
      <div className="grid-3">
        {/* Logistics & Supplier Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Building2 size={16} color="var(--primary)" /> Supplier & Partner
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-field">
              <div className="detail-label">Supplier Company</div>
              <div className="detail-value font-semibold">
                {shipment.supplier?.companyName || shipment.supplier?.name || '—'}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Supplier Contact</div>
              <div className="detail-value text-sm">{shipment.supplier?.email || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Designated Carrier</div>
              <div className="detail-value text-sm flex items-center gap-2">
                <Truck size={15} color="var(--primary)" /> {shipment.carrier || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse Destination */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Warehouse size={16} color="var(--primary)" /> Destination Warehouse
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-field">
              <div className="detail-label">Target Warehouse</div>
              <div className="detail-value font-semibold">
                {shipment.warehouse?.name || '—'} ({shipment.warehouse?.code || '—'})
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Warehouse City</div>
              <div className="detail-value text-sm">{shipment.warehouse?.location?.city || '—'}</div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Delivery Address</div>
              <div className="detail-value text-sm flex items-start gap-2">
                <MapPin size={15} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{fullDest || 'Warehouse address'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Schedule */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Calendar size={16} color="var(--primary)" /> Schedule & Timeline
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="detail-field">
              <div className="detail-label">Shipping Date</div>
              <div className="detail-value text-sm flex items-center gap-2">
                <Clock size={14} color="var(--text-muted)" /> {fmtDate(shipment.shippingDate)}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Estimated Delivery</div>
              <div className="detail-value text-sm font-semibold flex items-center gap-2">
                <Clock size={14} color="var(--yellow)" /> {fmtDate(shipment.estimatedDelivery)}
              </div>
            </div>
            <div className="detail-field">
              <div className="detail-label">Actual Delivery</div>
              <div className="detail-value text-sm flex items-center gap-2">
                {shipment.actualDelivery ? (
                  <>
                    <CheckCircle size={14} color="var(--green)" /> {fmtDate(shipment.actualDelivery)}
                  </>
                ) : (
                  <span className="text-muted">Pending delivery</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Package size={16} color="var(--primary)" /> Order Items ({shipment.items?.length || 0})
          </span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product / Item</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Current Stock</th>
              </tr>
            </thead>
            <tbody>
              {(!shipment.items || shipment.items.length === 0) ? (
                <tr>
                  <td colSpan={4}>
                    <div style={{ padding: '24px 0', textAlign: 'center' }} className="text-muted text-sm">
                      No items listed in this purchase order.
                    </div>
                  </td>
                </tr>
              ) : (
                shipment.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium text-strong">
                      {item.inventory?.productName || item.inventory?.name || (typeof item.inventory === 'string' ? item.inventory : 'Item')}
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold">
                        {item.inventory?.sku || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue font-semibold" style={{ fontSize: 13, padding: '4px 10px' }}>
                        {item.quantity} units
                      </span>
                    </td>
                    <td>
                      {item.inventory?.quantity != null ? (
                        <span className="text-sm">{item.inventory.quantity} in warehouse</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Section */}
      {shipment.notes && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Order Notes</span>
          </div>
          <div className="card-body">
            <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.6 }}>
              {shipment.notes}
            </p>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <Modal
        open={statusOpen}
        onClose={() => !updatingStatus && setStatusOpen(false)}
        title={`Update Status — ${shipment.shipmentNumber}`}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStatusOpen(false)} disabled={updatingStatus}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updatingStatus || !targetStatus}>
              {updatingStatus && <span className="spinner spinner-sm" />}
              Confirm Status
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Current Status: <Badge status={shipment.status} />
          </p>
          <div className="form-group">
            <label className="form-label">Next Status</label>
            <select
              className="form-select"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
            >
              {allowedNextStatuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          {targetStatus === 'DELIVERED' && (
            <p className="text-xs" style={{ color: 'var(--green)' }}>
              Marking as DELIVERED will set the actual delivery timestamp to now.
            </p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete order "${shipment.shipmentNumber}"?`}
        confirmText="Delete Order"
        variant="danger"
      />
    </div>
  );
}
