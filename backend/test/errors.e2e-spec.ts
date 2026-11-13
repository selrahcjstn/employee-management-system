import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { db } from '../src/prisma/db.js';
import {
  authHeader,
  createApp,
  createTestUser,
  deleteTestEmployees,
  deleteTestUser,
} from './helpers.js';

describe('Global error handling (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let auth: { Authorization: string };
  const employeeIds: string[] = [];
  const componentIds: string[] = [];
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const server = () => app.getHttpServer();
  const post = (url: string, body: unknown) =>
    request(server())
      .post(url)
      .set(auth)
      .send(body as object);

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser();
    auth = await authHeader(app, user.email);
  });

  afterAll(async () => {
    await deleteTestEmployees(employeeIds);
    for (const id of componentIds) {
      await db.orm.public.EmployeeSalaryComponent.where({
        salaryComponentId: id,
      }).deleteAll();
      await db.orm.public.SalaryComponent.where({ id }).deleteAll();
    }
    await deleteTestUser(user.id);
    await app.close();
  });

  const expectErrorShape = (body: Record<string, unknown>, status: number) => {
    expect(body).toEqual({
      statusCode: status,
      message: expect.any(String),
      errors: expect.any(Array),
    });
  };

  describe('NUL characters (PostgreSQL text cannot store them)', () => {
    it.each([
      ['employee number', '/api/employees', { employeeNo: 'x\u0000y' }],
      ['employee first name', '/api/employees', { firstName: 'A\u0000' }],
      ['component name', '/api/salary-components', { name: 'a\u0000b' }],
    ])('rejects one in the %s with 400, never 500', async (_l, url, patch) => {
      const body =
        url === '/api/employees'
          ? {
              employeeNo: `E2E-${tag}-NUL`,
              firstName: 'A',
              lastName: 'B',
              dateHired: '2024-01-01',
              ...patch,
            }
          : patch;
      const res = await post(url, body).expect(400);
      expectErrorShape(res.body, 400);
      expect(res.body.errors[0]).toContain('null characters');
    });

    it('rejects one in a query string with 400', async () => {
      const res = await request(server())
        .get('/api/employees?search=%00')
        .set(auth)
        .expect(400);
      expectErrorShape(res.body, 400);
      expect(res.body.errors[0]).toBe(
        'query.search must not contain null characters',
      );
    });

    it('rejects one on the public login route too, before any lookup', async () => {
      const res = await request(server())
        .post('/api/auth/login')
        .send({ email: 'a@b.co', password: 'pass\u0000word' })
        .expect(400);
      expectErrorShape(res.body, 400);
    });

    it('rejects one in a nested value', async () => {
      await post('/api/salary-components', { name: 'ok', extra: ['\u0000'] })
        .expect(400)
        .then((res) => expectErrorShape(res.body, 400));
    });
  });

  describe('malformed requests', () => {
    it('answers 400 with the standard shape for malformed JSON', async () => {
      const res = await request(server())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{bad')
        .expect(400);
      expectErrorShape(res.body, 400);
    });

    it('answers 413 with the standard shape for an oversized body', async () => {
      const res = await post('/api/salary-components', {
        name: 'a'.repeat(300_000),
      }).expect(413);
      expectErrorShape(res.body, 413);
    });

    it('answers 404 with the standard shape for an unknown route', async () => {
      const res = await request(server())
        .get('/api/does-not-exist')
        .set(auth)
        .expect(404);
      expectErrorShape(res.body, 404);
    });

    it('answers 400 for a body that is not an object', async () => {
      const res = await request(server())
        .post('/api/employees')
        .set(auth)
        .set('Content-Type', 'application/json')
        .send('"just a string"');
      expect(res.status).toBe(400);
      expectErrorShape(res.body, 400);
    });

    it('answers 401 with the standard shape without leaking why', async () => {
      const res = await request(server())
        .get('/api/employees')
        .set('Authorization', 'Bearer not.a.token')
        .expect(401);
      expectErrorShape(res.body, 401);
    });
  });

  describe('hostile text never produces a 5xx', () => {
    const nasty = [
      '',
      ' ',
      '\u0000',
      'a\u0000b',
      "'; DROP TABLE users; --",
      '" OR 1=1 --',
      '%',
      '_',
      '\\',
      '\\u0000',
      '😀 émoji ñ 漢字',
      '\ud800',
      '‮ rtl',
      '\n\r\t',
      '${process.env.DATABASE_URL}',
      '<script>alert(1)</script>',
      '../../etc/passwd',
      'x'.repeat(5000),
    ];
    const notServerError = (status: number) => expect(status).toBeLessThan(500);

    it('on every string field of the write endpoints', async () => {
      const employee = await post('/api/employees', {
        employeeNo: `E2E-${tag}-FUZZ`,
        firstName: 'Fuzz',
        lastName: 'Target',
        dateHired: '2024-01-01',
      }).expect(201);
      employeeIds.push(employee.body.id);

      for (const [index, value] of nasty.entries()) {
        const attempts = [
          post('/api/employees', {
            employeeNo: value,
            firstName: value,
            middleName: value,
            lastName: value,
            dateHired: value,
          }),
          request(server())
            .patch(`/api/employees/${employee.body.id}`)
            .set(auth)
            .send({ firstName: value, middleName: value, lastName: value }),
          post('/api/salary-components', { name: value }),
          post(`/api/employees/${employee.body.id}/components`, {
            name: value,
            amount: value,
          }),
          request(server())
            .put(`/api/employees/${employee.body.id}/salary`)
            .set(auth)
            .send({ monthlyBasicSalary: value }),
          request(server())
            .patch('/api/users/me')
            .set(auth)
            .send({
              fullName: value,
              currentPassword: value,
              newPassword: value,
            }),
          request(server())
            .post('/api/auth/login')
            .send({ email: value, password: value }),
          request(server())
            .get('/api/employees')
            .query({ search: value })
            .set(auth),
        ];
        for (const attempt of attempts) {
          const res = await attempt;
          notServerError(res.status);
          if (res.status === 201 && res.body.componentId) {
            componentIds.push(res.body.componentId);
          }
          if (res.status === 201 && res.body.employeeNo) {
            employeeIds.push(res.body.id);
          }
          if (res.status === 201 && res.body.name && !res.body.componentId) {
            componentIds.push(res.body.id);
          }
        }
        expect(index).toBeLessThan(nasty.length);
      }
    }, 120_000);

    it('in path parameters', async () => {
      for (const value of ['%00', 'abc', '..%2F..', '%27%3B--', '😀']) {
        for (const path of [
          `/api/employees/${value}`,
          `/api/employees/${value}/salary`,
          `/api/employees/${value}/components`,
          `/api/employees/${value}/computation`,
        ]) {
          notServerError((await request(server()).get(path).set(auth)).status);
        }
      }
    });
  });
});
