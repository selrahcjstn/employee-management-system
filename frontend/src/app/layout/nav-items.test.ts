import { NAV_GROUPS, findNav } from './nav-items';

describe('nav groups', () => {
  it('lists Overview and People, with the dashboard and the employee hub', () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual([
      'Overview',
      'People',
    ]);
    expect(
      NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to)),
    ).toEqual(['/dashboard', '/employees']);
  });

  it('has no pay links: Salary, Components and Computation are tabs in an employee workspace', () => {
    const labels = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => item.label),
    );
    for (const gone of ['Salary', 'Components', 'Computation']) {
      expect(labels).not.toContain(gone);
    }
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
  });

  it('does not match a path that only starts with the same letters', () => {
    expect(findNav('/employeesX')).toBeUndefined();
    expect(findNav('/salaries')).toBeUndefined();
    expect(findNav('/salary')).toBeUndefined();
  });

  it('returns nothing for the root and for unknown paths', () => {
    expect(findNav('/')).toBeUndefined();
    expect(findNav('/login')).toBeUndefined();
  });
});
