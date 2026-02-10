import type { CSSProperties } from 'react';
import type { Signal } from '../types/domain';
import { Card } from '../ui/components/Card';
import { EmptyState } from '../ui/components/EmptyState';

interface Props {
  signals: Signal[];
}

const s: Record<string, CSSProperties> = {
  summaryRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  metric: {
    minWidth: 100,
    textAlign: 'center',
    padding: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--accent)',
  },
  metricLabel: {
    fontSize: 11,
    color: 'var(--muted)',
    marginTop: 2,
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
  },
  time: {
    fontSize: 11,
    color: 'var(--muted)',
    minWidth: 64,
  },
  type: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--accent)',
    minWidth: 130,
  },
  zone: {
    fontSize: 12,
    color: 'var(--muted)',
    minWidth: 70,
  },
  barBg: {
    width: 60,
    height: 6,
    background: 'var(--border)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pct: {
    fontSize: 11,
    color: 'var(--muted)',
    minWidth: 36,
  },
  source: {
    fontSize: 11,
    color: 'var(--muted)',
  },
};

function intensityColor(val: number): string {
  if (val >= 0.8) return 'var(--danger)';
  if (val >= 0.5) return 'var(--warn)';
  return 'var(--success)';
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString();
}

export function SignalsPage({ signals }: Props) {
  const byType: Record<string, number> = {};
  signals.forEach((sg) => {
    byType[sg.signal_type] = (byType[sg.signal_type] || 0) + 1;
  });

  return (
    <div>
      <Card title="Signal Summary (Last 15 min)" style={{ marginBottom: 16 }}>
        {Object.keys(byType).length === 0 ? (
          <EmptyState
            title="No recent signals"
            subtitle="Signals are generated when zone conditions trigger detection rules. Update zone occupancy to produce signals."
          />
        ) : (
          <div style={s.summaryRow}>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} style={s.metric}>
                <div style={s.metricValue}>{count}</div>
                <div style={s.metricLabel}>
                  {type.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Signal Feed"
        trailing={
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {signals.length} signals
          </span>
        }
      >
        {signals.length === 0 ? (
          <EmptyState
            title="No signals recorded"
            subtitle="The signal engine evaluates zones whenever occupancy changes. No signals have been generated yet."
          />
        ) : (
          <div>
            {signals.map((sg) => (
              <div key={sg.id} style={s.entry}>
                <span style={s.time}>{formatTime(sg.created_at)}</span>
                <span style={s.type}>
                  {sg.signal_type.replace(/_/g, ' ')}
                </span>
                <span style={s.zone}>Zone #{sg.zone_id}</span>
                <div style={s.barBg}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(sg.intensity * 100)}%`,
                      background: intensityColor(sg.intensity),
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span style={s.pct}>
                  {Math.round(sg.intensity * 100)}%
                </span>
                <span style={s.source}>{sg.source}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
