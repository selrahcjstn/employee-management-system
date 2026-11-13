import type { ReactNode } from 'react';
import { formatTimestamp } from '../../../shared/lib/format';
import { roleLabel } from '../../../shared/lib/role-label';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import { CalendarIcon, MailIcon, ShieldIcon } from '../../../shared/ui/icons';
import type { SessionUser } from '../../../shared/api/types';

function Detail({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-neutral-600">{label}</dt>
        <dd className="truncate text-sm font-medium text-neutral-900">
          {children}
        </dd>
      </div>
    </div>
  );
}

/** Who is signed in: a large avatar, the name, role and status, and the account facts. Nothing here is editable. */
export function ProfileCard({ user }: { user: SessionUser }) {
  return (
    <section
      aria-labelledby="profile-name"
      className="min-w-0 rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm"
    >
      <div className="flex flex-col items-center text-center">
        <Avatar name={user.fullName} size="lg" />
        <h2
          id="profile-name"
          className="mt-4 max-w-full truncate text-xl font-semibold text-neutral-900"
        >
          {user.fullName}
        </h2>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Badge variant="primary">{roleLabel(user.role)}</Badge>
          <Badge variant={user.isActive ? 'success' : 'neutral'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-neutral-200 border-t border-neutral-200 pt-4">
        <Detail icon={<MailIcon />} label="Email">
          {user.email}
        </Detail>
        <Detail icon={<ShieldIcon />} label="Role">
          {roleLabel(user.role)}
        </Detail>
        <Detail icon={<CalendarIcon />} label="Member since">
          {formatTimestamp(user.createdAt)}
        </Detail>
      </dl>
    </section>
  );
}
