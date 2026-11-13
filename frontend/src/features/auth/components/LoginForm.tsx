import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '../../../shared/api/errors';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { PasswordField } from '../../../shared/ui/PasswordField';
import { TextField } from '../../../shared/ui/TextField';
import { useAuth } from '../context/useAuth';
import { loginSchema, type LoginValues } from '../schemas';

const INVALID_CREDENTIALS = 'Invalid email or password';
const FIELDS = ['email', 'password'] as const;

export function LoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  // Counts failed attempts so the alert is a new element each time, which replays its animation.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      // On success the route guard moves the user on, so there is nothing to do here.
      await login(values.email, values.password);
    } catch (error) {
      setFailedAttempts((count) => count + 1);
      const parsed = parseApiError(error);
      if (parsed.status === 401) {
        // One generic message: never say whether the email or the password was wrong.
        setServerError(INVALID_CREDENTIALS);
        return;
      }
      const fieldsWithErrors = FIELDS.filter(
        (field) => parsed.fieldErrors[field],
      );
      for (const field of fieldsWithErrors) {
        setError(field, { message: parsed.fieldErrors[field] });
      }
      if (fieldsWithErrors.length === 0) setServerError(parsed.message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <div key={failedAttempts} className="animate-shake">
          <Alert className="animate-slide-down">{serverError}</Alert>
        </div>
      )}
      <TextField
        label="Email"
        type="email"
        autoComplete="username"
        autoFocus
        required
        className="animate-fade-up anim-delay-2"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        required
        className="animate-fade-up anim-delay-3"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        className="animate-fade-up anim-delay-4"
      >
        Sign in
      </Button>
    </form>
  );
}
