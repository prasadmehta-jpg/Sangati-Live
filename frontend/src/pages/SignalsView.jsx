import React from 'react';

export default function SignalsView({ signals }) {
  const intensityColor = (val) => {
    if (val >= 0.8) return 'var(--danger)';
    if (val >= 0.5) return 'var(--warning)';
    return 'var(--success)';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString();
  };

  const byType = {};
  signals.forEach(s => {
    if (!byType[s.signal_type]) byType[s.signal_type] = 0;
    byType[s.signal_type]++;
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Signal Summary (Last 15 min)</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(byType).map(([type, count]) => (
            <div key={type} className="metric" style={{ minWidth: 120 }}>
              <div className="metric-value" style={{ fontSize: 24 }}>{count}</div>
              <div className="metric-label">{type.replace(/_/g, ' ')}</div>
            </div>
          ))}
          {Object.keys(byType).length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: 20 }}>No recent signals.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Signal Feed</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{signals.length} signals</span>
        </div>
        <div className="signal-list">
          {signals.map(s => (
            <div key={s.id} className="signal-entry">
              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 70 }}>
                {formatTime(s.created_at)}
              </span>
              <span style={{ minWidth: 140, fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                {s.signal_type.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80 }}>
                Zone #{s.zone_id}
              </span>
              <div className="signal-intensity-bar">
                <div
                  className="signal-intensity-fill"
                  style={{
                    width: `${Math.round(s.intensity * 100)}%`,
                    background: intensityColor(s.intensity),
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 40 }}>
                {Math.round(s.intensity * 100)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {s.source}
              </span>
              {s.is_demo && <span className="badge badge-warning" style={{ fontSize: 9 }}>demo</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
