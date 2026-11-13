import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { isUniqueViolation, sqlState } from '../src/common/db-errors.js';
import { SalaryService } from '../src/modules/salary/salary.service.js';
import { db } from '../src/prisma/db.js';
import {
  authHeader,
  createApp,
  createTestUser,
  deleteTestEmployees,
  deleteTestUser,
  randomDigits,
} from './helpers.js';

describe('Salary (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let auth: { Authorization: string };
  const employeeIds: string[] = [];
  const digits = randomDigits();
  let counter = 0;
  const server = () => app.getHttpServer();
  const salaryUrl = (id: string) => `/api/employees/${id}/salary`;
  const put = (id: string, body: unknown) =>
    request(server())
      .put(salaryUrl(id))
      .set(auth)
      .send(body as object);
  const rowsOf = (employeeId: string) =>
    db.orm.public.SalaryAssignment.where({ employeeId }).all();

  const newEmployee = async (): Promise<string> => {
    const res = await request(server())
      .post('/api/employees')
      .set(auth)
      .send({
        employeeNo: `EMP-${digits}${++counter}`,
        firstName: 'Sal',
        lastName: 'Ary',
        dateHired: '2024-01-01',
      })
      .expect(201);
    employeeIds.push(res.body.id);
    return res.body.id;
  };

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser();
    auth = await authHeader(app, user.email);
  });

  afterAll(async () => {
    await deleteTestEmployees(employeeIds);
    await deleteTestUser(user.id);
    await app.close();
  });

  it('requires a token', async () => {
    const id = randomUUID();
    await request(server()).get(salaryUrl(id)).expect(401);
    await request(server())
      .put(salaryUrl(id))
      .send({ monthlyBasicSalary: '1' })
      .expect(401);
    await request(server())
      .get(`${salaryUrl(id)}/history`)
      .expect(401);
  });

  it('returns 404 when no salary is assigned, for an unknown employee, and 400 for a malformed id', async () => {
    const id = await newEmployee();
    const none = await request(server())
      .get(salaryUrl(id))
      .set(auth)
      .expect(404);
    expect(none.body.message).toBe('No basic salary assigned');
    await request(server()).get(salaryUrl(randomUUID())).set(auth).expect(404);
    await put(randomUUID(), { monthlyBasicSalary: '1000.00' }).expect(404);
    await request(server())
      .get('/api/employees/not-a-uuid/salary')
      .set(auth)
      .expect(400);
  });

  it('assigns a first salary and returns it as a decimal string', async () => {
    const id = await newEmployee();
    const res = await put(id, { monthlyBasicSalary: '30000' }).expect(200);
    expect(res.body.changed).toBe(true);
    expect(res.body.salary).toMatchObject({
      employeeId: id,
      monthlyBasicSalary: '30000.00',
    });
    const current = await request(server())
      .get(salaryUrl(id))
      .set(auth)
      .expect(200);
    expect(current.body.monthlyBasicSalary).toBe('30000.00');
  });

  it.each([
    ['negative', '-1'],
    ['zero', '0'],
    ['zero with decimals', '0.00'],
    ['empty', ''],
    ['non-numeric', 'abc'],
    ['3 decimals', '1000.123'],
    ['exponent', '1e5'],
    ['over the maximum', '100000000'],
    ['a JSON number', 30000],
    ['null', null],
  ])('rejects %s amounts with 400', async (_label, value) => {
    const id = await newEmployee();
    const res = await put(id, { monthlyBasicSalary: value }).expect(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(await rowsOf(id)).toHaveLength(0);
  });

  it('rejects a missing amount and unknown fields', async () => {
    const id = await newEmployee();
    await put(id, {}).expect(400);
    await put(id, { monthlyBasicSalary: '1000', extra: 1 }).expect(400);
  });

  it('accepts the boundary amounts 0.01 and 99999999.99', async () => {
    const id = await newEmployee();
    await put(id, { monthlyBasicSalary: '0.01' }).expect(200);
    const max = await put(id, { monthlyBasicSalary: '99999999.99' }).expect(
      200,
    );
    expect(max.body.salary.monthlyBasicSalary).toBe('99999999.99');
  });

  it('an adjustment soft deletes the old row and inserts a new active one; nothing is lost', async () => {
    const id = await newEmployee();
    await put(id, { monthlyBasicSalary: '30000.00' }).expect(200);
    const adjusted = await put(id, { monthlyBasicSalary: '35000.50' }).expect(
      200,
    );
    expect(adjusted.body).toMatchObject({
      changed: true,
      salary: { monthlyBasicSalary: '35000.50' },
    });

    const rows = await rowsOf(id);
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.deletedAt === null)).toHaveLength(1);
    const old = rows.find((row) => row.deletedAt !== null)!;
    expect(old.monthlyBasicSalary).toBe('30000.00');

    const current = await request(server())
      .get(salaryUrl(id))
      .set(auth)
      .expect(200);
    expect(current.body.monthlyBasicSalary).toBe('35000.50');
  });

  it('history lists previous salaries newest first and excludes the active one', async () => {
    const id = await newEmployee();
    await put(id, { monthlyBasicSalary: '10000' }).expect(200);
    await put(id, { monthlyBasicSalary: '20000' }).expect(200);
    await put(id, { monthlyBasicSalary: '30000' }).expect(200);
    const res = await request(server())
      .get(`${salaryUrl(id)}/history`)
      .set(auth)
      .expect(200);
    expect(
      res.body.map((h: { monthlyBasicSalary: string }) => h.monthlyBasicSalary),
    ).toEqual(['20000.00', '10000.00']);
    expect(res.body[0].replacedAt).toEqual(expect.any(String));
    await request(server())
      .get(`/api/employees/${randomUUID()}/salary/history`)
      .set(auth)
      .expect(404);
  });

  it('adjusting to the same amount is a no-change and writes no extra row', async () => {
    const id = await newEmployee();
    await put(id, { monthlyBasicSalary: '30000.00' }).expect(200);
    const same = await put(id, { monthlyBasicSalary: '30000' }).expect(200);
    expect(same.body.changed).toBe(false);
    expect(same.body.salary.monthlyBasicSalary).toBe('30000.00');
    expect(await rowsOf(id)).toHaveLength(1);
  });

  it('a failed insert rolls back the soft delete: the old salary stays active', async () => {
    const id = await newEmployee();
    await put(id, { monthlyBasicSalary: '30000.00' }).expect(200);
    // Bypasses the DTO: the amount overflows numeric(12,2), so the INSERT fails after the soft delete ran.
    await expect(
      app.get(SalaryService).assign(id, '1000000000000.00'),
    ).rejects.toThrow();

    const rows = await rowsOf(id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.deletedAt).toBeNull();
    expect(rows[0]!.monthlyBasicSalary).toBe('30000.00');
  });

  it('the database allows only one active salary per employee, but any number of soft deleted ones', async () => {
    const id = await newEmployee();
    await put(id, { monthlyBasicSalary: '30000' }).expect(200);
    const error = await db.orm.public.SalaryAssignment.create({
      employeeId: id,
      monthlyBasicSalary: '40000',
    }).then(
      () => undefined,
      (caught: unknown) => caught,
    );
    expect(isUniqueViolation(error)).toBe(true);

    const deletedAt = new Date();
    await db.orm.public.SalaryAssignment.create({
      employeeId: id,
      monthlyBasicSalary: '1.00',
      deletedAt,
    });
    await db.orm.public.SalaryAssignment.create({
      employeeId: id,
      monthlyBasicSalary: '2.00',
      deletedAt,
    });
    expect(await rowsOf(id)).toHaveLength(3);
  });

  it('the database rejects zero and negative salaries (CHECK > 0)', async () => {
    const id = await newEmployee();
    for (const amount of ['0', '-5.00']) {
      const error = await db.orm.public.SalaryAssignment.create({
        employeeId: id,
        monthlyBasicSalary: amount,
      }).then(
        () => undefined,
        (caught: unknown) => caught,
      );
      expect(sqlState(error)).toBe('23514');
    }
  });

  it('the employee list shows the active salary, or null when not assigned', async () => {
    const withSalary = await newEmployee();
    const without = await newEmployee();
    await put(withSalary, { monthlyBasicSalary: '12000' }).expect(200);
    await put(withSalary, { monthlyBasicSalary: '15000.25' }).expect(200);

    const res = await request(server())
      .get('/api/employees')
      .query({ search: `EMP-${digits}` })
      .set(auth)
      .expect(200);
    const byId = new Map<string, string | null>(
      res.body.map((e: { id: string; currentBasicSalary: string | null }) => [
        e.id,
        e.currentBasicSalary,
      ]),
    );
    expect(byId.get(withSalary)).toBe('15000.25');
    expect(byId.get(without)).toBeNull();
  });
});
