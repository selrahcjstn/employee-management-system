import {
  adminSession,
  apiError,
  installFakeServer,
} from '../../../test/fake-server';
import { tokenStore } from '../../../shared/api/token-store';
import { login, logout, me } from './auth-api';

describe('auth api', () => {
  beforeEach(() => tokenStore.set(null));

  it('login posts the credentials and returns the session', async () => {
    const calls = installFakeServer(() => ({
      status: 200,
      data: adminSession('t'),
    }));
    const session = await login('admin@example.com', 'pw');
    expect(session.accessToken).toBe('t');
    expect(calls[0]).toMatchObject({
      method: 'POST',
      url: '/auth/login',
      body: { email: 'admin@example.com', password: 'pw' },
    });
  });

  it('me returns the current user', async () => {
    tokenStore.set('t');
    const calls = installFakeServer(() => ({
      status: 200,
      data: adminSession().user,
    }));
    expect((await me()).email).toBe('admin@example.com');
    expect(calls[0]).toMatchObject({
      method: 'GET',
      url: '/auth/me',
      authorization: 'Bearer t',
    });
  });

  describe('logout', () => {
    it('makes one call with the access token', async () => {
      tokenStore.set('t');
      const calls = installFakeServer(() => ({ status: 204 }));
      await logout();
      expect(calls.map((c) => [c.url, c.authorization])).toEqual([
        ['/auth/logout', 'Bearer t'],
      ]);
    });

    it('when the access token has expired, refreshes once and then revokes with the new token', async () => {
      tokenStore.set('expired');
      const calls = installFakeServer((call) => {
        if (call.url === '/auth/refresh')
          return { status: 200, data: adminSession('new') };
        return call.authorization === 'Bearer new'
          ? { status: 204 }
          : apiError(401, 'Unauthorized');
      });

      await logout();

      expect(calls.map((c) => [c.url, c.authorization])).toEqual([
        ['/auth/logout', 'Bearer expired'],
        // Refresh uses the httpOnly cookie, so it carries no Bearer header.
        ['/auth/refresh', undefined],
        ['/auth/logout', 'Bearer new'],
      ]);
    });

    it('when even the refresh cookie is invalid there is nothing to revoke, so it finishes quietly', async () => {
      tokenStore.set('expired');
      const calls = installFakeServer(() => apiError(401, 'Unauthorized'));
      await expect(logout()).resolves.toBeUndefined();
      expect(calls.map((c) => c.url)).toEqual([
        '/auth/logout',
        '/auth/refresh',
      ]);
    });

    it('lets other failures through so the caller knows the server was not told', async () => {
      tokenStore.set('t');
      installFakeServer(() => apiError(500, 'Internal server error'));
      await expect(logout()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });
});
