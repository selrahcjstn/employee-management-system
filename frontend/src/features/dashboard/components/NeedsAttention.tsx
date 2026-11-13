import { Link } from 'react-router';
import { cx } from '../../../shared/lib/cx';
import { formatDate } from '../../../shared/lib/format';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import { AlertCircleIcon, CheckCircleIcon } from '../../../shared/ui/icons';
import { fullName, type Employee } from '../../employees/types';
import { daysBetween } from '../stats';

const SHOWN = 5;

/** How long someone has been waiting for a salary, in words. */
function waiting(dateHired: string, today: string): string {
  const days = daysBetween(dateHired, today);
  if (days < 0) return `Starts ${formatDate(dateHired)}`;
  if (days === 0) return 'Hired today';
  if (days === 1) return 'Hired yesterday';
  if (days < 60) return `Hired ${days} days ago`;
  return `Hired ${formatDate(dateHired)}`;
}

interface NeedsAttentionProps {
  /** Employees with no basic salary yet. */
  employees: Employee[];
  /** Everyone, for "3 of 12". */
  total: number;
  /** The Manila date, YYYY-MM-DD. */
  today: string;
}

/** The one thing an admin has to act on here: employees with no basic salary, each a click from fixing it. */
export function NeedsAttention({
  employees,
  total,
  today,
}: NeedsAttentionProps) {
  const shown = employees.slice(0, SHOWN);
  const hidden = employees.length - shown.length;
  const clear = employees.length === 0;

  return (
    <section
      aria-labelledby="attention-title"
      className={cx(
        'min-w-0 rounded-lg border p-6 shadow-sm',
        clear
          ? 'border-success-border bg-success-bg'
          : 'border-warning-border bg-neutral-0',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="attention-title"
          className="flex items-center gap-2 text-sm font-medium text-neutral-600"
        >
          {!clear && <AlertCircleIcon className="text-warning" />}
          Needs attention
        </h2>
        {!clear && <Badge variant="warning">{employees.length}</Badge>}
      </div>

      {clear ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircleIcon size={48} className="text-success" />
          <p className="mt-4 text-lg font-semibold text-neutral-900">
            All caught up
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {total === 0
              ? 'Nothing to do yet. Add an employee to get started.'
              : 'Everyone has a basic salary.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-neutral-600">
            {employees.length} of {total} employees have no basic salary, so
            they are left out of the payroll.
          </p>
          <ul className="mt-4 divide-y divide-neutral-200">
            {shown.map((employee) => (
              <li
                key={employee.id}
                className="flex items-center gap-4 py-4 first:pt-0"
              >
                <Avatar name={fullName(employee)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {fullName(employee)}
                  </p>
                  <p className="truncate text-xs text-neutral-600">
                    <span className="font-mono">{employee.employeeNo}</span>
                    {' · '}
                    {waiting(employee.dateHired, today)}
                  </p>
                </div>
                <Link
                  to={`/employees/${employee.id}/salary`}
                  aria-label={`Set salary for ${fullName(employee)}`}
                  className="inline-flex h-8 shrink-0 items-center rounded-md border border-field bg-neutral-0 px-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
                >
                  Set salary
                </Link>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <Link
              to="/employees"
              className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline"
            >
              and {hidden} more, see Employees
            </Link>
          )}
        </>
      )}
    </section>
  );
}
