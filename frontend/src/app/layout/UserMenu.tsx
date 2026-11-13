import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useAuth } from '../../features/auth/context/useAuth';
import { cx } from '../../shared/lib/cx';
import { roleLabel } from '../../shared/lib/role-label';
import { Avatar } from '../../shared/ui/Avatar';
import { Badge } from '../../shared/ui/Badge';
import { ChevronDownIcon, LogOutIcon } from '../../shared/ui/icons';

/**
 * The account menu in the header: who you are and Logout. A button that opens a real menu: it
 * takes focus when it opens, the arrow keys move between items, Escape closes it and puts focus
 * back on the button, and so does a click anywhere outside.
 */
export function UserMenu() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (auth.status !== 'authenticated') return null;
  const { user } = auth;

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [
      ...(menu.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? []),
    ];
    const current = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (index: number) => {
      event.preventDefault();
      items[(index + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'ArrowDown':
        focusAt(current + 1);
        break;
      case 'ArrowUp':
        focusAt(current - 1);
        break;
      case 'Home':
        focusAt(0);
        break;
      case 'End':
        focusAt(items.length - 1);
        break;
      case 'Tab':
        // Focus moves on by itself; the menu just closes behind it.
        setOpen(false);
        break;
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    await auth.logout();
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account menu, ${user.fullName}`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-10 items-center gap-2 rounded-md pr-2 pl-1 transition-colors hover:bg-neutral-100"
      >
        <Avatar name={user.fullName} />
        <span className="hidden text-sm font-medium text-neutral-900 sm:block">
          {user.fullName}
        </span>
        <ChevronDownIcon
          size={16}
          className={cx(
            'text-neutral-500 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-64 animate-menu-in rounded-lg border border-neutral-200 bg-neutral-0 p-2 shadow-md">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar name={user.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-900">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-neutral-600">{user.email}</p>
            </div>
          </div>
          <div className="px-2 pb-2">
            <Badge variant="primary">{roleLabel(user.role)}</Badge>
          </div>
          <hr className="my-2 border-neutral-200" />
          <div
            id={menuId}
            ref={menu}
            role="menu"
            aria-label="Account"
            onKeyDown={onMenuKeyDown}
          >
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={onLogout}
              className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-400"
            >
              <LogOutIcon />
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
