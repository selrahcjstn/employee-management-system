import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { componentsServer } from '../../../test/components-server';
import { makeEmployee } from '../../../test/employees-server';
import { apiError, type RecordedCall } from '../../../test/fake-server';
import { renderApp } from '../../../test/render-app';

const ana = makeEmployee({ firstName: 'Ana', lastName: 'Reyes' });
const ben = makeEmployee({ firstName: 'Ben', lastName: 'Lim' });

type User = ReturnType<typeof userEvent.setup>;

const writes = (calls: RecordedCall[]) =>
  calls.filter(
    (c) =>
      c.method !== 'GET' &&
      (c.url.includes('components') || c.url.includes('salary-components')),
  );
const rows = () =>
  within(screen.getByRole('table', { name: 'Salary components' }))
    .getAllByRole('row')
    .slice(1);
const rowTexts = () => rows().map((row) => row.textContent);
const componentBox = () => screen.getByRole('combobox', { name: 'Component' });
const amountField = () => screen.getByLabelText(/^Amount/);

async function pickExisting(user: User, name: string) {
  await user.click(componentBox());
  await user.click(await screen.findByRole('option', { name }));
}

async function pickNew(user: User, name: string) {
  await user.click(componentBox());
  await user.type(componentBox(), name);
  await user.click(
    await screen.findByRole('option', { name: `Create “${name}”` }),
  );
}

async function submitAdd(user: User, amount: string) {
  if (amount) await user.type(amountField(), amount);
  await user.click(screen.getByRole('button', { name: 'Add component' }));
}

const open = (employeeId = ana.id) =>
  renderApp(`/employees/${employeeId}/components`);

