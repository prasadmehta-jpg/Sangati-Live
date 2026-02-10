import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  icon: {
    fontSize: 32,
    color: 'var(--muted)',
    marginBottom: 12,
    opacity: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--muted)',
    maxWidth: 320,
    marginBottom: 16,
  },
};

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div style={styles.container}>
      {icon && <div style={styles.icon}>{icon}</div>}
      <div style={styles.title}>{title}</div>
      {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
