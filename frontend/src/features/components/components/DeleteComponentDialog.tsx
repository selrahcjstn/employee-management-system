import { useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { useToast } from '../../../shared/ui/useToast';
import { useDeleteComponent } from '../api/queries';
import type { CatalogComponent } from '../types';

function DeleteBody({
  item,
  onClose,
}: {
  item: CatalogComponent;
  onClose: () => void;
}) {
  const toast = useToast();
  const remove = useDeleteComponent();
  const [error, setError] = useState<string | null>(null);
  const { usageCount } = item;

  const confirm = async () => {
    setError(null);
    try {
      await remove.mutateAsync(item.id);
      toast.success('Component deleted');
      onClose();
    } catch (failure) {
      setError(parseApiError(failure).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <p className="text-sm text-neutral-600">
        {usageCount === 0
          ? 'No employee has this component, so only the name is removed.'
          : `It will also be removed from ${usageCount} ${usageCount === 1 ? 'employee' : 'employees'}, and their monthly totals will change.`}{' '}
        This cannot be undone from here.
      </p>
      <div className="mt-2 flex justify-end gap-2">
        <Button
          variant="secondary"
          disabled={remove.isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          autoFocus
          loading={remove.isPending}
          onClick={confirm}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

/** Asks first: deleting a component takes it off every employee that has it. */
export function DeleteComponentDialog({
  item,
  onClose,
}: {
  /** The component to delete, or null while the dialog is closed. */
  item: CatalogComponent | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      title="Delete component"
      description={item ? `Delete ${item.name}?` : undefined}
    >
      {item && <DeleteBody item={item} onClose={onClose} />}
    </Dialog>
  );
}
