import { useCallback, useEffect, useState } from 'react';

export const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';
/** The width at which the sidebar stops being a drawer (the `lg` breakpoint in DESIGN.md 4.4). */
const DESKTOP_QUERY = '(min-width: 1024px)';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    // Storage can be blocked (private windows, site settings). The sidebar then starts expanded.
    return false;
  }
}

/**
 * The two states of the sidebar. `collapsed` is the desktop icon rail, remembered between visits
 * (a display preference, never a token). `drawerOpen` is the mobile drawer, which closes by itself
 * when the window becomes wide enough to show the sidebar permanently.
 */
export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Not saved; it still works for this visit.
    }
  }, [collapsed]);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (query.matches) setDrawerOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return {
    collapsed,
    drawerOpen,
    toggleCollapsed: useCallback(() => setCollapsed((current) => !current), []),
    openDrawer: useCallback(() => setDrawerOpen(true), []),
    closeDrawer: useCallback(() => setDrawerOpen(false), []),
  };
}
