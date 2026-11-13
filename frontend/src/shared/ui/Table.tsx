import type { MouseEventHandler, ReactNode } from 'react';
import { cx } from '../lib/cx';
import { Skeleton } from './Skeleton';

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
    <div className="relative overflow-x-auto">
      <table aria-label={label} className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

interface CellProps {
  align?: Align;
  className?: string;
  /** How many columns the cell spans, for a message that replaces several cells. */
  colSpan?: number;
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
export function Td({
  align = 'left',
  className,
  colSpan,
  children,
}: CellProps) {
  return (
    <td
      colSpan={colSpan}
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

interface TrProps {
  children: ReactNode;
  /** Makes the whole row clickable for mouse users. Keep a real link or button inside for everyone else. */
  onClick?: MouseEventHandler<HTMLTableRowElement>;
}

export function Tr({ children, onClick }: TrProps) {
  return (
    <tr
      onClick={onClick}
      className={cx(
        'bg-neutral-0 transition-colors hover:bg-neutral-50',
        onClick && 'cursor-pointer',
      )}
    >
      {children}
    </tr>
  );
}

interface TableSkeletonProps {
  /** Names the table and the status message, for example "Loading salaries". */
  label: string;
  headers: { text: string; align?: Align }[];
  rows?: number;
}

/** Header and rows the same size as the real table, shown while a list loads. */
export function TableSkeleton({
  label,
  headers,
  rows = 5,
}: TableSkeletonProps) {
  return (
    <div aria-busy="true">
      <Table label={label}>
        <thead>
          <tr>
            {headers.map((header) => (
              <Th key={header.text} align={header.align}>
                {header.text}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <Tr key={row}>
              {headers.map((header) => (
                <Td key={header.text} align={header.align}>
                  <Skeleton
                    className={
                      header.align === 'right' ? 'ml-auto h-4 w-24' : 'h-4 w-32'
                    }
                  />
                </Td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
      <span role="status" className="sr-only">
        {label}
      </span>
    </div>
  );
}
