import { formatPeso, formatTimestamp } from '../../../shared/lib/format';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { Table, Td, Th, Tr } from '../../../shared/ui/Table';
import type { SalaryHistoryEntry } from '../types';

interface SalaryHistoryCardProps {
  history: SalaryHistoryEntry[] | undefined;
  isError: boolean;
  onRetry: () => void;
}

export function SalaryHistoryCard({
  history,
  isError,
  onRetry,
}: SalaryHistoryCardProps) {
  let content;
  if (isError) {
    content = (
      <div className="p-4">
        <Alert>
          <p>Could not load the salary history.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={onRetry}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  } else if (history === undefined) {
    content = (
      <div role="status" aria-label="Loading salary history" className="p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-4 w-3/4" />
      </div>
    );
  } else if (history.length === 0) {
    content = (
      <p className="p-4 text-sm text-neutral-600">
        No previous salaries. When the salary is adjusted, the old amount is
        listed here.
      </p>
    );
  } else {
    content = (
      <Table label="Salary history">
        <thead>
          <tr>
            <Th align="right">Monthly basic salary</Th>
            <Th>Assigned</Th>
            <Th>Replaced</Th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <Tr key={entry.id}>
              <Td align="right">
                <span className="num font-medium whitespace-nowrap">
                  {formatPeso(entry.monthlyBasicSalary)}
                </span>
              </Td>
              <Td className="whitespace-nowrap">
                {formatTimestamp(entry.createdAt)}
              </Td>
              <Td className="whitespace-nowrap">
                {formatTimestamp(entry.replacedAt)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  }

  return (
    <section
      aria-labelledby="salary-history-title"
      className="rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm"
    >
      <h2
        id="salary-history-title"
        className="border-b border-neutral-200 p-4 text-sm font-medium text-neutral-600"
      >
        Salary history
      </h2>
      {content}
    </section>
  );
}
