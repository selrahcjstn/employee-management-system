import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** A 48px icon (`<UsersIcon size={48} />`). */
  icon: ReactNode;
  title: string;
  description: string;
  /** One primary action, if there is something to do about it. */
  action?: ReactNode;
}

/** Nothing here yet: what it is, why, and the one thing to do next (DESIGN.md 6.8). */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div className="text-neutral-400">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
