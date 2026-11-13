import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { parseApiError } from '../../../shared/api/errors';
import type { SessionUser } from '../../../shared/api/types';
import { cx } from '../../../shared/lib/cx';
import { Alert } from '../../../shared/ui/Alert';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { updateFullName } from '../api/profile-api';

const MAX_NAME = 150;
/** From here the count turns to a warning and screen readers are told once. */
const NEAR_LIMIT = 135;

/** The same rules as the API (UpdateMeDto): 1 to 150 characters once trimmed. */
const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(MAX_NAME, `Full name must be ${MAX_NAME} characters or fewer`),
});
type ProfileValues = z.infer<typeof profileSchema>;

interface EditNameCardProps {
  user: SessionUser;
  /** Called with the saved user, so the rest of the app shows the new name at once. */
  onSaved: (user: SessionUser) => void;
}

/** The one thing that can change here. Save stays off until the name differs from the saved one. */
export function EditNameCard({ user, onSaved }: EditNameCardProps) {
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user.fullName },
  });
  const length = (useWatch({ control, name: 'fullName' }) ?? '').length;

  const onSubmit = handleSubmit(async ({ fullName }) => {
    setServerError(null);
    try {
      const saved = await updateFullName(fullName);
      onSaved(saved);
      reset({ fullName: saved.fullName });
      toast.success('Profile updated');
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.fieldErrors['fullName']) {
        setError(
          'fullName',
          { message: parsed.fieldErrors['fullName'] },
          { shouldFocus: true },
        );
      } else {
        setServerError(parsed.message);
      }
    }
  });

  return (
    <section
      aria-labelledby="edit-name-title"
      className="rounded-lg border border-neutral-200 bg-neutral-0 p-4 shadow-sm"
    >
      <h2
        id="edit-name-title"
        className="text-lg font-semibold text-neutral-900"
      >
        Edit your name
      </h2>
      <p className="mt-2 text-sm text-neutral-600">
        This is the name shown in the menu at the top right and in your account.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-4">
        {serverError && <Alert>{serverError}</Alert>}
        <div>
          <TextField
            label="Full name"
            required
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <p
            aria-hidden="true"
            className={cx(
              'num mt-1 text-right text-xs',
              length >= NEAR_LIMIT ? 'text-warning' : 'text-neutral-500',
            )}
          >
            {length} / {MAX_NAME}
          </p>
          {/* Said once when the limit gets close, not on every key. */}
          <p role="status" className="sr-only">
            {length >= NEAR_LIMIT ? `${MAX_NAME - length} characters left` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
          {isDirty && (
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => reset({ fullName: user.fullName })}
            >
              Reset
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
