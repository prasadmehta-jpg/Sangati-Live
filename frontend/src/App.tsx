import { useState, useEffect, type CSSProperties } from 'react';
import { useDashboard } from './hooks/useDashboard';
import { AppShell, type PageId } from './ui/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ZonesPage } from './pages/ZonesPage';
import { NudgesPage } from './pages/NudgesPage';
import { SignalsPage } from './pages/SignalsPage';
import { DecisionsPage } from './pages/DecisionsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { wsClient } from './lib/ws';
import type { Role } from './types/domain';

const loadingStyles: Record<string, CSSProperties> = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg)',
    gap: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--accent)',
  },
  sub: {
    fontSize: 13,
    color: 'var(--muted)',
  },
  error: {
    background: 'rgba(229, 83, 75, 0.1)',
    border: '1px solid var(--danger)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 16px',
    color: 'var(--danger)',
    fontSize: 13,
    marginBottom: 16,
  },
};

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [role, setRole] = useState<Role>('owner');
  const { data, error, loading, refresh } = useDashboard(4000);

  // Connect WS on mount, refresh on zone/nudge events
  useEffect(() => {
    wsClient.connect();

    const unsub1 = wsClient.on('zone_updated', () => {
      refresh();
    });
    const unsub2 = wsClient.on('nudge_action', () => {
      refresh();
    });

    return () => {
      unsub1();
      unsub2();
      wsClient.disconnect();
    };
  }, [refresh]);

  if (loading && !data) {
    return (
      <div style={loadingStyles.screen}>
        <div style={loadingStyles.brand}>Sangati</div>
        <div style={loadingStyles.sub}>
          Connecting to operations engine...
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (!data) return null;
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage data={data} role={role} refresh={refresh} />
        );
      case 'zones':
        return (
          <ZonesPage
            zones={data.zones}
            pressure={data.pressure_summary}
          />
        );
      case 'nudges':
        return (
          <NudgesPage
            nudges={data.active_nudges}
            role={role}
            refresh={refresh}
          />
        );
      case 'signals':
        return <SignalsPage signals={data.recent_signals} />;
      case 'decisions':
        return <DecisionsPage decisions={data.recent_decisions} />;
      case 'audit':
        return <AuditPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage data={data} role={role} refresh={refresh} />
        );
    }
  };

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      role={role}
      onRoleChange={setRole}
    >
      {error && (
        <div style={loadingStyles.error}>
          Connection issue: {error}. Retrying...
        </div>
      )}
      {renderPage()}
    </AppShell>
  );
}
