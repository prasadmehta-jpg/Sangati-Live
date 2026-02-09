import { type CSSProperties, type ReactNode, useState } from 'react';
import type { Role } from '../types/domain';

export type PageId =
  | 'dashboard'
  | 'zones'
  | 'nudges'
  | 'signals'
  | 'decisions'
  | 'audit'
  | 'settings';

interface NavItem {
  id: PageId;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u25A6' },
  { id: 'zones', label: 'Zones', icon: '\u25A1' },
  { id: 'nudges', label: 'Nudges', icon: '\u25B6' },
  { id: 'signals', label: 'Signals', icon: '\u25CE' },
  { id: 'decisions', label: 'Decisions', icon: '\u2699' },
  { id: 'audit', label: 'Audit Log', icon: '\u2630' },
  { id: 'settings', label: 'Settings', icon: '\u2638' },
];

const ROLES: { id: Role; label: string }[] = [
  { id: 'server', label: 'Server' },
  { id: 'manager', label: 'Manager' },
  { id: 'owner', label: 'Owner' },
];

interface AppShellProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  children: ReactNode;
}

const s: Record<string, CSSProperties> = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 200,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  brand: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid var(--border)',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--accent)',
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: 11,
    color: 'var(--muted)',
    marginTop: 2,
  },
  nav: {
    flex: 1,
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    fontSize: 13,
    color: 'var(--muted)',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'var(--font-sans)',
    transition: 'background 0.1s, color 0.1s',
    borderRadius: 0,
  },
  navItemActive: {
    color: 'var(--text)',
    background: 'var(--surface2)',
    borderLeft: '2px solid var(--accent)',
  },
  rolePicker: {
    padding: '12px 16px',
    borderTop: '1px solid var(--border)',
  },
  roleLabel: {
    fontSize: 10,
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 6,
  },
  roleGroup: {
    display: 'flex',
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    padding: '4px 0',
    fontSize: 11,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
  },
  roleBtnActive: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: 'var(--bg)',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topbar: {
    height: 48,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    flexShrink: 0,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--success)',
    display: 'inline-block',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'var(--muted)',
  },
  content: {
    flex: 1,
    padding: 20,
    maxWidth: 1280,
    width: '100%',
    margin: '0 auto',
    overflowY: 'auto',
  },
};

export function AppShell({
  activePage,
  onNavigate,
  role,
  onRoleChange,
  children,
}: AppShellProps) {
  const currentNav = NAV_ITEMS.find((n) => n.id === activePage);
  const [wsStatus] = useState<'connected' | 'disconnected'>('connected');

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandName}>Sangati</div>
          <div style={s.brandSub}>by Intuiserve</div>
        </div>

        <nav style={s.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              style={{
                ...s.navItem,
                ...(activePage === item.id ? s.navItemActive : {}),
              }}
              onClick={() => onNavigate(item.id)}
            >
              <span style={{ width: 16, textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={s.rolePicker}>
          <div style={s.roleLabel}>View as</div>
          <div style={s.roleGroup}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                style={{
                  ...s.roleBtn,
                  ...(role === r.id ? s.roleBtnActive : {}),
                }}
                onClick={() => onRoleChange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={s.main}>
        <header style={s.topbar}>
          <span style={s.pageTitle}>{currentNav?.label || 'Dashboard'}</span>
          <span style={s.statusText}>
            <span
              style={{
                ...s.statusDot,
                background:
                  wsStatus === 'connected'
                    ? 'var(--success)'
                    : 'var(--danger)',
              }}
            />
            {wsStatus === 'connected' ? 'Live' : 'Reconnecting...'}
          </span>
        </header>
        <main style={s.content}>{children}</main>
      </div>
    </div>
  );
}
