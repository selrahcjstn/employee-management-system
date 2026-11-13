import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { type Response } from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/common/password.js';
import { db } from '../src/prisma/db.js';

export const TEST_PASSWORD = 'Test-password-1';

export async function createApp(rateLimit = 1000): Promise<INestApplication> {
  process.env['AUTH_RATE_LIMIT'] = String(rateLimit);
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export async function createTestUser(overrides: { isActive?: boolean } = {}) {
  return db.orm.public.User.create({
    email: `e2e-${randomUUID()}@test.local`,
    passwordHash: await hashPassword(TEST_PASSWORD),
    fullName: 'E2E User',
    role: 'admin',
    isActive: overrides.isActive ?? true,
  });
}

export async function deleteTestUser(id: string) {
  await db.orm.public.RefreshToken.where({ userId: id }).deleteAll();
  await db.orm.public.User.where({ id }).deleteAll();
}

/** The `refresh_token=...` pair from a response, ready to send back as a Cookie header. */
export function refreshCookie(res: Response): string {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = cookies?.find((value) => value.startsWith('refresh_token='));
  if (!cookie) throw new Error('No refresh_token cookie in response');
  return cookie.split(';')[0]!;
}

/** Logs in through the API and returns the Authorization header for supertest. */
export async function authHeader(app: INestApplication, email: string): Promise<{ Authorization: string }> {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password: TEST_PASSWORD });
  return { Authorization: `Bearer ${res.body.accessToken as string}` };
}

/** Deletes employees created by a test, after the rows that point at them. */
export async function deleteTestEmployees(ids: string[]) {
  for (const id of ids) {
    await db.orm.public.Employee.where({ id }).deleteAll();
  }
}
