import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { adminSession, apiError } from '../../../test/fake-server';
import { authServer, renderApp } from '../../../test/render-app';

/** The fake session user is the admin; PATCH /users/me answers like the real API. */
function server(patch?: (body: { fullName?: string }) => unknown) {
  return authServer({
    signedIn: true,
    handle: (call) => {
      if (call.url === '/users/me' && call.method === 'PATCH') {
        const body = call.body as { fullName?: string };
        const custom = patch?.(body);
        if (custom) return custom as never;
        return {
          status: 200,
          data: { ...adminSession().user, fullName: body.fullName },
        };
      }
      return undefined;
    },
  });
}

const open = async () => {
  const user = userEvent.setup();
  renderApp('/profile');
  await screen.findByRole('heading', { name: 'My profile' });
  return user;
};

describe('My profile page', () => {
  it('shows the name, email and role of the signed-in user', async () => {
    server();
    await open();
    const user = adminSession().user;
    const main = within(document.getElementById('main')!);
    expect(main.getByText(user.email)).toBeInTheDocument();
    expect(main.getAllByText('Administrator').length).toBeGreaterThan(0);
    expect(main.getByLabelText(/^Full name/)).toHaveValue(user.fullName);
  });

  it('has no password change, per the scope', async () => {
    server();
    await open();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('keeps Save changes off until the name has changed', async () => {
    server();
    const user = await open();
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/^Full name/), 'x');
    expect(save).toBeEnabled();
  });

  it('saves a new name, shows a toast, and updates the account menu', async () => {
    const { calls } = server();
    const user = await open();
    const field = screen.getByLabelText(/^Full name/);
    await user.clear(field);
    await user.type(field, '  Grace Hopper ');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
    const patch = calls.find((c) => c.method === 'PATCH');
    expect(patch!.body).toEqual({ fullName: 'Grace Hopper' });
    expect(
      screen.getByRole('button', { name: 'Account menu, Grace Hopper' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('requires a name and sends nothing without one', async () => {
    const { calls } = server();
    const user = await open();
    await user.clear(screen.getByLabelText(/^Full name/));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText('Full name is required'),
    ).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('rejects a name over 150 characters', async () => {
    server();
    const user = await open();
    const field = screen.getByLabelText(/^Full name/);
    await user.clear(field);
    await user.click(field);
    await user.paste('x'.repeat(151));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText('Full name must be 150 characters or fewer'),
    ).toBeInTheDocument();
  });

  it('shows a server failure as an alert and keeps the typed name', async () => {
    server(() => apiError(500, 'update users set full_name'));
    const user = await open();
    const field = screen.getByLabelText(/^Full name/);
    await user.type(field, ' Jr');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/update users/);
    expect(field).toHaveValue(`${adminSession().user.fullName} Jr`);
  });
});
