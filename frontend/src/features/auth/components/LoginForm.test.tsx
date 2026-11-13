import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tokenStore } from '../../../shared/api/token-store';
import { apiError, type RecordedCall } from '../../../test/fake-server';
import { authServer, GOOD_PASSWORD, renderApp } from '../../../test/render-app';

const emailField = () => screen.getByLabelText(/^email/i);
const passwordField = () => screen.getByLabelText(/^password/i);
const submitButton = () => screen.getByRole('button', { name: /sign in/i });

async function openLoginPage(
  options: Parameters<typeof authServer>[0] = { signedIn: false },
) {
  const server = authServer(options);
  const app = renderApp('/login');
  await screen.findByRole('button', { name: /sign in/i });
  return { ...server, ...app, user: userEvent.setup() };
}

const loginCalls = (calls: RecordedCall[]) =>
  calls.filter((c) => c.url === '/auth/login');

describe('LoginForm', () => {
  beforeEach(() => tokenStore.set(null));

  it('has labelled, required fields with the right autocomplete hints, and email is focused', async () => {
    await openLoginPage();

    expect(emailField()).toHaveAttribute('autocomplete', 'username');
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(emailField()).toBeRequired();
    expect(passwordField()).toHaveAttribute('autocomplete', 'current-password');
    expect(passwordField()).toBeRequired();
    expect(emailField()).toHaveFocus();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Employee & Salary Management',
    );
  });

  it('shows an inline error for each empty field and does not call the API', async () => {
    const { calls, user } = await openLoginPage();

    await user.click(submitButton());

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(loginCalls(calls)).toHaveLength(0);
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveAccessibleDescription('Email is required');
  });

  it('rejects a malformed email without calling the API', async () => {
    const { calls, user } = await openLoginPage();

    await user.type(emailField(), 'not-an-email');
    await user.type(passwordField(), 'x');
    await user.click(submitButton());

    expect(
      await screen.findByText('Enter a valid email address'),
    ).toBeInTheDocument();
    expect(loginCalls(calls)).toHaveLength(0);
  });

  it('submits when Enter is pressed in a field', async () => {
    const { calls, user } = await openLoginPage();

    await user.type(emailField(), 'admin@example.com');
    await user.type(passwordField(), `${GOOD_PASSWORD}{Enter}`);

    expect(
      await screen.findByRole('heading', { name: 'Employees' }),
    ).toBeInTheDocument();
    expect(loginCalls(calls)).toHaveLength(1);
    expect(loginCalls(calls)[0]?.body).toEqual({
      email: 'admin@example.com',
      password: GOOD_PASSWORD,
    });
  });

  it('shows and hides the password with a labelled toggle', async () => {
    const { user } = await openLoginPage();
    expect(passwordField()).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordField()).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordField()).toHaveAttribute('type', 'password');
  });

  it('disables the button and marks it busy while signing in, so it cannot be submitted twice', async () => {
    const { calls, user } = await openLoginPage({
      signedIn: false,
      loginDelayMs: 150,
    });

    await user.type(emailField(), 'admin@example.com');
    await user.type(passwordField(), GOOD_PASSWORD);
    await user.click(submitButton());

    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveAttribute('aria-busy', 'true');
    await user.click(submitButton());
    expect(
      await screen.findByRole('heading', { name: 'Employees' }),
    ).toBeInTheDocument();
    expect(loginCalls(calls)).toHaveLength(1);
  });

  it('shows the same generic message whichever of the two was wrong', async () => {
    const { user } = await openLoginPage();

    await user.type(emailField(), 'nobody@example.com');
    await user.type(passwordField(), 'whatever');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    );
  });

  it('clears the error when the next attempt starts', async () => {
    const { user } = await openLoginPage({ signedIn: false, loginDelayMs: 60 });
    await user.type(emailField(), 'admin@example.com');
    await user.type(passwordField(), 'wrong');
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.clear(passwordField());
    await user.type(passwordField(), GOOD_PASSWORD);
    await user.click(submitButton());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Employees' }),
    ).toBeInTheDocument();
  });

  it('tells the user when they are rate limited', async () => {
    const { calls, user } = await openLoginPage();
    // Replace the scripted server with one that always rate limits.
    const { installFakeServer } = await import('../../../test/fake-server');
    installFakeServer(() =>
      apiError(429, 'ThrottlerException: Too Many Requests'),
    );

    await user.type(emailField(), 'admin@example.com');
    await user.type(passwordField(), 'x');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts',
    );
    expect(calls).toBeDefined();
  });

  it('tells the user when the server cannot be reached', async () => {
    const { user } = await openLoginPage();
    const { AxiosError } = await import('axios');
    const { api } = await import('../../../shared/api/client');
    api.defaults.adapter = () =>
      Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK'));

    await user.type(emailField(), 'admin@example.com');
    await user.type(passwordField(), 'x');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot reach the server',
    );
  });

  it('shows a field message from a 400 next to that field', async () => {
    const { user } = await openLoginPage();
    const { installFakeServer } = await import('../../../test/fake-server');
    installFakeServer(() =>
      apiError(400, 'Validation failed', ['email must be an email']),
    );

    await user.type(emailField(), 'admin@example.com');
    await user.type(passwordField(), 'x');
    await user.click(submitButton());

    expect(await screen.findByText('must be an email')).toBeInTheDocument();
    expect(emailField()).toHaveAccessibleDescription('must be an email');
  });

  it('follows the keyboard order: email, password, show/hide, sign in', async () => {
    const { user } = await openLoginPage();
    expect(emailField()).toHaveFocus();

    await user.tab();
    expect(passwordField()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveFocus();
    await user.tab();
    expect(submitButton()).toHaveFocus();
  });
});
