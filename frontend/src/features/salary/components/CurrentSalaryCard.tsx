import { formatPeso, formatTimestamp } from '../../../shared/lib/format';
import { Skeleton } from '../../../shared/ui/Skeleton';
import type { Salary } from '../types';

interface CurrentSalaryCardProps {
  /** The active salary, null when none is assigned, undefined while loading. */
  salary: Salary | null | undefined;
}

export function CurrentSalaryCard({ salary }: CurrentSalaryCardProps) {
  return (
    <section
      aria-labelledby="current-salary-title"
      className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm"
    >
      <h2
        id="current-salary-title"
        className="text-sm font-medium text-neutral-600"
      >
        Current basic salary
      </h2>
      {salary === undefined ? (
        <div role="status" aria-label="Loading current salary" className="mt-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      ) : salary === null ? (
        <>
          <p className="mt-4 text-lg font-semibold text-neutral-900">
            No salary assigned yet
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Enter the monthly amount to assign one.
          </p>
        </>
      ) : (
        <>
          <p className="num mt-4 text-3xl font-semibold text-neutral-900">
            {formatPeso(salary.monthlyBasicSalary)}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            per month, since {formatTimestamp(salary.createdAt)}
          </p>
        </>
      )}
    </section>
  );
}
