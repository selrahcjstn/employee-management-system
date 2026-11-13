import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { refreshSession } from '../../../shared/api/refresh';
import { sessionEvents, tokenStore } from '../../../shared/api/token-store';
import * as authApi from '../api/auth-api';
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
} from './auth-context';

/**
 * Holds the signed-in user in memory. The access token is in `tokenStore` (also memory only), so a
 * reload starts in "restoring" and asks the server for a new token using the httpOnly refresh cookie.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'restoring' });

  useEffect(() => {
    let current = true;
    // Shared in-flight refresh: StrictMode runs this effect twice, and two refreshes would be a replay.
    refreshSession().then(
      ({ user }) => {
        if (current) setState({ status: 'authenticated', user });
      },
      () => {
        if (current) setState({ status: 'unauthenticated' });
      },
    );
    return () => {
      current = false;
    };
  }, []);

  useEffect(
    () =>
      sessionEvents.onExpired(() => {
        tokenStore.set(null);
        queryClient.clear();
        setState({ status: 'unauthenticated' });
      }),
    [queryClient],
  );

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    tokenStore.set(session.accessToken);
    setState({ status: 'authenticated', user: session.user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The server could not be told (offline, for example). The local session still ends.
    } finally {
      tokenStore.set(null);
      queryClient.clear();
      setState({ status: 'unauthenticated' });
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
