import { useState, type CSSProperties } from 'react';
import type { Decision } from '../types/domain';
import { Card } from '../ui/components/Card';
import { Badge } from '../ui/components/Badge';
import { Button } from '../ui/components/Button';
import { EmptyState } from '../ui/components/EmptyState';

interface Props {
  decisions: Decision[];
}

const s: Record<string, CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  entry: {
    padding: 12,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rule: {
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text)',
  },
  action: {
    fontSize: 11,
    color: 'var(--muted)',
    marginLeft: 8,
  },
  confidence: {
    fontSize: 12,
    color: 'var(--accent)',
  },
  explanation: {
    fontSize: 12,
    color: 'var(--muted)',
    lineHeight: 1.5,
  },
  detail: {
    marginTop: 8,
    padding: 10,
    background: 'var(--bg)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    color: 'var(--muted)',
  },
  detailRow: {
    marginBottom: 4,
  },
};

function DecisionEntry({ d }: { d: Decision }) {
  const [expanded, setExpanded] = useState(false);

  const statusVariant =
    d.status === 'nudged' ? 'ok' : d.status === 'pending' ? 'warn' : 'muted';

  return (
    <div style={s.entry}>
      <div style={s.header}>
        <div>
          <span style={s.rule}>
            {d.rule_name.replace(/_/g, ' ')}
          </span>
          <span style={s.action}>{d.action_type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={s.confidence}>
            {Math.round(d.confidence * 100)}%
          </span>
          <Badge variant={statusVariant}>{d.status}</Badge>
        </div>
      </div>
      <div style={s.explanation}>{d.explanation}</div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        style={{ marginTop: 8 }}
      >
        {expanded ? 'Hide details' : 'Show details'}
      </Button>

      {expanded && (
        <div style={s.detail}>
          <div style={s.detailRow}>
            <strong>Rule:</strong> {d.rule_description}
          </div>
          <div style={s.detailRow}>
            <strong>Signals:</strong> {JSON.stringify(d.signal_ids)}
          </div>
          <div style={s.detailRow}>
            <strong>Parameters:</strong> {JSON.stringify(d.parameters)}
          </div>
          <div style={s.detailRow}>
            <strong>Created:</strong>{' '}
            {d.created_at
              ? new Date(d.created_at).toLocaleString()
              : '—'}
          </div>
        </div>
      )}
    </div>
  );
}

export function DecisionsPage({ decisions }: Props) {
  return (
    <div>
      <Card
        title="Decision Engine Output"
        trailing={
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {decisions.length} recent
          </span>
        }
      >
        {decisions.length === 0 ? (
          <EmptyState
            title="No decisions recorded"
            subtitle="The decision engine fires rules when signals exceed confidence thresholds. Decisions will appear here once signals are processed."
          />
        ) : (
          <div style={s.list}>
            {decisions.map((d) => (
              <DecisionEntry key={d.id} d={d} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
