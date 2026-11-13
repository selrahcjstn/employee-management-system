import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

type Align = 'left' | 'right';

const ALIGN: Record<Align, string> = { left: 'text-left', right: 'text-right' };

interface TableProps {
  /** Names the table for screen readers (DESIGN.md 9: a real table with a caption or aria-label). */
  label: string;
  children: ReactNode;
}

/** A table that scrolls sideways inside its box on small screens instead of squeezing its columns. */
export function Table({ label, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

interface CellProps {
  align?: Align;
  className?: string;
  children?: ReactNode;
}

/** Header cell: 40px, neutral-100, text-xs uppercase with letter spacing. Money columns align right. */
export function Th({ align = 'left', className, children }: CellProps) {
  return (
    <th
      scope="col"
      className={cx(
        'h-10 bg-neutral-100 px-4 text-xs font-semibold tracking-header whitespace-nowrap text-neutral-600 uppercase',
        ALIGN[align],
        className,
      )}
    >
      {children}
    </th>
  );
}

/** Body cell: 48px row, 16px side padding, a divider under it. */
export function Td({ align = 'left', className, children }: CellProps) {
  return (
    <td
      className={cx(
        'h-12 border-b border-neutral-200 px-4 text-neutral-900',
        ALIGN[align],
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr className="bg-neutral-0 transition-colors hover:bg-neutral-50">
      {children}
    </tr>
  );
}
