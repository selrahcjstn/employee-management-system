import { useMemo, useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso, formatTimestamp } from '../../../shared/lib/format';
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
import { SearchIcon, WalletIcon } from '../../../shared/ui/icons';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { ListCard } from '../../../shared/ui/ListCard';
import { MiniStat } from '../../../shared/ui/MiniStat';
import { Pagination } from '../../../shared/ui/Pagination';
import { Table, TableSkeleton, Td, Th } from '../../../shared/ui/Table';
import { useEmployees } from '../../employees/api/queries';
import {
  EmployeeNameLink,
  EmployeeRow,
  EmployeeStatusBadge,
  RowChevron,
} from '../../employees/components/employee-row';
import { fullName, type Employee } from '../../employees/types';

const HEADERS = [
  { text: 'Employee' },
  { text: 'Basic salary', align: 'right' },
  { text: 'Last adjusted' },
  { text: 'Status' },
  { text: 'Open', align: 'right' },
] as const;

type Status = 'all' | 'ready' | 'needs';
type Adjusted = 'any' | '30' | '90' | 'year';
type Sort = 'name' | 'high' | 'low' | 'recent';

const DAY_MS = 86_400_000;

const matches = (employee: Employee, term: string) =>
  `${employee.employeeNo} ${fullName(employee)}`.toLowerCase().includes(term);

/** Whether the salary was assigned within (or before) the chosen window. Employees without a salary were never adjusted. */
function adjustedMatches(employee: Employee, adjusted: Adjusted, now: number) {
  if (adjusted === 'any') return true;
  if (!employee.basicSalarySince) return false;
  const age = now - new Date(employee.basicSalarySince).getTime();
  if (adjusted === '30') return age <= 30 * DAY_MS;
  if (adjusted === '90') return age <= 90 * DAY_MS;
  return age > 365 * DAY_MS;
}

function bySalary(a: Employee, b: Employee, direction: 1 | -1): number {
  // Employees without a salary go last whichever way the list is sorted.
  if (!a.currentBasicSalary) return b.currentBasicSalary ? 1 : 0;
  if (!b.currentBasicSalary) return -1;
  const difference =
    toCentavos(a.currentBasicSalary) - toCentavos(b.currentBasicSalary);
  return difference === 0n ? 0 : difference > 0n ? direction : -direction;
}

function sortRows(rows: Employee[], sort: Sort): Employee[] {
  if (sort === 'name') return rows;
  const sorted = [...rows];
  if (sort === 'high') return sorted.sort((a, b) => bySalary(a, b, -1));
  if (sort === 'low') return sorted.sort((a, b) => bySalary(a, b, 1));
  return sorted.sort((a, b) =>
    (b.basicSalarySince ?? '').localeCompare(a.basicSalarySince ?? ''),
  );
}

