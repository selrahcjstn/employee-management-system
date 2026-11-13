import { authClient } from './client';
import { tokenStore } from './token-store';
import type { Session } from './types';

let inFlight: Promise<Session> | null = null;

/**
 * Exchanges the refresh cookie for a new access token. Every caller that asks while a refresh is
 * running gets that same promise, which matters twice: parallel 401s must not each refresh, and
 * React StrictMode runs the restore effect twice in development. The server rotates the refresh
 * token on every call, so a second concurrent call with the old cookie would be treated as a
 * replay and revoke the whole session.
 */
export function refreshSession(): Promise<Session> {
  inFlight ??= authClient
    .post<Session>('/auth/refresh')
    .then(({ data }) => {
      tokenStore.set(data.accessToken);
      return data;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
