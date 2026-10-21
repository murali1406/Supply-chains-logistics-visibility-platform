import { X, AlertTriangle, Trash2 } from "lucide-react";

// ─── Modal base ──────────────────────────────────────────────
export const Modal = ({ open, onClose, title, size = "", children, footer }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? `modal-${size}` : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  variant = "danger",
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: "center", padding: "32px 24px" }}>
          <div className={`confirm-icon confirm-icon-${variant}`}>
            {variant === "danger" ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn btn-${variant === "danger" ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
