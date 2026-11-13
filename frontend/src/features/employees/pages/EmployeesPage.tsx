import { useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { cx } from '../../../shared/lib/cx';
import { usePageTitle } from '../../../shared/lib/use-page-title';
import { useDebouncedValue } from '../../../shared/lib/use-debounced-value';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PlusIcon, SearchIcon, UsersIcon } from '../../../shared/ui/icons';
import { Pagination } from '../../../shared/ui/Pagination';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useEmployees } from '../api/queries';
import {
  EmployeeFormDialog,
  type SaveResult,
} from '../components/EmployeeFormDialog';
import {
  EmployeesTable,
  EmployeesTableSkeleton,
} from '../components/EmployeesTable';
import type { Employee } from '../types';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;

type DialogState = { open: false } | { open: true; employee: Employee | null };

const SAVED_MESSAGE: Record<SaveResult, string> = {
  created: 'Employee added',
  updated: 'Employee updated',
};

export function EmployeesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  // The page belongs to the search and filter it was chosen in, so changing either starts on page 1 without an effect.
  const view = `${query}|${unassignedOnly}`;
  const [pageState, setPageState] = useState({ view: '|false', page: 1 });
  const page = pageState.view === view ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ view, page: next });
  usePageTitle('Employees');
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const employees = useEmployees(query);

  const found = employees.data ?? [];
  const rows = unassignedOnly
    ? found.filter((employee) => employee.currentBasicSalary === null)
    : found;
  const lastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visible = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const openAdd = () => setDialog({ open: true, employee: null });

  let content;
  if (employees.isPending) {
    content = <EmployeesTableSkeleton />;
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
  } else if (found.length === 0 && query === '') {
    content = (
      <EmptyState
        icon={<UsersIcon size={48} />}
        title="No employees yet"
        description="Add the people you onboard here. You can set their salary once they are added."
        action={
          <Button icon={<PlusIcon />} onClick={openAdd}>
            Add employee
          </Button>
        }
      />
    );
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        icon={<SearchIcon size={48} />}
        title={
          query
            ? `No employees match “${query}”`
            : 'Everyone has a basic salary'
        }
        description={
          query
            ? 'Check the spelling, or search by Employee ID.'
            : 'No employee is waiting for a salary right now.'
        }
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setUnassignedOnly(false);
            }}
          >
            {unassignedOnly ? 'Clear filters' : 'Clear search'}
          </Button>
        }
      />
    );
  } else {
    content = (
      <>
        <div
          className={cx(
            'transition-opacity',
            employees.isPlaceholderData && 'opacity-60',
          )}
        >
          <EmployeesTable
            employees={visible}
            onEdit={(employee) => setDialog({ open: true, employee })}
          />
        </div>
        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Employees</h1>
          <p className="mt-2 text-sm text-neutral-600">
            The people you have onboarded. Open one to manage their salary,
            components and computation.
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={openAdd}>
          Add employee
        </Button>
      </div>

      <section className="mt-4 rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto border-b border-neutral-200 p-4">
          <TextField
            type="search"
            label="Search employees"
            hideLabel
            placeholder="Search by name or Employee ID"
            autoComplete="off"
            startAdornment={<SearchIcon />}
            className="max-w-sm min-w-40 flex-1"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="flex h-10 shrink-0 items-center gap-2 pl-2 text-sm whitespace-nowrap text-neutral-700">
            <input
              type="checkbox"
              checked={unassignedOnly}
              onChange={(event) => setUnassignedOnly(event.target.checked)}
              className="size-4 accent-primary-600"
            />
            Needs salary only
          </label>
        </div>
        {content}
      </section>

      {employees.isSuccess && (
        <p role="status" className="sr-only">
          {rows.length} {rows.length === 1 ? 'employee' : 'employees'} found
        </p>
      )}

      <EmployeeFormDialog
        open={dialog.open}
        employee={dialog.open ? dialog.employee : null}
        onClose={() => setDialog({ open: false })}
        onSaved={(result) => {
          setDialog({ open: false });
          toast.success(SAVED_MESSAGE[result]);
        }}
      />
    </>
  );
}
