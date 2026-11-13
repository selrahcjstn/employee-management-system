import { initials } from '../lib/initials';

/** A 32px circle with the person's initials. The name is always written next to it, so it is decorative. */
export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700"
    >
      {initials(name)}
    </span>
  );
}
