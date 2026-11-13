import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import { AlertCircleIcon } from './icons';

type Variant = 'danger' | 'info';

const VARIANTS: Record<Variant, string> = {
  danger: 'border-danger-border bg-danger-bg text-danger',
  info: 'border-info-border bg-info-bg text-info',
};

interface AlertProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

/** An inline message with an icon and text. Errors use role="alert" so screen readers announce them. */
export function Alert({ variant = 'danger', children, className }: AlertProps) {
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2 rounded-md border p-4 text-sm',
        VARIANTS[variant],
        className,
      )}
    >
      <AlertCircleIcon className="shrink-0" />
      <div>{children}</div>
    </div>
  );
}
