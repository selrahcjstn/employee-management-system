import { useId } from 'react';
import { cx } from '../lib/cx';
import { ChevronDownIcon } from './icons';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** How many rows this choice would show, so the choice can be judged before it is made. */
  count?: number;
}

interface SegmentedFilterProps<T extends string> {
  /** Names the group for screen readers, for example "Status". */
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A few exclusive choices side by side (All, Ready, Needs salary). Real buttons, with the chosen one marked `aria-pressed`. */
export function SegmentedFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedFilterProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 gap-1 rounded-md border border-field bg-neutral-0 p-1"
    >
      {options.map((option) => {
        const chosen = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={chosen}
            onClick={() => onChange(option.value)}
            className={cx(
              'flex h-8 items-center gap-2 rounded-sm px-3 text-sm font-medium whitespace-nowrap transition-colors',
              chosen
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cx(
                  'num text-xs',
                  chosen ? 'text-primary-700' : 'text-neutral-500',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SelectFilterProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A native select (so it works on every device and with the keyboard), with its label beside it. */
export function SelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: SelectFilterProps<T>) {
  const id = useId();
  return (
    <div className="flex shrink-0 items-center gap-2">
      <label
        htmlFor={id}
        className="text-sm whitespace-nowrap text-neutral-600"
      >
        {label}
      </label>
      {/* The select itself is the bordered control, so its focus ring fits it exactly. */}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className="h-10 appearance-none rounded-md border border-field bg-neutral-0 pr-8 pl-3 text-sm text-neutral-900 focus:border-primary-600"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500"
        />
      </div>
    </div>
  );
}
