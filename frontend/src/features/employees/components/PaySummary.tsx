import type { ReactNode } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso } from '../../../shared/lib/format';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useComputation } from '../../computation/api/queries';

function Figure({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-neutral-600">{label}</dt>
      <dd className="num mt-1 min-h-8 text-lg font-semibold text-neutral-900">
        {children}
      </dd>
    </div>
  );
}

/**
 * Basic salary, components total and monthly total, as the server's computation reports them, so
 * the header never does its own sums. It refreshes by itself when a salary or component is saved.
 */
export function PaySummary({ employeeId }: { employeeId: string }) {
  const computation = useComputation(employeeId);

  if (computation.isError) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
        <p>{parseApiError(computation.error).message}</p>
        <Button
          variant="secondary"
          size="sm"
          loading={computation.isFetching}
          onClick={() => computation.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const data = computation.data;
  return (
    <dl
      aria-label="Pay summary"
      aria-busy={data ? undefined : true}
      className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 md:grid-cols-3"
    >
      <Figure label="Basic salary">
        {!data ? (
          <Skeleton className="h-6 w-28" />
        ) : data.basicSalary === null ? (
          <Badge>Not assigned</Badge>
        ) : (
          formatPeso(data.basicSalary)
        )}
      </Figure>
      <Figure label="Components total">
        {!data ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          formatPeso(data.componentsTotal)
        )}
      </Figure>
      <Figure
        label="Monthly total"
        className="col-span-2 rounded-md bg-primary-50 p-4 md:col-span-1"
      >
        {!data ? (
          <Skeleton className="h-6 w-32" />
        ) : data.monthlyTotal === null ? (
          '—'
        ) : (
          formatPeso(data.monthlyTotal)
        )}
      </Figure>
    </dl>
  );
}
