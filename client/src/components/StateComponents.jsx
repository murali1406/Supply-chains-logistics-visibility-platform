import { AlertCircle, Inbox } from "lucide-react";

export const LoadingState = ({ message = "Loading..." }) => (
  <div className="state-container">
    <div className="state-icon state-icon-loading">
      <span className="spinner spinner-lg" />
    </div>
    <p className="state-message">{message}</p>
  </div>
);

export const ErrorState = ({ message = "Something went wrong.", onRetry }) => (
  <div className="state-container">
    <div className="state-icon state-icon-error">
      <AlertCircle size={24} />
    </div>
    <p className="state-title">Error</p>
    <p className="state-message">{message}</p>
    {onRetry && (
      <button className="btn btn-secondary" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);

export const EmptyState = ({ title = "No results found", message = "Nothing to display here.", action, icon: Icon = Inbox }) => (
  <div className="state-container">
    <div className="state-icon state-icon-empty">
      <Icon size={24} />
    </div>
    <p className="state-title">{title}</p>
    <p className="state-message">{message}</p>
    {action}
  </div>
);

// Skeleton row for tables
export const TableSkeleton = ({ cols = 5, rows = 5 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} style={{ padding: "12px 16px" }}>
            <div className="skeleton" style={{ height: 16, width: c === 0 ? "60%" : "80%", borderRadius: 4 }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export default LoadingState;
