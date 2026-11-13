import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../../test/employees-server';
import { apiError, type RecordedCall } from '../../../test/fake-server';
import { renderApp } from '../../../test/render-app';
import { makeSalary, salaryServer } from '../../../test/salary-server';

const ana = makeEmployee({
  employeeNo: 'EMP-001',
  firstName: 'Ana',
  lastName: 'Reyes',
});

const puts = (calls: RecordedCall[]) => calls.filter((c) => c.method === 'PUT');
const amountField = () => screen.getByLabelText(/monthly basic salary/i);

/** The workspace header repeats the pay figures, so look for the current salary inside its own card. */
const inCurrent = async (text: string) =>
  within(
    await screen.findByRole('region', { name: 'Current basic salary' }),
  ).findByText(text);

describe('Salary page', () => {
  it('opens the salary tab of the employee in the address, showing their current salary', async () => {
    salaryServer([ana], {
      [ana.id]: {
        current: makeSalary(ana.id, '33500.00', '2025-03-01T00:00:00.000Z'),
      },
    });
    renderApp(`/employees/${ana.id}/salary`);

    expect(
      await screen.findByText('per month, since Mar 1, 2025'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ana Reyes' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('focuses the amount field when there is no salary yet, so the next thing is to type it', async () => {
    salaryServer([ana]);
    renderApp(`/employees/${ana.id}/salary`);
    await screen.findByText('No salary assigned yet');
    expect(amountField()).toHaveFocus();
  });

  describe('an employee with no salary', () => {
    it('says so and offers to assign one, with an empty history', async () => {
      salaryServer([ana]);
      renderApp(`/employees/${ana.id}/salary`);

      expect(
        await screen.findByText('No salary assigned yet'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Assign salary' }),
      ).toBeInTheDocument();
      expect(screen.getByText(/No previous salaries/)).toBeInTheDocument();
    });

    it('assigns the first salary, shows it, and sends it as a two-decimal string', async () => {
      const { calls } = salaryServer([ana]);
      const user = userEvent.setup();
      renderApp(`/employees/${ana.id}/salary`);
      await screen.findByText('No salary assigned yet');

      await user.type(amountField(), '30000.5');
      await user.click(screen.getByRole('button', { name: 'Assign salary' }));

      expect(await screen.findByText('Salary assigned')).toBeInTheDocument();
      expect(await inCurrent('₱30,000.50')).toBeInTheDocument();
      expect(puts(calls).map((c) => [c.url, c.body])).toEqual([
        [`/employees/${ana.id}/salary`, { monthlyBasicSalary: '30000.50' }],
      ]);
      expect(
        screen.getByRole('button', { name: 'Save salary' }),
      ).toBeInTheDocument();
      expect(amountField()).toHaveValue('');
    });
  });

  describe('validation', () => {
    it.each([
      ['', 'Monthly basic salary is required'],
      ['0', 'Salary must be greater than 0'],
      ['-100', 'Salary must be greater than 0'],
      ['abc', 'Enter a number, for example 30000 or 30000.50'],
      ['1.234', 'Use at most 2 decimal places'],
      ['100000000', 'Salary cannot be more than ₱99,999,999.99'],
    ])(
      'shows "%s" as an error without calling the API',
      async (input, message) => {
        const { calls } = salaryServer([ana]);
        const user = userEvent.setup();
        renderApp(`/employees/${ana.id}/salary`);
        await screen.findByText('No salary assigned yet');

        if (input) await user.type(amountField(), input);
        await user.click(screen.getByRole('button', { name: 'Assign salary' }));

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(puts(calls)).toHaveLength(0);
      },
    );
  });

  describe('an employee with a salary', () => {
    const seeded = () =>
      salaryServer([ana], {
        [ana.id]: {
          current: makeSalary(ana.id, '30000.00', '2025-03-01T00:00:00.000Z'),
          history: [
            {
              ...makeSalary(ana.id, '28000.00', '2024-01-01T00:00:00.000Z'),
              replacedAt: '2025-03-01T00:00:00.000Z',
            },
            {
              ...makeSalary(ana.id, '25000.00', '2023-01-16T00:00:00.000Z'),
              replacedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        },
      });

    it('shows the current salary and the history, newest first', async () => {
      seeded();
      renderApp(`/employees/${ana.id}/salary`);

      expect(await inCurrent('₱30,000.00')).toBeInTheDocument();
      const rows = within(
        await screen.findByRole('table', { name: 'Salary history' }),
      )
        .getAllByRole('row')
        .slice(1);
      expect(rows.map((row) => row.textContent)).toEqual([
        '₱28,000.00Jan 1, 2024Mar 1, 2025',
        '₱25,000.00Jan 16, 2023Jan 1, 2024',
      ]);
    });

    it('adjusts the salary: the old amount moves to the history and the Employees list follows', async () => {
      seeded();
      const user = userEvent.setup();
      const { router } = renderApp(`/employees/${ana.id}/salary`);
      await inCurrent('₱30,000.00');

      await user.type(amountField(), '35000');
      await user.click(screen.getByRole('button', { name: 'Save salary' }));

      expect(await screen.findByText('Salary updated')).toBeInTheDocument();
      expect(await inCurrent('₱35,000.00')).toBeInTheDocument();
      const history = await screen.findByRole('table', {
        name: 'Salary history',
      });
      await waitFor(() =>
        expect(within(history).getAllByRole('row')[1]).toHaveTextContent(
          '₱30,000.00',
        ),
      );

      await router.navigate('/employees');
      // The Employees table shows it as the basic salary and, with no components, as the monthly total.
      const row = (
        await screen.findByRole('link', { name: 'Ana Reyes' })
      ).closest('tr')!;
      expect(within(row).getAllByText('₱35,000.00')).toHaveLength(2);
    });

    it('refuses the same amount in any spelling, without calling the API', async () => {
      const { calls } = seeded();
      const user = userEvent.setup();
      renderApp(`/employees/${ana.id}/salary`);
      await inCurrent('₱30,000.00');

      await user.type(amountField(), '30000.0');
      await user.click(screen.getByRole('button', { name: 'Save salary' }));

      expect(
        await screen.findByText('This is already the current salary'),
      ).toBeInTheDocument();
      expect(amountField()).toHaveFocus();
      expect(puts(calls)).toHaveLength(0);
    });

    it('says nothing changed when the server reports the same amount', async () => {
      // Another window already saved 30,000.00 while this form was open.
      const server = seeded();
      const user = userEvent.setup();
      renderApp(`/employees/${ana.id}/salary`);
      await inCurrent('₱30,000.00');
      const row = server.rows.get(ana.id)!;
      // A new object: the page still holds the old one it fetched.
      row.current = { ...row.current!, monthlyBasicSalary: '31000.00' };

      await user.type(amountField(), '31000');
      await user.click(screen.getByRole('button', { name: 'Save salary' }));

      expect(
        await screen.findByText(
          'Salary is already ₱31,000.00. Nothing changed.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('failures', () => {
    it('shows the API field error under the field', async () => {
      const server = salaryServer([ana]);
      server.fail.save = apiError(400, 'Validation failed', [
        'monthlyBasicSalary must be a valid amount',
      ]);
      const user = userEvent.setup();
      renderApp(`/employees/${ana.id}/salary`);
      await screen.findByText('No salary assigned yet');

      await user.type(amountField(), '30000');
      await user.click(screen.getByRole('button', { name: 'Assign salary' }));

      expect(
        await screen.findByText('must be a valid amount'),
      ).toBeInTheDocument();
    });

    it('shows a server failure as an alert and keeps the typed amount', async () => {
      const server = salaryServer([ana]);
      server.fail.save = apiError(500, 'insert into salary_assignments failed');
      const user = userEvent.setup();
      renderApp(`/employees/${ana.id}/salary`);
      await screen.findByText('No salary assigned yet');

      await user.type(amountField(), '30000');
      await user.click(screen.getByRole('button', { name: 'Assign salary' }));

      const alert = await screen.findByRole('alert');
      expect(alert).not.toHaveTextContent(/insert into/i);
      expect(amountField()).toHaveValue('30000');
    });

    it('shows a load error with Retry', async () => {
      const server = salaryServer([ana]);
      server.fail.current = true;
      const user = userEvent.setup();
      renderApp(`/employees/${ana.id}/salary`);

      const alert = await screen.findByRole('alert');
      expect(alert).not.toHaveTextContent(/select failed/i);

      server.fail.current = false;
      await user.click(within(alert).getByRole('button', { name: 'Retry' }));
      expect(
        await screen.findByText('No salary assigned yet'),
      ).toBeInTheDocument();
    });
  });
});
