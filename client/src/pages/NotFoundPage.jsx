import { Link } from "react-router-dom";
import { TrendingUp, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        background: "var(--bg)",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <TrendingUp size={28} color="#fff" />
      </div>
      <h1 style={{ fontSize: 80, fontWeight: 800, color: "var(--border-strong)", lineHeight: 1, margin: 0 }}>
        404
      </h1>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
        Page Not Found
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 360 }}>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
    </div>
  );
}
