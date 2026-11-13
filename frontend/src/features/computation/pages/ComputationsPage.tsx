import { useMemo, useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso, formatPesoRate } from '../../../shared/lib/format';
import {
  averageAmount,
  sumAmounts,
  toCentavos,
} from '../../../shared/lib/money';
import { usePageTitle } from '../../../shared/lib/use-page-title';
import {
  PAGE_SIZE,
  usePagedSearch,
} from '../../../shared/lib/use-paged-search';
import { Alert } from '../../../shared/ui/Alert';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { SegmentedFilter, SelectFilter } from '../../../shared/ui/filters';
import { CalculatorIcon, SearchIcon } from '../../../shared/ui/icons';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { ListCard } from '../../../shared/ui/ListCard';
import { MiniStat } from '../../../shared/ui/MiniStat';
import { Pagination } from '../../../shared/ui/Pagination';
import { Table, TableSkeleton, Td, Th } from '../../../shared/ui/Table';
import {
  EmployeeNameLink,
  EmployeeRow,
  RowChevron,
} from '../../employees/components/employee-row';
import { useComputations } from '../api/queries';
import type { ComputationSummary } from '../types';

const HEADERS = [
  { text: 'Employee' },
  { text: 'Monthly total', align: 'right' },
  { text: 'Annual', align: 'right' },
  { text: 'Daily', align: 'right' },
  { text: 'Hourly', align: 'right' },
  { text: 'Per-minute', align: 'right' },
  { text: 'Open', align: 'right' },
] as const;

type Status = 'all' | 'computed' | 'needs';
type Range = 'any' | 'under' | 'middle' | 'over';
type Sort = 'name' | 'high' | 'low';

/** The monthly-total ranges in centavos: under 25,000, 25,000 up to 50,000, and 50,000 or more. */
const LOW = 2_500_000n;
const HIGH = 5_000_000n;

const matches = (line: ComputationSummary, term: string) =>
  `${line.employee.employeeNo} ${line.employee.name}`
    .toLowerCase()
    .includes(term);

function inRange(line: ComputationSummary, range: Range): boolean {
  if (range === 'any') return true;
  if (line.monthlyTotal === null) return false;
  const total = toCentavos(line.monthlyTotal);
  if (range === 'under') return total < LOW;
  if (range === 'middle') return total >= LOW && total < HIGH;
  return total >= HIGH;
}

function byTotal(
  a: ComputationSummary,
  b: ComputationSummary,
  direction: 1 | -1,
) {
  // Employees without a total go last whichever way the list is sorted.
  if (a.monthlyTotal === null) return b.monthlyTotal === null ? 0 : 1;
  if (b.monthlyTotal === null) return -1;
  const difference = toCentavos(a.monthlyTotal) - toCentavos(b.monthlyTotal);
  return difference === 0n ? 0 : difference > 0n ? direction : -direction;
}

function Money({ amount, rate = false }: { amount: string; rate?: boolean }) {
  return (
    <span className="num whitespace-nowrap">
      {rate ? formatPesoRate(amount) : formatPeso(amount)}
    </span>
  );
}

