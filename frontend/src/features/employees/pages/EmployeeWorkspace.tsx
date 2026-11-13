import { NavLink, Outlet, useLocation, useParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { cx } from '../../../shared/lib/cx';
import { formatDate } from '../../../shared/lib/format';
import { usePageTitle } from '../../../shared/lib/use-page-title';
import { Alert } from '../../../shared/ui/Alert';
import { Avatar } from '../../../shared/ui/Avatar';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ArrowLeftIcon, UsersIcon } from '../../../shared/ui/icons';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useEmployee } from '../api/queries';
import { PaySummary } from '../components/PaySummary';
import { fullName } from '../types';
import { WORKSPACE_TABS } from '../workspace-tabs';

const CARD = 'rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm';

function WorkspaceSkeleton() {
  return (
    <div role="status" aria-label="Loading employee">
      <div className={cx(CARD, 'p-4')}>
        <Skeleton className="h-4 w-24" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="size-8 rounded-full" />
          <div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="mt-2 h-4 w-40" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 md:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="col-span-2 h-14 w-full md:col-span-1" />
        </div>
      </div>
      <div className={cx(CARD, 'mt-4 p-4')}>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-4 w-full" />
      </div>
    </div>
  );
}

/**
 * One employee's workspace: who they are, their pay at a glance, and tabs for Salary, Components
 * and Computation. The employee is loaded once here; the tabs read the id from the address.
 */
export function EmployeeWorkspace() {
  const { id = '' } = useParams();
  const { pathname } = useLocation();
  const employee = useEmployee(id);
  const tab = WORKSPACE_TABS.find((entry) =>
    pathname.endsWith(`/${entry.path}`),
  );
  const name = employee.data ? fullName(employee.data) : undefined;
  usePageTitle(tab?.label, name);

  if (employee.isError) {
    const status = parseApiError(employee.error).status;
    if (status === 400 || status === 404) {
      return (
        <section className={CARD}>
          <EmptyState
            icon={<UsersIcon size={48} />}
            title="Employee not found"
            description="This employee does not exist, or the address is wrong."
            action={
              <LinkButton variant="secondary" to="/employees">
                Back to Employees
              </LinkButton>
            }
          />
        </section>
      );
    }
    return (
      <Alert>
        <p>{parseApiError(employee.error).message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          loading={employee.isFetching}
          onClick={() => employee.refetch()}
        >
          Retry
        </Button>
      </Alert>
    );
  }
  if (!employee.data) return <WorkspaceSkeleton />;

  const person = employee.data;
  return (
    <>
      <div className={CARD}>
        <div className="p-4">
          <NavLink
            to="/employees"
            end
            className="inline-flex h-8 items-center gap-1 rounded-md text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeftIcon size={16} />
            Employees
          </NavLink>
          <div className="mt-4 flex items-center gap-4">
            <Avatar name={fullName(person)} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold text-neutral-900">
                {fullName(person)}
              </h1>
              <p className="text-sm text-neutral-600">
                <span className="font-mono">{person.employeeNo}</span>
                {' · '}
                Hired {formatDate(person.dateHired)}
              </p>
            </div>
          </div>
          <PaySummary employeeId={id} />
        </div>
        <nav
          aria-label="Employee sections"
          className="border-t border-neutral-200"
        >
          <ul className="flex overflow-x-auto px-4">
            {WORKSPACE_TABS.map((entry) => (
              <li key={entry.path} className="shrink-0">
                <NavLink
                  to={`/employees/${id}/${entry.path}`}
                  className={({ isActive }) =>
                    cx(
                      'flex h-12 items-center border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900',
                    )
                  }
                >
                  {entry.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-4">
        <Outlet />
      </div>
    </>
  );
}
