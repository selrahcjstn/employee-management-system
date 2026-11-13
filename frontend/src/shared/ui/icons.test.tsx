import { render } from '@testing-library/react';
import * as icons from './icons';

const components = Object.entries(icons).filter(([name]) =>
  name.endsWith('Icon'),
) as [string, (props: icons.IconProps) => React.JSX.Element][];

describe('icons', () => {
  it('has all twenty-three icons from src/assets/icons', () => {
    expect(components.map(([name]) => name).sort()).toEqual([
      'AlertCircleIcon',
      'ArrowLeftIcon',
      'CalculatorIcon',
      'CheckCircleIcon',
      'ChevronDownIcon',
      'ChevronRightIcon',
      'CloseIcon',
      'DashboardIcon',
      'EyeIcon',
      'EyeOffIcon',
      'ListIcon',
      'LogOutIcon',
      'MenuIcon',
      'MoreIcon',
      'PanelLeftIcon',
      'PencilIcon',
      'PlusIcon',
      'SearchIcon',
      'TagIcon',
      'TrashIcon',
      'UserIcon',
      'UsersIcon',
      'WalletIcon',
    ]);
  });

  it.each(components)(
    '%s draws an SVG that is hidden from assistive technology',
    (_name, Icon) => {
      const { container } = render(<Icon />);
      const wrapper = container.firstElementChild!;
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      expect(wrapper.querySelector('svg')).not.toBeNull();
    },
  );

  it.each(components)(
    '%s is 20px by default, and 16px or 48px when asked',
    (_name, Icon) => {
      const { container: normal } = render(<Icon />);
      expect(normal.firstElementChild!.className).toMatch(/\bsize-5\b/);
      const { container: small } = render(<Icon size={16} />);
      expect(small.firstElementChild!.className).toMatch(/\bsize-4\b/);
      const { container: large } = render(<Icon size={48} />);
      expect(large.firstElementChild!.className).toMatch(/\bsize-12\b/);
    },
  );

  it('passes a class name through, for positioning', () => {
    const { container } = render(
      <icons.UsersIcon className="shrink-0 text-danger" />,
    );
    expect(container.firstElementChild!.className).toMatch(/text-danger/);
  });
});
