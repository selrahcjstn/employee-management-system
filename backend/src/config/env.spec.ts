import { loadEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  FRONTEND_ORIGIN: 'http://localhost:5173',
};

describe('loadEnv', () => {
  it('returns typed settings with defaults', () => {
    expect(loadEnv(valid)).toMatchObject({ port: 3000, jwtAccessTtl: '15m', jwtRefreshTtl: '7d' });
  });

  it.each(Object.keys(valid))('fails when %s is missing', (key) => {
    const { [key]: _removed, ...rest } = valid as Record<string, string>;
    expect(() => loadEnv(rest)).toThrow(key);
  });

  it('fails when a secret is too short', () => {
    expect(() => loadEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow('at least 32');
  });

  it('fails when both secrets are the same', () => {
    expect(() => loadEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET })).toThrow('must be different');
  });
});
