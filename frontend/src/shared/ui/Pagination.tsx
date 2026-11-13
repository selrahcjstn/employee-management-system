import { Button } from './Button';

interface PaginationProps {
  /** The current page, counting from 1. */
  page: number;
  pageSize: number;
  /** How many rows there are in all. */
  total: number;
  onPageChange: (page: number) => void;
}

/** "Showing 11–20 of 42" with Previous and Next. Draws nothing when there are no rows. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null;
  const pages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-neutral-200 px-4 py-3"
    >
      <p aria-live="polite" className="text-sm text-neutral-600">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
