import type { ComponentType } from 'react';
import {
  CalculatorIcon,
  DashboardIcon,
  ListIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type IconProps,
} from '../../shared/ui/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The sidebar, grouped by what the pages are about. Every item is a real page. The breadcrumb in
 * the header repeats the group.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: DashboardIcon }],
  },
  {
    label: 'People',
    items: [{ to: '/employees', label: 'Employees', icon: UsersIcon }],
  },
  {
    label: 'Pay',
    items: [
      { to: '/salaries', label: 'Salaries', icon: WalletIcon },
      { to: '/components', label: 'Components', icon: ListIcon },
      { to: '/computation', label: 'Computation', icon: CalculatorIcon },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/profile', label: 'My profile', icon: UserIcon }],
  },
];

/** The group and page that a path belongs to, for the breadcrumb. */
export function findNav(
  pathname: string,
): { group: string; item: NavItem } | undefined {
  for (const group of NAV_GROUPS) {
    const item = group.items.find(
      (candidate) =>
        pathname === candidate.to || pathname.startsWith(`${candidate.to}/`),
    );
    if (item) return { group: group.label, item };
  }
  return undefined;
}
