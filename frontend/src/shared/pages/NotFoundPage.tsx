import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 p-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          The page you are looking for does not exist.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex h-10 items-center rounded-md bg-primary-600 px-4 text-sm font-medium text-neutral-0 transition-colors hover:bg-primary-700 active:bg-primary-800"
      >
        Go to home
      </Link>
    </main>
  );
}
