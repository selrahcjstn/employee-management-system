import { loadEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  FRONTEND_ORIGIN: 'http://localhost:5173',
};

describe('loadEnv', () => {
  it('returns typed settings with defaults', () => {
    expect(loadEnv(valid)).toMatchObject({
      port: 3000,
      jwtAccessTtl: '15m',
      jwtRefreshTtl: '7d',
    });
  });

  it.each(Object.keys(valid))('fails when %s is missing', (key) => {
    const { [key]: _removed, ...rest } = valid as Record<string, string>;
    expect(() => loadEnv(rest)).toThrow(key);
  });

  it('fails when a secret is too short', () => {
    expect(() => loadEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(
      'at least 32',
    );
  });

  it('fails when both secrets are the same', () => {
    expect(() =>
      loadEnv({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET }),
    ).toThrow('must be different');
  });

  it.each(['15 minutes', '15mn', '0m', '-5m', 'm', '1.5h', '900', ''])(
    'fails at startup for the invalid token lifetime "%s"',
    (ttl) => {
      expect(() => loadEnv({ ...valid, JWT_ACCESS_TTL: ttl })).toThrow(
        'JWT_ACCESS_TTL',
      );
      expect(() => loadEnv({ ...valid, JWT_REFRESH_TTL: ttl })).toThrow(
        'JWT_REFRESH_TTL',
      );
    },
  );

  it.each(['30s', '15m', '12h', '7d', '2w', '500ms'])(
    'accepts the token lifetime %s',
    (ttl) => {
      expect(loadEnv({ ...valid, JWT_ACCESS_TTL: ttl }).jwtAccessTtl).toBe(ttl);
    },
  );

  it.each(['abc', '0', '70000', '-1', '3000.5'])(
    'fails for the invalid PORT "%s"',
    (port) => {
      expect(() => loadEnv({ ...valid, PORT: port })).toThrow('PORT');
    },
  );

  it('reads a valid PORT', () => {
    expect(loadEnv({ ...valid, PORT: '8080' }).port).toBe(8080);
  });

  it('leaves trust proxy unset by default, and reads a hop count or a keyword', () => {
    expect(loadEnv(valid).trustProxy).toBeUndefined();
    expect(loadEnv({ ...valid, TRUST_PROXY: '1' }).trustProxy).toBe(1);
    expect(loadEnv({ ...valid, TRUST_PROXY: 'loopback' }).trustProxy).toBe(
      'loopback',
    );
  });

  it('rejects an unknown TRUST_PROXY value rather than trusting every proxy by accident', () => {
    expect(() => loadEnv({ ...valid, TRUST_PROXY: 'true' })).toThrow(
      'TRUST_PROXY',
    );
  });

  it('turns Swagger on outside production, off in production, and lets SWAGGER_ENABLED override', () => {
    expect(loadEnv(valid).swaggerEnabled).toBe(true);
    expect(loadEnv({ ...valid, NODE_ENV: 'production' }).swaggerEnabled).toBe(
      false,
    );
    expect(
      loadEnv({ ...valid, NODE_ENV: 'production', SWAGGER_ENABLED: 'true' })
        .swaggerEnabled,
    ).toBe(true);
    expect(loadEnv({ ...valid, SWAGGER_ENABLED: 'false' }).swaggerEnabled).toBe(
      false,
    );
  });
});
