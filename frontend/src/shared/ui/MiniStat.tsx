import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

interface MiniStatProps {
  label: string;
  value: ReactNode;
  /** One short line under the value. */
  note?: ReactNode;
  /** Draws the card in the warning colors, for something that needs a decision. */
  attention?: boolean;
}

/** A small number with its label, for the strip above a list. Smaller than the dashboard cards on purpose. */
export function MiniStat({ label, value, note, attention }: MiniStatProps) {
  return (
    <div
      className={cx(
        'min-w-0 rounded-lg border p-4 shadow-sm',
        attention
          ? 'border-warning-border bg-warning-bg'
          : 'border-neutral-200 bg-neutral-0',
      )}
    >
      <p className="text-xs text-neutral-600">{label}</p>
      <p className="num mt-1 truncate text-xl font-semibold text-neutral-900">
        {value}
      </p>
      {note && <p className="mt-1 truncate text-xs text-neutral-600">{note}</p>}
    </div>
  );
}
