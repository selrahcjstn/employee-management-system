import { cx } from '../../../shared/lib/cx';
import { formatPeso } from '../../../shared/lib/format';
import { toCentavos } from '../../../shared/lib/money';
import { fullName, type Employee } from '../../employees/types';

const SHOWN = 6;

interface PayrollChartProps {
  /** Employees who have a salary, the highest first. */
  employees: Employee[];
  /** The sum of their basic salaries, as a decimal string. */
  payroll: string;
  className?: string;
}

/** Each person's basic salary as a bar and a share of the payroll, so it is clear where the money goes. */
export function PayrollChart({
  employees,
  payroll,
  className,
}: PayrollChartProps) {
  const shown = employees.slice(0, SHOWN);
  const hidden = employees.length - shown.length;
  const highest = shown[0] ? toCentavos(shown[0].currentBasicSalary!) : 1n;
  const total = toCentavos(payroll);

  return (
    <section
      aria-labelledby="payroll-title"
      className={cx(
        'min-w-0 rounded-lg border border-neutral-200 bg-neutral-0 p-6 shadow-sm',
        className,
      )}
    >
      <h2 id="payroll-title" className="text-sm font-medium text-neutral-600">
        Payroll by employee
      </h2>
      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No salaries assigned yet. Once there are, you will see who the payroll
          goes to.
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-4">
            {shown.map((employee) => {
              const salary = toCentavos(employee.currentBasicSalary!);
              // One decimal place: 352 -> "35.2%".
              const share = Number((salary * 1000n) / total) / 10;
              return (
                <li key={employee.id}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate font-medium text-neutral-900">
                      {fullName(employee)}
                    </span>
                    <span className="num shrink-0 text-neutral-900">
                      {formatPeso(employee.currentBasicSalary!)}
                      <span className="ml-2 text-xs text-neutral-600">
                        {share}%
                      </span>
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${fullName(employee)}: ${share}% of the payroll`}
                    className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"
                  >
                    <div
                      style={{
                        width: `${Number((salary * 1000n) / highest) / 10}%`,
                      }}
                      className="h-full origin-left animate-bar-fill rounded-full bg-primary-600"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {hidden > 0 && (
            <p className="mt-4 text-sm text-neutral-600">
              and {hidden} more, in the table on the Employees page
            </p>
          )}
        </>
      )}
    </section>
  );
}
