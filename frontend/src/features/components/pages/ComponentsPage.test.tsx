import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../../test/employees-server';
import { apiError, type RecordedCall } from '../../../test/fake-server';
import { renderApp } from '../../../test/render-app';
import { workspaceServer } from '../../../test/workspace-server';

const ana = makeEmployee({ firstName: 'Ana', lastName: 'Reyes' });
const ben = makeEmployee({ firstName: 'Ben', lastName: 'Lim' });

const seeded = () =>
  workspaceServer([ana, ben], {
    assigned: {
      [ana.id]: [
        ['Rice Allowance', '2000.00'],
        ['Transportation', '1500.00'],
      ],
      [ben.id]: [['Rice Allowance', '500.00']],
    },
    catalog: ['Unused Bonus'],
  });

const writes = (calls: RecordedCall[]) =>
  calls.filter(
    (c) => c.method !== 'GET' && c.url.startsWith('/salary-components'),
  );
const rows = () =>
  within(screen.getByRole('table', { name: 'Components' }))
    .getAllByRole('row')
    .slice(1);
const rowFor = (name: string) =>
  rows().find((row) => within(row).queryByText(name))!;

async function open() {
  const user = userEvent.setup();
  const view = renderApp('/components');
  await screen.findByRole('table', { name: 'Components' });
  return { user, ...view };
}

async function openMenu(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByRole('button', { name: `Actions for ${name}` }));
}

