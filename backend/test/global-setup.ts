import { execSync } from 'node:child_process';
import pg from 'pg';
import { databaseName, testDatabaseUrl } from './test-database.js';

/** Creates the test database if it is missing and applies every migration to it. */
export default async function setup() {
  const url = testDatabaseUrl();
  const name = databaseName(url);
  if (
    process.env['DATABASE_URL'] &&
    name === databaseName(process.env['DATABASE_URL'])
  ) {
    throw new Error(
      `Refusing to run e2e tests against the development database "${name}"`,
    );
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(
      `Test database name "${name}" may only contain letters, digits and underscores`,
    );
  }

  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const existing = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (existing.rowCount === 0)
      await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }

  // One command string (not an args array) because Windows needs a shell to run npx.
  execSync(`npx prisma db migrate --db "${url}"`, { stdio: 'pipe' });
}
