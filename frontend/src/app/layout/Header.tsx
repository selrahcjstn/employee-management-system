import type { Ref } from 'react';
import { IconButton } from '../../shared/ui/IconButton';
import { MenuIcon, PanelLeftIcon } from '../../shared/ui/icons';
import { Breadcrumb } from './Breadcrumb';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  collapsed: boolean;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onToggleCollapsed: () => void;
  /** The button that opens the drawer, so focus can return to it when the drawer closes. */
  menuButtonRef: Ref<HTMLButtonElement>;
}

/** 64px bar across the top: sidebar control and breadcrumb on the left, the account menu on the right. */
export function Header({
  collapsed,
  drawerOpen,
  onOpenDrawer,
  onToggleCollapsed,
  menuButtonRef,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-neutral-200 bg-neutral-0/80 px-4 backdrop-blur-md lg:px-8">
      <div className="lg:hidden">
        <IconButton
          ref={menuButtonRef}
          label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
          onClick={onOpenDrawer}
        >
          <MenuIcon />
        </IconButton>
      </div>
      <div className="hidden lg:block">
        <IconButton
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          onClick={onToggleCollapsed}
        >
          <PanelLeftIcon />
        </IconButton>
      </div>
      <div aria-hidden="true" className="mx-1 h-6 w-px bg-neutral-200" />
      <Breadcrumb />
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
