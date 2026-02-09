import { useState, useEffect, type CSSProperties } from 'react';
import type { HealthStatus } from '../types/domain';
import { healthCheck, triggerPipeline } from '../lib/api';
import { Card } from '../ui/components/Card';
import { Button } from '../ui/components/Button';
import { Badge } from '../ui/components/Badge';
import { useToast } from '../ui/components/Toast';

const s: Record<string, CSSProperties> = {
  section: {
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
  },
  label: {
    fontSize: 13,
    color: 'var(--text)',
  },
  value: {
    fontSize: 13,
    color: 'var(--muted)',
  },
};

export function SettingsPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    healthCheck()
      .then(setHealth)
      .catch(() => {});
  }, []);

  const handleTick = async () => {
    try {
      const result = await triggerPipeline();
      toast(
        `Pipeline: ${result.signals_generated} signals, ${result.decisions_made} decisions, ${result.nudges_created} nudges`,
        'info',
      );
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <div>
      <Card title="System Status" style={s.section}>
        <div style={s.row}>
          <span style={s.label}>Application</span>
          <span style={s.value}>{health?.app || '—'}</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Version</span>
          <span style={s.value}>{health?.version || '—'}</span>
        </div>
        <div style={s.row}>
          <span style={s.label}>Status</span>
          <Badge variant={health?.status === 'healthy' ? 'ok' : 'danger'}>
            {health?.status || 'unknown'}
          </Badge>
        </div>
        <div style={s.row}>
          <span style={s.label}>Database</span>
          <span style={s.value}>SQLite (local, offline-first)</span>
        </div>
      </Card>

      <Card title="Pipeline Controls" style={s.section}>
        <div style={s.row}>
          <span style={s.label}>
            Manually trigger one signal → decision → nudge cycle
          </span>
          <Button variant="primary" size="sm" onClick={handleTick}>
            Run Pipeline
          </Button>
        </div>
      </Card>

      <Card title="About">
        <div
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: 'var(--text)' }}>Intuiserve Sangati</strong>
          <br />
          Offline-first anticipatory operations intelligence for restaurants.
          <br />
          No external APIs. No biometric data. Runs entirely on your network.
        </div>
      </Card>
    </div>
  );
}
