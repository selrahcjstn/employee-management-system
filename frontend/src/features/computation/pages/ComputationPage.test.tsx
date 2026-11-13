import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../../test/employees-server';
import { renderApp } from '../../../test/render-app';
import { makeSalary, workspaceServer } from '../../../test/workspace-server';

const ana = makeEmployee({ firstName: 'Ana', lastName: 'Reyes' });

const open = () => renderApp(`/employees/${ana.id}/computation`);

describe('Computation tab', () => {
  it('matches the PRD worked example: 30,000 + 2,000 + 1,500 = 33,500', async () => {
    workspaceServer([ana], {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
      assigned: {
        [ana.id]: [
          ['Rice Allowance', '2000.00'],
          ['Transportation', '1500.00'],
        ],
      },
    });
    open();

    const breakdown = await screen.findByRole('region', {
      name: 'Monthly breakdown',
    });
    expect(
      within(breakdown).getByText('Basic salary').closest('div'),
    ).toHaveTextContent('₱30,000.00');
    expect(
      within(breakdown).getByText('Rice Allowance').closest('div'),
    ).toHaveTextContent('₱2,000.00');
    expect(
      within(breakdown).getByText('Transportation').closest('div'),
    ).toHaveTextContent('₱1,500.00');
    expect(
      within(breakdown).getByText('Total monthly salary').closest('div'),
    ).toHaveTextContent('₱33,500.00');

    const rates = screen.getByRole('region', { name: 'Salary rates' });
    expect(within(rates).getByText('Annual').closest('div')).toHaveTextContent(
      '₱402,000.00',
    );
    expect(within(rates).getByText('Daily').closest('div')).toHaveTextContent(
      '₱1,280.25',
    );
    expect(within(rates).getByText('Hourly').closest('div')).toHaveTextContent(
      '₱160.03',
    );
    expect(
      within(rates).getByText('Per minute').closest('div'),
    ).toHaveTextContent('₱2.67');
  });

  it('shows the formula beside each rate and the 314-day note', async () => {
    workspaceServer([ana], {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
    });
    open();

    const rates = await screen.findByRole('region', { name: 'Salary rates' });
    expect(within(rates).getByText('Monthly total × 12')).toBeInTheDocument();
    expect(within(rates).getByText('Annual ÷ 314')).toBeInTheDocument();
    expect(within(rates).getByText('Daily ÷ 8')).toBeInTheDocument();
    expect(within(rates).getByText('Hourly ÷ 60')).toBeInTheDocument();
    expect(rates).toHaveTextContent(
      'Daily rate uses 314 working days per year.',
    );
  });

  it('says so when there are no components', async () => {
    workspaceServer([ana], {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '1000.00') } },
    });
    open();
    expect(await screen.findByText('No components added.')).toBeInTheDocument();
  });

  it('shows an empty state with a link to the Salary tab when there is no basic salary', async () => {
    workspaceServer([ana]);
    open();

    expect(
      await screen.findByRole('heading', { name: 'No salary to compute yet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Salary' })).toHaveAttribute(
      'href',
      `/employees/${ana.id}/salary`,
    );
  });

  it('recalculates after a component is added, without a reload', async () => {
    workspaceServer([ana], {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
      catalog: ['Bonus'],
    });
    const user = userEvent.setup();
    renderApp(`/employees/${ana.id}/components`);
    await screen.findByText('No components yet');

    await user.click(screen.getByRole('combobox', { name: 'Component' }));
    await user.click(await screen.findByRole('option', { name: 'Bonus' }));
    await user.type(screen.getByLabelText(/^Amount/), '1000');
    await user.click(screen.getByRole('button', { name: 'Add component' }));
    await screen.findByText('Component added');

    const tabs = screen.getByRole('navigation', { name: 'Employee sections' });
    await user.click(within(tabs).getByRole('link', { name: 'Computation' }));
    const breakdown = await screen.findByRole('region', {
      name: 'Monthly breakdown',
    });
    expect(
      within(breakdown).getByText('Total monthly salary').closest('div'),
    ).toHaveTextContent('₱31,000.00');
  });

  it('shows a plain error with Retry', async () => {
    const server = workspaceServer([ana], {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '1000.00') } },
    });
    server.fail.computation = true;
    const user = userEvent.setup();
    open();

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/select sum/);

    server.fail.computation = false;
    await user.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('region', { name: 'Monthly breakdown' }),
    ).toBeInTheDocument();
  });

  it('lists the four rates as rows with the formula and a plain meaning, and has no chart', async () => {
    workspaceServer([ana], {
      salaries: { [ana.id]: { current: makeSalary(ana.id, '30000.00') } },
    });
    open();

    const rates = await screen.findByRole('region', { name: 'Salary rates' });
    const rows = within(rates)
      .getAllByRole('term')
      .map((term) => term.textContent);
    expect(rows).toEqual([
      expect.stringContaining('Annual'),
      expect.stringContaining('Daily'),
      expect.stringContaining('Hourly'),
      expect.stringContaining('Per minute'),
    ]);
    expect(within(rates).getByText('One working day')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/What the monthly total is made of/),
    ).not.toBeInTheDocument();
  });
});
