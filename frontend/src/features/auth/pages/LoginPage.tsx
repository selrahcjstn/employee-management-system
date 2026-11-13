import { APP_NAME } from '../../../shared/config';
import { LoginForm } from '../components/LoginForm';

/** There is no sign-up: accounts are created by the administrator, so this page has no register link. */
export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-100 rounded-lg border border-neutral-200 bg-neutral-0 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-neutral-600">Sign in to continue.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
