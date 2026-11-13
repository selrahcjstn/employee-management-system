import { NAV_GROUPS, findNav } from './nav-items';

describe('nav groups', () => {
  it('lists Overview, People and Pay, with every module once', () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual([
      'Overview',
      'People',
      'Pay',
    ]);
    expect(
      NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label)),
    ).toEqual([
      'Dashboard',
      'Employees',
      'Salary',
      'Components',
      'Computation',
    ]);
  });

  it('enables only the pages that exist', () => {
    const enabled = NAV_GROUPS.flatMap((group) => group.items)
      .filter((item) => item.enabled)
      .map((item) => item.to);
    expect(enabled).toEqual(['/dashboard', '/employees', '/salary']);
  });
});

describe('findNav', () => {
  it('finds the group and page for a path, and for a path below it', () => {
    expect(findNav('/dashboard')).toMatchObject({
      group: 'Overview',
      item: { label: 'Dashboard' },
    });
    expect(findNav('/employees')).toMatchObject({
      group: 'People',
      item: { label: 'Employees' },
    });
    expect(findNav('/employees/42')).toMatchObject({ group: 'People' });
    expect(findNav('/salary')).toMatchObject({
      group: 'Pay',
      item: { label: 'Salary' },
    });
    expect(findNav('/computation')).toMatchObject({
      group: 'Pay',
      item: { label: 'Computation' },
    });
  });

  it('does not match a path that only starts with the same letters', () => {
    expect(findNav('/employeesX')).toBeUndefined();
    expect(findNav('/salaries')).toBeUndefined();
  });

  it('returns nothing for the root and for unknown paths', () => {
    expect(findNav('/')).toBeUndefined();
    expect(findNav('/login')).toBeUndefined();
  });
});
