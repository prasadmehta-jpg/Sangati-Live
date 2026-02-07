import React, { useState } from 'react';

export default function DecisionsView({ decisions }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Decision Engine Output</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{decisions.length} recent decisions</span>
        </div>
      </div>

      <div className="decision-list">
        {decisions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--text-muted)' }}>No recent decisions. The engine will act when signals trigger rules.</p>
          </div>
        )}

        {decisions.map(d => (
          <div key={d.id} className="decision-entry">
            <div className="decision-header">
              <div>
                <span className="decision-rule">{d.rule_name.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {d.action_type}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="decision-confidence">
                  {Math.round(d.confidence * 100)}% confidence
                </span>
                <span className={`badge ${
                  d.status === 'nudged' ? 'badge-success' :
                  d.status === 'pending' ? 'badge-warning' : ''
                }`}>{d.status}</span>
                {d.is_demo && <span className="badge badge-warning" style={{ fontSize: 9 }}>demo</span>}
              </div>
            </div>
            <div className="decision-explanation">{d.explanation}</div>

            <button
              className="btn btn-sm"
              style={{ marginTop: 8, fontSize: 11 }}
              onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
            >
              {expandedId === d.id ? 'Hide details' : 'Show details'}
            </button>

            {expandedId === d.id && (
              <div style={{
                marginTop: 8,
                padding: 10,
                background: 'var(--bg-primary)',
                borderRadius: 4,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                <div><strong>Rule:</strong> {d.rule_description}</div>
                <div><strong>Signals:</strong> {JSON.stringify(d.signal_ids)}</div>
                <div><strong>Parameters:</strong> {JSON.stringify(d.parameters)}</div>
                <div><strong>Created:</strong> {new Date(d.created_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
