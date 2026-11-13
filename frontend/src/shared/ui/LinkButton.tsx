import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '../lib/cx';

type Variant = 'ghost' | 'secondary';

const VARIANTS: Record<Variant, string> = {
  ghost: 'text-primary-600 hover:bg-primary-50',
  secondary:
    'border border-field bg-neutral-0 text-neutral-900 hover:bg-neutral-100',
};

interface LinkButtonProps extends Omit<LinkProps, 'className'> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

/** A link that looks like a small button (32px high): for going to another page, where a real button would be wrong. */
export function LinkButton({
  variant = 'ghost',
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cx(
        'inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium whitespace-nowrap transition-colors',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
