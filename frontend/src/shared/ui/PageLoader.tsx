import { APP_NAME } from '../config';

/** Full-page state while the session is restored, so the login page never flashes for a signed-in user. */
export function PageLoader({
  message = 'Restoring your session…',
}: {
  message?: string;
}) {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-50 p-4 text-center"
    >
      <p className="text-lg font-semibold text-neutral-900">{APP_NAME}</p>
      <div
        className="h-2 w-32 animate-pulse rounded-sm bg-neutral-200"
        aria-hidden="true"
      />
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}
