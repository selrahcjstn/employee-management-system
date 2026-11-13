import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { parseApiError } from '../../../shared/api/errors';
import { todayInManila } from '../../../shared/lib/today';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Dialog } from '../../../shared/ui/Dialog';
import { TextField } from '../../../shared/ui/TextField';
import { useEmployeeNoTaken } from '../api/use-employee-no-taken';
import { useEmployees, useSaveEmployee } from '../api/queries';
import {
  editEmployeeSchema,
  employeeSchema,
  type EmployeeFormValues,
} from '../schemas';
import { suggestEmployeeNo } from '../suggest-employee-no';
import type { Employee } from '../types';

export type SaveResult = 'created' | 'updated';

const FIELDS = [
  'employeeNo',
  'firstName',
  'middleName',
  'lastName',
  'dateHired',
] as const;

const DUPLICATE_MESSAGE = 'Employee ID already exists';

interface EmployeeFormProps {
  /** The employee being edited, or null to add a new one. */
  employee: Employee | null;
  /** The Employee ID to start a new employee with (empty for none). Ignored when editing. */
  suggestedNo: string;
  onClose: () => void;
  onSaved: (result: SaveResult) => void;
}

/** Mounted only while the dialog is open, so every opening starts from a clean form. */
function EmployeeForm({
  employee,
  suggestedNo,
  onClose,
  onSaved,
}: EmployeeFormProps) {
  const editing = employee !== null;
  const save = useSaveEmployee(employee);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(editing ? editEmployeeSchema : employeeSchema),
    defaultValues: {
      employeeNo: employee?.employeeNo ?? suggestedNo,
      firstName: employee?.firstName ?? '',
      middleName: employee?.middleName ?? '',
      lastName: employee?.lastName ?? '',
      dateHired: employee?.dateHired ?? '',
    },
  });

  // A hint while typing. The unique index and the 409 below stay the source of truth.
  const taken = useEmployeeNoTaken(
    useWatch({ control, name: 'employeeNo' }) ?? '',
    !editing,
  );

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await save.mutateAsync(values);
      onSaved(editing ? 'updated' : 'created');
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        // The Employee ID is taken. Say so next to the field, in the API's own words.
        setError(
          'employeeNo',
          { message: parsed.message },
          { shouldFocus: true },
        );
        return;
      }
      const withErrors = FIELDS.filter((field) => parsed.fieldErrors[field]);
      for (const field of withErrors) {
        setError(field, { message: parsed.fieldErrors[field] });
      }
      if (withErrors.length === 0) setServerError(parsed.message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && <Alert>{serverError}</Alert>}
      <TextField
        label="Employee ID"
        autoComplete="off"
        required
        readOnly={editing}
        autoFocus={!editing}
        placeholder={editing ? undefined : 'e.g. EMP-001'}
        hint={editing ? "The Employee ID can't be changed." : undefined}
        error={
          errors.employeeNo?.message ??
          (taken.taken ? DUPLICATE_MESSAGE : undefined)
        }
        {...register('employeeNo', { onBlur: taken.onBlur })}
      />
      <TextField
        label="First name"
        autoComplete="off"
        required
        autoFocus={editing}
        error={errors.firstName?.message}
        {...register('firstName')}
      />
      <TextField
        label="Middle name"
        autoComplete="off"
        error={errors.middleName?.message}
        {...register('middleName')}
      />
      <TextField
        label="Last name"
        autoComplete="off"
        required
        error={errors.lastName?.message}
        {...register('lastName')}
      />
      <TextField
        label="Date hired"
        type="date"
        max={todayInManila()}
        required
        error={errors.dateHired?.message}
        {...register('dateHired')}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {editing ? 'Save changes' : 'Add employee'}
        </Button>
      </div>
    </form>
  );
}

interface EmployeeFormDialogProps extends Omit<
  EmployeeFormProps,
  'suggestedNo'
> {
  open: boolean;
}

export function EmployeeFormDialog({
  open,
  employee,
  onClose,
  onSaved,
}: EmployeeFormDialogProps) {
  const editing = employee !== null;
  // The same list the page shows, so the suggestion costs no extra request.
  const everyone = useEmployees('');
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit employee' : 'Add employee'}
      description={
        editing
          ? 'Update their details. Their salary is changed on the Salary page.'
          : 'Enter the details of the person you are onboarding. Their salary is set separately.'
      }
    >
      <EmployeeForm
        employee={employee}
        suggestedNo={suggestEmployeeNo(everyone.data ?? [])}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  );
}
