import type { CSSProperties } from 'react';
import type { DashboardState, Role } from '../types/domain';
import { Card } from '../ui/components/Card';
import { EmptyState } from '../ui/components/EmptyState';
import { ZoneCard } from './ZonesPage';
import { NudgeItem } from './NudgesPage';

interface Props {
  data: DashboardState;
  role: Role;
  refresh: () => Promise<void>;
}

const s: Record<string, CSSProperties> = {
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10,
  },
  nudgeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
};

function Metric({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <Card>
      <div style={{ ...s.metricValue, color: color || 'var(--accent)' }}>
        {value}
      </div>
      <div style={s.metricLabel}>{label}</div>
    </Card>
  );
}

export function DashboardPage({ data, role, refresh }: Props) {
  const { zones, active_nudges, pressure_summary, recent_signals } = data;

  const roleNudges =
    role === 'owner'
      ? active_nudges
      : active_nudges.filter(
          (n) =>
            n.target_role === role ||
            (role === 'manager' && n.priority === 'urgent'),
        );

  const occColor =
    pressure_summary.occupancy_rate > 0.8
      ? 'var(--danger)'
      : pressure_summary.occupancy_rate > 0.5
        ? 'var(--warn)'
        : 'var(--success)';

  return (
    <div>
      <div style={s.grid4}>
        <Metric value={pressure_summary.total_occupancy} label="Total Guests" />
        <Metric
          value={`${Math.round(pressure_summary.occupancy_rate * 100)}%`}
          label="Occupancy Rate"
          color={occColor}
        />
        <Metric value={roleNudges.length} label="Active Nudges" />
        <Metric value={recent_signals.length} label="Signals (15m)" />
      </div>

      <div style={s.grid2}>
        <Card
          title="Floor Status"
          trailing={
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {pressure_summary.occupied_tables}/
              {pressure_summary.total_tables} tables
            </span>
          }
        >
          {zones.length === 0 ? (
            <EmptyState
              title="No zones configured"
              subtitle="Add restaurant zones to get started"
            />
          ) : (
            <div style={s.zoneGrid}>
              {zones.map((z) => (
                <ZoneCard key={z.id} zone={z} />
              ))}
            </div>
          )}
        </Card>

        <Card title="Active Nudges" trailing={<span style={{fontSize: 11, color: 'var(--muted)'}}>{roleNudges.length}</span>}>
          {roleNudges.length === 0 ? (
            <EmptyState
              title="No active nudges"
              subtitle="Operations running smoothly. Nudges appear when the system detects actionable signals."
            />
          ) : (
            <div style={s.nudgeList}>
              {roleNudges.slice(0, 10).map((n) => (
                <NudgeItem key={n.id} nudge={n} refresh={refresh} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
