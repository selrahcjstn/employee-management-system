import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../lib/cx';
import { AlertCircleIcon } from './icons';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Message shown under the field. Text and an icon, never only a red border. */
  error?: string | undefined;
  /** Plain help under the field, for example why it cannot be edited. */
  hint?: string;
  /** Keeps the label for screen readers but does not draw it, for a field whose purpose is obvious, like search. */
  hideLabel?: boolean;
  /** Shown inside the left edge of the input, for example a search icon. */
  startAdornment?: ReactNode;
  /** Shown inside the right edge of the input, for example the show/hide password button. */
  endAdornment?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  hint,
  hideLabel = false,
  startAdornment,
  endAdornment,
  required,
  className,
  id,
  ref,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={cx(
          'text-sm font-medium text-neutral-700',
          hideLabel ? 'sr-only' : 'mb-2 block',
        )}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-danger">
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      <div className="relative">
        {startAdornment && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
            {startAdornment}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            'h-10 w-full rounded-md border bg-neutral-0 px-4 text-sm text-neutral-900 placeholder:text-neutral-500 read-only:bg-neutral-100 read-only:text-neutral-600 disabled:bg-neutral-100 disabled:text-neutral-600',
            error ? 'border-danger' : 'border-field focus:border-primary-600',
            Boolean(startAdornment) && 'pl-11',
            Boolean(endAdornment) && 'pr-12',
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-neutral-600">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-1 flex items-start gap-1 text-xs text-danger"
        >
          <AlertCircleIcon size={16} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
