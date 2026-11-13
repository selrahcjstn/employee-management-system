import { cx } from '../lib/cx';

/** A grey block the size of the content that is coming, so nothing jumps when it arrives. Size it with className. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('block animate-pulse rounded-sm bg-neutral-200', className)}
    />
  );
}