describe('Components catalog page', () => {
  it('lists the names with how many employees use each and when it was created', async () => {
    seeded();
    await open();

    expect(rows()).toHaveLength(3);
    expect(rowFor('Rice Allowance')).toHaveTextContent('2');
    expect(rowFor('Transportation')).toHaveTextContent('1');
    expect(rowFor('Unused Bonus')).toHaveTextContent('0');
    expect(rowFor('Rice Allowance')).toHaveTextContent('Nov 13, 2026');
  });

  it('has one primary button, "New component", and no amount column', async () => {
    seeded();
    await open();
    expect(
      screen.getAllByRole('button', { name: 'New component' }),
    ).toHaveLength(1);
    expect(
      screen
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(['Component name', 'Employees using it', 'Created', 'Actions']);
  });

  describe('new component', () => {
    it('creates a name only: no amount and no employee', async () => {
      const { calls, catalog } = seeded();
      const { user } = await open();

      await user.click(screen.getByRole('button', { name: 'New component' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'New component',
      });
      expect(within(dialog).getByLabelText(/^Component name/)).toHaveFocus();
      await user.type(
        within(dialog).getByLabelText(/^Component name/),
        '  Meal Allowance ',
      );
      await user.click(
        within(dialog).getByRole('button', { name: 'Create component' }),
      );

      expect(await screen.findByText('Component created')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(writes(calls)).toHaveLength(1);
      expect(writes(calls)[0]).toMatchObject({
        method: 'POST',
        url: '/salary-components',
      });
      expect(writes(calls)[0]!.body).toEqual({ name: 'Meal Allowance' });
      expect(catalog.map((c) => c.name)).toContain('Meal Allowance');
      expect(
        await within(screen.getByRole('table')).findByText('Meal Allowance'),
      ).toBeInTheDocument();
    });

    it('requires a name and sends nothing without one', async () => {
      const { calls } = seeded();
      const { user } = await open();
      await user.click(screen.getByRole('button', { name: 'New component' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(
        within(dialog).getByRole('button', { name: 'Create component' }),
      );
      expect(
        await within(dialog).findByText('Component name is required'),
      ).toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });

    it('shows a taken name, in any letter case, inside the dialog', async () => {
      seeded();
      const { user } = await open();
      await user.click(screen.getByRole('button', { name: 'New component' }));
      const dialog = await screen.findByRole('dialog');
      const field = within(dialog).getByLabelText(/^Component name/);
      await user.type(field, 'rice allowance');
      await user.click(
        within(dialog).getByRole('button', { name: 'Create component' }),
      );
      await waitFor(() =>
        expect(field).toHaveAccessibleDescription(
          /Component name already exists/,
        ),
      );
    });

    it('closes without saving on Cancel and Escape', async () => {
      const { calls } = seeded();
      const { user } = await open();
      await user.click(screen.getByRole('button', { name: 'New component' }));
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Cancel',
        }),
      );
      await user.click(screen.getByRole('button', { name: 'New component' }));
      await screen.findByRole('dialog');
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(writes(calls)).toHaveLength(0);
    });
  });

  describe('rename', () => {
    it('renames for everyone, and says so', async () => {
      const { calls } = seeded();
      const { user, router } = await open();
      await openMenu(user, 'Rice Allowance');
      await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

      const dialog = await screen.findByRole('dialog', {
        name: 'Rename component',
      });
      const field = within(dialog).getByLabelText(/^Component name/);
      expect(field).toHaveAccessibleDescription(
        'Applies to all employees using it.',
      );
      await user.clear(field);
      await user.type(field, 'Rice Subsidy');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save name' }),
      );

      expect(await screen.findByText('Component renamed')).toBeInTheDocument();
      expect(writes(calls)[0]).toMatchObject({ method: 'PATCH' });
      expect(
        await within(screen.getByRole('table')).findByText('Rice Subsidy'),
      ).toBeInTheDocument();

      await router.navigate(`/employees/${ben.id}/components`);
      await screen.findByRole('heading', { name: 'Ben Lim' });
      const table = await screen.findByRole('table', {
        name: 'Salary components',
      });
      expect(within(table).getByText('Rice Subsidy')).toBeInTheDocument();
    });

    it('shows a taken name inside the dialog', async () => {
      seeded();
      const { user } = await open();
      await openMenu(user, 'Transportation');
      await user.click(screen.getByRole('menuitem', { name: 'Rename' }));
      const dialog = await screen.findByRole('dialog');
      const field = within(dialog).getByLabelText(/^Component name/);
      await user.clear(field);
      await user.type(field, 'Rice Allowance');
      await user.click(
        within(dialog).getByRole('button', { name: 'Save name' }),
      );
      await waitFor(() =>
        expect(field).toHaveAccessibleDescription(
          /Component name already exists/,
        ),
      );
    });
  });

  describe('delete', () => {
    it('asks first and says how many employees will lose it', async () => {
      const { calls } = seeded();
      const { user } = await open();
      await openMenu(user, 'Rice Allowance');
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

      const dialog = await screen.findByRole('dialog', {
        name: 'Delete component',
      });
      expect(dialog).toHaveAccessibleDescription('Delete Rice Allowance?');
      expect(dialog).toHaveTextContent(
        'It will also be removed from 2 employees',
      );
      expect(writes(calls)).toHaveLength(0);
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(writes(calls)).toHaveLength(0);
    });

    it('says it is one employee, singular, and zero when nobody has it', async () => {
      seeded();
      const { user } = await open();
      await openMenu(user, 'Transportation');
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
      expect(await screen.findByRole('dialog')).toHaveTextContent(
        'removed from 1 employee,',
      );
      await user.keyboard('{Escape}');

      await openMenu(user, 'Unused Bonus');
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
      expect(await screen.findByRole('dialog')).toHaveTextContent(
        'No employee has this component',
      );
    });

    it('deletes it everywhere, and the employees lose it from their lists and totals', async () => {
      const { calls, assignments } = seeded();
      const { user, router } = await open();
      await openMenu(user, 'Rice Allowance');
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Delete',
        }),
      );

      expect(await screen.findByText('Component deleted')).toBeInTheDocument();
      expect(writes(calls)[0]).toMatchObject({ method: 'DELETE' });
      await waitFor(() => expect(rows()).toHaveLength(2));
      expect(assignments.get(ana.id)).toHaveLength(1);
      expect(assignments.get(ben.id)).toHaveLength(0);

      await router.navigate('/employees');
      const row = (
        await screen.findByRole('link', { name: 'Ben Lim' })
      ).closest('tr')!;
      expect(within(row).getAllByText('0').length).toBeGreaterThan(0);
    });

    it('shows a failure inside the dialog and keeps the component', async () => {
      const server = seeded();
      server.fail.componentsWrite = apiError(
        500,
        'delete from salary_components',
      );
      const { user } = await open();
      await openMenu(user, 'Unused Bonus');
      await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
      expect(await within(dialog).findByRole('alert')).not.toHaveTextContent(
        /delete from/,
      );
      expect(rows()).toHaveLength(3);
    });
  });

  it('searches by component name and shows a no-match state with Clear search', async () => {
    seeded();
    const { user } = await open();
    await user.type(
      screen.getByRole('searchbox', { name: 'Search components' }),
      'trans',
    );
    expect(rows()).toHaveLength(1);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(
      await screen.findByRole('heading', { name: /No components match/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(
      await screen.findByRole('table', { name: 'Components' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state whose button creates the first component', async () => {
    workspaceServer([ana]);
    const user = userEvent.setup();
    renderApp('/components');
    expect(
      await screen.findByRole('heading', { name: 'No components yet' }),
    ).toBeInTheDocument();
    // The page header button and the empty-state button do the same thing.
    await user.click(
      screen.getAllByRole('button', { name: 'New component' })[1]!,
    );
    expect(
      await screen.findByRole('dialog', { name: 'New component' }),
    ).toBeInTheDocument();
  });

  it('shows a plain error with Retry', async () => {
    const server = seeded();
    server.fail.catalog = true;
    const user = userEvent.setup();
    renderApp('/components');

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/select \*/);
    server.fail.catalog = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('table', { name: 'Components' }),
    ).toBeInTheDocument();
  });
});
