import { useState, type KeyboardEvent } from 'react';
import { parseApiError } from '../../../shared/api/errors';
import { formatPeso } from '../../../shared/lib/format';
import {
  centavosToAmount,
  normalizeAmount,
  toCentavos,
} from '../../../shared/lib/money';
import { Button } from '../../../shared/ui/Button';
import { IconButton } from '../../../shared/ui/IconButton';
import { PencilIcon, TagIcon, TrashIcon } from '../../../shared/ui/icons';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { Table, Td, Th, Tr } from '../../../shared/ui/Table';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useUpdateAmount } from '../api/queries';
import { amountSchema } from '../schemas';
import type { EmployeeComponent } from '../types';

function Head() {
  return (
    <thead>
      <tr>
        <Th>Component</Th>
        <Th align="right">Amount</Th>
        <Th align="right">
          <span className="sr-only">Actions</span>
        </Th>
      </tr>
    </thead>
  );
}

interface AmountEditorProps {
  employeeId: string;
  item: EmployeeComponent;
  onDone: () => void;
}

/** The amount cell while it is being edited: Enter or Save keeps it, Escape or Cancel leaves it as it was. */
function AmountEditor({ employeeId, item, onDone }: AmountEditorProps) {
  const toast = useToast();
  const update = useUpdateAmount(employeeId);
  const [value, setValue] = useState(item.amount);
  const [error, setError] = useState<string | undefined>();

  const save = async () => {
    const checked = amountSchema.safeParse(value);
    if (!checked.success) {
      setError(checked.error.issues[0]?.message);
      return;
    }
    const amount = normalizeAmount(checked.data);
    if (amount === item.amount) {
      onDone();
      return;
    }
    try {
      await update.mutateAsync({ assignmentId: item.id, amount });
      toast.success('Amount updated');
      onDone();
    } catch (failure) {
      const parsed = parseApiError(failure);
      setError(parsed.fieldErrors['amount'] ?? parsed.message);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onDone();
    }
  };

  return (
    <div className="ml-auto flex flex-col items-end gap-2 py-2 sm:flex-row sm:items-start">
      <TextField
        className="w-40"
        label={`Amount for ${item.name}`}
        hideLabel
        autoFocus
        inputMode="decimal"
        autoComplete="off"
        startAdornment={<span aria-hidden="true">₱</span>}
        value={value}
        error={error}
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
        onKeyDown={onKeyDown}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-10"
          loading={update.isPending}
          onClick={save}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-10"
          disabled={update.isPending}
          onClick={onDone}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface ComponentsTableProps {
  employeeId: string;
  items: EmployeeComponent[];
  onRename: (item: EmployeeComponent) => void;
  onRemove: (item: EmployeeComponent) => void;
}

export function ComponentsTable({
  employeeId,
  items,
  onRename,
  onRemove,
}: ComponentsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + toCentavos(item.amount), 0n);

  return (
    <Table label="Salary components">
      <Head />
      <tbody>
        {items.map((item) => (
          <Tr key={item.id}>
            <Td className="font-medium">{item.name}</Td>
            <Td align="right">
              {editingId === item.id ? (
                <AmountEditor
                  employeeId={employeeId}
                  item={item}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <span className="num whitespace-nowrap">
                  {formatPeso(item.amount)}
                </span>
              )}
            </Td>
            <Td align="right">
              <div className="flex justify-end">
                <IconButton
                  label={`Edit amount of ${item.name}`}
                  title="Edit amount"
                  onClick={() => setEditingId(item.id)}
                >
                  <PencilIcon />
                </IconButton>
                <IconButton
                  label={`Rename ${item.name}`}
                  title="Rename"
                  onClick={() => onRename(item)}
                >
                  <TagIcon />
                </IconButton>
                <IconButton
                  label={`Remove ${item.name}`}
                  title="Remove"
                  onClick={() => onRemove(item)}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </Td>
          </Tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-neutral-50">
          <th
            scope="row"
            className="h-12 px-4 text-left text-sm font-semibold text-neutral-900"
          >
            Components total
          </th>
          <td className="num h-12 px-4 text-right font-semibold whitespace-nowrap text-neutral-900">
            {formatPeso(centavosToAmount(total))}
          </td>
          <td />
        </tr>
      </tfoot>
    </Table>
  );
}

/** Rows the same height as the real ones, shown while the list loads. */
export function ComponentsTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <Table label="Loading components">
        <Head />
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <Tr key={index}>
              <Td>
                <Skeleton className="h-4 w-40" />
              </Td>
              <Td align="right">
                <Skeleton className="ml-auto h-4 w-24" />
              </Td>
              <Td>
                <Skeleton className="ml-auto h-4 w-20" />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <span role="status" className="sr-only">
        Loading components
      </span>
    </div>
  );
}
