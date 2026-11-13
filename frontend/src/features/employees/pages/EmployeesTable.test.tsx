import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../../test/render-app';
import { makeEmployee } from '../../../test/employees-server';
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
// Created before the Employee ID rule: it must still be listed and editable.
const legacy = makeEmployee({
  employeeNo: 'EMP003',
  firstName: 'Old',
  lastName: 'Row',
});

const seeded = () =>
  // Copies, because the fake server edits the employees it is given.
  workspaceServer(
    [ana, ben, legacy].map((employee) => ({ ...employee })),
    {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
      assigned: {
        [ana.id]: [
          ['Rice Allowance', '2000.00'],
          ['Transportation', '1500.00'],
        ],
      },
    },
  );

const rows = () =>
  within(screen.getByRole('table', { name: 'Employees' }))
    .getAllByRole('row')
    .slice(1);

async function open() {
  const user = userEvent.setup();
  const view = renderApp('/employees');
  await screen.findByRole('table', { name: 'Employees' });
  return { user, ...view };
}

describe('Employees table', () => {
  it('has the columns: Employee ID, Full name, Date hired, Basic salary, Components, Monthly total, Status and actions', async () => {
    seeded();
    await open();
    expect(
      screen
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent?.trim()),
    ).toEqual([
      'Employee ID',
      'Full name',
      'Date hired',
      'Basic salary',
      'Components',
      'Monthly total',
      'Status',
      'Actions',
    ]);
  });

  it('shows the components count, the monthly total and a Ready status for an employee with a salary', async () => {
    seeded();
    await open();
    const row = rows()[0]!;
    expect(row).toHaveTextContent('EMP-001');
    expect(row).toHaveTextContent('₱30,000.00');
    expect(row).toHaveTextContent('₱33,500.00');
    expect(within(row).getByText('2')).toBeInTheDocument();
    expect(within(row).getByText('Ready')).toBeInTheDocument();
  });

  it('shows Not assigned, a dash and Needs salary for an employee without one', async () => {
    seeded();
    await open();
    const row = rows()[1]!;
    expect(within(row).getByText('Not assigned')).toBeInTheDocument();
    expect(within(row).getByLabelText('No monthly total')).toBeInTheDocument();
    expect(within(row).getByText('Needs salary')).toBeInTheDocument();
  });

  it('aligns the money and count columns to the right', async () => {
    seeded();
    await open();
    const cells = within(rows()[0]!).getAllByRole('cell');
    for (const index of [3, 4, 5])
      expect(cells[index]!.className).toMatch(/text-right/);
  });

  it('lists a row that does not match the Employee ID format (EMP003) like any other', async () => {
    seeded();
    await open();
    expect(rows()[2]).toHaveTextContent('EMP003');
    expect(rows()[2]).toHaveTextContent('Old Row');
  });

  describe('opening an employee', () => {
    it('opens the Salary tab when the row is clicked anywhere', async () => {
      seeded();
      const { user, router } = await open();
      await user.click(within(rows()[1]!).getByText('Not assigned'));
      expect(router.state.location.pathname).toBe(
        `/employees/${ben.id}/salary`,
      );
    });

    it('opens it from the keyboard through the name link', async () => {
      seeded();
      const { user, router } = await open();
      const link = within(rows()[0]!).getByRole('link', { name: 'Ana Reyes' });
      expect(link).toHaveAttribute('href', `/employees/${ana.id}/salary`);
      link.focus();
      await user.keyboard('{Enter}');
      expect(router.state.location.pathname).toBe(
        `/employees/${ana.id}/salary`,
      );
    });
  });

  describe('the actions menu', () => {
    it('is the only action on a row: no pencil, no text links for the tabs', async () => {
      seeded();
      await open();
      const row = rows()[0]!;
      expect(within(row).getAllByRole('button')).toHaveLength(1);
      expect(
        within(row).queryByRole('button', { name: /^Edit / }),
      ).not.toBeInTheDocument();
      expect(within(row).getAllByRole('link')).toHaveLength(1); // the name
    });

    it('is named for the employee and holds Edit employee, Salary, Components and Computation', async () => {
      seeded();
      const { user } = await open();
      await user.click(
        screen.getByRole('button', { name: 'Actions for Ana Reyes' }),
      );
      const items = screen.getAllByRole('menuitem');
      expect(items.map((item) => item.textContent)).toEqual([
        'Edit employee',
        'Salary',
        'Components',
        'Computation',
      ]);
      expect(items[3]).toHaveAttribute(
        'href',
        `/employees/${ana.id}/computation`,
      );
    });

    it('works from the keyboard: open, arrow to a tab, Enter', async () => {
      seeded();
      const { user, router } = await open();
      screen.getByRole('button', { name: 'Actions for Ben Lim' }).focus();
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      expect(router.state.location.pathname).toBe(
        `/employees/${ben.id}/components`,
      );
    });

    it('does not also open the row when the menu is used', async () => {
      seeded();
      const { user, router } = await open();
      await user.click(
        screen.getByRole('button', { name: 'Actions for Ana Reyes' }),
      );
      expect(router.state.location.pathname).toBe('/employees');
    });

    it('opens the edit dialog, and a pre-rule Employee ID can still be edited', async () => {
      seeded();
      const { user } = await open();
      await user.click(
        screen.getByRole('button', { name: 'Actions for Old Row' }),
      );
      await user.click(screen.getByRole('menuitem', { name: 'Edit employee' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Edit employee',
      });
      expect(within(dialog).getByLabelText(/^Employee ID/)).toHaveValue(
        'EMP003',
      );

      await user.clear(within(dialog).getByLabelText(/^First name/));
      await user.type(within(dialog).getByLabelText(/^First name/), 'Older');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save changes' }),
      );
      expect(await screen.findByText('Employee updated')).toBeInTheDocument();
    });
  });

  describe('the Needs salary only filter', () => {
    it('shows only employees without a basic salary, and combines with the search', async () => {
      seeded();
      const { user } = await open();
      await user.click(
        screen.getByRole('checkbox', { name: 'Needs salary only' }),
      );
      expect(
        rows().map((row) => within(row).getByRole('link').textContent),
      ).toEqual(['Ben Lim', 'Old Row']);

      await user.type(screen.getByRole('searchbox'), 'ben');
      // The search waits a moment after typing, then asks the server.
      await waitFor(() => expect(rows()).toHaveLength(1));
      expect(rows()[0]).toHaveTextContent('Ben Lim');
    });

    it('says so when everyone has a salary, and clears the filter from there', async () => {
      workspaceServer([ana], {
        salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
      });
      const { user } = await open();
      await user.click(
        screen.getByRole('checkbox', { name: 'Needs salary only' }),
      );
      expect(
        await screen.findByRole('heading', {
          name: 'Everyone has a basic salary',
        }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Clear filters' }));
      expect(
        await screen.findByRole('table', { name: 'Employees' }),
      ).toBeInTheDocument();
    });
  });
});
