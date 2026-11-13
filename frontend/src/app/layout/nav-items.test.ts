import { NAV_GROUPS, findNav } from './nav-items';

describe('nav groups', () => {
  it('lists Overview, People, Pay and Account, each page once', () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual([
      'Overview',
      'People',
      'Pay',
      'Account',
    ]);
    expect(
      NAV_GROUPS.flatMap((group) => group.items.map((item) => item.label)),
    ).toEqual([
      'Dashboard',
      'Employees',
      'Salaries',
      'Components',
      'Computation',
      'My profile',
    ]);
  });

  it('points every item at a real page', () => {
    expect(
      NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
    ).toEqual([
      '/dashboard',
      '/employees',
      '/salaries',
      '/components',
      '/computation',
      '/profile',
    ]);
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
    expect(findNav('/employees/42/salary')).toMatchObject({
      group: 'People',
      item: { label: 'Employees' },
    });
    expect(findNav('/salaries')).toMatchObject({
      group: 'Pay',
      item: { label: 'Salaries' },
    });
    expect(findNav('/computation')).toMatchObject({
      group: 'Pay',
      item: { label: 'Computation' },
    });
    expect(findNav('/profile')).toMatchObject({
      group: 'Account',
      item: { label: 'My profile' },
    });
  });

  it('does not match a path that only starts with the same letters', () => {
    expect(findNav('/employeesX')).toBeUndefined();
    expect(findNav('/salary')).toBeUndefined();
    expect(findNav('/profiles')).toBeUndefined();
  });

  it('returns nothing for the root and for unknown paths', () => {
    expect(findNav('/')).toBeUndefined();
    expect(findNav('/login')).toBeUndefined();
  });
});
