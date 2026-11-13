import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp, createTestUser, deleteTestUser } from './helpers.js';

describe('Auth rate limit (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    app = await createApp(3);
    user = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(user.id);
    await app.close();
  });

  it('answers 429 once the login limit for one email is exceeded', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong-password' });
    for (let i = 0; i < 3; i++) await attempt().expect(401);
    await attempt().expect(429);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'another@test.local', password: 'wrong-password' })
      .expect(401);
  });

  it('refresh has its own, higher limit: it is not throttled at the login limit, but still at 30 per minute', async () => {
    const refresh = () =>
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', 'refresh_token=garbage');
    // The login limit is 3 in this app; refresh must keep answering 401 well past that.
    for (let i = 0; i < 30; i++) await refresh().expect(401);
    await refresh().expect(429);
  });
});
