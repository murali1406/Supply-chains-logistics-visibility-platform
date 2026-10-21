import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/authApi';

// ─── SVG Icons ───────────────────────────────────────────────
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
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Validation ───────────────────────────────────────────────
function validate(fields) {
  const errs = {};

  if (!fields.name.trim()) {
    errs.name = 'Full name is required';
  } else if (fields.name.trim().length < 2) {
    errs.name = 'Name must be at least 2 characters';
  }

  if (!fields.email.trim()) {
    errs.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errs.email = 'Enter a valid email address';
  }

  if (fields.phone && fields.phone.trim()) {
    const cleaned = fields.phone.replace(/[\s-]/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      errs.phone = 'Phone number must be between 10 and 15 digits';
    }
  }

  if (!fields.password) {
    errs.password = 'Password is required';
  } else if (fields.password.length < 8) {
    errs.password = 'Password must be at least 8 characters';
  } else if (!/[A-Z]/.test(fields.password)) {
    errs.password = 'Password must contain at least one uppercase letter';
  } else if (!/[0-9]/.test(fields.password)) {
    errs.password = 'Password must contain at least one number';
  }

  if (!fields.confirmPassword) {
    errs.confirmPassword = 'Confirm password is required';
  } else if (fields.confirmPassword !== fields.password) {
    errs.confirmPassword = 'Passwords do not match';
  }

  return errs;
}

// ─── Password strength helper ─────────────────────────────────
function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))       score++;
  if (/[0-9]/.test(pw))       score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;  // 0-4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#dc2626', '#ca8a04', '#2563eb', '#16a34a'];

// ─── Component ────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(fields.password);

  const handleChange = (key) => (e) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    if (apiError)    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const errs = validate(fields);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await authApi.register({
        name:            fields.name.trim(),
        email:           fields.email.trim(),
        phone:           fields.phone.trim() || undefined,
        password:        fields.password,
        confirmPassword: fields.confirmPassword,
      });
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Account created successfully! Please sign in with your credentials.' },
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
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
            Join the future of supply chain management
          </h1>
          <p className="auth-brand-sub">
            Get instant access to real-time inventory tracking, shipment management, and powerful analytics built for logistics professionals.
          </p>

          {/* Benefit list */}
          <div className="auth-benefits">
            {[
              'Live inventory across multiple warehouses',
              'Automated low-stock alerts & notifications',
              'Supplier & shipment lifecycle management',
              'Role-based access for your entire team',
              'Comprehensive audit trail & reporting',
            ].map((item) => (
              <div key={item} className="auth-benefit-item">
                <div className="auth-benefit-check">
                  <IconCheck />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="auth-brand-footer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Enterprise-grade security · Role-based access control</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-logo-icon auth-logo-icon--sm">
              <IconTruck />
            </div>
            <span className="auth-logo-text">LogiTrack</span>
          </div>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-subtitle">Fill in the details below to get started</p>
          </div>

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
            {/* Full name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Full name <span className="required">*</span>
              </label>
              <input
                id="reg-name"
                type="text"
                className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="Jane Smith"
                value={fields.name}
                onChange={handleChange('name')}
                autoComplete="name"
                disabled={loading}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email address <span className="required">*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className={`form-input${errors.email ? ' error' : ''}`}
                placeholder="jane@company.com"
                value={fields.email}
                onChange={handleChange('email')}
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Phone number <span className="text-muted" style={{ fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                className={`form-input${errors.phone ? ' error' : ''}`}
                placeholder="+91 98765 43210"
                value={fields.phone}
                onChange={handleChange('phone')}
                autoComplete="tel"
                disabled={loading}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password <span className="required">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' error' : ''}`}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  value={fields.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
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

              {/* Strength meter */}
              {fields.password && !errors.password && (
                <div className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="auth-strength-bar"
                        style={{
                          background: n <= strength ? STRENGTH_COLORS[strength] : 'var(--border)',
                          transition: 'background 0.25s ease',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="auth-strength-label"
                    style={{ color: STRENGTH_COLORS[strength] }}
                  >
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm-password">
                Confirm password <span className="required">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPass ? 'text' : 'password'}
                  className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                  placeholder="Re-enter your password"
                  value={fields.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-toggle-pass"
                  onClick={() => setShowConfirmPass((v) => !v)}
                  aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              <span className="form-hint">
                New accounts are registered with standard operational user access.
              </span>
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
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
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
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .auth-brand-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          margin-bottom: 36px;
        }

        /* Benefits */
        .auth-benefits {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 40px;
        }

        .auth-benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          line-height: 1.4;
        }

        .auth-benefit-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.25);
          border: 1px solid rgba(34, 197, 94, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4ade80;
          flex-shrink: 0;
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
          margin-bottom: 28px;
          color: var(--text-heading);
        }

        @media (min-width: 900px) {
          .auth-mobile-logo { display: none; }
        }

        .auth-form-header {
          margin-bottom: 24px;
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
          gap: 16px;
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

        /* Strength meter */
        .auth-strength {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .auth-strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .auth-strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 99px;
        }

        .auth-strength-label {
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          min-width: 40px;
          text-align: right;
        }

        /* Submit btn */
        .auth-submit-btn {
          margin-top: 4px;
          height: 44px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

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
