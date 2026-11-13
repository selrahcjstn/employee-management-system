import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useRenameComponent } from '../api/queries';
import { renameFormSchema, type RenameFormValues } from '../schemas';

/** What a rename needs: the catalog entry's id and its current name. An assigned component fits. */
export interface RenameTarget {
  componentId: string;
  name: string;
}

interface RenameFormProps {
  item: RenameTarget;
  onClose: () => void;
}

/** Mounted only while the dialog is open, so each opening starts from the current name. */
function RenameForm({ item, onClose }: RenameFormProps) {
  const toast = useToast();
  const rename = useRenameComponent();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RenameFormValues>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: { name: item.name },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    setServerError(null);
    if (name === item.name) {
      onClose();
      return;
    }
    try {
      await rename.mutateAsync({ componentId: item.componentId, name });
      toast.success('Component renamed');
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        // Another active component already has this name, in the API's own words.
        setError('name', { message: parsed.message }, { shouldFocus: true });
      } else if (parsed.fieldErrors['name']) {
        setError('name', { message: parsed.fieldErrors['name'] });
      } else {
        setServerError(parsed.message);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && <Alert>{serverError}</Alert>}
      <TextField
        label="Component name"
        required
        autoFocus
        autoComplete="off"
        hint="Applies to all employees using it."
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save name
        </Button>
      </div>
    </form>
  );
}

interface RenameDialogProps {
  /** The component to rename, or null while the dialog is closed. */
  item: RenameTarget | null;
  onClose: () => void;
}

export function RenameDialog({ item, onClose }: RenameDialogProps) {
  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      title="Rename component"
      description="The new name is used everywhere this component appears."
    >
      {item && <RenameForm item={item} onClose={onClose} />}
    </Dialog>
  );
}
