import { formatDate, formatPeso } from '../../../shared/lib/format';
import { fullName } from '../../employees/types';
import type { EmployeeStats } from '../stats';

/** "1.7 years", or months while the team is under a year old. */
function formatTenure(years: number): string {
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

function Row({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <dt className="text-xs text-neutral-600">{label}</dt>
      <dd className="num mt-1 text-lg font-semibold text-neutral-900">
        {value}
      </dd>
      {detail && (
        <dd className="truncate text-xs text-neutral-600">{detail}</dd>
      )}
    </div>
  );
}

type AtAGlanceProps = Pick<EmployeeStats, 'salaryRange' | 'tenure'>;

/** The spread of pay and how long people have stayed: what the cards above do not show. */
export function AtAGlance({ salaryRange, tenure }: AtAGlanceProps) {
  const empty = salaryRange === null && tenure === null;

  return (
    <section
      aria-labelledby="glance-title"
      className="min-w-0 rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm"
    >
      <h2 id="glance-title" className="text-sm font-medium text-neutral-600">
        At a glance
      </h2>
      {empty ? (
        <p className="mt-4 text-sm text-neutral-600">
          Salary range and tenure show up once you add employees and assign
          salaries.
        </p>
      ) : (
        <dl className="mt-4 divide-y divide-neutral-200">
          {salaryRange && (
            <>
              <Row
                label="Highest salary"
                value={formatPeso(salaryRange.highest.currentBasicSalary!)}
                detail={fullName(salaryRange.highest)}
              />
              <Row
                label="Median salary"
                value={formatPeso(salaryRange.median)}
              />
              <Row
                label="Lowest salary"
                value={formatPeso(salaryRange.lowest.currentBasicSalary!)}
                detail={fullName(salaryRange.lowest)}
              />
            </>
          )}
          {tenure && (
            <>
              <Row
                label="Average tenure"
                value={formatTenure(tenure.averageYears)}
              />
              <Row
                label="Longest serving"
                value={fullName(tenure.longest)}
                detail={`Since ${formatDate(tenure.longest.dateHired)}`}
              />
            </>
          )}
        </dl>
      )}
    </section>
  );
}
