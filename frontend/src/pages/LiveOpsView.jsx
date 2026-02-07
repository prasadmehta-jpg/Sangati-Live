import React from 'react';
import ZoneCard from '../components/ZoneCard';
import NudgeCard from '../components/NudgeCard';

export default function LiveOpsView({ data, refresh }) {
  const { zones, active_nudges, pressure_summary, recent_signals, demo_mode, current_scenario } = data;

  const urgentNudges = active_nudges.filter(n => n.priority === 'urgent' || n.priority === 'high');
  const normalNudges = active_nudges.filter(n => n.priority === 'normal' || n.priority === 'low');

  return (
    <div>
      {/* Metrics Bar */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <div className="metric-value">{pressure_summary.total_occupancy}</div>
          <div className="metric-label">Total Guests</div>
        </div>
        <div className="card metric">
          <div className="metric-value" style={{
            color: pressure_summary.occupancy_rate > 0.8 ? 'var(--danger)' :
                   pressure_summary.occupancy_rate > 0.5 ? 'var(--warning)' : 'var(--success)'
          }}>
            {Math.round(pressure_summary.occupancy_rate * 100)}%
          </div>
          <div className="metric-label">Occupancy Rate</div>
        </div>
        <div className="card metric">
          <div className="metric-value">{active_nudges.length}</div>
          <div className="metric-label">Active Nudges</div>
        </div>
        <div className="card metric">
          <div className="metric-value">{recent_signals.length}</div>
          <div className="metric-label">Recent Signals (15m)</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Left: Floor Plan / Zones */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Floor Status</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {pressure_summary.occupied_tables}/{pressure_summary.total_tables} tables occupied
              </span>
            </div>
            <div className="zone-grid">
              {zones.map(zone => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active Nudges */}
        <div>
          {urgentNudges.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title pulse" style={{ color: 'var(--urgent)' }}>
                  Attention Required
                </span>
                <span className="badge badge-urgent">{urgentNudges.length}</span>
              </div>
              <div className="nudge-list">
                {urgentNudges.map(nudge => (
                  <NudgeCard key={nudge.id} nudge={nudge} refresh={refresh} />
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">Active Nudges</span>
              <span className="badge badge-normal">{normalNudges.length}</span>
            </div>
            {normalNudges.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>
                No active nudges. Operations running smoothly.
              </p>
            ) : (
              <div className="nudge-list">
                {normalNudges.map(nudge => (
                  <NudgeCard key={nudge.id} nudge={nudge} refresh={refresh} />
                ))}
              </div>
            )}
          </div>

          {demo_mode && (
            <div className="card" style={{ marginTop: 16, borderColor: 'var(--accent-dim)' }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--accent)' }}>Demo Mode Active</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Simulation is running: <strong>{current_scenario?.name?.replace('_', ' ')}</strong> scenario.
                Data is generated automatically. Toggle off Demo Mode in the header to switch to real sensor input.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