describe('Components page', () => {
  describe('the list', () => {
    it('shows the components with their amounts and a total', async () => {
      componentsServer([ana], {
        assigned: {
          [ana.id]: [
            ['Rice Allowance', '2000.00'],
            ['Transportation', '1500.50'],
          ],
        },
      });
      open();

      await screen.findByRole('table', { name: 'Salary components' });
      expect(rowTexts().slice(0, 2)).toEqual([
        expect.stringContaining('Rice Allowance₱2,000.00'),
        expect.stringContaining('Transportation₱1,500.50'),
      ]);
      expect(
        within(screen.getByRole('table', { name: 'Salary components' }))
          .getByText('Components total')
          .closest('tr'),
      ).toHaveTextContent('₱3,500.50');
    });

    it('shows each employee their own, so another employee can have the same name', async () => {
      componentsServer([ana, ben], {
        assigned: {
          [ana.id]: [['Rice Allowance', '2000.00']],
          [ben.id]: [['Rice Allowance', '500.00']],
        },
      });
      open(ben.id);
      await screen.findByRole('table', { name: 'Salary components' });
      expect(rowTexts()[0]).toContain('₱500.00');
    });

    it('shows a skeleton, an empty state, and a plain error with Retry', async () => {
      const server = componentsServer([ana]);
      server.fail.list = true;
      const user = userEvent.setup();
      open();

      const alert = await screen.findByRole('alert');
      expect(alert).not.toHaveTextContent(/select \*/);
      server.fail.list = false;
      await user.click(within(alert).getByRole('button', { name: 'Retry' }));
      expect(await screen.findByText('No components yet')).toBeInTheDocument();
    });
  });

  describe('adding', () => {
    it('adds an existing name with an amount, then clears the form', async () => {
      const { calls } = componentsServer([ana, ben], {
        catalog: ['Rice Allowance'],
        assigned: { [ben.id]: [['Rice Allowance', '500.00']] },
      });
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await pickExisting(user, 'Rice Allowance');
      await submitAdd(user, '2000');

      expect(await screen.findByText('Component added')).toBeInTheDocument();
      await waitFor(() => expect(rowTexts()).toHaveLength(2)); // the row and the total
      expect(rowTexts()[0]).toContain('Rice Allowance₱2,000.00');
      expect(amountField()).toHaveValue('');
      expect(componentBox()).toHaveValue('');
      const [post] = writes(calls);
      expect(post).toMatchObject({
        method: 'POST',
        url: `/employees/${ana.id}/components`,
      });
      expect(post!.body).toEqual({
        componentId: expect.any(String),
        amount: '2000.00',
      });
    });

    it('creates a new name on the fly, and offers it afterwards to other employees', async () => {
      const { calls, catalog } = componentsServer([ana]);
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await pickNew(user, 'Transport');
      expect(componentBox()).toHaveValue('Transport');
      await submitAdd(user, '1500.5');

      expect(await screen.findByText('Component added')).toBeInTheDocument();
      expect(writes(calls)[0]!.body).toEqual({
        name: 'Transport',
        amount: '1500.50',
      });
      expect(catalog.map((c) => c.name)).toEqual(['Transport']);
      await user.click(componentBox());
      expect(
        await screen.findByRole('option', { name: 'Transport' }),
      ).toBeInTheDocument();
    });

    it('allows an amount of zero', async () => {
      const { calls } = componentsServer([ana], { catalog: ['Bonus'] });
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await pickExisting(user, 'Bonus');
      await submitAdd(user, '0');

      expect(await screen.findByText('Component added')).toBeInTheDocument();
      expect(writes(calls)[0]!.body).toMatchObject({ amount: '0.00' });
    });

    it.each([
      ['', 'Amount is required'],
      ['-5', 'Amount cannot be negative'],
      ['abc', 'Enter a number, for example 2000 or 2000.50'],
      ['1.234', 'Use at most 2 decimal places'],
      ['100000000', 'Amount cannot be more than ₱99,999,999.99'],
    ])(
      'rejects the amount "%s" without calling the API',
      async (input, message) => {
        const { calls } = componentsServer([ana], { catalog: ['Bonus'] });
        const user = userEvent.setup();
        open();
        await screen.findByText('No components yet');

        await pickExisting(user, 'Bonus');
        await submitAdd(user, input);

        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(writes(calls)).toHaveLength(0);
      },
    );

    it('asks for a component when none is chosen', async () => {
      const { calls } = componentsServer([ana]);
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await submitAdd(user, '100');

      expect(
        await screen.findByText('Choose a component, or type a new name'),
      ).toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('rejects a name over 100 characters', async () => {
      const { calls } = componentsServer([ana]);
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await pickNew(user, 'x'.repeat(101));
      await submitAdd(user, '100');

      expect(
        await screen.findByText(
          'Component name must be 100 characters or fewer',
        ),
      ).toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('blocks a duplicate for the same employee before calling the API, even when typed in another letter case', async () => {
      const { calls } = componentsServer([ana], {
        assigned: { [ana.id]: [['Rice Allowance', '2000.00']] },
      });
      const user = userEvent.setup();
      open();
      await screen.findByRole('table', { name: 'Salary components' });

      await user.click(componentBox());
      await user.type(componentBox(), 'rice allowance');
      await user.click(
        await screen.findByRole('option', { name: 'Rice Allowance' }),
      );
      await submitAdd(user, '100');

      expect(
        await screen.findByText('This employee already has this component'),
      ).toBeInTheDocument();
      expect(componentBox()).toHaveAccessibleDescription(
        'This employee already has this component',
      );
      expect(writes(calls)).toHaveLength(0);
    });

    it('shows the API duplicate error too, for a duplicate it could not see', async () => {
      const server = componentsServer([ana], { catalog: ['Bonus'] });
      server.fail.write = apiError(409, 'Employee already has this component');
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await pickExisting(user, 'Bonus');
      await submitAdd(user, '100');

      expect(
        await screen.findByText('This employee already has this component'),
      ).toBeInTheDocument();
    });

    it('can add the same component again after it was removed', async () => {
      componentsServer([ana], {
        assigned: { [ana.id]: [['Rice Allowance', '2000.00']] },
      });
      const user = userEvent.setup();
      open();
      await screen.findByRole('table', { name: 'Salary components' });

      await user.click(
        screen.getByRole('button', { name: 'Remove Rice Allowance' }),
      );
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Remove',
        }),
      );
      await screen.findByText('No components yet');

      await pickExisting(user, 'Rice Allowance');
      await submitAdd(user, '2500');
      expect(await screen.findByText('Component added')).toBeInTheDocument();
    });

    it('shows a server failure as an alert and keeps what was typed', async () => {
      const server = componentsServer([ana], { catalog: ['Bonus'] });
      server.fail.write = apiError(
        500,
        'insert into employee_components failed',
      );
      const user = userEvent.setup();
      open();
      await screen.findByText('No components yet');

      await pickExisting(user, 'Bonus');
      await submitAdd(user, '100');

      const alert = await screen.findByRole('alert');
      expect(alert).not.toHaveTextContent(/insert into/);
      expect(amountField()).toHaveValue('100');
    });
  });

  describe('editing an amount', () => {
    const seeded = () =>
      componentsServer([ana], {
        assigned: { [ana.id]: [['Rice Allowance', '2000.00']] },
      });

    it('saves a new amount with Enter and updates the row and total', async () => {
      const { calls } = seeded();
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', {
          name: 'Edit amount of Rice Allowance',
        }),
      );

      const field = screen.getByLabelText('Amount for Rice Allowance');
      expect(field).toHaveFocus();
      await user.clear(field);
      await user.type(field, '2500.5{Enter}');

      expect(await screen.findByText('Amount updated')).toBeInTheDocument();
      await waitFor(() => expect(rowTexts()[0]).toContain('₱2,500.50'));
      expect(
        within(screen.getByRole('table', { name: 'Salary components' }))
          .getByText('Components total')
          .closest('tr'),
      ).toHaveTextContent('₱2,500.50');
      const [patch] = writes(calls);
      expect(patch).toMatchObject({ method: 'PATCH' });
      expect(patch!.body).toEqual({ amount: '2500.50' });
    });

    it('leaves the amount as it was on Escape and on Cancel, calling nothing', async () => {
      const { calls } = seeded();
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', {
          name: 'Edit amount of Rice Allowance',
        }),
      );
      await user.type(screen.getByLabelText('Amount for Rice Allowance'), '9');
      await user.keyboard('{Escape}');
      expect(rowTexts()[0]).toContain('₱2,000.00');

      await user.click(
        screen.getByRole('button', { name: 'Edit amount of Rice Allowance' }),
      );
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(rowTexts()[0]).toContain('₱2,000.00');
      expect(writes(calls)).toHaveLength(0);
    });

    it('shows an invalid amount next to the field and sends nothing', async () => {
      const { calls } = seeded();
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', {
          name: 'Edit amount of Rice Allowance',
        }),
      );
      const field = screen.getByLabelText('Amount for Rice Allowance');
      await user.clear(field);
      await user.type(field, '-3{Enter}');

      expect(
        await screen.findByText('Amount cannot be negative'),
      ).toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('does not call the API when the amount is unchanged', async () => {
      const { calls } = seeded();
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', {
          name: 'Edit amount of Rice Allowance',
        }),
      );
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(
        screen.queryByLabelText('Amount for Rice Allowance'),
      ).not.toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });
  });

  describe('renaming', () => {
    it('renames for every employee, and says so in the dialog', async () => {
      const { calls } = componentsServer([ana, ben], {
        assigned: {
          [ana.id]: [['Rice Allowance', '2000.00']],
          [ben.id]: [['Rice Allowance', '500.00']],
        },
      });
      const user = userEvent.setup();
      const { router } = open();
      await user.click(
        await screen.findByRole('button', { name: 'Rename Rice Allowance' }),
      );

      const dialog = await screen.findByRole('dialog', {
        name: 'Rename component',
      });
      const field = within(dialog).getByLabelText(/^Component name/);
      expect(field).toHaveValue('Rice Allowance');
      expect(field).toHaveAccessibleDescription(
        'Applies to all employees using this component.',
      );
      await user.clear(field);
      await user.type(field, 'Rice Subsidy');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save name' }),
      );

      expect(await screen.findByText('Component renamed')).toBeInTheDocument();
      expect(await screen.findByText('Rice Subsidy')).toBeInTheDocument();
      expect(writes(calls)[0]).toMatchObject({ method: 'PATCH' });
      expect(writes(calls)[0]!.body).toEqual({ name: 'Rice Subsidy' });

      await router.navigate(`/employees/${ben.id}/components`);
      // Wait for Ben's workspace first: until then the old page is still showing Ana's row.
      await screen.findByRole('heading', { name: 'Ben Lim' });
      expect(await screen.findByText('Rice Subsidy')).toBeInTheDocument();
    });

    it('shows a name that is taken inside the dialog', async () => {
      componentsServer([ana], {
        assigned: {
          [ana.id]: [
            ['Rice Allowance', '2000.00'],
            ['Transportation', '1500.00'],
          ],
        },
      });
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', { name: 'Rename Transportation' }),
      );

      const dialog = await screen.findByRole('dialog');
      const field = within(dialog).getByLabelText(/^Component name/);
      await user.clear(field);
      await user.type(field, 'rice allowance');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save name' }),
      );

      await waitFor(() =>
        expect(field).toHaveAccessibleDescription(
          /Component name already exists/,
        ),
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('requires a name, and closes without calling the API when the name is unchanged', async () => {
      const { calls } = componentsServer([ana], {
        assigned: { [ana.id]: [['Rice Allowance', '2000.00']] },
      });
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', { name: 'Rename Rice Allowance' }),
      );
      const dialog = await screen.findByRole('dialog');
      const field = within(dialog).getByLabelText(/^Component name/);

      await user.clear(field);
      await user.click(
        within(dialog).getByRole('button', { name: 'Save name' }),
      );
      expect(
        await within(dialog).findByText('Component name is required'),
      ).toBeInTheDocument();

      await user.type(field, 'Rice Allowance');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save name' }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(writes(calls)).toHaveLength(0);
    });
  });

  describe('removing', () => {
    const seeded = () =>
      componentsServer([ana, ben], {
        assigned: {
          [ana.id]: [['Rice Allowance', '2000.00']],
          [ben.id]: [['Rice Allowance', '500.00']],
        },
      });

    it('asks first, and says whose it is and that others keep it', async () => {
      const { calls } = seeded();
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', { name: 'Remove Rice Allowance' }),
      );

      const dialog = await screen.findByRole('dialog', {
        name: 'Remove component',
      });
      expect(dialog).toHaveAccessibleDescription(
        'Remove Rice Allowance from Ana Reyes?',
      );
      expect(dialog).toHaveTextContent('Other employees who have it keep it');
      expect(writes(calls)).toHaveLength(0);

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('removes it from this employee only', async () => {
      const { calls, assignments } = seeded();
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', { name: 'Remove Rice Allowance' }),
      );
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Remove',
        }),
      );

      expect(await screen.findByText('Component removed')).toBeInTheDocument();
      expect(await screen.findByText('No components yet')).toBeInTheDocument();
      expect(writes(calls)[0]).toMatchObject({ method: 'DELETE' });
      expect(assignments.get(ben.id)).toHaveLength(1);
    });

    it('shows a failure inside the dialog and keeps the component', async () => {
      const server = seeded();
      server.fail.write = apiError(500, 'delete from employee_components');
      const user = userEvent.setup();
      open();
      await user.click(
        await screen.findByRole('button', { name: 'Remove Rice Allowance' }),
      );
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

      expect(await within(dialog).findByRole('alert')).not.toHaveTextContent(
        /delete from/,
      );
      expect(rowTexts()[0]).toContain('Rice Allowance');
    });
  });
});
