import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/router';
import { AuthProvider } from '../features/auth/context/AuthProvider';
import { ToastProvider } from '../shared/ui/ToastProvider';
import {
  adminSession,
  apiError,
  delay,
  installFakeServer,
  type FakeReply,
  type RecordedCall,
} from './fake-server';

interface ServerOptions {
  /** Whether the refresh cookie is valid when the app loads. */
  signedIn: boolean;
  refreshDelayMs?: number;
  loginDelayMs?: number;
  /**
   * Answers every other request (employees and so on) before the defaults below. Return
   * undefined to fall through to the defaults.
   */
  handle?: (
    call: RecordedCall,
  ) => FakeReply | undefined | Promise<FakeReply | undefined>;
}

export const GOOD_PASSWORD = 'correct-password';

/** A scripted auth server: refresh works while signed in, login works with the right password. */
export function authServer({
  signedIn,
  refreshDelayMs = 0,
  loginDelayMs = 0,
  handle,
}: ServerOptions) {
  const state = { signedIn };
  const calls = installFakeServer(async (call) => {
    const handled = await handle?.(call);
    if (handled) return handled;
    switch (`${call.method} ${call.url}`) {
      case 'POST /auth/refresh':
        await delay(refreshDelayMs);
        return state.signedIn
          ? { status: 200, data: adminSession('refreshed') }
          : apiError(401, 'Invalid refresh token');
      case 'POST /auth/login': {
        await delay(loginDelayMs);
        const body = call.body as { email: string; password: string };
        if (
          body.email === 'admin@example.com' &&
          body.password === GOOD_PASSWORD
        ) {
          state.signedIn = true;
          return { status: 200, data: adminSession('logged-in') };
        }
        return apiError(401, 'Invalid email or password');
      }
      case 'POST /auth/logout':
        state.signedIn = false;
        return { status: 204 };
      case 'GET /employees':
        // Pages that list employees get an empty list unless a test supplies its own.
        return { status: 200, data: [] };
      default:
        return apiError(401, 'Unauthorized');
    }
  });
  return { calls, state };
}

/** Renders the real routes inside the real providers, starting at `path`. */
export function renderApp(
  path: string,
  { strict = false }: { strict?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const tree = (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { router, queryClient };
}
