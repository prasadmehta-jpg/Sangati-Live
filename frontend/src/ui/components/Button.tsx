import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const base: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontWeight: 500,
  fontFamily: 'var(--font-sans)',
  transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
  border: '1px solid var(--border)',
  lineHeight: 1,
};

const variants: Record<Variant, CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--bg)',
    borderColor: 'var(--accent)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text)',
    borderColor: 'var(--border)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger)',
    borderColor: 'var(--danger)',
  },
};

const sizes: Record<'sm' | 'md', CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 11 },
  md: { padding: '6px 14px', fontSize: 13 },
};

export function Button({
  variant = 'ghost',
  size = 'md',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      style={{
        ...base,
        ...variants[variant],
        ...sizes[size],
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      disabled={disabled}
      {...rest}
    />
  );
}
