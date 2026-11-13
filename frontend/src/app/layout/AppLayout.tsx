import { useCallback, useEffect, useRef } from 'react';
import { Outlet } from 'react-router';
import { cx } from '../../shared/lib/cx';
import { Header } from './Header';
import { Sidebar, type CloseReason } from './Sidebar';
import { useSidebarState } from './use-sidebar-state';

/** The frame for every signed-in page: sidebar (240px, or a 72px rail), 64px header, content up to 1200px. */
export function AppLayout() {
  const { collapsed, drawerOpen, toggleCollapsed, openDrawer, closeDrawer } =
    useSidebarState();
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const focusAfterClose = useRef<'menu-button' | 'main' | null>(null);

  // Where focus goes when the drawer closes: back to the button that opened it, or, after
  // following a link, to the new page. It waits for the drawer to be gone because the page
  // behind an open drawer is `inert` and cannot take focus.
  useEffect(() => {
    if (drawerOpen || !focusAfterClose.current) return;
    (focusAfterClose.current === 'main' ? main : menuButton).current?.focus();
    focusAfterClose.current = null;
  }, [drawerOpen]);

  const onClose = useCallback(
    (reason: CloseReason) => {
      focusAfterClose.current = reason === 'navigate' ? 'main' : 'menu-button';
      closeDrawer();
    },
    [closeDrawer],
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-neutral-0 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>
      <Sidebar
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onClose={onClose}
      />
      <div
        inert={drawerOpen}
        className={cx(
          'transition-[padding] duration-200',
          collapsed ? 'lg:pl-18' : 'lg:pl-60',
        )}
      >
        <Header
          collapsed={collapsed}
          drawerOpen={drawerOpen}
          onOpenDrawer={openDrawer}
          onToggleCollapsed={toggleCollapsed}
          menuButtonRef={menuButton}
        />
        <main
          id="main"
          ref={main}
          tabIndex={-1}
          className="mx-auto w-full max-w-content p-4 outline-none lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
