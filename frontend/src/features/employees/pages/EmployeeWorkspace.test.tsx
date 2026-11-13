import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../../test/employees-server';
import { renderApp } from '../../../test/render-app';
import { makeSalary, workspaceServer } from '../../../test/workspace-server';

const ana = makeEmployee({
  employeeNo: 'EMP-001',
  firstName: 'Ana',
  middleName: 'Cruz',
  lastName: 'Reyes',
  dateHired: '2023-01-16',
});

const seeded = () =>
  workspaceServer([ana], {
    salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
    assigned: {
      [ana.id]: [
        ['Rice Allowance', '2000.00'],
        ['Transportation', '1500.00'],
      ],
    },
  });

describe('Employee workspace', () => {
  it('shows who the employee is, with their Employee ID and date hired', async () => {
    seeded();
    renderApp(`/employees/${ana.id}/salary`);

    expect(
      await screen.findByRole('heading', { name: 'Ana Cruz Reyes' }),
    ).toBeInTheDocument();
    expect(screen.getByText('EMP-001')).toBeInTheDocument();
    expect(screen.getByText(/Hired Jan 16, 2023/)).toBeInTheDocument();
    expect(
      within(document.getElementById('main')!).getByRole('link', {
        name: 'Employees',
      }),
    ).toHaveAttribute('href', '/employees');
  });

  it('shows the pay summary from the server: basic, components and monthly total', async () => {
    seeded();
    renderApp(`/employees/${ana.id}/salary`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });

    const pay = screen.getByLabelText('Pay summary');
    expect(await within(pay).findByText('₱30,000.00')).toBeInTheDocument();
    expect(within(pay).getByText('₱3,500.00')).toBeInTheDocument();
    expect(within(pay).getByText('₱33,500.00')).toBeInTheDocument();
  });

  it('says Not assigned when there is no basic salary, and still shows the components total', async () => {
    workspaceServer([ana], { assigned: { [ana.id]: [['Bonus', '100.00']] } });
    renderApp(`/employees/${ana.id}/components`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });

    const pay = screen.getByLabelText('Pay summary');
    expect(await within(pay).findByText('Not assigned')).toBeInTheDocument();
    expect(within(pay).getByText('₱100.00')).toBeInTheDocument();
    expect(within(pay).getByText('—')).toBeInTheDocument();
  });

  it('has three real links as tabs, with the current one marked', async () => {
    seeded();
    renderApp(`/employees/${ana.id}/components`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });

    const tabs = screen.getByRole('navigation', { name: 'Employee sections' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Salary', 'Components', 'Computation']);
    expect(
      within(tabs).getByRole('link', { name: 'Components' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(tabs).getByRole('link', { name: 'Salary' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('keeps the same employee when switching tabs, with no flash of loading', async () => {
    const { calls } = seeded();
    const user = userEvent.setup();
    const { router } = renderApp(`/employees/${ana.id}/salary`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });

    const tabs = screen.getByRole('navigation', { name: 'Employee sections' });
    await user.click(within(tabs).getByRole('link', { name: 'Components' }));
    expect(router.state.location.pathname).toBe(
      `/employees/${ana.id}/components`,
    );
    // The header is never replaced by a skeleton while the tab changes.
    expect(
      screen.queryByRole('status', { name: 'Loading employee' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ana Cruz Reyes' }),
    ).toBeInTheDocument();
    await user.click(within(tabs).getByRole('link', { name: 'Computation' }));
    expect(router.state.location.pathname).toBe(
      `/employees/${ana.id}/computation`,
    );

    const detailCalls = calls.filter((c) => c.url === `/employees/${ana.id}`);
    expect(detailCalls).toHaveLength(1);
  });

  it('redirects the bare employee address to the Salary tab', async () => {
    seeded();
    const { router } = renderApp(`/employees/${ana.id}`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });
    expect(router.state.location.pathname).toBe(`/employees/${ana.id}/salary`);
  });

  it.each(['/salary', '/components', '/computation'])(
    'sends the old %s address to the Employees table',
    async (path) => {
      seeded();
      const { router } = renderApp(path);
      await screen.findByRole('heading', { name: 'Employees' });
      expect(router.state.location.pathname).toBe('/employees');
    },
  );

  it('shows a not-found state with a way back for an employee that does not exist', async () => {
    seeded();
    const { router } = renderApp(
      '/employees/00000000-0000-4000-8000-0000000000ff/salary',
    );
    expect(
      await screen.findByRole('heading', { name: 'Employee not found' }),
    ).toBeInTheDocument();
    const back = screen.getByRole('link', { name: 'Back to Employees' });
    expect(back).toHaveAttribute('href', '/employees');
    expect(router.state.location.pathname).toMatch(/\/salary$/);
  });

  it('treats a malformed id as not found too', async () => {
    seeded();
    renderApp('/employees/not-a-real-id/salary');
    expect(
      await screen.findByRole('heading', { name: 'Employee not found' }),
    ).toBeInTheDocument();
  });

  it('puts the tab and the employee in the page title', async () => {
    seeded();
    renderApp(`/employees/${ana.id}/computation`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });
    expect(document.title).toBe(
      'Computation | Ana Cruz Reyes | Employee & Salary Management',
    );
  });

  it('refreshes the summary and the Computation tab after a salary is saved', async () => {
    seeded();
    const user = userEvent.setup();
    renderApp(`/employees/${ana.id}/salary`);
    await screen.findByRole('heading', { name: 'Ana Cruz Reyes' });
    const pay = screen.getByLabelText('Pay summary');
    await within(pay).findByText('₱33,500.00');

    await user.type(screen.getByLabelText(/monthly basic salary/i), '40000');
    await user.click(screen.getByRole('button', { name: 'Save salary' }));

    expect(await within(pay).findByText('₱43,500.00')).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Employee sections' });
    await user.click(within(tabs).getByRole('link', { name: 'Computation' }));
    expect(await screen.findByText('Total monthly salary')).toBeInTheDocument();
    expect(
      within(
        screen.getByText('Total monthly salary').closest('div')!,
      ).getByText('₱43,500.00'),
    ).toBeInTheDocument();
  });
});
