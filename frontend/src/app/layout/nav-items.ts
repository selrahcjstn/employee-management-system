import type { ComponentType } from 'react';
import {
  CalculatorIcon,
  ListIcon,
  UsersIcon,
  WalletIcon,
} from '../../shared/ui/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType;
  /** Pages that are not built yet show as disabled. */
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/employees', label: 'Employees', icon: UsersIcon, enabled: true },
  { to: '/salary', label: 'Salary', icon: WalletIcon, enabled: false },
  { to: '/components', label: 'Components', icon: ListIcon, enabled: false },
  {
    to: '/computation',
    label: 'Computation',
    icon: CalculatorIcon,
    enabled: false,
  },
];
