import { useState, type CSSProperties } from 'react';
import type { Nudge, Role } from '../types/domain';
import { Card } from '../ui/components/Card';
import { Badge, priorityVariant } from '../ui/components/Badge';
import { Button } from '../ui/components/Button';
import { EmptyState } from '../ui/components/EmptyState';
import { nudgeAction } from '../lib/api';
import { useToast } from '../ui/components/Toast';

interface PageProps {
  nudges: Nudge[];
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
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: 'var(--muted)',
    textAlign: 'center',
    marginTop: 2,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  nudge: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  role: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: 'var(--accent)',
  },
  msg: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
    color: 'var(--text)',
  },
  explanation: {
    fontSize: 12,
    color: 'var(--muted)',
    background: 'var(--bg)',
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 8,
    borderLeft: '2px solid var(--accent)',
  },
  explLabel: {
    fontSize: 10,
    color: 'var(--accent)',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    marginBottom: 2,
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  time: {
    fontSize: 11,
    color: 'var(--muted)',
  },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function NudgeItem({
  nudge,
  refresh,
}: {
  nudge: Nudge;
  refresh: () => Promise<void>;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [acting, setActing] = useState(false);
  const { toast } = useToast();

  const borderLeft =
    nudge.priority === 'urgent'
      ? '3px solid var(--danger)'
      : nudge.priority === 'high'
        ? '3px solid var(--warn)'
        : '3px solid var(--border)';

  const handleAction = async (action: string) => {
    setActing(true);
    try {
      await nudgeAction(nudge.id, action);
      await refresh();
      toast(
        `Nudge ${action === 'acknowledge' ? 'acknowledged' : 'dismissed'}`,
        'success',
      );
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={{ ...s.nudge, borderLeft }}>
      <div style={s.header}>
        <span style={s.role}>{nudge.target_role}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant={priorityVariant(nudge.priority)}>
            {nudge.priority}
          </Badge>
          <span style={s.time}>{timeAgo(nudge.created_at)}</span>
        </div>
      </div>
      <div style={s.msg}>{nudge.message}</div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowWhy(!showWhy)}
        style={{ marginBottom: 8, color: 'var(--accent)' }}
      >
        {showWhy ? 'Hide' : 'Why am I seeing this?'}
      </Button>

      {showWhy && (
        <div style={s.explanation}>
          <div style={s.explLabel}>Why am I seeing this?</div>
          {nudge.explanation}
        </div>
      )}

      <div style={s.actions}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleAction('acknowledge')}
          disabled={acting}
        >
          Acknowledge
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction('dismiss')}
          disabled={acting}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

export function NudgesPage({ nudges, role, refresh }: PageProps) {
  const filtered =
    role === 'owner'
      ? nudges
      : nudges.filter(
          (n) =>
            n.target_role === role ||
            (role === 'manager' && n.priority === 'urgent'),
        );

  const byRole: Record<string, Nudge[]> = {};
  filtered.forEach((n) => {
    if (!byRole[n.target_role]) byRole[n.target_role] = [];
    byRole[n.target_role].push(n);
  });
  const roles = Object.keys(byRole).sort();

  return (
    <div>
      <div style={s.grid4}>
        <Card>
          <div style={{ ...s.metricValue, color: 'var(--text)' }}>
            {filtered.length}
          </div>
          <div style={s.metricLabel}>Total Active</div>
        </Card>
        <Card>
          <div style={{ ...s.metricValue, color: 'var(--danger)' }}>
            {filtered.filter((n) => n.priority === 'urgent').length}
          </div>
          <div style={s.metricLabel}>Urgent</div>
        </Card>
        <Card>
          <div style={{ ...s.metricValue, color: 'var(--warn)' }}>
            {filtered.filter((n) => n.priority === 'high').length}
          </div>
          <div style={s.metricLabel}>High</div>
        </Card>
        <Card>
          <div style={{ ...s.metricValue, color: 'var(--accent)' }}>
            {
              filtered.filter(
                (n) => n.priority === 'normal' || n.priority === 'low',
              ).length
            }
          </div>
          <div style={s.metricLabel}>Normal / Low</div>
        </Card>
      </div>

      {roles.length === 0 && (
        <Card>
          <EmptyState
            title="No active nudges"
            subtitle="Nudges will appear here when the decision engine generates actionable recommendations from detected signals."
          />
        </Card>
      )}

      {roles.map((r) => (
        <Card
          key={r}
          title={r}
          trailing={
            <Badge variant="accent">{byRole[r].length}</Badge>
          }
          style={{ marginBottom: 12 }}
        >
          <div style={s.list}>
            {byRole[r].map((n) => (
              <NudgeItem key={n.id} nudge={n} refresh={refresh} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
