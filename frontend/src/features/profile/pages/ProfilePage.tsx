import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { parseApiError } from '../../../shared/api/errors';
import { formatTimestamp } from '../../../shared/lib/format';
import { roleLabel } from '../../../shared/lib/role-label';
import { usePageTitle } from '../../../shared/lib/use-page-title';
import { Alert } from '../../../shared/ui/Alert';
import { Avatar } from '../../../shared/ui/Avatar';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useToast } from '../../../shared/ui/useToast';
import { useAuth } from '../../auth/context/useAuth';
import { updateFullName } from '../api/profile-api';

/** The same rules as the API (UpdateMeDto): 1 to 150 characters once trimmed. */
const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(150, 'Full name must be 150 characters or fewer'),
});
type ProfileValues = z.infer<typeof profileSchema>;

/** Who you are signed in as. The full name can change; the email and role are shown, not edited. */
export function ProfilePage() {
  usePageTitle('My profile');
  const auth = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const user = auth.status === 'authenticated' ? auth.user : null;
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: user?.fullName ?? '' },
  });

  if (!user || auth.status !== 'authenticated') return null;

  const onSubmit = handleSubmit(async ({ fullName }) => {
    setServerError(null);
    try {
      const saved = await updateFullName(fullName);
      auth.setUser(saved);
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
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My profile</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your account details. You can change your name here.
        </p>
      </div>

      <section
        aria-labelledby="account-title"
        className="mt-6 max-w-xl rounded-lg border border-neutral-200 bg-neutral-0 p-6 shadow-sm"
      >
        <h2 id="account-title" className="sr-only">
          Account
        </h2>
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-neutral-900">
              {user.fullName}
            </p>
            <Badge variant="primary">{roleLabel(user.role)}</Badge>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-neutral-200 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-neutral-600">Email</dt>
            <dd className="mt-1 truncate text-sm font-medium text-neutral-900">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-600">Role</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {roleLabel(user.role)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-600">Member since</dt>
            <dd className="mt-1 text-sm font-medium text-neutral-900">
              {formatTimestamp(user.createdAt)}
            </dd>
          </div>
        </dl>

        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-6 flex flex-col gap-4 border-t border-neutral-200 pt-6"
        >
          {serverError && <Alert>{serverError}</Alert>}
          <TextField
            label="Full name"
            required
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <div>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
