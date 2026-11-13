import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '../../../shared/api/errors';
import { normalizeAmount } from '../../../shared/lib/money';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Combobox } from '../../../shared/ui/Combobox';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useAddComponent, useCatalog } from '../api/queries';
import {
  amountFormSchema,
  componentNameSchema,
  type AmountFormValues,
} from '../schemas';
import type { EmployeeComponent } from '../types';

const DUPLICATE_MESSAGE = 'This employee already has this component';
const NEW_VALUE = 'new';

/** What was picked: a name from the catalog, or a new name typed in. */
type Choice = { kind: 'existing'; id: string } | { kind: 'new'; name: string };

interface AddComponentFormProps {
  employeeId: string;
  /** What the employee already has, to catch a duplicate before anything is sent. */
  assigned: EmployeeComponent[];
}

/** Adds a component to one employee. Mount it with `key={employeeId}` so each employee starts clean. */
export function AddComponentForm({
  employeeId,
  assigned,
}: AddComponentFormProps) {
  const toast = useToast();
  const catalog = useCatalog();
  const add = useAddComponent(employeeId);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [choiceError, setChoiceError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AmountFormValues>({
    resolver: zodResolver(amountFormSchema),
    defaultValues: { amount: '' },
  });

  const names = catalog.data ?? [];
  const options = names.map((component) => ({
    value: component.id,
    label: component.name,
  }));
  if (choice?.kind === 'new') {
    options.push({ value: NEW_VALUE, label: choice.name });
  }

  const nameOf = (picked: Choice): string =>
    picked.kind === 'new'
      ? picked.name
      : (names.find((component) => component.id === picked.id)?.name ?? '');

  const onSubmit = handleSubmit(async ({ amount }) => {
    setServerError(null);
    if (!choice) {
      setChoiceError('Choose a component, or type a new name');
      return;
    }
    const name = nameOf(choice);
    if (choice.kind === 'new') {
      const checked = componentNameSchema.safeParse(name);
      if (!checked.success) {
        setChoiceError(checked.error.issues[0]?.message);
        return;
      }
    }
    if (
      assigned.some(
        (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      setChoiceError(DUPLICATE_MESSAGE);
      return;
    }

    const normalized = normalizeAmount(amount);
    try {
      await add.mutateAsync(
        choice.kind === 'existing'
          ? { componentId: choice.id, amount: normalized }
          : { name: name.trim(), amount: normalized },
      );
      toast.success('Component added');
      reset();
      setChoice(null);
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.status === 409) {
        setChoiceError(DUPLICATE_MESSAGE);
      } else if (parsed.fieldErrors['amount']) {
        setError('amount', { message: parsed.fieldErrors['amount'] });
      } else if (parsed.fieldErrors['name']) {
        setChoiceError(parsed.fieldErrors['name']);
      } else {
        setServerError(parsed.message);
      }
    }
  });

  return (
    <section
      aria-labelledby="add-component-title"
      className="rounded-lg border border-neutral-200 bg-neutral-0 p-6 shadow-sm"
    >
      <h2
        id="add-component-title"
        className="text-sm font-medium text-neutral-600"
      >
        Add a component
      </h2>
      <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Combobox
            className="min-w-0 sm:flex-1"
            label="Component"
            placeholder="Search, or type a new name"
            options={options}
            value={
              choice === null
                ? null
                : choice.kind === 'new'
                  ? NEW_VALUE
                  : choice.id
            }
            loading={catalog.isPending}
            onChange={(id) => {
              setChoice({ kind: 'existing', id });
              setChoiceError(undefined);
            }}
            create={{
              label: (typed) => `Create “${typed}”`,
              onCreate: (typed) => {
                setChoice({ kind: 'new', name: typed });
                setChoiceError(undefined);
              },
            }}
            error={choiceError}
          />
          <TextField
            className="sm:w-48"
            label="Amount"
            required
            inputMode="decimal"
            autoComplete="off"
            startAdornment={<span aria-hidden="true">₱</span>}
            error={errors.amount?.message}
            {...register('amount')}
          />
          <div className="sm:shrink-0">
            <span aria-hidden="true" className="mb-2 hidden text-sm sm:block">
              &nbsp;
            </span>
            <Button type="submit" loading={isSubmitting}>
              Add component
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
