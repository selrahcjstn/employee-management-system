import { useState } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso } from '../../../shared/lib/format';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { useToast } from '../../../shared/ui/useToast';
import { useRemoveComponent } from '../api/queries';
import type { EmployeeComponent } from '../types';

interface RemoveBodyProps {
  employeeId: string;
  item: EmployeeComponent;
  onClose: () => void;
}

function RemoveBody({ employeeId, item, onClose }: RemoveBodyProps) {
  const toast = useToast();
  const remove = useRemoveComponent(employeeId);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setError(null);
    try {
      await remove.mutateAsync(item.id);
      toast.success('Component removed');
      onClose();
    } catch (failure) {
      setError(parseApiError(failure).message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <p className="text-sm text-neutral-600">
        {item.name} ({formatPeso(item.amount)}) will no longer count towards
        their salary. Other employees who have it keep it, and you can add it
        again later.
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
          Remove
        </Button>
      </div>
    </div>
  );
}

interface RemoveDialogProps {
  employeeId: string;
  employeeName: string;
  /** The component to remove, or null while the dialog is closed. */
  item: EmployeeComponent | null;
  onClose: () => void;
}

/** Asks first, because removing changes the employee's computed salary. */
export function RemoveDialog({
  employeeId,
  employeeName,
  item,
  onClose,
}: RemoveDialogProps) {
  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      title="Remove component"
      description={
        item ? `Remove ${item.name} from ${employeeName}?` : undefined
      }
    >
      {item && (
        <RemoveBody employeeId={employeeId} item={item} onClose={onClose} />
      )}
    </Dialog>
  );
}
