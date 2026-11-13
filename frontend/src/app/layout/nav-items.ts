import type { ComponentType } from 'react';
import {
  CalculatorIcon,
  DashboardIcon,
  ListIcon,
  UsersIcon,
  WalletIcon,
  type IconProps,
} from '../../shared/ui/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
  /** Pages that are not built yet show as disabled. */
  enabled: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** The four modules, grouped by what they are about. The breadcrumb in the header repeats the group. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: DashboardIcon,
        enabled: true,
      },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: UsersIcon, enabled: true },
    ],
  },
  {
    label: 'Pay',
    items: [
      { to: '/salary', label: 'Salary', icon: WalletIcon, enabled: true },
      {
        to: '/components',
        label: 'Components',
        icon: ListIcon,
        enabled: false,
      },
      {
        to: '/computation',
        label: 'Computation',
        icon: CalculatorIcon,
        enabled: false,
      },
    ],
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
