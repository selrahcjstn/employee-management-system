import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from '../../../shared/lib/cx';
import { formatPeso } from '../../../shared/lib/format';
import { todayInManila } from '../../../shared/lib/today';
import { AnimatedNumber } from '../../../shared/ui/AnimatedNumber';
import {
  CalculatorIcon,
  CheckCircleIcon,
  UsersIcon,
  WalletIcon,
} from '../../../shared/ui/icons';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { centavosToAmount, toCentavos } from '../../../shared/lib/money';
import { computeStats, type EmployeeStats } from '../stats';
import type { Employee } from '../../employees/types';
import { AtAGlance } from './AtAGlance';
import { NeedsAttention } from './NeedsAttention';
import { PayrollChart } from './PayrollChart';
import { RecentHires } from './RecentHires';

const pesos = (centavos: number) =>
  formatPeso(centavosToAmount(BigInt(centavos)));

interface StatCardProps {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  note: ReactNode;
  children?: ReactNode;
}

function StatCard({ label, icon, value, note, children }: StatCardProps) {
  return (
    <article
      aria-label={label}
      className="min-w-0 rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm transition hover:-translate-y-px hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-neutral-600">{label}</h2>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
          {icon}
        </span>
      </div>
      <p className="num mt-4 text-3xl font-semibold text-neutral-900">
        {value}
      </p>
      {children}
      <p className="mt-2 text-sm text-neutral-600">{note}</p>
    </article>
  );
}

function StatsSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-4 h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Cards({ stats }: { stats: EmployeeStats }) {
  const missing = stats.withoutSalary.length;
  const percent =
    stats.total === 0 ? 0 : Math.round((stats.withSalary / stats.total) * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total employees"
        icon={<UsersIcon />}
        value={<AnimatedNumber value={stats.total} />}
        note={
          stats.hiredRecently > 0
            ? `${stats.hiredRecently} hired in the last 30 days`
            : 'No new hires in the last 30 days'
        }
      />
      <StatCard
        label="Monthly basic payroll"
        icon={<WalletIcon />}
        value={
          <AnimatedNumber
            value={Number(toCentavos(stats.payroll))}
            format={pesos}
          />
        }
        note="Basic salary only, components not included"
      />
      <StatCard
        label="Average basic salary"
        icon={<CalculatorIcon />}
        value={
          stats.average === null ? (
            '—'
          ) : (
            <AnimatedNumber
              value={Number(toCentavos(stats.average))}
              format={pesos}
            />
          )
        }
        note={
          stats.withSalary === 0
            ? 'No salaries assigned yet'
            : `Across ${stats.withSalary} ${stats.withSalary === 1 ? 'employee' : 'employees'} with a salary`
        }
      />
      <StatCard
        label="Salary assigned"
        icon={<CheckCircleIcon />}
        value={
          <>
            <AnimatedNumber value={stats.withSalary} />
            <span className="ml-2 text-lg font-medium text-neutral-600">
              of {stats.total}
            </span>
          </>
        }
        note={
          missing === 0 ? (
            stats.total === 0 ? (
              'Add an employee to get started'
            ) : (
              'Everyone has a basic salary'
            )
          ) : (
            <Link
              to="/employees"
              className="font-medium text-warning underline-offset-2 hover:underline"
            >
              {missing} still {missing === 1 ? 'needs' : 'need'} a salary
            </Link>
          )
        }
      >
        <div
          role="progressbar"
          aria-label="Employees with a salary"
          aria-valuemin={0}
          aria-valuemax={stats.total}
          aria-valuenow={stats.withSalary}
          className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200"
        >
          <div
            style={{ width: `${percent}%` }}
            className={cx(
              'h-full origin-left animate-bar-fill rounded-full',
              missing === 0 ? 'bg-success' : 'bg-primary-600',
            )}
          />
        </div>
      </StatCard>
    </div>
  );
}

/**
 * The numbers an admin wants at a glance, worked out from the whole employee list (not the
 * search), so they always agree with the table below. `undefined` while the list loads.
 */
export function DashboardOverview({
  employees,
}: {
  employees: Employee[] | undefined;
}) {
  if (!employees) return <StatsSkeleton />;
  const today = todayInManila();
  const stats = computeStats(employees, today);

  return (
    <div className="flex flex-col gap-4">
      <Cards stats={stats} />
      <div className="grid gap-4 xl:grid-cols-3">
        <PayrollChart
          employees={stats.bySalary}
          payroll={stats.payroll}
          className="xl:col-span-2"
        />
        <NeedsAttention
          employees={stats.withoutSalary}
          total={stats.total}
          today={today}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <RecentHires employees={stats.recentHires} className="xl:col-span-2" />
        <AtAGlance salaryRange={stats.salaryRange} tenure={stats.tenure} />
      </div>
    </div>
  );
}
