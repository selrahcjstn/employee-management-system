import 'dotenv/config';

/**
 * The e2e suite never runs against the development database. It uses TEST_DATABASE_URL, or the
 * development URL with `_test` appended to the database name.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env['TEST_DATABASE_URL'];
  if (explicit) return explicit;
  const development = process.env['DATABASE_URL'];
  if (!development)
    throw new Error('DATABASE_URL must be set to derive the test database URL');
  const url = new URL(development);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

export function databaseName(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}
