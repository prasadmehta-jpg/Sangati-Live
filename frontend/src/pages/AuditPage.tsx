import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import type { AuditEvent } from '../types/domain';
import { getAuditLog } from '../lib/api';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { EmptyState } from '../ui/components/EmptyState';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'signal_received', label: 'Signals' },
  { value: 'decision_made', label: 'Decisions' },
  { value: 'nudge_generated', label: 'Nudges' },
  { value: 'nudge_acknowledged', label: 'Ack' },
  { value: 'system_start', label: 'System' },
];

const s: Record<string, CSSProperties> = {
  filters: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  entry: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
  },
  time: {
    color: 'var(--muted)',
    fontSize: 11,
    whiteSpace: 'nowrap',
    minWidth: 64,
  },
  eventType: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    minWidth: 100,
  },
  summary: {
    color: 'var(--muted)',
    flex: 1,
  },
  actor: {
    fontSize: 10,
    color: 'var(--muted)',
    minWidth: 70,
    textAlign: 'right',
  },
};

function eventColor(type: string): string {
  if (type.includes('signal')) return 'var(--accent)';
  if (type.includes('decision')) return 'var(--warn)';
  if (type.includes('nudge')) return 'var(--success)';
  if (type.includes('system')) return 'var(--muted)';
  return 'var(--muted)';
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString();
}

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = useCallback(async () => {
    try {
      const data = await getAuditLog(200, filter || undefined);
      setEntries(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 5000);
    return () => clearInterval(interval);
  }, [fetchAudit]);

  return (
    <div>
      <Card
        title="Audit Trail"
        trailing={
          <div style={s.filters}>
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? 'primary' : 'ghost'}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        }
      >
        {error && (
          <div
            style={{
              color: 'var(--danger)',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            Failed to load audit log: {error}
          </div>
        )}

        {loading && entries.length === 0 ? (
          <div
            style={{
              color: 'var(--muted)',
              textAlign: 'center',
              padding: 40,
            }}
          >
            Loading audit log...
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            title="No actions yet"
            subtitle="The audit trail records every signal, decision, and nudge with full traceability. Activity will appear here as the system operates."
          />
        ) : (
          <div style={s.list}>
            {entries.map((e) => (
              <div key={e.id} style={s.entry}>
                <span style={s.time}>
                  {formatTime(e.created_at)}
                </span>
                <span
                  style={{
                    ...s.eventType,
                    color: eventColor(e.event_type),
                  }}
                >
                  {e.event_type.replace(/_/g, ' ')}
                </span>
                <span style={s.summary}>{e.summary}</span>
                <span style={s.actor}>{e.actor}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
