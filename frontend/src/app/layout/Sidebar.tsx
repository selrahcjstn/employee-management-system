import { useEffect, useRef, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Logo } from '../../features/auth/components/Logo';
import { cx } from '../../shared/lib/cx';
import { CloseIcon } from '../../shared/ui/icons';
import { IconButton } from '../../shared/ui/IconButton';
import { NAV_GROUPS, type NavItem } from './nav-items';

export type CloseReason = 'dismiss' | 'navigate';

interface SidebarProps {
  /** Desktop icon rail (72px). Below 1024px the sidebar is a drawer and ignores this. */
  collapsed: boolean;
  /** Whether the mobile drawer is open. */
  drawerOpen: boolean;
  /** `dismiss`: closed with Escape, the overlay or the close button. `navigate`: a link was followed. */
  onClose: (reason: CloseReason) => void;
}

const ITEM =
  'group relative flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors';
const LABEL = 'whitespace-nowrap transition-opacity delay-100';
/** In the rail the text is squeezed to nothing but stays in the page, so screen readers still read it. */
const RAIL_HIDDEN = 'lg:w-0 lg:overflow-hidden lg:opacity-0';
const RAIL_CENTER = 'lg:justify-center lg:px-0';

/** A small label that appears beside an icon in the rail, on hover or keyboard focus. */
function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 hidden -translate-y-1/2 rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-neutral-0 shadow-md lg:group-hover:block lg:group-focus-visible:block"
    >
      {children}
    </span>
  );
}

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate: () => void;
}

function SidebarItem({ item, collapsed, onNavigate }: SidebarItemProps) {
  const Icon = item.icon;
  const label = (
    <span className={cx(LABEL, collapsed && RAIL_HIDDEN)}>{item.label}</span>
  );

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          ITEM,
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
          collapsed && RAIL_CENTER,
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            // The marker on the sidebar's left edge: where you are, readable at a glance.
            <span
              aria-hidden="true"
              className="absolute top-1/2 -left-2 h-6 w-0.75 -translate-y-1/2 rounded-r-full bg-primary-600"
            />
          )}
          <Icon />
          {label}
          {collapsed && <Tooltip>{item.label}</Tooltip>}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ collapsed, drawerOpen, onClose }: SidebarProps) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose('dismiss');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, onClose]);

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-overlay lg:hidden"
          onClick={() => onClose('dismiss')}
          aria-hidden="true"
        />
      )}
      <aside
        id="app-sidebar"
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neutral-200 bg-neutral-0 transition-[width,transform] duration-200 lg:visible lg:translate-x-0',
          collapsed && 'lg:w-18',
          drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-neutral-200 px-4">
          <Logo />
          <div
            className={cx(
              'min-w-0 flex-1 leading-tight',
              LABEL,
              collapsed && RAIL_HIDDEN,
            )}
          >
            <p className="text-sm font-semibold text-neutral-900">
              Employee &amp; Salary
            </p>
            <p className="text-xs text-neutral-500">Management</p>
          </div>
          <IconButton
            ref={closeButton}
            label="Close navigation"
            onClick={() => onClose('dismiss')}
            className="lg:hidden"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-4 px-2 py-4">
          {NAV_GROUPS.map((group, index) => {
            const headingId = `nav-group-${group.label.toLowerCase()}`;
            return (
              <div key={group.label}>
                {collapsed && index > 0 && (
                  <div
                    aria-hidden="true"
                    className="mx-2 mb-4 hidden h-px bg-neutral-200 lg:block"
                  />
                )}
                <p
                  id={headingId}
                  className={cx(
                    'mb-2 px-4 text-xs font-semibold text-neutral-500',
                    collapsed && 'lg:sr-only',
                  )}
                >
                  {group.label}
                </p>
                <ul aria-labelledby={headingId} className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <SidebarItem
                        item={item}
                        collapsed={collapsed}
                        onNavigate={() => {
                          if (drawerOpen) onClose('navigate');
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
