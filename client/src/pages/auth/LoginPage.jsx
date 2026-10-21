import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── SVG Icons (inline, no extra deps) ───────────────────────
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconTruck = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBox = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

// ─── Validation ───────────────────────────────────────────────
function validate(email, password) {
  const errs = {};
  if (!email.trim()) {
    errs.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errs.email = 'Enter a valid email address';
  }
  if (!password) {
    errs.password = 'Password is required';
  } else if (password.length < 6) {
    errs.password = 'Password must be at least 6 characters';
  }
  return errs;
}

// ─── Component ────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [loginType, setLoginType] = useState('admin'); // 'admin' | 'user'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [errors, setErrors]       = useState({});
  const [apiError, setApiError]   = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || '');
  const [loading, setLoading]     = useState(false);

  const handleTypeChange = (type) => {
    setLoginType(type);
    setApiError('');
    setErrors({});
    if (type === 'admin') {
      setEmail('admin@logitrack.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@logitrack.com');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');

    const errs = validate(email, password);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const userData = await login(email.trim(), password, loginType);
      if (userData?.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials and try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (loginType === 'admin') {
      setEmail('admin@logitrack.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@logitrack.com');
      setPassword('Admin@123');
    }
    setErrors({});
    setApiError('');
  };

  return (
    <div className="auth-page">
      {/* ── Left brand panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <IconTruck />
            </div>
            <span className="auth-logo-text">LogiTrack</span>
          </div>

          <h1 className="auth-brand-headline">
            Supply chain intelligence at your fingertips
          </h1>
          <p className="auth-brand-sub">
            Track shipments, manage inventory, coordinate warehouses — all in one unified platform built for modern logistics teams.
          </p>

          {/* Feature pills */}
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <IconBox />
              </div>
              <div>
                <div className="auth-feature-title">Real-time Inventory</div>
                <div className="auth-feature-desc">Live stock levels across all warehouses</div>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <IconTruck />
              </div>
              <div>
                <div className="auth-feature-title">Shipment Tracking</div>
                <div className="auth-feature-desc">End-to-end visibility on every delivery</div>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <IconChart />
              </div>
              <div>
                <div className="auth-feature-title">Analytics Dashboard</div>
                <div className="auth-feature-desc">Data-driven insights for smarter decisions</div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <IconShield />
            <span>Enterprise-grade security · Role-based access control</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Mobile logo (hidden on desktop) */}
          <div className="auth-mobile-logo">
            <div className="auth-logo-icon auth-logo-icon--sm">
              <IconTruck />
            </div>
            <span className="auth-logo-text">LogiTrack</span>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Choose your portal and sign in to continue</p>
          </div>

          {/* ── Selectable Options: [ Admin Login ] [ User Login ] ── */}
          <div className="auth-login-selector" role="tablist" aria-label="Login mode selection">
            <button
              type="button"
              role="tab"
              aria-selected={loginType === 'admin'}
              className={`auth-role-btn ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => handleTypeChange('admin')}
            >
              <IconShield />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginType === 'user'}
              className={`auth-role-btn ${loginType === 'user' ? 'active' : ''}`}
              onClick={() => handleTypeChange('user')}
            >
              <IconUser />
              <span>User Login</span>
            </button>
          </div>

          {/* Mode description pill */}
          <div className={`auth-mode-pill auth-mode-pill--${loginType}`}>
            <span className="auth-mode-tag">
              {loginType === 'admin' ? 'Administrator Portal' : 'User Portal'}
            </span>
            <span className="auth-mode-text">
              {loginType === 'admin'
                ? 'Full access to user administration, warehouse analytics & platform controls'
                : 'Access to warehouse inventory, shipments & operational tracking'}
            </span>
          </div>

          {/* Registration success banner */}
          {successMsg && (
            <div className="auth-success-banner" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* API error banner */}
          {apiError && (
            <div className="auth-error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`form-input${errors.email ? ' error' : ''}`}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                }}
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                  }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-toggle-pass"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Signing in…
                </>
              ) : (
                loginType === 'admin' ? 'Sign in as Administrator' : 'Sign in as User'
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="auth-demo-hint">
            <span className="auth-demo-label">Demo {loginType === 'admin' ? 'Admin' : 'User'}</span>
            <button type="button" className="auth-demo-fill" onClick={fillDemo}>
              {loginType === 'admin' ? 'Use admin@logitrack.com / Admin@123' : 'Use staff@logitrack.com / Admin@123'}
            </button>
          </div>

          <div className="divider" />

          <p className="auth-switch-text">
            Don&apos;t have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        /* Page shell */
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          background: var(--bg);
        }

        /* ── Brand panel ── */
        .auth-brand-panel {
          display: none;
          flex: 1;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%);
          position: relative;
          overflow: hidden;
        }

        .auth-brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 20%, rgba(59,130,246,0.25) 0%, transparent 65%),
                      radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.2) 0%, transparent 55%);
          pointer-events: none;
        }

        @media (min-width: 900px) {
          .auth-brand-panel { display: flex; }
        }

        .auth-brand-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 52px;
          max-width: 540px;
          margin: auto;
          gap: 0;
        }

        /* Logo */
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 48px;
        }

        .auth-logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          backdrop-filter: blur(4px);
        }

        .auth-logo-icon--sm {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--primary);
          border: none;
        }

        .auth-logo-text {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .auth-brand-headline {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .auth-brand-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          margin-bottom: 40px;
        }

        /* Features */
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 48px;
        }

        .auth-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .auth-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.9);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .auth-feature-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
        }

        .auth-feature-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          line-height: 1.5;
        }

        .auth-brand-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          border-top: 1px solid rgba(255,255,255,0.12);
          padding-top: 24px;
        }

        /* ── Form panel ── */
        .auth-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #fff;
          min-height: 100vh;
        }

        @media (min-width: 900px) {
          .auth-form-panel {
            min-height: auto;
            max-width: 480px;
            width: 100%;
          }
        }

        .auth-form-inner {
          width: 100%;
          max-width: 400px;
        }

        /* Mobile logo */
        .auth-mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          color: var(--text-heading);
        }

        @media (min-width: 900px) {
          .auth-mobile-logo { display: none; }
        }

        .auth-form-header {
          margin-bottom: 20px;
        }

        /* ── Login Mode Selector ── */
        .auth-login-selector {
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          margin-bottom: 14px;
          border: 1px solid var(--border);
        }

        .auth-role-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-role-btn:hover {
          color: var(--text-heading);
        }

        .auth-role-btn.active {
          background: #ffffff;
          color: var(--primary);
          border-color: rgba(37, 99, 235, 0.2);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        /* ── Mode Pill ── */
        .auth-mode-pill {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 18px;
          border-left: 3px solid;
          background: #f8fafc;
          transition: all 0.2s ease;
        }

        .auth-mode-pill--admin {
          border-left-color: #2563eb;
          background: #eff6ff;
        }

        .auth-mode-pill--user {
          border-left-color: #059669;
          background: #ecfdf5;
        }

        .auth-mode-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auth-mode-pill--admin .auth-mode-tag {
          color: #1d4ed8;
        }

        .auth-mode-pill--user .auth-mode-tag {
          color: #047857;
        }

        .auth-mode-text {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* ── Success banner ── */
        .auth-success-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: var(--radius);
          color: #065f46;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .auth-success-banner svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .auth-form-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-heading);
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .auth-form-subtitle {
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Error banner */
        .auth-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          background: var(--red-bg);
          border: 1px solid var(--red-border);
          border-radius: var(--radius);
          color: var(--red);
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .auth-error-banner svg { flex-shrink: 0; margin-top: 1px; }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Password input wrapper */
        .auth-input-wrap {
          position: relative;
        }

        .auth-input-wrap .form-input {
          padding-right: 40px;
        }

        .auth-toggle-pass {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          border-radius: var(--radius-sm);
          transition: color var(--transition);
          line-height: 1;
        }

        .auth-toggle-pass:hover { color: var(--text-strong); }

        /* Submit btn */
        .auth-submit-btn {
          margin-top: 6px;
          height: 44px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        /* Demo hint */
        .auth-demo-hint {
          margin-top: 20px;
          padding: 12px 14px;
          background: var(--blue-bg);
          border: 1px solid var(--blue-border);
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .auth-demo-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--blue);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .auth-demo-fill {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: var(--primary);
          font-weight: 500;
          padding: 0;
          text-decoration: underline;
          font-family: var(--font);
        }

        .auth-demo-fill:hover { color: var(--primary-hover); }

        /* Switch link */
        .auth-switch-text {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 16px;
        }

        .auth-switch-text a {
          font-weight: 600;
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
