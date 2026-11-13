import { useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { cx } from '../../../shared/lib/cx';
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
  // The page belongs to the search it was chosen in, so a new search starts on page 1 without an effect.
  const [pageState, setPageState] = useState({ query: '', page: 1 });
  const page = pageState.query === query ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ query, page: next });
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const employees = useEmployees(query);

  const rows = employees.data ?? [];
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
      <div className="p-6">
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
  } else if (rows.length === 0 && query === '') {
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
        title={`No employees match “${query}”`}
        description="Check the spelling, or search by Employee ID."
        action={
          <Button variant="secondary" onClick={() => setSearch('')}>
            Clear search
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
            The people you have onboarded. Their basic salary is set on the
            Salary page.
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={openAdd}>
          Add employee
        </Button>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm">
        <div className="border-b border-neutral-200 p-4">
          <TextField
            type="search"
            label="Search employees"
            hideLabel
            placeholder="Search by name or Employee ID"
            autoComplete="off"
            startAdornment={<SearchIcon />}
            className="max-w-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
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
