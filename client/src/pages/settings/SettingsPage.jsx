import { User, Globe, Palette, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/Badge';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const APP_VERSION  = '1.0.0';

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex gap-3" style={{ marginBottom: 16 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color="var(--primary)" />
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 2 }}>{title}</h3>
        {description && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{description}</p>}
      </div>
    </div>
  );
}

function InfoRow({ label, value, children }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        gap: 16,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 500, textAlign: 'right' }}>
        {children ?? value ?? '—'}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  // User initials for avatar
  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">View your profile and system configuration</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

        {/* ── Profile Section ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Profile</span>
            <span className="badge badge-gray text-xs">Read-only</span>
          </div>
          <div className="card-body">
            <SectionHeader
              icon={User}
              title="Account Information"
              description="Your profile details as registered in LogiTrack."
            />

            {/* Avatar + name hero */}
            <div
              className="flex items-center gap-4"
              style={{
                padding: '16px 20px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>
                  {user?.name || '—'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {user?.email || '—'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                {user?.role && <Badge status={user.role} />}
              </div>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <InfoRow label="Full Name"    value={user?.name}  />
              <InfoRow label="Email"        value={user?.email} />
              <InfoRow label="Role">
                {user?.role ? <Badge status={user.role} /> : '—'}
              </InfoRow>
              <InfoRow label="Account Status">
                {user?.status ? <Badge status={user.status} /> : <Badge status="ACTIVE" />}
              </InfoRow>
              {joinedDate && (
                <InfoRow label="Member Since" value={joinedDate} />
              )}
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                background: 'var(--yellow-bg)',
                border: '1px solid var(--yellow-border)',
                borderRadius: 'var(--radius)',
                fontSize: 13,
                color: 'var(--yellow)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              Profile editing is not available in this version. Contact your administrator to update account details.
            </div>
          </div>
        </div>

        {/* ── System Info ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">System Information</span>
          </div>
          <div className="card-body">
            <SectionHeader
              icon={Globe}
              title="API & Version"
              description="Runtime configuration for this LogiTrack instance."
            />
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <InfoRow label="Application" value="LogiTrack Supply Chain" />
              <InfoRow label="Version"     value={`v${APP_VERSION}`} />
              <InfoRow label="API Base URL">
                <code
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--bg)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-strong)',
                  }}
                >
                  {API_BASE_URL}
                </code>
              </InfoRow>
              <InfoRow label="Environment">
                <span
                  className={`badge ${import.meta.env.MODE === 'production' ? 'badge-green' : 'badge-yellow'}`}
                >
                  {import.meta.env.MODE || 'development'}
                </span>
              </InfoRow>
            </div>
          </div>
        </div>

        {/* ── Permissions Summary ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Permissions</span>
          </div>
          <div className="card-body">
            <SectionHeader
              icon={ShieldCheck}
              title="Role Capabilities"
              description="Access level for your current role."
            />
            {user?.role ? (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <InfoRow label="Assigned Role">
                  <Badge status={user.role} />
                </InfoRow>
                <InfoRow
                  label="Dashboard Access"
                  value="✓ Allowed"
                />
                <InfoRow
                  label="Inventory Management"
                  value={['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role) ? '✓ Full Access' : '✓ Read Access'}
                />
                <InfoRow
                  label="Supplier Management"
                  value={['ADMIN', 'PROCUREMENT_MANAGER'].includes(user.role) ? '✓ Full Access' : '✓ Read Access'}
                />
                <InfoRow
                  label="Admin Panel"
                  value={user.role === 'ADMIN' ? '✓ Allowed' : '✗ Not Available'}
                />
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Role information unavailable.</p>
            )}
          </div>
        </div>

        {/* ── Appearance Placeholder ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Appearance</span>
            <span className="badge badge-gray text-xs">Coming Soon</span>
          </div>
          <div className="card-body">
            <SectionHeader
              icon={Palette}
              title="Theme & Display"
              description="Customise the look and feel of LogiTrack."
            />
            <div
              style={{
                padding: '24px',
                background: 'var(--bg)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
              }}
            >
              <Palette size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Theme customisation (light / dark mode, accent colours) will be available in a future release.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
