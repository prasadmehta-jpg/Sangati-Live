import type { CSSProperties } from 'react';
import type { Zone, PressureSummary } from '../types/domain';
import { Card } from '../ui/components/Card';
import { Badge, statusVariant } from '../ui/components/Badge';
import { EmptyState } from '../ui/components/EmptyState';

interface Props {
  zones: Zone[];
  pressure: PressureSummary;
}

const s: Record<string, CSSProperties> = {
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--accent)',
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: 'var(--muted)',
    textAlign: 'center',
    marginTop: 2,
  },
  zoneGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 10,
  },
  section: {
    marginBottom: 16,
  },
};

const zoneCardStyle: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: 12,
};

const barBg: CSSProperties = {
  height: 4,
  background: 'var(--border)',
  borderRadius: 2,
  overflow: 'hidden',
  marginTop: 6,
};

export function ZoneCard({ zone }: { zone: Zone }) {
  const pct =
    zone.capacity > 0
      ? Math.round((zone.current_occupancy / zone.capacity) * 100)
      : 0;
  const fillColor =
    pct >= 85
      ? 'var(--danger)'
      : pct >= 50
        ? 'var(--warn)'
        : pct > 0
          ? 'var(--success)'
          : 'var(--border)';

  const borderLeft =
    zone.status === 'occupied'
      ? '3px solid var(--warn)'
      : zone.status === 'available'
        ? '3px solid var(--success)'
        : zone.status === 'cleaning'
          ? '3px solid var(--accent)'
          : '3px solid var(--border)';

  return (
    <div style={{ ...zoneCardStyle, borderLeft }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{zone.name}</div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            {zone.zone_type}
          </div>
        </div>
        <Badge variant={statusVariant(zone.status)}>{zone.status}</Badge>
      </div>
      {zone.capacity > 0 && (
        <>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
            {zone.current_occupancy}
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              /{zone.capacity}
            </span>
          </div>
          <div style={barBg}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: fillColor,
                borderRadius: 2,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function ZonesPage({ zones, pressure }: Props) {
  const byType: Record<string, Zone[]> = {};
  zones.forEach((z) => {
    if (!byType[z.zone_type]) byType[z.zone_type] = [];
    byType[z.zone_type].push(z);
  });

  if (zones.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No zones configured"
          subtitle="Zones represent tables, bar sections, patios, and other areas in your restaurant. They will appear here once configured."
        />
      </Card>
    );
  }

  return (
    <div>
      <div style={s.grid3}>
        <Card>
          <div style={s.metricValue}>{pressure.total_zones}</div>
          <div style={s.metricLabel}>Total Zones</div>
        </Card>
        <Card>
          <div
            style={{
              ...s.metricValue,
              color:
                pressure.table_utilization > 0.8
                  ? 'var(--danger)'
                  : 'var(--accent)',
            }}
          >
            {Math.round(pressure.table_utilization * 100)}%
          </div>
          <div style={s.metricLabel}>Table Utilization</div>
        </Card>
        <Card>
          <div style={s.metricValue}>
            {pressure.zones_by_status.available || 0}
          </div>
          <div style={s.metricLabel}>Available</div>
        </Card>
      </div>

      {Object.entries(byType).map(([type, typeZones]) => (
        <div key={type} style={s.section}>
          <Card
            title={`${type} zones`}
            trailing={
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                {typeZones.length}
              </span>
            }
          >
            <div style={s.zoneGrid}>
              {typeZones.map((z) => (
                <ZoneCard key={z.id} zone={z} />
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
