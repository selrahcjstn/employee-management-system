import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../../shared/api/token-store';
import { authServer, renderApp } from '../../test/render-app';

async function openApp() {
  const server = authServer({ signedIn: true });
  const app = renderApp('/employees');
  await screen.findByRole('heading', { name: 'Employees' });
  return { ...server, ...app, user: userEvent.setup() };
}

const trigger = () =>
  screen.getByRole('button', { name: 'Account menu, Ada Admin' });

describe('UserMenu', () => {
  beforeEach(() => {
    tokenStore.set(null);
    localStorage.clear();
  });

  it('is a closed menu button at first', async () => {
    await openApp();
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).not.toHaveAttribute('aria-controls');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on click, shows who is signed in, and puts focus on the first item', async () => {
    const { user } = await openApp();

    await user.click(trigger());

    const menu = screen.getByRole('menu', { name: 'Account' });
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(trigger()).toHaveAttribute('aria-controls', menu.id);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getAllByText('Ada Admin').length).toBeGreaterThanOrEqual(2);
    expect(
      within(menu).getByRole('menuitem', { name: 'Logout' }),
    ).toHaveFocus();
  });

  it('opens with the Down arrow from the button', async () => {
    const { user } = await openApp();
    trigger().focus();

    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Logout' })).toHaveFocus();
  });

  it('closes with Escape and returns focus to the button', async () => {
    const { user } = await openApp();
    await user.click(trigger());

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveFocus();
  });

  it('closes when the button is pressed again', async () => {
    const { user } = await openApp();
    await user.click(trigger());
    await user.click(trigger());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on a click outside, without stealing focus back', async () => {
    const { user } = await openApp();
    await user.click(trigger());

    await user.click(screen.getByRole('heading', { name: 'Employees' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger()).not.toHaveFocus();
  });

  it('closes on Tab and lets focus move on', async () => {
    const { user } = await openApp();
    await user.click(trigger());

    await user.tab();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps focus on the only item for the arrow, Home and End keys (they wrap)', async () => {
    const { user } = await openApp();
    await user.click(trigger());
    const item = screen.getByRole('menuitem', { name: 'Logout' });

    for (const key of ['{ArrowDown}', '{ArrowUp}', '{Home}', '{End}']) {
      await user.keyboard(key);
      expect(item).toHaveFocus();
    }
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('logs out from the menu: the API is called with the token and the login page appears', async () => {
    const { user, calls } = await openApp();
    await user.click(trigger());

    await user.click(screen.getByRole('menuitem', { name: 'Logout' }));

    expect(
      await screen.findByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(calls.find((c) => c.url === '/auth/logout')?.authorization).toBe(
      'Bearer refreshed',
    );
    expect(tokenStore.get()).toBeNull();
  });

  it('logs out with the keyboard alone: open, Enter on Logout', async () => {
    const { user } = await openApp();
    trigger().focus();

    await user.keyboard('{ArrowDown}{Enter}');

    expect(
      await screen.findByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });
});
