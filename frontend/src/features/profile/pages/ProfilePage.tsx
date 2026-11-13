import { usePageTitle } from '../../../shared/lib/use-page-title';
import { useAuth } from '../../auth/context/useAuth';
import { EditNameCard } from '../components/EditNameCard';
import { ProfileCard } from '../components/ProfileCard';

/** Who you are signed in as. The full name can change; the email and role are shown, not edited. */
export function ProfilePage() {
  usePageTitle('My profile');
  const auth = useAuth();
  if (auth.status !== 'authenticated') return null;
  const { user } = auth;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My profile</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Your account details. You can change your name here.
        </p>
      </div>

      <div className="mt-4 grid animate-fade-up items-start gap-4 xl:grid-cols-3">
        <ProfileCard user={user} />
        <div className="flex flex-col gap-4 xl:col-span-2">
          <EditNameCard user={user} onSaved={auth.setUser} />
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Your email and role are set by an administrator. Passwords are
            managed by your administrator too, so there is nothing to change
            here.
          </p>
        </div>
      </div>
    </>
  );
}
