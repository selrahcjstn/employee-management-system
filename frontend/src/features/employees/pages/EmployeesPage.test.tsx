import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { apiError, type RecordedCall } from '../../../test/fake-server';
import { employeesServer, makeEmployee } from '../../../test/employees-server';
import { renderApp } from '../../../test/render-app';

const rowsOf = () =>
  within(screen.getByRole('table')).getAllByRole('row').slice(1);
const writes = (calls: RecordedCall[]) =>
  calls.filter(
    (c) =>
      c.url.startsWith('/employees') &&
      (c.method === 'POST' || c.method === 'PATCH'),
  );

async function openAddDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: 'Add employee' })[0]!);
  return screen.findByRole('dialog', { name: 'Add employee' });
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  values: Record<string, string>,
) {
  for (const [label, value] of Object.entries(values)) {
    const field = screen.getByLabelText(new RegExp(`^${label}`));
    await user.clear(field);
    if (value) await user.type(field, value);
  }
}

describe('Employees page', () => {
  it('shows a skeleton while loading, then the rows', async () => {
    employeesServer([makeEmployee({ firstName: 'Ana', lastName: 'Reyes' })], {
      listDelayMs: 30,
    });
    renderApp('/employees');

    expect(
      await screen.findByText('Loading employees', { selector: 'span' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument();
    expect(
      screen.queryByText('Loading employees', { selector: 'span' }),
    ).not.toBeInTheDocument();
  });

  it('formats the date and salary, and marks a missing salary as Not assigned', async () => {
    employeesServer([
      makeEmployee({
        employeeNo: 'EMP-100',
        firstName: 'Ana',
        middleName: 'Cruz',
        lastName: 'Reyes',
        dateHired: '2023-01-16',
        currentBasicSalary: '33500.00',
      }),
      makeEmployee({ firstName: 'Ben', lastName: 'Lim' }),
    ]);
    renderApp('/employees');

    const ana = (await screen.findByText('Ana Cruz Reyes')).closest('tr')!;
    expect(within(ana).getByText('EMP-100')).toBeInTheDocument();
    expect(within(ana).getByText('Jan 16, 2023')).toBeInTheDocument();
    expect(within(ana).getByText('₱33,500.00')).toBeInTheDocument();
    expect(
      within(screen.getByText('Ben Lim').closest('tr')!).getByText(
        'Not assigned',
      ),
    ).toBeInTheDocument();
  });

  it('shows an empty state with an Add employee action when there are no employees', async () => {
    employeesServer([]);
    renderApp('/employees');

    expect(
      await screen.findByRole('heading', { name: 'No employees yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Add employee' }),
    ).toHaveLength(2);
  });

  it('searches on the server after a pause, and can clear a search with no results', async () => {
    const { calls } = employeesServer([
      makeEmployee({ firstName: 'Ana', lastName: 'Reyes' }),
      makeEmployee({ firstName: 'Ben', lastName: 'Lim' }),
    ]);
    const user = userEvent.setup();
    renderApp('/employees');
    await screen.findByText('Ana Reyes');

    await user.type(
      screen.getByRole('searchbox', { name: 'Search employees' }),
      'lim',
    );

    await waitFor(() =>
      expect(screen.queryByText('Ana Reyes')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Ben Lim')).toBeInTheDocument();
    const searches = calls.filter((c) => c.params?.['search']);
    expect(searches.map((c) => c.params?.['search'])).toEqual(['lim']);

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(
      await screen.findByRole('heading', { name: 'No employees match “zzz”' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('shows a plain error with Retry and never the raw server message', async () => {
    const server = employeesServer([
      makeEmployee({ firstName: 'Ana', lastName: 'Reyes' }),
    ]);
    server.fail.list = true;
    const user = userEvent.setup();
    renderApp('/employees');

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/postgres|password authentication/i);

    server.fail.list = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Ana Reyes')).toBeInTheDocument();
  });

  it('shows 10 rows per page and moves between pages', async () => {
    employeesServer(
      Array.from({ length: 25 }, (_, i) =>
        makeEmployee({ employeeNo: `E-${String(i + 1).padStart(3, '0')}` }),
      ),
    );
    const user = userEvent.setup();
    renderApp('/employees');

    await screen.findByText('Showing 1–10 of 25');
    expect(rowsOf()).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Showing 21–25 of 25')).toBeInTheDocument();
    expect(rowsOf()).toHaveLength(5);
  });

  describe('adding', () => {
    it('shows validation errors without calling the API', async () => {
      const { calls } = employeesServer([]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      const dialog = await openAddDialog(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      expect(
        await screen.findByText('Employee ID is required'),
      ).toBeInTheDocument();
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Date hired is required')).toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('creates the employee, closes, toasts, lists the new row and returns focus', async () => {
      const { calls } = employeesServer([]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      const dialog = await openAddDialog(user);
      expect(screen.getByLabelText(/^Employee ID/)).toHaveFocus();
      await fillForm(user, {
        'Employee ID': 'EMP-900',
        'First name': 'Ana',
        'Last name': 'Reyes',
      });
      await user.type(screen.getByLabelText(/^Date hired/), '2024-03-01');
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      expect(await screen.findByText('Employee added')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(await screen.findByText('Ana Reyes')).toBeInTheDocument();
      expect(writes(calls).map((c) => [c.method, c.url, c.body])).toEqual([
        [
          'POST',
          '/employees',
          {
            employeeNo: 'EMP-900',
            firstName: 'Ana',
            middleName: '',
            lastName: 'Reyes',
            dateHired: '2024-03-01',
          },
        ],
      ]);
    });

    it('rejects a hire date in the future', async () => {
      const { calls } = employeesServer([]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      const dialog = await openAddDialog(user);
      await fillForm(user, {
        'Employee ID': 'EMP-1',
        'First name': 'A',
        'Last name': 'B',
      });
      await user.type(screen.getByLabelText(/^Date hired/), '2999-01-01');
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      expect(
        await screen.findByText('Date hired cannot be in the future'),
      ).toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('shows a taken Employee ID next to the field', async () => {
      employeesServer([makeEmployee({ employeeNo: 'EMP-001' })]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');

      const dialog = await openAddDialog(user);
      await fillForm(user, {
        'Employee ID': 'emp-001',
        'First name': 'A',
        'Last name': 'B',
      });
      await user.type(screen.getByLabelText(/^Date hired/), '2024-03-01');
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      const field = screen.getByLabelText(/^Employee ID/);
      await waitFor(() =>
        expect(field).toHaveAccessibleDescription('Employee ID already exists'),
      );
      expect(field).toHaveFocus();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows field errors from the API on their fields', async () => {
      const server = employeesServer([]);
      server.fail.save = apiError(400, 'Validation failed', [
        'firstName must be shorter',
      ]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      const dialog = await openAddDialog(user);
      await fillForm(user, {
        'Employee ID': 'EMP-1',
        'First name': 'A',
        'Last name': 'B',
      });
      await user.type(screen.getByLabelText(/^Date hired/), '2024-03-01');
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      expect(await screen.findByText(/must be shorter/i)).toBeInTheDocument();
    });

    it('shows a server failure as an alert inside the dialog and keeps what was typed', async () => {
      const server = employeesServer([]);
      server.fail.save = apiError(500, 'Internal server error');
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      const dialog = await openAddDialog(user);
      await fillForm(user, {
        'Employee ID': 'EMP-1',
        'First name': 'Ana',
        'Last name': 'B',
      });
      await user.type(screen.getByLabelText(/^Date hired/), '2024-03-01');
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText(/^First name/)).toHaveValue('Ana');
    });

    it('closes without saving from Cancel, Escape, the X and the overlay', async () => {
      const { calls } = employeesServer([]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      for (const close of [
        () => user.click(screen.getByRole('button', { name: 'Cancel' })),
        () => user.keyboard('{Escape}'),
        () => user.click(screen.getByRole('button', { name: 'Close' })),
        () =>
          user.click(document.body.querySelector<HTMLElement>('.bg-overlay')!),
      ]) {
        await openAddDialog(user);
        await close();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }
      expect(writes(calls)).toHaveLength(0);
    });

    it('shows a loading state on the button while saving', async () => {
      employeesServer([], { saveDelayMs: 100 });
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });

      const dialog = await openAddDialog(user);
      await fillForm(user, {
        'Employee ID': 'EMP-1',
        'First name': 'A',
        'Last name': 'B',
      });
      await user.type(screen.getByLabelText(/^Date hired/), '2024-03-01');
      const submit = within(dialog).getByRole('button', {
        name: 'Add employee',
      });
      await user.click(submit);

      expect(submit).toBeDisabled();
      expect(await screen.findByText('Employee added')).toBeInTheDocument();
    });
  });

  describe('editing', () => {
    it('opens with the current values and a read-only Employee ID', async () => {
      employeesServer([
        makeEmployee({
          employeeNo: 'EMP-050',
          firstName: 'Ana',
          middleName: 'Cruz',
          lastName: 'Reyes',
        }),
      ]);
      const user = userEvent.setup();
      renderApp('/employees');

      await user.click(
        await screen.findByRole('button', { name: 'Edit Ana Cruz Reyes' }),
      );

      const dialog = await screen.findByRole('dialog', {
        name: 'Edit employee',
      });
      const id = within(dialog).getByLabelText(/^Employee ID/);
      expect(id).toHaveValue('EMP-050');
      expect(id).toHaveAttribute('readonly');
      expect(id).toHaveAccessibleDescription(
        "The Employee ID can't be changed.",
      );
      expect(within(dialog).getByLabelText(/^First name/)).toHaveFocus();
      expect(within(dialog).getByLabelText(/^Middle name/)).toHaveValue('Cruz');
    });

    it('sends only the changed-able fields (never the Employee ID), clears the middle name, and toasts', async () => {
      const { calls } = employeesServer([
        makeEmployee({
          firstName: 'Ana',
          middleName: 'Cruz',
          lastName: 'Reyes',
        }),
      ]);
      const user = userEvent.setup();
      renderApp('/employees');

      await user.click(
        await screen.findByRole('button', { name: 'Edit Ana Cruz Reyes' }),
      );
      await fillForm(user, { 'First name': 'Anna', 'Middle name': '' });
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText('Employee updated')).toBeInTheDocument();
      expect(await screen.findByText('Anna Reyes')).toBeInTheDocument();
      const [patch] = writes(calls);
      expect(patch).toMatchObject({ method: 'PATCH' });
      expect(patch!.body).toEqual({
        firstName: 'Anna',
        middleName: '',
        lastName: 'Reyes',
        dateHired: '2024-01-15',
      });
    });
  });
});
