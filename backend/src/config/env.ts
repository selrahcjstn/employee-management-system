import 'dotenv/config';

const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_ORIGIN',
] as const;

export interface Env {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
  frontendOrigin: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing = REQUIRED.filter((key) => !source[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const accessSecret = source['JWT_ACCESS_SECRET']!;
  const refreshSecret = source['JWT_REFRESH_SECRET']!;
  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('JWT secrets must be at least 32 characters long');
  }
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
  }
  return {
    nodeEnv: source['NODE_ENV'] ?? 'development',
    port: Number(source['PORT'] ?? 3000),
    databaseUrl: source['DATABASE_URL']!,
    jwtAccessSecret: accessSecret,
    jwtRefreshSecret: refreshSecret,
    jwtAccessTtl: source['JWT_ACCESS_TTL'] ?? '15m',
    jwtRefreshTtl: source['JWT_REFRESH_TTL'] ?? '7d',
    frontendOrigin: source['FRONTEND_ORIGIN']!,
  };
}

export const env = loadEnv();
