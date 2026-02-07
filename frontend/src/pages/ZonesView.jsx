import React from 'react';
import ZoneCard from '../components/ZoneCard';

export default function ZonesView({ zones, pressure }) {
  const byType = {};
  zones.forEach(z => {
    if (!byType[z.zone_type]) byType[z.zone_type] = [];
    byType[z.zone_type].push(z);
  });

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card metric">
          <div className="metric-value">{pressure.total_zones}</div>
          <div className="metric-label">Total Zones</div>
        </div>
        <div className="card metric">
          <div className="metric-value" style={{
            color: pressure.table_utilization > 0.8 ? 'var(--danger)' : 'var(--accent)'
          }}>
            {Math.round(pressure.table_utilization * 100)}%
          </div>
          <div className="metric-label">Table Utilization</div>
        </div>
        <div className="card metric">
          <div className="metric-value">{pressure.zones_by_status.available}</div>
          <div className="metric-label">Available Zones</div>
        </div>
      </div>

      {Object.entries(byType).map(([type, typeZones]) => (
        <div key={type} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">{type} Zones</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{typeZones.length} zones</span>
          </div>
          <div className="zone-grid">
            {typeZones.map(z => <ZoneCard key={z.id} zone={z} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
