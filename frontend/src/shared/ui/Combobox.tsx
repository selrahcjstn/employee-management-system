import { useId, useState, type KeyboardEvent } from 'react';
import { cx } from '../lib/cx';
import { ChevronDownIcon, SearchIcon } from './icons';

export interface ComboboxOption {
  value: string;
  label: string;
  /** A second, quieter line, for example the Employee ID. It is searched too. */
  description?: string;
}

interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  /** The chosen option's value, or null for none. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shown instead of the options while they load. */
  loading?: boolean;
  className?: string;
}

/**
 * A searchable select (ARIA 1.2 combobox with a listbox). Type to filter, Arrow keys move,
 * Enter chooses, Escape closes and puts the chosen name back.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder,
  loading = false,
  className,
}: ComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (optionValue: string) => `${id}-option-${optionValue}`;
  const [open, setOpen] = useState(false);
  // What the user has typed; null while they have not typed since choosing, so the input shows the chosen name.
  const [typed, setTyped] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value);
  const needle = (typed ?? '').trim().toLowerCase();
  const shown = needle
    ? options.filter((option) =>
        `${option.label} ${option.description ?? ''}`
          .toLowerCase()
          .includes(needle),
      )
    : options;
  const active = shown[Math.min(activeIndex, shown.length - 1)];

  const close = () => {
    setOpen(false);
    setTyped(null);
  };
  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    close();
  };
  const move = (step: number) => {
    setOpen(true);
    if (shown.length === 0) return;
    setActiveIndex((current) => (current + step + shown.length) % shown.length);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (active) choose(active);
    } else if (event.key === 'Escape' && open) {
      // Close the list only; the page or a dialog around it should not also close.
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-neutral-700"
      >
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
          <SearchIcon />
        </div>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && active ? optionId(active.value) : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          value={typed ?? selected?.label ?? ''}
          onChange={(event) => {
            setTyped(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={(event) => {
            event.target.select();
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onBlur={close}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-md border border-field bg-neutral-0 pr-12 pl-11 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-primary-600"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-500">
          <ChevronDownIcon />
        </div>
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-neutral-200 bg-neutral-0 py-1 shadow-md"
          >
            {loading ? (
              <li className="px-4 py-2 text-sm text-neutral-600">Loading…</li>
            ) : shown.length === 0 ? (
              <li className="px-4 py-2 text-sm text-neutral-600">
                No match for “{typed?.trim()}”
              </li>
            ) : (
              shown.map((option) => (
                <li
                  key={option.value}
                  id={optionId(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                  // mousedown, not click: the input would lose focus and close the list first.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  onMouseMove={() => setActiveIndex(shown.indexOf(option))}
                  className={cx(
                    'flex cursor-pointer items-center justify-between gap-4 px-4 py-2 text-sm',
                    option === active && 'bg-neutral-100',
                    option.value === value && 'font-medium text-primary-700',
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {option.description && (
                    <span className="shrink-0 font-mono text-xs text-neutral-600">
                      {option.description}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
