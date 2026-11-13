import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const VARIANTS: Record<Variant, string> = {
  neutral: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  primary: 'border-primary-200 bg-primary-50 text-primary-700',
  success: 'border-success-border bg-success-bg text-success',
  warning: 'border-warning-border bg-warning-bg text-warning',
  danger: 'border-danger-border bg-danger-bg text-danger',
};

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

/** A short status label (DESIGN.md 6.5): text-xs, 4px by 8px padding, small radius, a semantic color pair. */
export function Badge({
  variant = 'neutral',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-sm border px-2 py-1 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
