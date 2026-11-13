import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cx } from '../lib/cx';
import { AlertCircleIcon, CheckCircleIcon, CloseIcon } from './icons';
import { ToastContext, type ToastApi } from './toast-context';

const SUCCESS_MS = 4000;

type Kind = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

const STYLES: Record<Kind, string> = {
  success: 'border-success-border bg-success-bg text-success',
  info: 'border-info-border bg-info-bg text-info',
  error: 'border-danger-border bg-danger-bg text-danger',
};

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const { id, kind } = item;
  // `onDismiss` is stable, so a toast's timer is not restarted when another toast arrives.
  useEffect(() => {
    if (kind === 'error') return;
    const timer = setTimeout(() => onDismiss(id), SUCCESS_MS);
    return () => clearTimeout(timer);
  }, [id, kind, onDismiss]);

  const Icon = item.kind === 'success' ? CheckCircleIcon : AlertCircleIcon;
  return (
    <div
      role={item.kind === 'error' ? 'alert' : 'status'}
      className={cx(
        'pointer-events-auto flex w-80 max-w-full animate-toast-in items-start gap-2 rounded-lg border p-4 text-sm shadow-md',
        STYLES[item.kind],
      )}
    >
      <Icon className="shrink-0" />
      <p className="min-w-0 flex-1 text-neutral-900">{item.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(id)}
        className="-m-2 flex size-10 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

/**
 * Toasts in the top right, 16px from the edges and 8px apart (DESIGN.md 6.7). A success or info toast
 * (role="status") goes away after 4 seconds; an error toast (role="alert") stays until dismissed.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const add = useCallback((kind: Kind, message: string) => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, kind, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => add('success', message),
      info: (message) => add('info', message),
      error: (message) => add('error', message),
    }),
    [add],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 left-4 z-60 flex flex-col items-end gap-2">
        {items.map((item) => (
          <Toast key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}
