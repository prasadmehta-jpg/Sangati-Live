import React, { useState } from 'react';
import { useDashboard } from './hooks/useDashboard';
import Header from './components/Header';
import LiveOpsView from './pages/LiveOpsView';
import ZonesView from './pages/ZonesView';
import NudgesView from './pages/NudgesView';
import SignalsView from './pages/SignalsView';
import DecisionsView from './pages/DecisionsView';
import AuditView from './pages/AuditView';

const TABS = [
  { id: 'live', label: 'Live Operations' },
  { id: 'zones', label: 'Zones' },
  { id: 'nudges', label: 'Nudges' },
  { id: 'signals', label: 'Signals' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'audit', label: 'Audit Log' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const { data, error, loading, refresh } = useDashboard(3000);

  if (loading && !data) {
    return (
      <div className="loading-screen">
        <div>
          <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>Intuiserve Sangati</h2>
          <p>Connecting to operations engine...</p>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    if (!data) return null;
    switch (activeTab) {
      case 'live': return <LiveOpsView data={data} refresh={refresh} />;
      case 'zones': return <ZonesView zones={data.zones} pressure={data.pressure_summary} />;
      case 'nudges': return <NudgesView nudges={data.active_nudges} refresh={refresh} />;
      case 'signals': return <SignalsView signals={data.recent_signals} />;
      case 'decisions': return <DecisionsView decisions={data.recent_decisions} />;
      case 'audit': return <AuditView />;
      default: return <LiveOpsView data={data} refresh={refresh} />;
    }
  };

  return (
    <div className="app-layout">
      <Header data={data} refresh={refresh} />
      <nav className="app-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {error && <div className="error-banner">Connection issue: {error}. Retrying...</div>}
        {renderTab()}
      </main>
    </div>
  );
}