/** Every employee's basic salary in one table, with a summary and filters. A row opens that employee's Salary tab. */
export function SalariesPage() {
  usePageTitle('Salaries');
  const employees = useEmployees('');
  const [status, setStatus] = useState<Status>('all');
  const [adjusted, setAdjusted] = useState<Adjusted>('any');
  const [sort, setSort] = useState<Sort>('name');
  // "Last 30 days" counts back from when the page was opened.
  const [now] = useState(() => Date.now());

  const all = useMemo(() => employees.data ?? [], [employees.data]);
  const withSalary = all.filter((employee) => employee.currentBasicSalary);
  const needs = all.length - withSalary.length;

  const prepared = useMemo(() => {
    return sortRows(
      all.filter(
        (employee) =>
          (status === 'all' ||
            (status === 'ready') === (employee.currentBasicSalary !== null)) &&
          adjustedMatches(employee, adjusted, now),
      ),
      sort,
    );
  }, [all, status, adjusted, sort, now]);
  const list = usePagedSearch(
    prepared,
    matches,
    `${status}|${adjusted}|${sort}`,
  );
  const filtering = status !== 'all' || adjusted !== 'any' || list.term !== '';

  const clearFilters = () => {
    setStatus('all');
    setAdjusted('any');
    list.setSearch('');
  };

  let content;
  if (employees.isPending) {
    content = (
      <TableSkeleton
        label="Loading salaries"
        headers={HEADERS.map((header) => ({
          text: header.text,
          align: 'align' in header ? header.align : undefined,
        }))}
      />
    );
  } else if (employees.isError) {
    content = (
      <div className="p-4">
        <Alert>
          <p>{parseApiError(employees.error).message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            loading={employees.isFetching}
            onClick={() => employees.refetch()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  } else if (all.length === 0) {
    content = (
      <EmptyState
        icon={<WalletIcon size={48} />}
        title="No employees yet"
        description="Salaries are set per employee. Add an employee first."
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
        title="No salaries match"
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
      <Table label="Salaries">
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
          {list.visible.map((employee) => {
            const to = `/employees/${employee.id}/salary`;
            return (
              <EmployeeRow key={employee.id} to={to}>
                <Td>
                  <EmployeeNameLink
                    to={to}
                    name={fullName(employee)}
                    employeeNo={employee.employeeNo}
                  />
                </Td>
                <Td align="right">
                  {employee.currentBasicSalary ? (
                    <span className="num font-semibold whitespace-nowrap">
                      {formatPeso(employee.currentBasicSalary)}
                    </span>
                  ) : (
                    <Badge>Not assigned</Badge>
                  )}
                </Td>
                <Td className="whitespace-nowrap">
                  {employee.basicSalarySince ? (
                    formatTimestamp(employee.basicSalarySince)
                  ) : (
                    <span
                      aria-label="Never adjusted"
                      className="text-neutral-500"
                    >
                      —
                    </span>
                  )}
                </Td>
                <Td>
                  <EmployeeStatusBadge
                    hasSalary={employee.currentBasicSalary !== null}
                  />
                </Td>
                <RowChevron />
              </EmployeeRow>
            );
          })}
        </tbody>
      </Table>
    );
  }

  const amounts = withSalary.map((employee) => employee.currentBasicSalary!);
  const average = averageAmount(amounts);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Salaries</h1>
        <p className="mt-2 text-sm text-neutral-600">
          The basic salary of every employee. Open one to assign or adjust it.
        </p>
      </div>

      {employees.isSuccess && all.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MiniStat
            label="Salaries assigned"
            value={`${withSalary.length} of ${all.length}`}
            note={
              needs === 0
                ? 'Everyone has a basic salary'
                : `${needs} still need one`
            }
            attention={needs > 0}
          />
          <MiniStat
            label="Total basic payroll"
            value={formatPeso(sumAmounts(amounts))}
            note="Per month, before components"
          />
          <MiniStat
            label="Average basic salary"
            value={average ? formatPeso(average) : '—'}
            note={
              withSalary.length === 0
                ? 'No salaries yet'
                : `Across ${withSalary.length} ${withSalary.length === 1 ? 'employee' : 'employees'}`
            }
          />
        </div>
      )}

      <ListCard
        searchLabel="Search salaries"
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
                { value: 'ready', label: 'Ready', count: withSalary.length },
                { value: 'needs', label: 'Needs salary', count: needs },
              ]}
            />
            <SelectFilter
              label="Adjusted"
              value={adjusted}
              onChange={setAdjusted}
              options={[
                { value: 'any', label: 'Any time' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: 'year', label: 'Over a year ago' },
              ]}
            />
            <SelectFilter
              label="Sort by"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'name', label: 'Employee ID' },
                { value: 'high', label: 'Salary, high to low' },
                { value: 'low', label: 'Salary, low to high' },
                { value: 'recent', label: 'Recently adjusted' },
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
          employees.isSuccess && list.rows.length > 0 ? (
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
