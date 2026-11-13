export const LOGIN_PATH = '/login';
export const HOME_PATH = '/employees';

/** Router state set by ProtectedRoute: where the user was heading before being sent to /login. */
export interface FromState {
  from?: string;
}

/**
 * Where to go after signing in: the page the user originally asked for, if it is a plain in-app
 * path, otherwise the home page. Never the login page itself, and never an absolute URL.
 */
export function redirectTarget(state: unknown): string {
  const from = (state as FromState | null)?.from;
  const safe =
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !from.startsWith(LOGIN_PATH);
  return safe ? from : HOME_PATH;
}
