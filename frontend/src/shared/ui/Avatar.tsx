import { cx } from '../lib/cx';
import { initials } from '../lib/initials';

/**
 * A circle with the person's initials: 32px by default, 64px as `lg` (for a profile). The name is
 * always written next to it, so it is decorative.
 */
export function Avatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'md' | 'lg';
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700',
        size === 'lg' ? 'size-16 text-xl' : 'size-8 text-xs',
      )}
    >
      {initials(name)}
    </span>
  );
}
