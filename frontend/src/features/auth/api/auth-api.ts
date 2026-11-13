import axios from 'axios';
import { api } from '../../../shared/api/client';
import { refreshSession } from '../../../shared/api/refresh';
import type { Session, SessionUser } from '../../../shared/api/types';

export async function login(email: string, password: string): Promise<Session> {
  const { data } = await api.post<Session>('/auth/login', { email, password });
  return data;
}

/** Exchanges the refresh cookie for a new access token. Calls made at the same time share one request. */
export const refresh = refreshSession;

export async function me(): Promise<SessionUser> {
  const { data } = await api.get<SessionUser>('/auth/me');
  return data;
}

/**
 * Revokes the refresh token on the server and clears the cookie. Logout needs a valid access token,
 * so if that has expired (401) the refresh cookie is still live; refresh once to get a token, then
 * revoke. If the cookie is already invalid there is nothing left to revoke.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 401))
      throw error;
    try {
      await refreshSession();
    } catch {
      return;
    }
    await api.post('/auth/logout');
  }
}
