import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: 16,
    boxShadow: 'var(--shadow-sm)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};

export function Card({ children, title, trailing, className, style }: CardProps) {
  return (
    <div className={className} style={{ ...styles.card, ...style }}>
      {(title || trailing) && (
        <div style={styles.header}>
          {title && <span style={styles.title}>{title}</span>}
          {trailing}
        </div>
      )}
      {children}
    </div>
  );
}
