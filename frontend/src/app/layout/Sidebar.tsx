import { useEffect } from 'react';
import { NavLink } from 'react-router';
import { APP_NAME } from '../../shared/config';
import { cx } from '../../shared/lib/cx';
import { NAV_ITEMS } from './nav-items';

const LINK =
  'flex h-10 items-center gap-2 rounded-md px-4 text-sm transition-colors';

interface SidebarProps {
  /** On screens below 1024px the sidebar is a drawer; this says whether it is open. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="app-sidebar"
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neutral-200 bg-neutral-0 transition-transform lg:visible lg:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center px-4 text-lg font-semibold text-neutral-900">
          {APP_NAME}
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 p-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, enabled }) =>
            enabled ? (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cx(
                    LINK,
                    isActive
                      ? 'bg-primary-50 font-medium text-primary-700'
                      : 'text-neutral-700 hover:bg-neutral-100',
                  )
                }
              >
                <Icon />
                {label}
              </NavLink>
            ) : (
              <span
                key={to}
                aria-disabled="true"
                className={cx(LINK, 'cursor-not-allowed text-neutral-400')}
              >
                <Icon />
                {label}
                <span className="ml-auto text-xs">Soon</span>
              </span>
            ),
          )}
        </nav>
      </aside>
    </>
  );
}
