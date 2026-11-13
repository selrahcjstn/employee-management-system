import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { isUniqueViolation } from '../src/common/db-errors.js';
import { db } from '../src/prisma/db.js';
import {
  authHeader,
  createApp,
  createTestUser,
  deleteTestEmployees,
  deleteTestUser,
  randomDigits,
} from './helpers.js';

describe('Employees (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let auth: { Authorization: string };
  const created: string[] = [];
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const digits = randomDigits();
  let counter = 0;
  const server = () => app.getHttpServer();
  const body = (overrides: Record<string, unknown> = {}) => ({
    employeeNo: `EMP-${digits}${++counter}`,
    firstName: 'Juan',
    lastName: `Cruz${tag}`,
    dateHired: '2024-02-29',
    ...overrides,
  });
  const create = async (overrides: Record<string, unknown> = {}) => {
    const res = await request(server())
      .post('/api/employees')
      .set(auth)
      .send(body(overrides));
    if (res.status === 201) created.push(res.body.id);
    return res;
  };

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser();
    auth = await authHeader(app, user.email);
  });

  afterAll(async () => {
    await deleteTestEmployees(created);
    await deleteTestUser(user.id);
    await app.close();
  });

  it('requires a token on every route', async () => {
    await request(server()).get('/api/employees').expect(401);
    await request(server()).post('/api/employees').send(body()).expect(401);
    await request(server()).get(`/api/employees/${randomUUID()}`).expect(401);
    await request(server())
      .patch(`/api/employees/${randomUUID()}`)
      .send({})
      .expect(401);
  });

  it('creates an employee, trimming text and storing an empty middle name as null', async () => {
    const res = await create({
      employeeNo: `  emp-${digits}90  `,
      firstName: '  Juan ',
      middleName: '   ',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      employeeNo: `EMP-${digits}90`,
      firstName: 'Juan',
      middleName: null,
      dateHired: '2024-02-29',
    });
    expect(res.body.id).toEqual(expect.any(String));
  });

  it('rejects a duplicate Employee ID with 409, ignoring case and surrounding spaces', async () => {
    const employeeNo = `EMP-${digits}91`;
    expect((await create({ employeeNo })).status).toBe(201);
    const same = await create({ employeeNo });
    expect(same.status).toBe(409);
    expect(same.body).toMatchObject({
      statusCode: 409,
      message: 'Employee ID already exists',
    });
    expect(
      (await create({ employeeNo: `  ${employeeNo.toLowerCase()} ` })).status,
    ).toBe(409);
  });

  it('the database itself rejects a duplicate Employee ID that differs only by case', async () => {
    const employeeNo = `EMP-${digits}92`;
    expect((await create({ employeeNo })).status).toBe(201);
    const error = await db.orm.public.Employee.create({
      employeeNo: employeeNo.toLowerCase(),
      firstName: 'X',
      lastName: 'Y',
      dateHired: '2024-01-01',
    }).then(
      () => undefined,
      (caught: unknown) => caught,
    );
    expect(isUniqueViolation(error)).toBe(true);
  });

  it('rejects missing or invalid fields with 400 and the standard error shape', async () => {
    const { employeeNo: _omitted, ...noNumber } = body();
    const cases: Record<string, unknown>[] = [
      noNumber,
      body({ firstName: '' }),
      body({ firstName: '   ' }),
      body({ lastName: undefined }),
      body({ dateHired: undefined }),
      body({ dateHired: '2999-01-01' }),
      body({ dateHired: '2026-02-30' }),
      body({ dateHired: '15/01/2026' }),
      body({ employeeNo: 'x'.repeat(51) }),
      body({ firstName: 'x'.repeat(101) }),
      body({ unknownField: true }),
    ];
    for (const payload of cases) {
      const res = await request(server())
        .post('/api/employees')
        .set(auth)
        .send(payload)
        .expect(400);
      expect(res.body).toMatchObject({ statusCode: 400 });
      expect(res.body.errors.length).toBeGreaterThan(0);
    }
  });

  it('accepts today as the hire date', async () => {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Manila',
    });
    expect((await create({ dateHired: today })).status).toBe(201);
  });

  it('gets one employee, 404 for an unknown id and 400 for a malformed id', async () => {
    const made = await create();
    const res = await request(server())
      .get(`/api/employees/${made.body.id}`)
      .set(auth)
      .expect(200);
    expect(res.body.employeeNo).toBe(made.body.employeeNo);
    await request(server())
      .get(`/api/employees/${randomUUID()}`)
      .set(auth)
      .expect(404);
    await request(server())
      .get('/api/employees/not-a-uuid')
      .set(auth)
      .expect(400);
  });

  it('updates names and hire date, and the Employee ID never changes', async () => {
    const made = await create();
    const url = `/api/employees/${made.body.id}`;
    const res = await request(server())
      .patch(url)
      .set(auth)
      .send({
        firstName: 'Maria',
        middleName: 'Santos',
        dateHired: '2023-05-01',
      })
      .expect(200);
    expect(res.body).toMatchObject({
      employeeNo: made.body.employeeNo,
      firstName: 'Maria',
      middleName: 'Santos',
      dateHired: '2023-05-01',
    });

    await request(server())
      .patch(url)
      .set(auth)
      .send({ employeeNo: 'CHANGED' })
      .expect(400);
    const after = await request(server()).get(url).set(auth).expect(200);
    expect(after.body.employeeNo).toBe(made.body.employeeNo);

    const cleared = await request(server())
      .patch(url)
      .set(auth)
      .send({ middleName: '' })
      .expect(200);
    expect(cleared.body.middleName).toBeNull();
  });

  it('PATCH rejects an empty body, invalid values and unknown employees', async () => {
    const made = await create();
    const url = `/api/employees/${made.body.id}`;
    await request(server()).patch(url).set(auth).send({}).expect(400);
    await request(server())
      .patch(url)
      .set(auth)
      .send({ firstName: '' })
      .expect(400);
    await request(server())
      .patch(url)
      .set(auth)
      .send({ dateHired: '2999-01-01' })
      .expect(400);
    await request(server())
      .patch(`/api/employees/${randomUUID()}`)
      .set(auth)
      .send({ firstName: 'A' })
      .expect(404);
  });

  it('lists and searches by Employee ID or name, case-insensitively', async () => {
    const a = await create({
      firstName: `Zebulon${tag}`,
      middleName: `Quill${tag}`,
    });
    await create({ firstName: 'Other' });
    const ids = (res: request.Response) =>
      res.body.map((e: { id: string }) => e.id);

    const byName = await request(server())
      .get('/api/employees')
      .query({ search: `zebulon${tag}` })
      .set(auth)
      .expect(200);
    expect(ids(byName)).toEqual([a.body.id]);

    const byMiddle = await request(server())
      .get('/api/employees')
      .query({ search: `QUILL${tag}` })
      .set(auth)
      .expect(200);
    expect(ids(byMiddle)).toEqual([a.body.id]);

    const byNo = await request(server())
      .get('/api/employees')
      .query({ search: a.body.employeeNo.toLowerCase() })
      .set(auth)
      .expect(200);
    expect(ids(byNo)).toEqual([a.body.id]);

    const all = await request(server())
      .get('/api/employees')
      .set(auth)
      .expect(200);
    expect(all.body.length).toBeGreaterThanOrEqual(2);
  });

  it('treats % in the search term literally', async () => {
    await create();
    const percent = await request(server())
      .get('/api/employees')
      .query({ search: '%' })
      .set(auth)
      .expect(200);
    expect(percent.body).toEqual([]);
  });

  describe('Employee ID rules: typed by a person, so only the characters and the length are checked', () => {
    it.each([
      'EMP-001',
      'EMP001',
      'emp-low',
      'A1B',
      'X-9',
      'ABC123',
      'E-1-2-3',
    ])('accepts %s', async (value) => {
      const employeeNo = `${value}${digits}`.slice(0, 50);
      const res = await create({ employeeNo });
      expect(res.status).toBe(201);
      expect(res.body.employeeNo).toBe(employeeNo.toUpperCase());
    });

    it.each([
      ['a space inside', 'EMP 0'],
      ['an underscore', 'EMP_0'],
      ['a dot', 'EMP.0'],
      ['a slash', 'EMP/0'],
      ['an accented letter', 'EMPÉ0'],
      ['a symbol', 'EMP#0'],
      ['an emoji', 'EMP😀0'],
    ])(
      'rejects %s with 400 and says which characters are allowed',
      async (_label, value) => {
        const res = await create({ employeeNo: `${value}${digits}` });
        expect(res.status).toBe(400);
        expect(res.body.errors).toContain(
          'Employee ID can only use letters, numbers and hyphens',
        );
      },
    );

    it('rejects an ID shorter than 3 characters, after trimming', async () => {
      for (const employeeNo of ['A', 'AB', '  AB  ']) {
        const res = await create({ employeeNo });
        expect(res.status).toBe(400);
        expect(res.body.errors).toContain(
          'Employee ID must be at least 3 characters',
        );
      }
    });

    it('accepts exactly 3 and exactly 50 characters, and rejects 51', async () => {
      const three = `Z${digits.slice(0, 2)}`;
      expect((await create({ employeeNo: three })).status).toBe(201);
      const fifty = `${'F'.repeat(50 - digits.length)}${digits}`;
      expect((await create({ employeeNo: fifty })).status).toBe(201);
      expect((await create({ employeeNo: `${fifty}9` })).status).toBe(400);
    });

    it('saves it in upper case and trimmed', async () => {
      const res = await create({ employeeNo: `  emp-${digits}77  ` });
      expect(res.status).toBe(201);
      expect(res.body.employeeNo).toBe(`EMP-${digits}77`);
    });

    it('does not reject or change a row that is already in the database, such as EMP001 typed in lower case', async () => {
      const made = await create({ employeeNo: `emp${digits}` });
      expect(made.status).toBe(201);
      const list = await request(server())
        .get('/api/employees')
        .set(auth)
        .expect(200);
      expect(
        list.body.map((e: { employeeNo: string }) => e.employeeNo),
      ).toContain(`EMP${digits}`);
    });
  });

  describe('GET /employees/exists', () => {
    const exists = (employeeNo: string) =>
      request(server())
        .get('/api/employees/exists')
        .query({ employeeNo })
        .set(auth);

    it('requires a token', async () => {
      await request(server())
        .get('/api/employees/exists')
        .query({ employeeNo: 'EMP-001' })
        .expect(401);
    });

    it('is false for an ID nobody has', async () => {
      const res = await exists(`NOBODY-${digits}`).expect(200);
      expect(res.body).toEqual({ exists: false });
    });

    it('is true for an ID somebody has, ignoring case and surrounding spaces', async () => {
      const employeeNo = `CHK-${digits}`;
      expect((await create({ employeeNo })).status).toBe(201);
      for (const typed of [
        employeeNo,
        employeeNo.toLowerCase(),
        `  ${employeeNo.toLowerCase()} `,
      ]) {
        const res = await exists(typed).expect(200);
        expect(res.body).toEqual({ exists: true });
      }
    });

    it('is not fooled by wildcards: % and _ are literal', async () => {
      const employeeNo = `WLD-${digits}`;
      expect((await create({ employeeNo })).status).toBe(201);
      expect((await exists('%')).body).toEqual({ exists: false });
      expect((await exists('WLD-_______')).body).toEqual({ exists: false });
    });

    it('needs the employeeNo, and is not mistaken for an employee id', async () => {
      await request(server())
        .get('/api/employees/exists')
        .set(auth)
        .expect(400);
      await exists('x'.repeat(51)).expect(400);
    });

    it('agrees with create: an ID it reports taken is a 409 on create', async () => {
      const employeeNo = `AGR-${digits}`;
      expect((await create({ employeeNo })).status).toBe(201);
      expect((await exists(employeeNo)).body.exists).toBe(true);
      const again = await create({ employeeNo: employeeNo.toLowerCase() });
      expect(again.status).toBe(409);
      expect(again.body.message).toBe('Employee ID already exists');
    });
  });
});
