import alertCircle from '../../assets/icons/alert-circle.svg?raw';
import calculator from '../../assets/icons/calculator.svg?raw';
import checkCircle from '../../assets/icons/check-circle.svg?raw';
import chevronDown from '../../assets/icons/chevron-down.svg?raw';
import chevronRight from '../../assets/icons/chevron-right.svg?raw';
import eyeOff from '../../assets/icons/eye-off.svg?raw';
import eye from '../../assets/icons/eye.svg?raw';
import layoutDashboard from '../../assets/icons/layout-dashboard.svg?raw';
import list from '../../assets/icons/list.svg?raw';
import logOut from '../../assets/icons/log-out.svg?raw';
import menu from '../../assets/icons/menu.svg?raw';
import panelLeft from '../../assets/icons/panel-left.svg?raw';
import pencil from '../../assets/icons/pencil.svg?raw';
import plus from '../../assets/icons/plus.svg?raw';
import search from '../../assets/icons/search.svg?raw';
import tag from '../../assets/icons/tag.svg?raw';
import trash from '../../assets/icons/trash.svg?raw';
import users from '../../assets/icons/users.svg?raw';
import wallet from '../../assets/icons/wallet.svg?raw';
import x from '../../assets/icons/x.svg?raw';
import { cx } from '../lib/cx';

export interface IconProps {
  /** 20px in buttons and navigation, 16px in table cells and inline messages, 48px in empty states. */
  size?: 16 | 20 | 48;
  className?: string;
}

const SIZE_CLASS = { 16: 'size-4', 20: 'size-5', 48: 'size-12' } as const;

interface SvgIconProps extends IconProps {
  /** The text of an SVG file from src/assets/icons, imported with `?raw`. */
  source: string;
}

/**
 * Draws one of the icon files in src/assets/icons. The files stroke with `currentColor`, so an
 * icon takes the text color of whatever it sits in. Decorative: hidden from assistive technology,
 * so a button that holds only an icon needs its own aria-label.
 */
function SvgIcon({ source, size = 20, className }: SvgIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cx('icon inline-block shrink-0', SIZE_CLASS[size], className)}
      dangerouslySetInnerHTML={{ __html: source }}
    />
  );
}

export const AlertCircleIcon = (props: IconProps) => (
  <SvgIcon source={alertCircle} {...props} />
);
export const CalculatorIcon = (props: IconProps) => (
  <SvgIcon source={calculator} {...props} />
);
export const CheckCircleIcon = (props: IconProps) => (
  <SvgIcon source={checkCircle} {...props} />
);
export const ChevronDownIcon = (props: IconProps) => (
  <SvgIcon source={chevronDown} {...props} />
);
export const ChevronRightIcon = (props: IconProps) => (
  <SvgIcon source={chevronRight} {...props} />
);
export const CloseIcon = (props: IconProps) => (
  <SvgIcon source={x} {...props} />
);
export const DashboardIcon = (props: IconProps) => (
  <SvgIcon source={layoutDashboard} {...props} />
);
export const EyeIcon = (props: IconProps) => (
  <SvgIcon source={eye} {...props} />
);
export const EyeOffIcon = (props: IconProps) => (
  <SvgIcon source={eyeOff} {...props} />
);
export const ListIcon = (props: IconProps) => (
  <SvgIcon source={list} {...props} />
);
export const LogOutIcon = (props: IconProps) => (
  <SvgIcon source={logOut} {...props} />
);
export const MenuIcon = (props: IconProps) => (
  <SvgIcon source={menu} {...props} />
);
export const PanelLeftIcon = (props: IconProps) => (
  <SvgIcon source={panelLeft} {...props} />
);
export const PencilIcon = (props: IconProps) => (
  <SvgIcon source={pencil} {...props} />
);
export const PlusIcon = (props: IconProps) => (
  <SvgIcon source={plus} {...props} />
);
export const SearchIcon = (props: IconProps) => (
  <SvgIcon source={search} {...props} />
);
export const TagIcon = (props: IconProps) => (
  <SvgIcon source={tag} {...props} />
);
export const TrashIcon = (props: IconProps) => (
  <SvgIcon source={trash} {...props} />
);
export const UsersIcon = (props: IconProps) => (
  <SvgIcon source={users} {...props} />
);
export const WalletIcon = (props: IconProps) => (
  <SvgIcon source={wallet} {...props} />
);
