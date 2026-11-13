import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { todayInManila } from '../../../shared/lib/today';
import { employeesServer, makeEmployee } from '../../../test/employees-server';
import { apiError, type RecordedCall } from '../../../test/fake-server';
import { renderApp } from '../../../test/render-app';

type User = ReturnType<typeof userEvent.setup>;

const checks = (calls: RecordedCall[]) =>
  calls.filter((c) => c.url === '/employees/exists');
/** Creates sent to the API (the session refresh is a POST too, so look at the address). */
const writes = (calls: RecordedCall[]) =>
  calls.filter((c) => c.method === 'POST' && c.url === '/employees');
const idField = () => screen.getByLabelText(/^Employee ID/);

async function openAdd(user: User) {
  await user.click(screen.getAllByRole('button', { name: 'Add employee' })[0]!);
  return screen.findByRole('dialog', { name: 'Add employee' });
}

async function fillRest(user: User) {
  await user.type(screen.getByLabelText(/^First name/), 'Ana');
  await user.type(screen.getByLabelText(/^Last name/), 'Reyes');
  await user.type(screen.getByLabelText(/^Date hired/), '2024-03-01');
}

const taken = (id: string) =>
  makeEmployee({ employeeNo: id, firstName: 'Ben', lastName: 'Lim' });

