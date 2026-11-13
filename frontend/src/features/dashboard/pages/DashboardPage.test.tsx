import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { todayInManila } from '../../../shared/lib/today';
import { employeesServer, makeEmployee } from '../../../test/employees-server';
import { renderApp } from '../../../test/render-app';

/** A date YYYY-MM-DD a number of days before today in Manila. */
function daysAgo(days: number): string {
  const [year, month, day] = todayInManila().split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day! - days))
    .toISOString()
    .slice(0, 10);
}

const card = (name: string) => screen.getByRole('article', { name });
const panel = (name: string) => screen.getByRole('region', { name });

describe('Dashboard page', () => {
  it('greets the signed-in admin by first name', async () => {
    employeesServer([]);
    renderApp('/dashboard');
    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Good (morning|afternoon|evening), /),
    ).toBeInTheDocument();
  });

  it('shows a loading state, then the four numbers', async () => {
    employeesServer(
      [
        makeEmployee({
          currentBasicSalary: '30000.00',
          dateHired: daysAgo(400),
        }),
        makeEmployee({
          currentBasicSalary: '45000.00',
          dateHired: daysAgo(10),
        }),
        makeEmployee({ currentBasicSalary: null, dateHired: daysAgo(3) }),
      ],
      { listDelayMs: 30 },
    );
    renderApp('/dashboard');

    expect(
      await screen.findByRole('status', { name: 'Loading dashboard' }),
    ).toBeInTheDocument();
    await screen.findByRole('article', { name: 'Total employees' });

    expect(within(card('Total employees')).getByText('3')).toBeInTheDocument();
    expect(
      within(card('Total employees')).getByText('2 hired in the last 30 days'),
    ).toBeInTheDocument();
    expect(
      within(card('Monthly basic payroll')).getByText('₱75,000.00'),
    ).toBeInTheDocument();
    expect(
      within(card('Average basic salary')).getByText('₱37,500.00'),
    ).toBeInTheDocument();
    expect(
      within(card('Average basic salary')).getByText(
        'Across 2 employees with a salary',
      ),
    ).toBeInTheDocument();
    expect(
      within(card('Salary assigned')).getByText('of 3'),
    ).toBeInTheDocument();
    expect(
      within(card('Salary assigned')).getByRole('progressbar', {
        name: 'Employees with a salary',
      }),
    ).toHaveAttribute('aria-valuenow', '2');
  });

  it('lists who the payroll goes to, with each share', async () => {
    employeesServer([
      makeEmployee({
        firstName: 'Ana',
        lastName: 'High',
        currentBasicSalary: '75000.00',
      }),
      makeEmployee({
        firstName: 'Ben',
        lastName: 'Low',
        currentBasicSalary: '25000.00',
      }),
    ]);
    renderApp('/dashboard');

    const chart = await screen.findByRole('region', {
      name: 'Payroll by employee',
    });
    const rows = within(chart).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Ana High₱75,000.0075%');
    expect(rows[1]).toHaveTextContent('Ben Low₱25,000.0025%');
  });

  describe('needs attention', () => {
    it('lists employees without a salary, each linking to the Salary page on them', async () => {
      const waiting = makeEmployee({
        employeeNo: 'EMP-900',
        firstName: 'Cara',
        lastName: 'Santos',
        currentBasicSalary: null,
        dateHired: daysAgo(1),
      });
      employeesServer([
        waiting,
        makeEmployee({ currentBasicSalary: '1000.00' }),
      ]);
      const user = userEvent.setup();
      const { router } = renderApp('/dashboard');

      const attention = await screen.findByRole('region', {
        name: 'Needs attention',
      });
      expect(attention).toHaveTextContent(
        '1 of 2 employees have no basic salary',
      );
      expect(attention).toHaveTextContent('EMP-900 · Hired yesterday');

      await user.click(
        within(attention).getByRole('link', {
          name: 'Set salary for Cara Santos',
        }),
      );
      expect(router.state.location.pathname).toBe(
        `/employees/${waiting.id}/salary`,
      );
    });

    it('shows the first five and says how many more', async () => {
      employeesServer(
        Array.from({ length: 7 }, () =>
          makeEmployee({ currentBasicSalary: null }),
        ),
      );
      renderApp('/dashboard');

      const attention = await screen.findByRole('region', {
        name: 'Needs attention',
      });
      expect(within(attention).getAllByRole('listitem')).toHaveLength(5);
      expect(
        within(attention).getByText('and 2 more, see Employees'),
      ).toBeInTheDocument();
    });

    it('says all is well when everyone has a salary', async () => {
      employeesServer([makeEmployee({ currentBasicSalary: '1000.00' })]);
      renderApp('/dashboard');

      const attention = await screen.findByRole('region', {
        name: 'Needs attention',
      });
      expect(attention).toHaveTextContent('All caught up');
      expect(attention).toHaveTextContent('Everyone has a basic salary.');
      expect(within(attention).queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('shows the newest hires with their pay, and a badge when there is none', async () => {
    employeesServer([
      makeEmployee({
        firstName: 'Old',
        lastName: 'Timer',
        dateHired: daysAgo(900),
        currentBasicSalary: '20000.00',
      }),
      makeEmployee({
        firstName: 'New',
        lastName: 'Joiner',
        dateHired: daysAgo(2),
        currentBasicSalary: null,
      }),
    ]);
    renderApp('/dashboard');

    const recent = await screen.findByRole('region', { name: 'Recent hires' });
    const rows = within(recent).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('New Joiner');
    expect(rows[0]).toHaveTextContent('No salary');
    expect(rows[1]).toHaveTextContent('Old Timer');
    expect(rows[1]).toHaveTextContent('₱20,000.00');
  });

  it('shows the salary range and tenure at a glance', async () => {
    employeesServer([
      makeEmployee({
        firstName: 'Ana',
        lastName: 'High',
        currentBasicSalary: '45000.00',
        dateHired: daysAgo(730),
      }),
      makeEmployee({
        firstName: 'Ben',
        lastName: 'Low',
        currentBasicSalary: '28500.00',
        dateHired: daysAgo(0),
      }),
    ]);
    renderApp('/dashboard');

    const glance = await screen.findByRole('region', { name: 'At a glance' });
    expect(glance).toHaveTextContent('Highest salary₱45,000.00Ana High');
    expect(glance).toHaveTextContent('Lowest salary₱28,500.00Ben Low');
    expect(glance).toHaveTextContent('Median salary₱36,750.00');
    expect(glance).toHaveTextContent('Average tenure1 year');
    expect(glance).toHaveTextContent('Longest servingAna High');
  });

  it('shows friendly empty panels when there are no employees', async () => {
    employeesServer([]);
    renderApp('/dashboard');

    await screen.findByRole('article', { name: 'Total employees' });
    expect(within(card('Total employees')).getByText('0')).toBeInTheDocument();
    expect(
      within(card('Average basic salary')).getByText('—'),
    ).toBeInTheDocument();
    expect(panel('Payroll by employee')).toHaveTextContent(
      'No salaries assigned yet',
    );
    expect(panel('Recent hires')).toHaveTextContent(
      'No one has been added yet',
    );
    expect(panel('Needs attention')).toHaveTextContent(
      'Add an employee to get started',
    );
    expect(panel('At a glance')).toHaveTextContent(
      'Salary range and tenure show up',
    );
  });

  it('shows a plain error with Retry when the list cannot load', async () => {
    const server = employeesServer([
      makeEmployee({ currentBasicSalary: '1000.00' }),
    ]);
    server.fail.list = true;
    const user = userEvent.setup();
    renderApp('/dashboard');

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/postgres|password authentication/i);

    server.fail.list = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('article', { name: 'Total employees' }),
    ).toBeInTheDocument();
  });
});
