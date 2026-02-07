import React from 'react';
import NudgeCard from '../components/NudgeCard';

export default function NudgesView({ nudges, refresh }) {
  const byRole = {};
  nudges.forEach(n => {
    if (!byRole[n.target_role]) byRole[n.target_role] = [];
    byRole[n.target_role].push(n);
  });

  const roles = Object.keys(byRole).sort();

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Active Nudges Summary</span>
        </div>
        <div className="grid-4">
          <div className="metric">
            <div className="metric-value">{nudges.length}</div>
            <div className="metric-label">Total Active</div>
          </div>
          <div className="metric">
            <div className="metric-value" style={{ color: 'var(--urgent)' }}>
              {nudges.filter(n => n.priority === 'urgent').length}
            </div>
            <div className="metric-label">Urgent</div>
          </div>
          <div className="metric">
            <div className="metric-value" style={{ color: 'var(--danger)' }}>
              {nudges.filter(n => n.priority === 'high').length}
            </div>
            <div className="metric-label">High</div>
          </div>
          <div className="metric">
            <div className="metric-value" style={{ color: 'var(--info)' }}>
              {nudges.filter(n => n.priority === 'normal' || n.priority === 'low').length}
            </div>
            <div className="metric-label">Normal / Low</div>
          </div>
        </div>
      </div>

      {roles.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>No active nudges. All operations running smoothly.</p>
        </div>
      )}

      {roles.map(role => (
        <div key={role} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">{role}</span>
            <span className="badge badge-normal">{byRole[role].length}</span>
          </div>
          <div className="nudge-list">
            {byRole[role].map(n => (
              <NudgeCard key={n.id} nudge={n} refresh={refresh} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
