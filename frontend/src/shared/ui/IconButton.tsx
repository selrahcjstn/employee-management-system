import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../lib/cx';

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  /** What the button does. Required, because the button shows only an icon. */
  label: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

/** A 40px by 40px icon-only button (the minimum hit area in DESIGN.md 4.2). */
export function IconButton({
  label,
  className,
  children,
  type = 'button',
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cx(
        'flex size-10 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
