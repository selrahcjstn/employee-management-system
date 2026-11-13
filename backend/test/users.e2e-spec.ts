import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_PASSWORD, createApp, createTestUser, deleteTestUser } from './helpers.js';

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
});
