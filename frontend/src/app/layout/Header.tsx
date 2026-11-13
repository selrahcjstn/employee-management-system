import { useState } from 'react';
import { useAuth } from '../../features/auth/context/useAuth';
import { Button } from '../../shared/ui/Button';
import { LogOutIcon, MenuIcon } from '../../shared/ui/icons';

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0]!.toUpperCase())
    .join('');
}

interface HeaderProps {
  drawerOpen: boolean;
  onOpenMenu: () => void;
}

export function Header({ drawerOpen, onOpenMenu }: HeaderProps) {
  const auth = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const user = auth.status === 'authenticated' ? auth.user : null;

  const onLogout = async () => {
    setLoggingOut(true);
    await auth.logout();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-neutral-0 px-4 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
        className="flex size-10 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 lg:hidden"
      >
        <MenuIcon />
      </button>
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700"
            >
              {initials(user.fullName)}
            </span>
            <span className="hidden text-sm font-medium text-neutral-900 sm:block">
              {user.fullName}
            </span>
          </div>
        )}
        <Button
          variant="secondary"
          icon={<LogOutIcon />}
          loading={loggingOut}
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
