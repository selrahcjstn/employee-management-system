import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { sqlState } from '../src/common/db-errors.js';
import { db } from '../src/prisma/db.js';
import { TEST_PASSWORD, createApp, createTestUser, deleteTestUser, refreshCookie } from './helpers.js';

describe('Users /me (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let token: string;
  const server = () => app.getHttpServer();
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser();
    const res = await request(server()).post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORD });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await deleteTestUser(user.id);
    await app.close();
  });

  it('GET /users/me returns the signed-in user without the password hash', async () => {
    const res = await request(server()).get('/api/users/me').set(auth()).expect(200);
    expect(res.body).toMatchObject({ id: user.id, email: user.email, fullName: 'E2E User', isActive: true });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('there is no open user CRUD: no list, create or delete routes', async () => {
    await request(server()).get('/api/users').set(auth()).expect(404);
    await request(server()).post('/api/users').set(auth()).send({}).expect(404);
    await request(server()).delete(`/api/users/${user.id}`).set(auth()).expect(404);
  });

  it('PATCH /users/me updates the name (trimmed)', async () => {
    const res = await request(server()).patch('/api/users/me').set(auth()).send({ fullName: '  New Name  ' }).expect(200);
    expect(res.body.fullName).toBe('New Name');
  });

  it('PATCH /users/me rejects an empty body, unknown fields and bad values with 400', async () => {
    await request(server()).patch('/api/users/me').set(auth()).send({}).expect(400);
    await request(server()).patch('/api/users/me').set(auth()).send({ role: 'owner' }).expect(400);
    await request(server()).patch('/api/users/me').set(auth()).send({ isActive: false }).expect(400);
    await request(server()).patch('/api/users/me').set(auth()).send({ fullName: '' }).expect(400);
    await request(server()).patch('/api/users/me').set(auth()).send({ newPassword: 'short1' }).expect(400);
    await request(server()).patch('/api/users/me').set(auth()).send({ newPassword: 'long-enough-1' }).expect(400);
  });

  it('PATCH /users/me changes the password only with the correct current password', async () => {
    await request(server())
      .patch('/api/users/me')
      .set(auth())
      .send({ currentPassword: 'wrong-password', newPassword: 'Another-pass-2' })
      .expect(401);

    await request(server())
      .patch('/api/users/me')
      .set(auth())
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'Another-pass-2' })
      .expect(200);

    await request(server()).post('/api/auth/login').send({ email: user.email, password: TEST_PASSWORD }).expect(401);
    await request(server()).post('/api/auth/login').send({ email: user.email, password: 'Another-pass-2' }).expect(200);
  });

  it('changing the password revokes every session; changing only the name does not', async () => {
    const other = await createTestUser();
    try {
      const login = () =>
        request(server()).post('/api/auth/login').send({ email: other.email, password: TEST_PASSWORD });
      const first = await login().expect(200);
      const second = await login().expect(200);
      const bearer = { Authorization: `Bearer ${first.body.accessToken}` };

      await request(server()).patch('/api/users/me').set(bearer).send({ fullName: 'Renamed' }).expect(200);
      const stillValid = await request(server()).post('/api/auth/refresh').set('Cookie', refreshCookie(second)).expect(200);

      await request(server())
        .patch('/api/users/me')
        .set(bearer)
        .send({ currentPassword: TEST_PASSWORD, newPassword: 'Brand-new-pass-3' })
        .expect(200);

      await request(server()).post('/api/auth/refresh').set('Cookie', refreshCookie(first)).expect(401);
      await request(server()).post('/api/auth/refresh').set('Cookie', refreshCookie(stillValid)).expect(401);
      const active = await db.orm.public.RefreshToken.where({ userId: other.id })
        .where((token) => token.revokedAt.isNull())
        .all();
      expect(active).toHaveLength(0);
      await request(server())
        .post('/api/auth/login')
        .send({ email: other.email, password: 'Brand-new-pass-3' })
        .expect(200);
    } finally {
      await deleteTestUser(other.id);
    }
  });

  it('the database stores emails in lowercase only (CHECK), so the case-sensitive lookup is always safe', async () => {
    const error = await db.orm.public.User.create({
      email: `Mixed-${Date.now()}@Test.Local`,
      passwordHash: 'x',
      fullName: 'Mixed Case',
      role: 'admin',
    }).then(
      () => undefined,
      (caught: unknown) => caught,
    );
    expect(sqlState(error)).toBe('23514');
  });

  it('a user can sign in with their email in any letter case', async () => {
    const res = await request(server())
      .post('/api/auth/login')
      .send({ email: user.email.toUpperCase(), password: 'Another-pass-2' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});
