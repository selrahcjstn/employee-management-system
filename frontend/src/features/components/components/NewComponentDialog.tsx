import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useCreateComponent } from '../api/queries';
import { renameFormSchema, type RenameFormValues } from '../schemas';

/** Mounted only while the dialog is open, so each opening starts empty. */
function NewComponentForm({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const create = useCreateComponent();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RenameFormValues>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    setServerError(null);
    try {
      await create.mutateAsync(name);
      toast.success('Component created');
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        // The name is taken (any letter case), in the API's own words.
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
        hint="For example Rice Allowance. Amounts are set per employee."
        error={errors.name?.message}
        {...register('name')}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create component
        </Button>
      </div>
    </form>
  );
}

export function NewComponentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New component"
      description="Adds a name to the catalog. You give it an amount when you add it to an employee."
    >
      <NewComponentForm onClose={onClose} />
    </Dialog>
  );
}
