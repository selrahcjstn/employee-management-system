import type { ComponentType } from 'react';
import {
  DashboardIcon,
  UsersIcon,
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
 * The sidebar: the dashboard, and the employee hub. Salary, Components and Computation are tabs in an
 * employee's workspace, not pages of their own. The breadcrumb in the header repeats the group.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: DashboardIcon,
      },
    ],
  },
  {
    label: 'People',
    items: [{ to: '/employees', label: 'Employees', icon: UsersIcon }],
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
