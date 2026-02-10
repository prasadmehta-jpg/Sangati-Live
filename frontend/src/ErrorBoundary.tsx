import { Component, type ReactNode, type CSSProperties } from 'react';
import { Button } from './ui/components/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const s: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: 32,
    background: 'var(--bg)',
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: 'var(--muted)',
    maxWidth: 480,
    marginBottom: 20,
  },
  detail: {
    fontSize: 12,
    color: 'var(--danger)',
    background: 'var(--surface)',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    maxWidth: 480,
    marginBottom: 20,
    wordBreak: 'break-word',
  },
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={s.container}>
          <div style={s.title}>Something went wrong</div>
          <div style={s.message}>
            The application encountered an unexpected error. This has been
            logged. You can try reloading the page.
          </div>
          {this.state.error && (
            <div style={s.detail}>{this.state.error.message}</div>
          )}
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
