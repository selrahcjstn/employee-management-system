import { useState } from 'react';
import { useParams } from 'react-router';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ListIcon } from '../../../shared/ui/icons';
import { useEmployee } from '../../employees/api/queries';
import { fullName } from '../../employees/types';
import { useEmployeeComponents } from '../api/queries';
import { AddComponentForm } from '../components/AddComponentForm';
import { ComponentsOverview } from '../components/ComponentsOverview';
import {
  ComponentsTable,
  ComponentsTableSkeleton,
} from '../components/ComponentsTable';
import { RemoveDialog } from '../components/RemoveDialog';
import { RenameDialog } from '../components/RenameDialog';
import type { EmployeeComponent } from '../types';

/** Names offered when there is nothing yet. They only fill the form; the person still gives the amount. */
const SUGGESTIONS = ['Rice Allowance', 'Transportation', 'Meal Allowance'];

/** The Components tab of an employee workspace: add, edit, rename and remove their components. */
export function EmployeeComponentsPage() {
  const { id: employeeId = '' } = useParams();
  const components = useEmployeeComponents(employeeId);
  const employee = useEmployee(employeeId).data;
  const [renaming, setRenaming] = useState<EmployeeComponent | null>(null);
  const [removing, setRemoving] = useState<EmployeeComponent | null>(null);
  // A name picked from the empty state's suggestions, to start the add form with.
  const [suggestion, setSuggestion] = useState<string | undefined>();

  if (components.isError) {
    return (
      <div>
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
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-neutral-600">Start with</span>
            {SUGGESTIONS.map((name) => (
              <Button
                key={name}
                variant="secondary"
                size="sm"
                onClick={() => setSuggestion(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        }
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
    <div className="flex flex-col gap-4">
      {items !== undefined && items.length > 0 && (
        <ComponentsOverview items={items} />
      )}
      {items !== undefined && (
        <AddComponentForm
          key={suggestion ?? ''}
          employeeId={employeeId}
          assigned={items}
          initialName={suggestion}
        />
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
