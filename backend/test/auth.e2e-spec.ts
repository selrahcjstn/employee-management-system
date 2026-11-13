import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { env } from '../src/config/env.js';
import { TokenCleanupService } from '../src/modules/auth/token-cleanup.service.js';
import { db } from '../src/prisma/db.js';
import { TEST_PASSWORD, createApp, createTestUser, deleteTestUser, refreshCookie } from './helpers.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  const server = () => app.getHttpServer();

  const login = (email: string = user.email, password: string = TEST_PASSWORD) =>
    request(server()).post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(user.id);
    await app.close();
  });

  it('health reports the database as up without a token', async () => {
    const res = await request(server()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('rejects protected routes without a token', async () => {
    await request(server()).get('/api/users/me').expect(401);
    await request(server()).get('/api/auth/me').expect(401);
    await request(server()).post('/api/auth/logout').expect(401);
  });

  it('login fails with the same generic message for a wrong password and an unknown email', async () => {
    const wrongPassword = await login(user.email, 'wrong-password').expect(401);
    const unknownEmail = await login('nobody@test.local', TEST_PASSWORD).expect(401);
    expect(wrongPassword.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body.message).toBe('Invalid email or password');
  });

  it('login validates the body with the standard error shape', async () => {
    const res = await request(server()).post('/api/auth/login').send({ password: 'x' }).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, message: 'Validation failed' });
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('login returns an access token, the user, and an httpOnly strict refresh cookie', async () => {
    const res = await login().expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ id: user.id, email: user.email });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refresh_token='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);

    const me = await request(server()).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`).expect(200);
    expect(me.body.id).toBe(user.id);
  });

  it('stores only a hash of the refresh token', async () => {
    const res = await login().expect(200);
    const raw = refreshCookie(res).split('=')[1]!;
    const rows = await db.orm.public.RefreshToken.where({ userId: user.id }).all();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.tokenHash).toHaveLength(64);
      expect(row.tokenHash).not.toBe(raw);
    }
  });

  it('refresh rotates the token: new pair issued, old one revoked and linked', async () => {
    const first = await login().expect(200);
    const oldCookie = refreshCookie(first);
    const second = await request(server()).post('/api/auth/refresh').set('Cookie', oldCookie).expect(200);
    expect(second.body.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(second)).not.toBe(oldCookie);

    const rows = await db.orm.public.RefreshToken.where({ userId: user.id }).all();
    const revoked = rows.filter((row) => row.revokedAt && row.replacedById);
    expect(revoked.length).toBeGreaterThan(0);
  });

  it('replaying a rotated refresh token revokes the whole family', async () => {
    const first = await login().expect(200);
    const oldCookie = refreshCookie(first);
    const second = await request(server()).post('/api/auth/refresh').set('Cookie', oldCookie).expect(200);
    const newCookie = refreshCookie(second);

    await request(server()).post('/api/auth/refresh').set('Cookie', oldCookie).expect(401);
    await request(server()).post('/api/auth/refresh').set('Cookie', newCookie).expect(401);
  });

  it('logout revokes the refresh token even if it was copied before', async () => {
    const res = await login().expect(200);
    const cookie = refreshCookie(res);
    await request(server())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .set('Cookie', cookie)
      .expect(204);
    await request(server()).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });

  it('refresh without a cookie, or with a garbage cookie, is 401', async () => {
    await request(server()).post('/api/auth/refresh').expect(401);
    await request(server()).post('/api/auth/refresh').set('Cookie', 'refresh_token=garbage').expect(401);
  });

  it('access and refresh tokens are not interchangeable (different secrets)', async () => {
    const res = await login().expect(200);
    await request(server())
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${res.body.accessToken}`)
      .expect(401);
    await request(server())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshCookie(res).split('=')[1]}`)
      .expect(401);
  });

  it('rejects an expired, a tampered, and a wrong-secret access token', async () => {
    const jwt = new JwtService();
    const expired = await jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret: env.jwtAccessSecret, algorithm: 'HS256', expiresIn: -10 },
    );
    const wrongSecret = await jwt.signAsync(
      { sub: user.id, email: user.email },
      { secret: 'x'.repeat(40), algorithm: 'HS256', expiresIn: 60 },
    );
    const valid = (await login().expect(200)).body.accessToken as string;
    const tampered = `${valid.slice(0, -4)}AAAA`;
    for (const token of [expired, wrongSecret, tampered]) {
      await request(server()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    }
  });

  it('a deactivated user cannot log in, use a token, or refresh', async () => {
    const other = await createTestUser();
    try {
      const res = await login(other.email).expect(200);
      const cookie = refreshCookie(res);
      await db.orm.public.User.where({ id: other.id }).update({ isActive: false });

      await login(other.email).expect(401);
      await request(server()).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`).expect(401);
      await request(server()).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
    } finally {
      await deleteTestUser(other.id);
    }
  });

  it('purges expired refresh tokens and keeps valid ones', async () => {
    const expiredId = randomUUID();
    await db.orm.public.RefreshToken.create({
      id: expiredId,
      userId: user.id,
      familyId: randomUUID(),
      tokenHash: 'e'.repeat(64),
      expiresAt: new Date(Date.now() - 1000),
    });
    const kept = await login().expect(200);
    await app.get(TokenCleanupService).purgeExpired();

    expect(await db.orm.public.RefreshToken.where({ id: expiredId }).first()).toBeNull();
    await request(server()).post('/api/auth/refresh').set('Cookie', refreshCookie(kept)).expect(200);
  });
});
