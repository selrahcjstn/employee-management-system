import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';
import { TextField, type TextFieldProps } from './TextField';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>;

/** A password input with a show/hide toggle (a 40px button, with a label for screen readers). */
export function PasswordField({ id, ...props }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      id={inputId}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          aria-controls={inputId}
          className="flex size-10 items-center justify-center rounded-md text-neutral-600 transition-colors hover:text-neutral-900"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
