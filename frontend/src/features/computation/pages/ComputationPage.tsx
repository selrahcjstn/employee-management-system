import { useParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso } from '../../../shared/lib/format';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { CalculatorIcon } from '../../../shared/ui/icons';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useComputation } from '../api/queries';
import type { Computation } from '../types';

/** The divisor is a fixed rule (PRD FR-4.6), stated here only so the page can say it. */
const WORKING_DAYS = 314;

const CARD = 'rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm';

function Row({
  label,
  hint,
  value,
  emphasis = false,
}: {
  label: string;
  hint?: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? 'flex items-center justify-between gap-4 border-t border-neutral-200 bg-primary-50 px-6 py-4'
          : 'flex items-center justify-between gap-4 px-6 py-4'
      }
    >
      <dt className="min-w-0">
        <span
          className={
            emphasis
              ? 'text-sm font-semibold text-neutral-900'
              : 'text-sm font-medium text-neutral-900'
          }
        >
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-xs text-neutral-600">{hint}</span>
        )}
      </dt>
      <dd
        className={
          emphasis
            ? 'num shrink-0 text-lg font-semibold text-neutral-900'
            : 'num shrink-0 text-sm font-medium text-neutral-900'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Breakdown({ data }: { data: Computation }) {
  return (
    <section aria-labelledby="breakdown-title" className={CARD}>
      <h2
        id="breakdown-title"
        className="border-b border-neutral-200 p-6 text-sm font-medium text-neutral-600"
      >
        Monthly breakdown
      </h2>
      <dl className="divide-y divide-neutral-200">
        <Row label="Basic salary" value={formatPeso(data.basicSalary!)} />
        {data.components.length === 0 ? (
          <div className="px-6 py-4 text-sm text-neutral-600">
            No components added.
          </div>
        ) : (
          data.components.map((component) => (
            <Row
              key={component.name}
              label={component.name}
              value={formatPeso(component.amount)}
            />
          ))
        )}
        <Row
          emphasis
          label="Total monthly salary"
          value={formatPeso(data.monthlyTotal!)}
        />
      </dl>
    </section>
  );
}

function Rates({ data }: { data: Computation }) {
  return (
    <section aria-labelledby="rates-title" className={CARD}>
      <h2
        id="rates-title"
        className="border-b border-neutral-200 p-6 text-sm font-medium text-neutral-600"
      >
        Salary rates
      </h2>
      <dl className="divide-y divide-neutral-200">
        <Row
          label="Annual"
          hint="Monthly total × 12"
          value={formatPeso(data.annualSalary!)}
        />
        <Row
          label="Daily"
          hint={`Annual ÷ ${WORKING_DAYS}`}
          value={formatPeso(data.dailyRate!)}
        />
        <Row
          label="Hourly"
          hint="Daily ÷ 8"
          value={formatPeso(data.hourlyRate!)}
        />
        <Row
          label="Per minute"
          hint="Hourly ÷ 60"
          value={formatPeso(data.perMinuteRate!)}
        />
      </dl>
      <p className="border-t border-neutral-200 px-6 py-4 text-xs text-neutral-600">
        Daily rate uses {WORKING_DAYS} working days per year. Rates are worked
        out at full precision and rounded only for display.
      </p>
    </section>
  );
}

function ComputationSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading computation"
      className="grid gap-6 lg:grid-cols-2"
    >
      {[0, 1].map((index) => (
        <div key={index} className={`${CARD} p-6`}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-6 h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/** The Computation tab: the breakdown and the four rates, as the server worked them out. */
export function ComputationPage() {
  const { id = '' } = useParams();
  const computation = useComputation(id);

  if (computation.isError) {
    return (
      <Alert>
        <p>{parseApiError(computation.error).message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          loading={computation.isFetching}
          onClick={() => computation.refetch()}
        >
          Retry
        </Button>
      </Alert>
    );
  }
  if (!computation.data) return <ComputationSkeleton />;

  const data = computation.data;
  if (data.basicSalary === null) {
    return (
      <section className={CARD}>
        <EmptyState
          icon={<CalculatorIcon size={48} />}
          title="No salary to compute yet"
          description="Rates are worked out from the basic salary plus any components. Assign a basic salary first."
          action={
            <LinkButton variant="secondary" to={`/employees/${id}/salary`}>
              Go to Salary
            </LinkButton>
          }
        />
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Breakdown data={data} />
      <Rates data={data} />
    </div>
  );
}