describe('Employee ID field', () => {
  describe('the suggested next ID', () => {
    it('is the highest EMP-number plus one, padded to 3 digits, and starts in the field', async () => {
      employeesServer([taken('EMP-001'), taken('EMP-007'), taken('EMP-003')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-007');

      await openAdd(user);
      expect(idField()).toHaveValue('EMP-008');
    });

    it('grows past 3 digits', async () => {
      employeesServer([taken('EMP-999')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-999');
      await openAdd(user);
      expect(idField()).toHaveValue('EMP-1000');
    });

    it('ignores IDs of another shape, such as EMP001', async () => {
      employeesServer([taken('EMP001'), taken('STAFF-9'), taken('EMP-004')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-004');
      await openAdd(user);
      expect(idField()).toHaveValue('EMP-005');
    });

    it('is empty when no ID has the EMP-number shape', async () => {
      employeesServer([taken('EMP001'), taken('STAFF-9')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP001');
      await openAdd(user);
      expect(idField()).toHaveValue('');
    });

    it('is empty with no employees at all', async () => {
      employeesServer([]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });
      await openAdd(user);
      expect(idField()).toHaveValue('');
    });

    it('can be replaced, and is sent upper-cased and trimmed as typed', async () => {
      const { calls } = employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      const dialog = await openAdd(user);

      await user.clear(idField());
      await user.type(idField(), '  staff-42 ');
      await fillRest(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      expect(await screen.findByText('Employee added')).toBeInTheDocument();
      const post = calls.find(
        (c) => c.method === 'POST' && c.url === '/employees',
      );
      expect(post!.body).toMatchObject({ employeeNo: 'STAFF-42' });
    });
  });

  it('has the placeholder "e.g. EMP-001" and no format hint when adding', async () => {
    employeesServer([]);
    const user = userEvent.setup();
    renderApp('/employees');
    await screen.findByRole('heading', { name: 'No employees yet' });
    await openAdd(user);

    expect(idField()).toHaveAttribute('placeholder', 'e.g. EMP-001');
    expect(idField()).not.toHaveAccessibleDescription();
    expect(screen.queryByText('Format: EMP-001')).not.toBeInTheDocument();
  });

  describe('rules', () => {
    async function submitWith(value: string) {
      const server = employeesServer([]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });
      const dialog = await openAdd(user);
      if (value) await user.type(idField(), value);
      await fillRest(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );
      return server;
    }

    it.each([
      ['EMP 001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMP_001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMP.001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMPÉ01', 'Employee ID can only use letters, numbers and hyphens'],
      ['AB', 'Employee ID must be at least 3 characters'],
      ['', 'Employee ID is required'],
    ])(
      'rejects "%s" with a message and calls nothing',
      async (value, message) => {
        const { calls } = await submitWith(value);
        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(writes(calls)).toHaveLength(0);
      },
    );

    it('accepts an ID with hyphens in the middle and a mix of letters and digits', async () => {
      const { calls } = await submitWith('a1-b2-c3');
      expect(await screen.findByText('Employee added')).toBeInTheDocument();
      expect(writes(calls)[0]!.body).toMatchObject({
        employeeNo: 'A1-B2-C3',
      });
    });
  });

  describe('the live duplicate check', () => {
    it('shows "Employee ID already exists" inline while typing, ignoring case and spaces, and keeps Submit enabled', async () => {
      employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      const dialog = await openAdd(user);

      await user.clear(idField());
      await user.type(idField(), ' emp-001 ');

      await waitFor(() =>
        expect(idField()).toHaveAccessibleDescription(
          'Employee ID already exists',
        ),
      );
      expect(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      ).toBeEnabled();
    });

    it('waits 400ms after the last keystroke, and asks once for a value typed in bursts', async () => {
      const { calls } = employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      await openAdd(user);
      const before = checks(calls).length;

      await user.clear(idField());
      await user.type(idField(), 'EMP-555');
      expect(checks(calls).length).toBe(before); // nothing yet: still inside the 400ms

      await waitFor(() => expect(checks(calls).length).toBe(before + 1), {
        timeout: 2000,
      });
      expect(checks(calls).at(-1)!.params).toEqual({ employeeNo: 'EMP-555' });
      // No second question for the same value.
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(checks(calls).length).toBe(before + 1);
    });

    it('asks at once when the field loses focus, without waiting for the 400ms', async () => {
      const { calls } = employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      await openAdd(user);
      const before = checks(calls).length;

      await user.clear(idField());
      await user.type(idField(), 'EMP-001');
      await user.tab();

      await waitFor(
        () => expect(checks(calls).length).toBeGreaterThan(before),
        {
          timeout: 300,
        },
      );
      expect(idField()).toHaveAccessibleDescription(
        'Employee ID already exists',
      );
    });

    it('says nothing for a free ID', async () => {
      const { calls } = employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      await openAdd(user);
      await user.clear(idField());
      await user.type(idField(), 'EMP-777');
      await waitFor(
        () =>
          expect(checks(calls).at(-1)?.params).toEqual({
            employeeNo: 'EMP-777',
          }),
        {
          timeout: 2000,
        },
      );
      expect(idField()).not.toHaveAccessibleDescription();
    });

    it('does not ask about a value that fails the rules (too short, bad characters)', async () => {
      const { calls } = employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      await openAdd(user);
      await user.clear(idField());
      const before = checks(calls).length;

      await user.type(idField(), 'AB');
      await user.tab();
      await new Promise((resolve) => setTimeout(resolve, 600));
      await user.clear(idField());
      await user.type(idField(), 'A B C');
      await user.tab();
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(checks(calls).length).toBe(before);
    });

    it('ignores a late answer for a value that is no longer in the field', async () => {
      employeesServer([taken('EMP-001')], { existsDelayMs: 500 });
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      await openAdd(user);

      await user.clear(idField());
      await user.type(idField(), 'EMP-001');
      await user.tab(); // asks at once; the answer takes 500ms
      await user.click(idField());
      await user.clear(idField());
      await user.type(idField(), 'EMP-222');

      await new Promise((resolve) => setTimeout(resolve, 1200));
      expect(idField()).toHaveValue('EMP-222');
      expect(idField()).not.toHaveAccessibleDescription();
    });

    it('says nothing when the check itself fails, and Submit still works', async () => {
      const server = employeesServer([taken('EMP-001')]);
      server.fail.exists = true;
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      const dialog = await openAdd(user);
      await user.clear(idField());
      await user.type(idField(), 'EMP-300');
      await user.tab();
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(idField()).not.toHaveAccessibleDescription();

      await fillRest(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );
      expect(await screen.findByText('Employee added')).toBeInTheDocument();
    });

    it('does not run when editing, where the ID is read-only', async () => {
      const { calls } = employeesServer([taken('EMP-001')]);
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      await user.click(
        screen.getByRole('button', { name: 'Actions for Ben Lim' }),
      );
      await user.click(screen.getByRole('menuitem', { name: 'Edit employee' }));
      await screen.findByRole('dialog', { name: 'Edit employee' });
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(checks(calls)).toHaveLength(0);
      expect(idField()).toHaveAttribute('readonly');
    });
  });

  describe('a 409 on submit stays the source of truth', () => {
    it('shows the same inline error when the check missed the duplicate', async () => {
      // The check says free (it fails), but the server refuses the create.
      const server = employeesServer([taken('EMP-001')]);
      server.fail.exists = true;
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByText('EMP-001');
      const dialog = await openAdd(user);
      await user.clear(idField());
      await user.type(idField(), 'emp-001');
      await fillRest(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );

      await waitFor(() =>
        expect(idField()).toHaveAccessibleDescription(
          'Employee ID already exists',
        ),
      );
      expect(idField()).toHaveFocus();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('also maps a 409 with the same text when the server says it', async () => {
      const server = employeesServer([]);
      server.fail.save = apiError(409, 'Employee ID already exists');
      const user = userEvent.setup();
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'No employees yet' });
      const dialog = await openAdd(user);
      await user.type(idField(), 'EMP-001');
      await fillRest(user);
      await user.click(
        within(dialog).getByRole('button', { name: 'Add employee' }),
      );
      await waitFor(() =>
        expect(idField()).toHaveAccessibleDescription(
          'Employee ID already exists',
        ),
      );
    });
  });

  it('limits the date hired to today in the input itself, as well as in the check on submit', async () => {
    employeesServer([]);
    const user = userEvent.setup();
    renderApp('/employees');
    await screen.findByRole('heading', { name: 'No employees yet' });
    await openAdd(user);
    expect(screen.getByLabelText(/^Date hired/)).toHaveAttribute(
      'max',
      todayInManila(),
    );
  });
});
