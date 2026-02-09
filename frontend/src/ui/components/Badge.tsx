import type { CSSProperties } from 'react';

type BadgeVariant = 'ok' | 'warn' | 'danger' | 'muted' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const colorMap: Record<BadgeVariant, { bg: string; fg: string }> = {
  ok: { bg: 'var(--success)', fg: 'var(--bg)' },
  warn: { bg: 'var(--warn)', fg: 'var(--bg)' },
  danger: { bg: 'var(--danger)', fg: '#fff' },
  muted: { bg: 'var(--muted)', fg: '#fff' },
  accent: { bg: 'var(--accent)', fg: 'var(--bg)' },
};

const base: CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  lineHeight: '16px',
};

export function Badge({ variant = 'muted', children }: BadgeProps) {
  const c = colorMap[variant];
  return (
    <span style={{ ...base, background: c.bg, color: c.fg }}>{children}</span>
  );
}

export function priorityVariant(
  p: string,
): BadgeVariant {
  switch (p) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warn';
    case 'normal':
      return 'accent';
    default:
      return 'muted';
  }
}

export function statusVariant(
  s: string,
): BadgeVariant {
  switch (s) {
    case 'available':
      return 'ok';
    case 'occupied':
      return 'warn';
    case 'cleaning':
      return 'accent';
    case 'reserved':
      return 'muted';
    default:
      return 'muted';
  }
}
