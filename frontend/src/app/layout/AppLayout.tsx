import { useCallback, useState } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/** The frame for every signed-in page: 240px sidebar, 64px header, content up to 1200px. */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-neutral-0 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>
      <Sidebar open={drawerOpen} onClose={closeDrawer} />
      <div className="lg:pl-60">
        <Header
          drawerOpen={drawerOpen}
          onOpenMenu={() => setDrawerOpen(true)}
        />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-content p-4 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
