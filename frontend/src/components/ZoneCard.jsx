import React from 'react';

export default function ZoneCard({ zone }) {
  const occupancyPct = zone.capacity > 0
    ? Math.round((zone.current_occupancy / zone.capacity) * 100)
    : 0;

  const fillColor = occupancyPct >= 85 ? 'var(--danger)' :
                    occupancyPct >= 50 ? 'var(--warning)' :
                    occupancyPct > 0 ? 'var(--success)' : 'var(--border)';

  return (
    <div className={`zone-card status-${zone.status}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="zone-name">{zone.name}</div>
          <div className="zone-type">{zone.zone_type}</div>
        </div>
        <span className={`badge ${
          zone.status === 'available' ? 'badge-success' :
          zone.status === 'cleaning' ? 'badge-warning' :
          zone.status === 'reserved' ? 'badge-normal' : ''
        }`} style={{
          fontSize: 9,
          ...(zone.status === 'occupied' ? { background: 'var(--warning)', color: 'var(--bg-primary)' } : {})
        }}>
          {zone.status}
        </span>
      </div>
      {zone.capacity > 0 && (
        <>
          <div className="zone-occupancy">
            {zone.current_occupancy}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/{zone.capacity}</span>
          </div>
          <div className="zone-occupancy-bar">
            <div
              className="zone-occupancy-fill"
              style={{ width: `${occupancyPct}%`, background: fillColor }}
            />
          </div>
        </>
      )}
    </div>
  );
}
