import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ActionsMenu } from './ActionsMenu';

function setup(onEdit = () => {}) {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ActionsMenu
        label="Actions for Ana Reyes"
        items={[
          { label: 'Salary', to: '/employees/1/salary' },
          { label: 'Edit employee', onSelect: onEdit },
        ]}
      />
    </MemoryRouter>,
  );
  return user;
}

const button = () =>
  screen.getByRole('button', { name: 'Actions for Ana Reyes' });

describe('ActionsMenu', () => {
  it('is a closed menu button until it is used', () => {
    setup();
    expect(button()).toHaveAttribute('aria-haspopup', 'menu');
    expect(button()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens with a click, puts focus on the first item, and lists links and actions as menu items', async () => {
    const user = setup();
    await user.click(button());

    expect(button()).toHaveAttribute('aria-expanded', 'true');
    const items = screen.getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Salary',
      'Edit employee',
    ]);
    expect(items[0]).toHaveAttribute('href', '/employees/1/salary');
    expect(items[0]).toHaveFocus();
  });

  it('moves with the arrow keys, wrapping around', async () => {
    const user = setup();
    await user.click(button());
    const [first, second] = screen.getAllByRole('menuitem');

    await user.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(second).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
    await user.keyboard('{End}');
    expect(second).toHaveFocus();
  });

  it('opens from the keyboard with ArrowDown', async () => {
    const user = setup();
    button().focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes with Escape and gives focus back to the button', async () => {
    const user = setup();
    await user.click(button());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button()).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    const user = setup();
    await user.click(button());
    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('runs an action and closes', async () => {
    const onEdit = vi.fn();
    const user = setup(onEdit);
    await user.click(button());
    await user.click(screen.getByRole('menuitem', { name: 'Edit employee' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
