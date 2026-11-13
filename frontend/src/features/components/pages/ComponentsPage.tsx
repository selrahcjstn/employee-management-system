import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ListIcon } from '../../../shared/ui/icons';
import { useEmployees } from '../../employees/api/queries';
import { EmployeePicker } from '../../employees/components/EmployeePicker';
import { fullName } from '../../employees/types';
import { useEmployeeComponents } from '../api/queries';
import { AddComponentForm } from '../components/AddComponentForm';
import {
  ComponentsTable,
  ComponentsTableSkeleton,
} from '../components/ComponentsTable';
import { RemoveDialog } from '../components/RemoveDialog';
import { RenameDialog } from '../components/RenameDialog';
import type { EmployeeComponent } from '../types';

/** The chosen employee lives in the address (?employee=<id>), so a refresh or a shared link keeps it. */
export function ComponentsPage() {
  const [params, setParams] = useSearchParams();
  const employeeId = params.get('employee');

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Components</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Allowances and other amounts added on top of an employee's basic
          salary. Pick an employee to manage theirs.
        </p>
      </div>

      <EmployeePicker
        className="mt-6 max-w-sm"
        value={employeeId}
        onChange={(id) => setParams({ employee: id })}
      />

      {employeeId ? (
        <EmployeeComponents key={employeeId} employeeId={employeeId} />
      ) : (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm">
          <EmptyState
            icon={<ListIcon size={48} />}
            title="Choose an employee"
            description="Pick someone above to see their components, add one, or change an amount."
          />
        </section>
      )}
    </>
  );
}

function EmployeeComponents({ employeeId }: { employeeId: string }) {
  const components = useEmployeeComponents(employeeId);
  const employees = useEmployees('');
  const employee = employees.data?.find((entry) => entry.id === employeeId);
  const [renaming, setRenaming] = useState<EmployeeComponent | null>(null);
  const [removing, setRemoving] = useState<EmployeeComponent | null>(null);

  if (components.isError) {
    return (
      <div className="mt-6">
        <Alert>
          <p>{parseApiError(components.error).message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            loading={components.isFetching}
            onClick={() => components.refetch()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  const items = components.data;
  let content;
  if (items === undefined) {
    content = <ComponentsTableSkeleton />;
  } else if (items.length === 0) {
    content = (
      <EmptyState
        icon={<ListIcon size={48} />}
        title="No components yet"
        description="Add one above, such as Rice Allowance or Transportation. Each has its own amount."
      />
    );
  } else {
    content = (
      <ComponentsTable
        employeeId={employeeId}
        items={items}
        onRename={setRenaming}
        onRemove={setRemoving}
      />
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {items !== undefined && (
        <AddComponentForm employeeId={employeeId} assigned={items} />
      )}
      <section
        aria-label="Assigned components"
        className="rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm"
      >
        {content}
      </section>
      <RenameDialog item={renaming} onClose={() => setRenaming(null)} />
      <RemoveDialog
        employeeId={employeeId}
        employeeName={employee ? fullName(employee) : 'this employee'}
        item={removing}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
