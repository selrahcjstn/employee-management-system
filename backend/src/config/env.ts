import 'dotenv/config';

const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_ORIGIN',
] as const;

/** A token lifetime such as `15m` or `7d`. */
export type Ttl = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w'}`;

const TTL_PATTERN = /^[1-9]\d*(ms|s|m|h|d|w)$/;
const PROXY_KEYWORDS = ['loopback', 'linklocal', 'uniquelocal'];

export interface Env {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: Ttl;
  jwtRefreshTtl: Ttl;
  frontendOrigin: string;
  /** Express `trust proxy` setting: a hop count or a keyword. Unset when not behind a proxy. */
  trustProxy: number | string | undefined;
  swaggerEnabled: boolean;
}

function readTtl(source: NodeJS.ProcessEnv, key: string, fallback: Ttl): Ttl {
  const value = source[key] ?? fallback;
  if (!TTL_PATTERN.test(value)) {
    throw new Error(`${key} must look like 15m, 12h or 7d (got "${value}")`);
  }
  return value as Ttl;
}

function readPort(source: NodeJS.ProcessEnv): number {
  const port = Number(source['PORT'] ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `PORT must be an integer from 1 to 65535 (got "${source['PORT']}")`,
    );
  }
  return port;
}

function readTrustProxy(
  source: NodeJS.ProcessEnv,
): number | string | undefined {
  const value = source['TRUST_PROXY']?.trim();
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  if (PROXY_KEYWORDS.includes(value)) return value;
  throw new Error(
    `TRUST_PROXY must be a hop count or one of ${PROXY_KEYWORDS.join(', ')} (got "${value}")`,
  );
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing = REQUIRED.filter((key) => !source[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
  const accessSecret = source['JWT_ACCESS_SECRET']!;
  const refreshSecret = source['JWT_REFRESH_SECRET']!;
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('JWT secrets must be at least 32 characters long');
  }
  if (accessSecret === refreshSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  }
  const nodeEnv = source['NODE_ENV'] ?? 'development';
  return {
    nodeEnv,
    port: readPort(source),
    databaseUrl: source['DATABASE_URL']!,
    jwtAccessSecret: accessSecret,
    jwtRefreshSecret: refreshSecret,
    jwtAccessTtl: readTtl(source, 'JWT_ACCESS_TTL', '15m'),
    jwtRefreshTtl: readTtl(source, 'JWT_REFRESH_TTL', '7d'),
    frontendOrigin: source['FRONTEND_ORIGIN']!,
    trustProxy: readTrustProxy(source),
    // The API docs are on in development and off in production unless SWAGGER_ENABLED says otherwise.
    swaggerEnabled: source['SWAGGER_ENABLED']
      ? source['SWAGGER_ENABLED'] === 'true'
      : nodeEnv !== 'production',
  };
}

export const env = loadEnv();
