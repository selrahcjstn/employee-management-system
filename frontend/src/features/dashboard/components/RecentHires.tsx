import { Link } from 'react-router';
import { cx } from '../../../shared/lib/cx';
import { formatDate, formatPeso } from '../../../shared/lib/format';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import { fullName, type Employee } from '../../employees/types';

interface RecentHiresProps {
  /** The newest hires, latest first. */
  employees: Employee[];
  className?: string;
}

/** Who joined last, with their start date and salary, so a new hire without pay stands out. */
export function RecentHires({ employees, className }: RecentHiresProps) {
  return (
    <section
      aria-labelledby="recent-title"
      className={cx(
        'min-w-0 rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="recent-title" className="text-sm font-medium text-neutral-600">
          Recent hires
        </h2>
        <Link
          to="/employees"
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          View all employees
        </Link>
      </div>
      {employees.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No one has been added yet. New employees appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200">
          {employees.map((employee) => (
            <li
              key={employee.id}
              className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <Avatar name={fullName(employee)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {fullName(employee)}
                </p>
                <p className="truncate text-xs text-neutral-600">
                  <span className="font-mono">{employee.employeeNo}</span>
                  {' · '}
                  Joined {formatDate(employee.dateHired)}
                </p>
              </div>
              {employee.currentBasicSalary ? (
                <span className="num shrink-0 text-sm font-medium text-neutral-900">
                  {formatPeso(employee.currentBasicSalary)}
                </span>
              ) : (
                <Badge variant="warning">No salary</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
