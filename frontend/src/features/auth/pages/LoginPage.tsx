import { APP_NAME } from '../../../shared/config';
import { BrandPanel } from '../components/BrandPanel';
import { LoginForm } from '../components/LoginForm';
import { Logo } from '../components/Logo';

/**
 * Split screen on large displays: the product on the left, the form on the right. Below 1024px
 * only the form shows, under a small logo. There is no sign-up: accounts are created by the
 * administrator, so the page has no register link.
 */
export function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-0 lg:grid lg:grid-cols-2">
      <BrandPanel />
      <div className="flex min-h-screen items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-100">
          <div className="mb-8 flex animate-fade-up items-center gap-2 lg:hidden">
            <Logo />
            <span className="text-lg font-semibold text-neutral-900">
              {APP_NAME}
            </span>
          </div>
          <h1 className="animate-fade-up text-2xl font-semibold text-neutral-900">
            Welcome back
          </h1>
          <p className="mt-2 animate-fade-up text-sm text-neutral-600 anim-delay-1">
            Sign in to your account to continue.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-6 animate-fade-up text-xs text-neutral-500 anim-delay-5">
            Accounts are created by your administrator. There is no sign-up.
          </p>
        </div>
      </div>
    </main>
  );
}
