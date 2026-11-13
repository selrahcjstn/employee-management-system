import { Link, useLocation, useMatch } from 'react-router';
import { useEmployee } from '../../features/employees/api/queries';
import { fullName } from '../../features/employees/types';
import { WORKSPACE_TABS } from '../../features/employees/workspace-tabs';
import { ChevronRightIcon } from '../../shared/ui/icons';
import { findNav } from './nav-items';

const SEPARATOR = (
  <ChevronRightIcon size={16} className="shrink-0 text-neutral-400" />
);

/** Inside an employee's workspace: Employees > Name > Tab. The name comes from the workspace's own query, so it costs no extra request. */
function WorkspaceCrumbs({ id }: { id: string }) {
  const { pathname } = useLocation();
  const employee = useEmployee(id).data;
  const tab = WORKSPACE_TABS.find((entry) =>
    pathname.endsWith(`/${entry.path}`),
  );

  return (
    <ol className="flex min-w-0 items-center gap-1 text-sm">
      <li className="flex items-center gap-1">
        <Link
          to="/employees"
          className="text-neutral-500 transition-colors hover:text-neutral-900"
        >
          Employees
        </Link>
        {SEPARATOR}
      </li>
      {employee && (
        <li className="hidden min-w-0 items-center gap-1 sm:flex">
          <span className="truncate text-neutral-500">
            {fullName(employee)}
          </span>
          {SEPARATOR}
        </li>
      )}
      <li aria-current="page" className="font-medium text-neutral-900">
        {tab?.label ?? 'Employee'}
      </li>
    </ol>
  );
}

/** Where you are: the group, then the page. The page's own h1 names it again below, in full. */
export function Breadcrumb() {
  const { pathname } = useLocation();
  const workspace = useMatch('/employees/:id/*');
  const match = findNav(pathname);

  if (workspace?.params.id) {
    return (
      <nav aria-label="Breadcrumb" className="min-w-0">
        <WorkspaceCrumbs id={workspace.params.id} />
      </nav>
    );
  }
  if (!match) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm">
        <li className="hidden items-center gap-1 text-neutral-500 sm:flex">
          {match.group}
          {SEPARATOR}
        </li>
        <li aria-current="page" className="font-medium text-neutral-900">
          {match.item.label}
        </li>
      </ol>
    </nav>
  );
}
