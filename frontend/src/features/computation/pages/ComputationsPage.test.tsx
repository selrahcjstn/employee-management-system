import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../../test/employees-server';
import { renderApp } from '../../../test/render-app';
import { makeSalary, workspaceServer } from '../../../test/workspace-server';

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

/** Ana is the PRD worked example (33,500); Cara earns 60,000; Ben has no salary. */
const seeded = () =>
  workspaceServer([ana, ben, cara], {
    salaries: {
      [ana.id]: { current: makeSalary(ana.id, '30000.00') },
      [cara.id]: { current: makeSalary(cara.id, '60000.00') },
    },
    assigned: {
      [ana.id]: [
        ['Rice Allowance', '2000.00'],
        ['Transportation', '1500.00'],
      ],
    },
  });

const rows = () =>
  within(screen.getByRole('table', { name: 'Computation' }))
    .getAllByRole('row')
    .slice(1);
const names = () =>
  rows().map((row) => within(row).getByRole('link').textContent);
const status = () => screen.getByRole('group', { name: 'Status' });

async function open() {
  const user = userEvent.setup();
  const view = renderApp('/computation');
  await screen.findByRole('table', { name: 'Computation' });
  return { user, ...view };
}

describe('Computation page', () => {
  it('shows the monthly total and every rate, per-minute to four decimals', async () => {
    seeded();
    await open();

    const cells = within(rows()[0]!).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent?.trim()).slice(1, 6)).toEqual([
      '₱33,500.00',
      '₱402,000.00',
      '₱1,280.25',
      '₱160.03',
      '₱2.6672',
    ]);
  });

  it('puts the numbers in right-aligned tabular cells', async () => {
    seeded();
    await open();
    const cells = within(rows()[0]!).getAllByRole('cell').slice(1, 6);
    for (const cell of cells) expect(cell.className).toMatch(/text-right/);
    expect(within(cells[0]!).getByText('₱33,500.00').className).toMatch(
      /\bnum\b/,
    );
  });

  it('says Not assigned for an employee without a salary, in one cell across the numbers', async () => {
    seeded();
    await open();
    const row = rows()[1]!;
    expect(within(row).getByText('Not assigned')).toBeInTheDocument();
    expect(within(row).queryByText(/₱/)).not.toBeInTheDocument();
  });

  it('has no actions menu and no Edit employee, and rows open the Computation tab', async () => {
    seeded();
    const { user, router } = await open();
    expect(
      screen.queryByRole('button', { name: /^Actions for/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Edit employee')).not.toBeInTheDocument();

    await user.click(within(rows()[2]!).getByText('₱60,000.00'));
    expect(router.state.location.pathname).toBe(
      `/employees/${cara.id}/computation`,
    );
  });

  it('opens the Computation tab from the keyboard through the name link', async () => {
    seeded();
    const { user, router } = await open();
    within(rows()[0]!).getByRole('link', { name: 'Ana Reyes' }).focus();
    await user.keyboard('{Enter}');
    expect(router.state.location.pathname).toBe(
      `/employees/${ana.id}/computation`,
    );
  });

  it('summarises the total payroll, monthly and annual, and the average', async () => {
    seeded();
    await open();
    expect(screen.getByText('₱93,500.00')).toBeInTheDocument(); // 33,500 + 60,000
    expect(screen.getByText('₱1,122,000.00')).toBeInTheDocument(); // x 12
    expect(screen.getByText('₱46,750.00')).toBeInTheDocument(); // average of 2
    expect(screen.getByText('1 left out: no basic salary')).toBeInTheDocument();
  });

  describe('filters', () => {
    it('filters by status, with counts', async () => {
      seeded();
      const { user } = await open();
      await user.click(
        within(status()).getByRole('button', { name: /Needs salary\s*1/ }),
      );
      expect(names()).toEqual(['Ben Lim']);
      await user.click(
        within(status()).getByRole('button', { name: /Computed\s*2/ }),
      );
      expect(names()).toEqual(['Ana Reyes', 'Cara Santos']);
    });

    it('filters by the size of the monthly total', async () => {
      seeded();
      const { user } = await open();
      await user.selectOptions(
        screen.getByLabelText('Monthly total'),
        '₱25,000 to ₱50,000',
      );
      expect(names()).toEqual(['Ana Reyes']);
      await user.selectOptions(
        screen.getByLabelText('Monthly total'),
        '₱50,000 or more',
      );
      expect(names()).toEqual(['Cara Santos']);
      await user.selectOptions(
        screen.getByLabelText('Monthly total'),
        'Under ₱25,000',
      );
      expect(
        await screen.findByRole('heading', { name: 'No employees match' }),
      ).toBeInTheDocument();
    });

    it('sorts by monthly total, those without one last either way', async () => {
      seeded();
      const { user } = await open();
      await user.selectOptions(
        screen.getByLabelText('Sort by'),
        'Monthly total, high to low',
      );
      expect(names()).toEqual(['Cara Santos', 'Ana Reyes', 'Ben Lim']);
      await user.selectOptions(
        screen.getByLabelText('Sort by'),
        'Monthly total, low to high',
      );
      expect(names()).toEqual(['Ana Reyes', 'Cara Santos', 'Ben Lim']);
    });

    it('searches by name or Employee ID and clears everything with one button', async () => {
      seeded();
      const { user } = await open();
      await user.click(
        within(status()).getByRole('button', { name: /Computed/ }),
      );
      await user.type(
        screen.getByRole('searchbox', { name: 'Search computation' }),
        'emp-003',
      );
      expect(names()).toEqual(['Cara Santos']);

      await user.click(screen.getByRole('button', { name: 'Clear filters' }));
      expect(names()).toEqual(['Ana Reyes', 'Ben Lim', 'Cara Santos']);
    });
  });

  it('recalculates after a component is added in the workspace', async () => {
    seeded();
    const { user, router } = await open();
    await router.navigate(`/employees/${cara.id}/components`);
    await user.click(
      await screen.findByRole('combobox', { name: 'Component' }),
    );
    await user.type(
      screen.getByRole('combobox', { name: 'Component' }),
      'Bonus',
    );
    await user.click(
      await screen.findByRole('option', { name: 'Create “Bonus”' }),
    );
    await user.type(screen.getByLabelText(/^Amount/), '5000');
    await user.click(screen.getByRole('button', { name: 'Add component' }));
    await screen.findByText('Component added');

    await router.navigate('/computation');
    // Wait for the overview: until then the workspace is still showing the same total in its header.
    await screen.findByRole('table', { name: 'Computation' });
    expect(
      await within(rows()[2]!).findByText('₱65,000.00'),
    ).toBeInTheDocument();
    expect(rows()[2]).toHaveTextContent('₱780,000.00');
  });

  it('shows an empty state when there are no employees', async () => {
    workspaceServer([]);
    renderApp('/computation');
    expect(
      await screen.findByRole('heading', { name: 'No employees yet' }),
    ).toBeInTheDocument();
  });

  it('shows a plain error with Retry', async () => {
    const server = seeded();
    server.fail.computation = true;
    const user = userEvent.setup();
    renderApp('/computation');
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/select sum/);
    server.fail.computation = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('table', { name: 'Computation' }),
    ).toBeInTheDocument();
  });
});