/** Every employee's monthly total and rates in one table, with a summary and filters. A row opens that employee's Computation tab. */
export function ComputationsPage() {
  usePageTitle('Computation');
  const computations = useComputations();
  const [status, setStatus] = useState<Status>('all');
  const [range, setRange] = useState<Range>('any');
  const [sort, setSort] = useState<Sort>('name');

  const all = useMemo(() => computations.data ?? [], [computations.data]);
  const computed = all.filter((line) => line.monthlyTotal !== null);
  const needs = all.length - computed.length;

  const prepared = useMemo(() => {
    const kept = all.filter(
      (line) =>
        (status === 'all' ||
          (status === 'computed') === (line.monthlyTotal !== null)) &&
        inRange(line, range),
    );
    if (sort === 'name') return kept;
    return [...kept].sort((a, b) => byTotal(a, b, sort === 'high' ? -1 : 1));
  }, [all, status, range, sort]);
  const list = usePagedSearch(prepared, matches, `${status}|${range}|${sort}`);
  const filtering = status !== 'all' || range !== 'any' || list.term !== '';

  const clearFilters = () => {
    setStatus('all');
    setRange('any');
    list.setSearch('');
  };

  let content;
  if (computations.isPending) {
    content = (
      <TableSkeleton
        label="Loading computation"
        headers={HEADERS.map((header) => ({
          text: header.text,
          align: 'align' in header ? header.align : undefined,
        }))}
      />
    );
  } else if (computations.isError) {
    content = (
      <div className="p-4">
        <Alert>
          <p>{parseApiError(computations.error).message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            loading={computations.isFetching}
            onClick={() => computations.refetch()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  } else if (all.length === 0) {
    content = (
      <EmptyState
        icon={<CalculatorIcon size={48} />}
        title="No employees yet"
        description="Rates are worked out per employee. Add an employee first."
        action={
          <LinkButton variant="secondary" to="/employees">
            Go to Employees
          </LinkButton>
        }
      />
    );
  } else if (list.rows.length === 0) {
    content = (
      <EmptyState
        icon={<SearchIcon size={48} />}
        title="No employees match"
        description="Try a different search, or clear the filters."
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  } else {
    content = (
      <Table label="Computation">
        <thead>
          <tr>
            {HEADERS.map((header) => (
              <Th
                key={header.text}
                align={'align' in header ? header.align : undefined}
              >
                {header.text === 'Open' ? (
                  <span className="sr-only">Open</span>
                ) : (
                  header.text
                )}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.visible.map((line) => {
            const to = `/employees/${line.employee.id}/computation`;
            return (
              <EmployeeRow key={line.employee.id} to={to}>
                <Td>
                  <EmployeeNameLink
                    to={to}
                    name={line.employee.name}
                    employeeNo={line.employee.employeeNo}
                  />
                </Td>
                {line.monthlyTotal === null ? (
                  <Td align="right" colSpan={5}>
                    <Badge>Not assigned</Badge>
                  </Td>
                ) : (
                  <>
                    <Td align="right" className="font-semibold">
                      <Money amount={line.monthlyTotal} />
                    </Td>
                    <Td align="right">
                      <Money amount={line.annualSalary!} />
                    </Td>
                    <Td align="right">
                      <Money amount={line.dailyRate!} />
                    </Td>
                    <Td align="right">
                      <Money amount={line.hourlyRate!} />
                    </Td>
                    <Td align="right">
                      <Money amount={line.perMinuteRate!} rate />
                    </Td>
                  </>
                )}
                <RowChevron />
              </EmployeeRow>
            );
          })}
        </tbody>
      </Table>
    );
  }

  const monthly = computed.map((line) => line.monthlyTotal!);
  const average = averageAmount(monthly);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Computation</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Monthly total and salary rates of every employee, from their basic
          salary plus components. Open one for the full breakdown.
        </p>
      </div>

      {computations.isSuccess && all.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MiniStat
            label="Total monthly payroll"
            value={formatPeso(sumAmounts(monthly))}
            note={
              needs === 0
                ? 'Basic salary plus components'
                : `${needs} left out: no basic salary`
            }
            attention={needs > 0}
          />
          <MiniStat
            label="Total annual payroll"
            value={formatPeso(
              sumAmounts(computed.map((line) => line.annualSalary!)),
            )}
            note="Monthly total × 12"
          />
          <MiniStat
            label="Average monthly total"
            value={average ? formatPeso(average) : '—'}
            note={
              computed.length === 0
                ? 'No salaries yet'
                : `Across ${computed.length} ${computed.length === 1 ? 'employee' : 'employees'}`
            }
          />
        </div>
      )}

      <ListCard
        searchLabel="Search computation"
        placeholder="Search by name or Employee ID"
        search={list.search}
        onSearch={list.setSearch}
        toolbar={
          <>
            <SegmentedFilter
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All', count: all.length },
                {
                  value: 'computed',
                  label: 'Computed',
                  count: computed.length,
                },
                { value: 'needs', label: 'Needs salary', count: needs },
              ]}
            />
            <SelectFilter
              label="Total"
              value={range}
              onChange={setRange}
              options={[
                { value: 'any', label: 'Any amount' },
                { value: 'under', label: 'Under ₱25,000' },
                { value: 'middle', label: '₱25,000 to ₱50,000' },
                { value: 'over', label: '₱50,000 or more' },
              ]}
            />
            <SelectFilter
              label="Sort by"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'name', label: 'Employee ID' },
                { value: 'high', label: 'Total, high to low' },
                { value: 'low', label: 'Total, low to high' },
              ]}
            />
            {filtering && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 whitespace-nowrap"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </>
        }
        footer={
          computations.isSuccess && list.rows.length > 0 ? (
            <Pagination
              page={list.page}
              pageSize={PAGE_SIZE}
              total={list.rows.length}
              onPageChange={list.setPage}
            />
          ) : undefined
        }
      >
        {content}
      </ListCard>
    </>
  );
}
