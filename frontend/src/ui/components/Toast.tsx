import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from 'react';

interface ToastItem {
  id: number;
  message: string;
  variant: 'info' | 'error' | 'success';
}

interface ToastContextValue {
  toast: (message: string, variant?: 'info' | 'error' | 'success') => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let _nextId = 0;

const containerStyle: CSSProperties = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  zIndex: 9999,
  pointerEvents: 'none',
};

const variantColors: Record<string, CSSProperties> = {
  info: {
    background: 'var(--surface2)',
    borderColor: 'var(--accent)',
    color: 'var(--text)',
  },
  error: {
    background: 'var(--surface2)',
    borderColor: 'var(--danger)',
    color: 'var(--danger)',
  },
  success: {
    background: 'var(--surface2)',
    borderColor: 'var(--success)',
    color: 'var(--success)',
  },
};

function ToastNotification({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  const vstyle = variantColors[item.variant] || variantColors.info;

  return (
    <div
      style={{
        ...vstyle,
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid',
        fontSize: 13,
        boxShadow: 'var(--shadow-md)',
        pointerEvents: 'auto',
        maxWidth: 360,
      }}
    >
      {item.message}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (message: string, variant: 'info' | 'error' | 'success' = 'info') => {
      const id = ++_nextId;
      setItems((prev) => [...prev, { id, message, variant }]);
    },
    [],
  );

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={containerStyle}>
        {items.map((item) => (
          <ToastNotification
            key={item.id}
            item={item}
            onDone={() => remove(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
