import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test/test-database.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Workers and the app under test read DATABASE_URL, so point it at the test database.
    env: { DATABASE_URL: testDatabaseUrl() },
  },
});
