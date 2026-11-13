import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso } from '../../../shared/lib/format';
import { normalizeAmount } from '../../../shared/lib/money';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useAssignSalary } from '../api/queries';
import { salarySchema, type SalaryFormValues } from '../schemas';
import type { Salary } from '../types';

interface SalaryFormProps {
  employeeId: string;
  /** The active salary, or null when none is assigned yet. */
  current: Salary | null;
}

/** Assigns the first salary or adjusts the current one. Mount it with `key={employeeId}` so each employee starts clean. */
export function SalaryForm({ employeeId, current }: SalaryFormProps) {
  const toast = useToast();
  const assign = useAssignSalary(employeeId);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalaryFormValues>({
    resolver: zodResolver(salarySchema),
    defaultValues: { monthlyBasicSalary: '' },
  });

  const onSubmit = handleSubmit(async ({ monthlyBasicSalary }) => {
    setServerError(null);
    const amount = normalizeAmount(monthlyBasicSalary);
    if (current && amount === current.monthlyBasicSalary) {
      setError(
        'monthlyBasicSalary',
        { message: 'This is already the current salary' },
        { shouldFocus: true },
      );
      return;
    }
    try {
      const result = await assign.mutateAsync(amount);
      if (result.changed) {
        toast.success(current ? 'Salary updated' : 'Salary assigned');
      } else {
        toast.info(
          `Salary is already ${formatPeso(result.salary.monthlyBasicSalary)}. Nothing changed.`,
        );
      }
      reset();
    } catch (error) {
      const parsed = parseApiError(error);
      const fieldMessage = parsed.fieldErrors['monthlyBasicSalary'];
      if (fieldMessage) {
        setError(
          'monthlyBasicSalary',
          { message: fieldMessage },
          { shouldFocus: true },
        );
      } else {
        setServerError(parsed.message);
      }
    }
  });

  return (
    <section
      aria-labelledby="salary-form-title"
      className="rounded-lg border border-neutral-200 bg-neutral-0 p-6 shadow-sm"
    >
      <h2
        id="salary-form-title"
        className="text-sm font-medium text-neutral-600"
      >
        {current ? 'Adjust salary' : 'Assign salary'}
      </h2>
      <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}
        <TextField
          label={current ? 'New monthly basic salary' : 'Monthly basic salary'}
          required
          inputMode="decimal"
          autoComplete="off"
          startAdornment={<span aria-hidden="true">₱</span>}
          hint={
            current
              ? 'The current salary is kept in the history.'
              : 'The amount per month, before any components.'
          }
          error={errors.monthlyBasicSalary?.message}
          {...register('monthlyBasicSalary')}
        />
        <div>
          <Button type="submit" loading={isSubmitting}>
            {current ? 'Save salary' : 'Assign salary'}
          </Button>
        </div>
      </form>
    </section>
  );
}
