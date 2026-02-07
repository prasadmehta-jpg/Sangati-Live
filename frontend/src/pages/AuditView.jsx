import React, { useState, useEffect } from 'react';
import { getAuditLog } from '../services/api';

const EVENT_FILTERS = [
  { value: '', label: 'All Events' },
  { value: 'signal_received', label: 'Signals' },
  { value: 'decision_made', label: 'Decisions' },
  { value: 'nudge_generated', label: 'Nudges' },
  { value: 'nudge_acknowledged', label: 'Acknowledged' },
  { value: 'simulation_tick', label: 'Simulation' },
  { value: 'system_start', label: 'System' },
];

export default function AuditView() {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const data = await getAuditLog(200, filter || undefined);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString();
  };

  const eventColor = (type) => {
    if (type.includes('signal')) return 'var(--info)';
    if (type.includes('decision')) return 'var(--accent)';
    if (type.includes('nudge')) return 'var(--warning)';
    if (type.includes('simulation')) return 'var(--text-muted)';
    if (type.includes('system')) return 'var(--success)';
    return 'var(--text-secondary)';
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Audit Trail</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {EVENT_FILTERS.map(f => (
              <button
                key={f.value}
                className={`scenario-btn ${filter === f.value ? 'active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Complete trace of every system action. Click any entry to understand why it happened.
        </p>
      </div>

      {loading && entries.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Loading audit log...</p>
      ) : (
        <div className="audit-list">
          {entries.map(e => (
            <div key={e.id} className="audit-entry">
              <span className="audit-time">{formatTime(e.created_at)}</span>
              <span className="audit-type" style={{ color: eventColor(e.event_type) }}>
                {e.event_type.replace(/_/g, ' ')}
              </span>
              <span className="audit-summary">{e.summary}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.actor}</span>
              {e.is_demo && <span className="badge badge-warning" style={{ fontSize: 9 }}>demo</span>}
            </div>
          ))}
          {entries.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No audit entries found.</p>
          )}
        </div>
      )}
    </div>
  );
}
