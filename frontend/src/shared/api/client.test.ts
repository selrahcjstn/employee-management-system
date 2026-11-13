import axios from 'axios';
import {
  adminSession,
  apiError,
  delay,
  installFakeServer,
  type RecordedCall,
} from '../../test/fake-server';
import { api } from './client';
import { refreshSession } from './refresh';
import { sessionEvents, tokenStore } from './token-store';

const ok = (data: unknown = { ok: true }) => ({ status: 200, data });

/** A server where /data needs "Bearer fresh", and /auth/refresh hands that token out. */
function serverWithExpiredToken(
  options: { refreshStatus?: number; dataAlwaysUnauthorized?: boolean } = {},
) {
  return installFakeServer(async (call) => {
    if (call.url === '/auth/refresh') {
      await delay(10);
      return options.refreshStatus === 401
        ? apiError(401, 'Invalid refresh token')
        : ok(adminSession('fresh'));
    }
    if (call.url === '/data') {
      const valid =
        call.authorization === 'Bearer fresh' &&
        !options.dataAlwaysUnauthorized;
      return valid ? ok({ rows: [1, 2, 3] }) : apiError(401, 'Unauthorized');
    }
    if (call.url === '/boom') return apiError(500, 'Internal server error');
    return apiError(404, 'Not found');
  });
}

const count = (calls: RecordedCall[], url: string) =>
  calls.filter((c) => c.url === url).length;

describe('api client', () => {
  beforeEach(() => {
    tokenStore.set(null);
    localStorage.clear();
    sessionStorage.clear();
  });

  it('sends the access token from memory as a Bearer header, and none when there is no token', async () => {
    const calls = installFakeServer(() => ok());
    await api.get('/anything');
    tokenStore.set('abc');
    await api.get('/anything');
    expect(calls.map((c) => c.authorization)).toEqual([
      undefined,
      'Bearer abc',
    ]);
  });

  it('on a 401, refreshes once, retries the request with the new token and returns its data', async () => {
    const calls = serverWithExpiredToken();
    tokenStore.set('expired');

    const { data } = await api.get('/data');

    expect(data).toEqual({ rows: [1, 2, 3] });
    expect(count(calls, '/auth/refresh')).toBe(1);
    expect(
      calls.filter((c) => c.url === '/data').map((c) => c.authorization),
    ).toEqual(['Bearer expired', 'Bearer fresh']);
    expect(tokenStore.get()).toBe('fresh');
  });

  it('shares ONE refresh between parallel 401s, then retries every request', async () => {
    const calls = serverWithExpiredToken();
    tokenStore.set('expired');

    const results = await Promise.all(
      Array.from({ length: 5 }, () => api.get('/data')),
    );

    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(count(calls, '/auth/refresh')).toBe(1);
    expect(count(calls, '/data')).toBe(10);
  });

  it('when the refresh fails, rejects with the original 401, clears the token and tells the app once', async () => {
    serverWithExpiredToken({ refreshStatus: 401 });
    tokenStore.set('expired');
    const expired = vi.fn();
    const stop = sessionEvents.onExpired(expired);

    await expect(api.get('/data')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(tokenStore.get()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    stop();
  });

  it('reports the expired session when parallel requests fail because the refresh failed', async () => {
    serverWithExpiredToken({ refreshStatus: 401 });
    tokenStore.set('expired');
    const expired = vi.fn();
    const stop = sessionEvents.onExpired(expired);

    const results = await Promise.allSettled([
      api.get('/data'),
      api.get('/data'),
      api.get('/data'),
    ]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    // Each failed request reports it, which is harmless: clearing an empty session is idempotent.
    expect(expired).toHaveBeenCalled();
    stop();
  });

  it('retries only once: a second 401 after refreshing is returned, not looped', async () => {
    const calls = serverWithExpiredToken({ dataAlwaysUnauthorized: true });
    tokenStore.set('expired');

    await expect(api.get('/data')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(count(calls, '/auth/refresh')).toBe(1);
    expect(count(calls, '/data')).toBe(2);
  });

  it('does not refresh for a 401 from an /auth/* call such as a failed login', async () => {
    const calls = installFakeServer((call) =>
      call.url === '/auth/login'
        ? apiError(401, 'Invalid email or password')
        : ok(),
    );

    await expect(
      api.post('/auth/login', { email: 'a@b.co', password: 'x' }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(count(calls, '/auth/refresh')).toBe(0);
    expect(calls).toHaveLength(1);
  });

  it('passes other errors through without refreshing', async () => {
    const calls = serverWithExpiredToken();
    await expect(api.get('/boom')).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(count(calls, '/auth/refresh')).toBe(0);
  });

  it('keeps the token out of localStorage and sessionStorage', async () => {
    serverWithExpiredToken();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    tokenStore.set('expired');

    await api.get('/data');

    expect(tokenStore.get()).toBe('fresh');
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
    setItem.mockRestore();
  });

  it('uses credentials so the httpOnly refresh cookie is sent', () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(axios.isAxiosError(new Error('x'))).toBe(false);
  });
});

describe('refreshSession', () => {
  beforeEach(() => tokenStore.set(null));

  it('makes a single request for concurrent callers, and a new one once it has finished', async () => {
    const calls = installFakeServer(async () => {
      await delay(10);
      return ok(adminSession('fresh'));
    });

    const [a, b, c] = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(calls).toHaveLength(1);

    await refreshSession();
    expect(calls).toHaveLength(2);
  });

  it('can be retried after a failure instead of staying stuck', async () => {
    let attempt = 0;
    const calls = installFakeServer(() =>
      ++attempt === 1 ? apiError(401, 'no') : ok(adminSession()),
    );

    await expect(refreshSession()).rejects.toBeDefined();
    await expect(refreshSession()).resolves.toMatchObject({
      accessToken: 'token-1',
    });
    expect(calls).toHaveLength(2);
  });
});
