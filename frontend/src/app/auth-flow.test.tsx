import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../shared/api/client';
import { tokenStore } from '../shared/api/token-store';
import { authServer, GOOD_PASSWORD, renderApp } from '../test/render-app';

const count = (calls: { url: string }[], url: string) =>
  calls.filter((c) => c.url === url).length;
const emailField = () => screen.getByLabelText(/^email/i);
const passwordField = () => screen.getByLabelText(/^password/i);

async function signIn(
  user: ReturnType<typeof userEvent.setup>,
  password = GOOD_PASSWORD,
) {
  await user.type(emailField(), 'admin@example.com');
  await user.type(passwordField(), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
}

describe('authentication flow', () => {
  beforeEach(() => {
    tokenStore.set(null);
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('restoring the session on load', () => {
    it('shows a full-page loading state, never the login form, then the page', async () => {
      const { calls } = authServer({ signedIn: true, refreshDelayMs: 50 });
      renderApp('/employees');

      expect(screen.getByRole('status')).toHaveTextContent(
        'Restoring your session',
      );
      expect(screen.queryByLabelText(/^email/i)).not.toBeInTheDocument();

      expect(
        await screen.findByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/^email/i)).not.toBeInTheDocument();
      expect(count(calls, '/auth/refresh')).toBe(1);
      expect(tokenStore.get()).toBe('refreshed');
    });

    it('sends exactly one refresh in React StrictMode, so the rotated cookie is not replayed', async () => {
      const { calls } = authServer({ signedIn: true, refreshDelayMs: 20 });
      renderApp('/employees', { strict: true });

      expect(
        await screen.findByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
      expect(count(calls, '/auth/refresh')).toBe(1);
    });

    it('sends a signed-in user away from /login to the home page without showing the form', async () => {
      authServer({ signedIn: true, refreshDelayMs: 20 });
      const { router } = renderApp('/login');

      expect(
        await screen.findByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/employees');
    });

    it('shows the login page when there is no valid session', async () => {
      authServer({ signedIn: false });
      renderApp('/login');
      expect(
        await screen.findByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument();
    });
  });

  describe('protected pages', () => {
    it('redirects a signed-out visitor to /login, then returns them to the page they asked for', async () => {
      authServer({ signedIn: false });
      const { router } = renderApp('/employees?tab=pay');
      const user = userEvent.setup();

      await screen.findByRole('button', { name: /sign in/i });
      expect(router.state.location.pathname).toBe('/login');

      await signIn(user);

      expect(
        await screen.findByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/employees');
      expect(router.state.location.search).toBe('?tab=pay');
    });

    it('goes to the home page after login when the user came to /login directly', async () => {
      authServer({ signedIn: false });
      const { router } = renderApp('/login');
      const user = userEvent.setup();

      await screen.findByRole('button', { name: /sign in/i });
      await signIn(user);

      expect(
        await screen.findByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/employees');
    });

    it('sends "/" to the login page when signed out and to the home page when signed in', async () => {
      authServer({ signedIn: false });
      const out = renderApp('/');
      await screen.findByRole('button', { name: /sign in/i });
      expect(out.router.state.location.pathname).toBe('/login');
    });

    it('sends "/" to the home page when signed in', async () => {
      authServer({ signedIn: true });
      const { router } = renderApp('/');
      expect(
        await screen.findByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/employees');
    });

    it('shows a not-found page for an unknown path', async () => {
      authServer({ signedIn: false });
      renderApp('/no/such/page');
      expect(
        await screen.findByRole('heading', { name: 'Page not found' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute(
        'href',
        '/',
      );
    });
  });

  describe('logging in', () => {
    it('shows the generic error for a wrong password, stays on /login and can try again', async () => {
      authServer({ signedIn: false });
      const { router } = renderApp('/login');
      const user = userEvent.setup();
      await screen.findByRole('button', { name: /sign in/i });

      await signIn(user, 'wrong-password');

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Invalid email or password',
      );
      expect(router.state.location.pathname).toBe('/login');
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
      expect(tokenStore.get()).toBeNull();
    });

    it('keeps tokens out of localStorage, sessionStorage and cookies', async () => {
      authServer({ signedIn: false });
      renderApp('/login');
      const user = userEvent.setup();
      await screen.findByRole('button', { name: /sign in/i });

      await signIn(user);
      await screen.findByRole('heading', { name: 'Employees' });

      expect(localStorage).toHaveLength(0);
      expect(sessionStorage).toHaveLength(0);
      expect(document.cookie).toBe('');
      expect(tokenStore.get()).toBe('logged-in');
    });

    it('has no sign-up or registration link', async () => {
      authServer({ signedIn: false });
      renderApp('/login');
      await screen.findByRole('button', { name: /sign in/i });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/sign up|register|create (an )?account/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('app layout', () => {
    it('shows the sidebar links, the user name and a logout button', async () => {
      authServer({ signedIn: true });
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'Employees' });

      const nav = screen.getByRole('navigation', { name: 'Main' });
      expect(
        within(nav).getByRole('link', { name: 'Employees' }),
      ).toHaveAttribute('aria-current', 'page');
      for (const name of ['Salary', 'Components', 'Computation']) {
        expect(
          within(nav).queryByRole('link', { name: new RegExp(name) }),
        ).not.toBeInTheDocument();
        expect(
          within(nav).getByText(name).closest('[aria-disabled="true"]'),
        ).not.toBeNull();
      }
      expect(screen.getByText('Ada Admin')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /logout/i }),
      ).toBeInTheDocument();
    });

    it('opens the drawer from the menu button and closes it with Escape', async () => {
      authServer({ signedIn: true });
      renderApp('/employees');
      const user = userEvent.setup();
      const menu = await screen.findByRole('button', {
        name: /open navigation/i,
      });

      expect(menu).toHaveAttribute('aria-expanded', 'false');
      await user.click(menu);
      expect(menu).toHaveAttribute('aria-expanded', 'true');
      await user.keyboard('{Escape}');
      expect(menu).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('logging out', () => {
    it('calls the API with the token, clears the token and the query cache, and shows /login', async () => {
      const { calls } = authServer({ signedIn: true });
      const { queryClient } = renderApp('/employees');
      const user = userEvent.setup();
      await screen.findByRole('heading', { name: 'Employees' });
      queryClient.setQueryData(['employees'], [{ id: 'secret' }]);

      await user.click(screen.getByRole('button', { name: /logout/i }));

      expect(
        await screen.findByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument();
      const logout = calls.find((c) => c.url === '/auth/logout');
      expect(logout?.authorization).toBe('Bearer refreshed');
      expect(tokenStore.get()).toBeNull();
      expect(queryClient.getQueryData(['employees'])).toBeUndefined();
    });

    it('cannot get back into a protected page afterwards', async () => {
      authServer({ signedIn: true });
      const { router } = renderApp('/employees');
      const user = userEvent.setup();
      await screen.findByRole('heading', { name: 'Employees' });

      await user.click(screen.getByRole('button', { name: /logout/i }));
      await screen.findByRole('button', { name: /sign in/i });

      await act(() => router.navigate('/employees'));
      expect(
        await screen.findByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');
    });
  });

  describe('when the session ends while using the app', () => {
    it('refreshes silently and keeps the user signed in when only the access token expired', async () => {
      const { calls, state } = authServer({ signedIn: true });
      renderApp('/employees');
      await screen.findByRole('heading', { name: 'Employees' });
      // The server now rejects the old access token on /data until the client refreshes.
      tokenStore.set('expired');
      state.signedIn = true;

      await act(async () => {
        await api.get('/data').catch(() => undefined);
      });

      expect(count(calls, '/auth/refresh')).toBe(2);
      expect(tokenStore.get()).toBe('refreshed');
      expect(
        screen.getByRole('heading', { name: 'Employees' }),
      ).toBeInTheDocument();
    });

    it('sends the user to /login when the refresh cookie is no longer valid', async () => {
      const { state } = authServer({ signedIn: true });
      const { router } = renderApp('/employees');
      await screen.findByRole('heading', { name: 'Employees' });

      state.signedIn = false;
      await act(async () => {
        await api.get('/data').catch(() => undefined);
      });

      await waitFor(() =>
        expect(router.state.location.pathname).toBe('/login'),
      );
      expect(
        await screen.findByRole('button', { name: /sign in/i }),
      ).toBeInTheDocument();
      expect(tokenStore.get()).toBeNull();
    });
  });
});
