import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../../test/employees-server';
import { renderApp } from '../../../test/render-app';
import { makeSalary, workspaceServer } from '../../../test/workspace-server';

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const ana = makeEmployee({
  employeeNo: 'EMP-001',
  firstName: 'Ana',
  lastName: 'Reyes',
});
const ben = makeEmployee({
  employeeNo: 'EMP-002',
  firstName: 'Ben',
  lastName: 'Lim',
});
const cara = makeEmployee({
  employeeNo: 'EMP-003',
  firstName: 'Cara',
  lastName: 'Santos',
});

const seeded = () =>
  workspaceServer([ana, ben, cara], {
    salaries: {
      [ana.id]: { current: makeSalary(ana.id, '30000.00', daysAgo(10)) },
      [cara.id]: { current: makeSalary(cara.id, '45000.00', daysAgo(400)) },
    },
  });

const rows = () =>
  within(screen.getByRole('table', { name: 'Salaries' }))
    .getAllByRole('row')
    .slice(1);
const names = () =>
  rows().map((row) => within(row).getByRole('link').textContent);
const status = () => screen.getByRole('group', { name: 'Status' });

async function open() {
  const user = userEvent.setup();
  const view = renderApp('/salaries');
  await screen.findByRole('table', { name: 'Salaries' });
  return { user, ...view };
}

describe('Salaries page', () => {
  it('lists every employee with their salary, last adjusted date and status', async () => {
    seeded();
    await open();

    expect(names()).toEqual(['Ana Reyes', 'Ben Lim', 'Cara Santos']);
    const [first, second] = rows();
    expect(first).toHaveTextContent('EMP-001');
    expect(first).toHaveTextContent('₱30,000.00');
    expect(first).toHaveTextContent('Ready');
    expect(second).toHaveTextContent('Not assigned');
    expect(second).toHaveTextContent('Needs salary');
  });

  it('has no actions menu and no Edit employee: a row already opens the workspace', async () => {
    seeded();
    await open();
    expect(
      screen.queryByRole('button', { name: /^Actions for/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Edit employee')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add employee' }),
    ).not.toBeInTheDocument();
  });

  it('opens the Salary tab when a row is clicked', async () => {
    seeded();
    const { user, router } = await open();
    await user.click(within(rows()[1]!).getByText('Not assigned'));
    expect(router.state.location.pathname).toBe(`/employees/${ben.id}/salary`);
  });

  it('opens the Salary tab from the keyboard through the name link', async () => {
    seeded();
    const { user, router } = await open();
    within(rows()[0]!).getByRole('link', { name: 'Ana Reyes' }).focus();
    await user.keyboard('{Enter}');
    expect(router.state.location.pathname).toBe(`/employees/${ana.id}/salary`);
  });

  it('summarises how many salaries are assigned and the payroll', async () => {
    seeded();
    await open();
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('1 still need one')).toBeInTheDocument();
    expect(screen.getByText('₱75,000.00')).toBeInTheDocument(); // total basic payroll
    expect(screen.getByText('₱37,500.00')).toBeInTheDocument(); // average
  });

  describe('filters', () => {
    it('shows how many each status would show, and filters by it', async () => {
      seeded();
      const { user } = await open();
      expect(
        within(status()).getByRole('button', { name: /All\s*3/ }),
      ).toHaveAttribute('aria-pressed', 'true');

      await user.click(
        within(status()).getByRole('button', { name: /Needs salary\s*1/ }),
      );
      expect(names()).toEqual(['Ben Lim']);
      await user.click(
        within(status()).getByRole('button', { name: /Ready\s*2/ }),
      );
      expect(names()).toEqual(['Ana Reyes', 'Cara Santos']);
    });

    it('filters by when the salary was last adjusted', async () => {
      seeded();
      const { user } = await open();
      await user.selectOptions(
        screen.getByLabelText('Adjusted'),
        'Last 30 days',
      );
      expect(names()).toEqual(['Ana Reyes']);
      await user.selectOptions(
        screen.getByLabelText('Adjusted'),
        'Over a year ago',
      );
      expect(names()).toEqual(['Cara Santos']);
    });

    it('sorts by salary, with employees who have none last either way', async () => {
      seeded();
      const { user } = await open();
      await user.selectOptions(
        screen.getByLabelText('Sort by'),
        'Salary, high to low',
      );
      expect(names()).toEqual(['Cara Santos', 'Ana Reyes', 'Ben Lim']);
      await user.selectOptions(
        screen.getByLabelText('Sort by'),
        'Salary, low to high',
      );
      expect(names()).toEqual(['Ana Reyes', 'Cara Santos', 'Ben Lim']);
      await user.selectOptions(
        screen.getByLabelText('Sort by'),
        'Recently adjusted',
      );
      expect(names()[0]).toBe('Ana Reyes');
    });

    it('combines the search with the filters, and clears them all', async () => {
      seeded();
      const { user } = await open();
      await user.click(within(status()).getByRole('button', { name: /Ready/ }));
      await user.type(
        screen.getByRole('searchbox', { name: 'Search salaries' }),
        'cara',
      );
      expect(names()).toEqual(['Cara Santos']);

      await user.type(screen.getByRole('searchbox'), 'zzz');
      expect(
        await screen.findByRole('heading', { name: 'No salaries match' }),
      ).toBeInTheDocument();
      await user.click(
        screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!,
      );
      await screen.findByRole('table', { name: 'Salaries' });
      expect(names()).toEqual(['Ana Reyes', 'Ben Lim', 'Cara Santos']);
      expect(screen.getByRole('searchbox')).toHaveValue('');
    });
  });

  it('updates after a salary is saved in the workspace', async () => {
    seeded();
    const { user, router } = await open();
    await router.navigate(`/employees/${ben.id}/salary`);
    await user.type(
      await screen.findByLabelText(/monthly basic salary/i),
      '28000',
    );
    await user.click(screen.getByRole('button', { name: 'Assign salary' }));
    await screen.findByText('Salary assigned');

    await router.navigate('/salaries');
    await screen.findByRole('table', { name: 'Salaries' });
    expect(await screen.findByText('3 of 3')).toBeInTheDocument();
    expect(rows()[1]).toHaveTextContent('₱28,000.00');
    expect(rows()[1]).toHaveTextContent('Ready');
  });

  it('shows an empty state with a way to add employees when there are none', async () => {
    workspaceServer([]);
    renderApp('/salaries');
    expect(
      await screen.findByRole('heading', { name: 'No employees yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to Employees' }),
    ).toHaveAttribute('href', '/employees');
  });

  it('shows a plain error with Retry', async () => {
    const server = seeded();
    server.fail.list = true;
    const user = userEvent.setup();
    renderApp('/salaries');
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/postgres|password/i);
    server.fail.list = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('table', { name: 'Salaries' }),
    ).toBeInTheDocument();
  });
});
