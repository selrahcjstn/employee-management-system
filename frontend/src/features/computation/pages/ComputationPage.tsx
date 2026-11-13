import { useParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso } from '../../../shared/lib/format';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { CalculatorIcon } from '../../../shared/ui/icons';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useComputation } from '../api/queries';
import type { Computation } from '../types';

/** The divisor is a fixed rule (PRD FR-4.6), stated here only so the page can say it. */
const WORKING_DAYS = 314;

const CARD = 'rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm';
const CARD_TITLE = 'text-sm font-medium text-neutral-600';

function BreakdownRow({
  label,
  amount,
  emphasis = false,
}: {
  label: string;
  amount: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? 'flex items-center justify-between gap-4 border-t border-neutral-200 bg-primary-50 px-4 py-4'
          : 'flex items-center justify-between gap-4 px-4 py-4'
      }
    >
      <dt
        className={
          emphasis
            ? 'text-sm font-semibold text-neutral-900'
            : 'text-sm font-medium text-neutral-900'
        }
      >
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? 'num shrink-0 text-lg font-semibold text-neutral-900'
            : 'num shrink-0 text-sm font-medium text-neutral-900'
        }
      >
        {formatPeso(amount)}
      </dd>
    </div>
  );
}

function Breakdown({ data }: { data: Computation }) {
  return (
    <section aria-labelledby="breakdown-title" className={CARD}>
      <h2
        id="breakdown-title"
        className={`${CARD_TITLE} border-b border-neutral-200 p-4`}
      >
        Monthly breakdown
      </h2>
      <dl className="divide-y divide-neutral-200">
        <BreakdownRow label="Basic salary" amount={data.basicSalary!} />
        {data.components.length === 0 ? (
          <div className="px-4 py-4 text-sm text-neutral-600">
            No components added.
          </div>
        ) : (
          data.components.map((component) => (
            <BreakdownRow
              key={component.name}
              label={component.name}
              amount={component.amount}
            />
          ))
        )}
        <BreakdownRow
          emphasis
          label="Total monthly salary"
          amount={data.monthlyTotal!}
        />
      </dl>
    </section>
  );
}

interface RateRow {
  label: string;
  formula: string;
  meaning: string;
  amount: string;
}

/** Each rate comes from the one before it: monthly to annual to daily to hourly to per minute. */
function rateRows(data: Computation): RateRow[] {
  return [
    {
      label: 'Annual',
      formula: 'Monthly total × 12',
      meaning: 'Everything paid in a year',
      amount: data.annualSalary!,
    },
    {
      label: 'Daily',
      formula: `Annual ÷ ${WORKING_DAYS}`,
      meaning: 'One working day',
      amount: data.dailyRate!,
    },
    {
      label: 'Hourly',
      formula: 'Daily ÷ 8',
      meaning: 'One hour of an 8-hour day',
      amount: data.hourlyRate!,
    },
    {
      label: 'Per minute',
      formula: 'Hourly ÷ 60',
      meaning: 'One minute of work',
      amount: data.perMinuteRate!,
    },
  ];
}

function Rates({ data }: { data: Computation }) {
  return (
    <section aria-labelledby="rates-title" className={CARD}>
      <h2
        id="rates-title"
        className={`${CARD_TITLE} border-b border-neutral-200 p-4`}
      >
        Salary rates
      </h2>
      <dl className="divide-y divide-neutral-200">
        {rateRows(data).map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 px-4 py-4"
          >
            <dt className="min-w-0">
              <span className="text-sm font-medium text-neutral-900">
                {row.label}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                  {row.formula}
                </span>
                <span className="text-xs text-neutral-600">{row.meaning}</span>
              </span>
            </dt>
            <dd className="num shrink-0 text-lg font-semibold text-neutral-900">
              {formatPeso(row.amount)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-neutral-200 px-4 py-4 text-xs text-neutral-600">
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
      className="grid gap-4 xl:grid-cols-2"
    >
      {[0, 1].map((index) => (
        <div key={index} className={`${CARD} p-4`}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-4 h-4 w-3/4" />
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
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <Breakdown data={data} />
      <Rates data={data} />
    </div>
  );
}
