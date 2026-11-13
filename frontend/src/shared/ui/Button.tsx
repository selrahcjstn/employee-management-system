import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Replaces the label with a spinner at the same width and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
  /** A 20px icon shown before the label. */
  icon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-neutral-0 enabled:hover:bg-primary-700 enabled:active:bg-primary-800',
  secondary:
    'border border-field bg-neutral-0 text-neutral-900 enabled:hover:bg-neutral-100',
  ghost: 'text-primary-600 enabled:hover:bg-primary-50',
};

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'relative inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        VARIANTS[variant],
        // A loading button keeps its colors; only a button that is disabled for another reason greys out.
        !loading &&
          'disabled:border-transparent disabled:bg-neutral-100 disabled:text-neutral-400',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      <span
        className={cx('inline-flex items-center gap-2', loading && 'invisible')}
      >
        {icon}
        {children}
      </span>
      {loading && (
        <span
          className="absolute inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
