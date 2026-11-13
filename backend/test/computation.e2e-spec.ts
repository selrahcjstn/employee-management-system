import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  authHeader,
  createApp,
  createTestUser,
  deleteTestComponents,
  deleteTestEmployees,
  deleteTestUser,
  randomDigits,
} from './helpers.js';

describe('Computation (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let auth: { Authorization: string };
  const employeeIds: string[] = [];
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const digits = randomDigits();
  const prefix = `E2E${tag} `;
  let counter = 0;
  const server = () => app.getHttpServer();

  const newEmployee = async (
    overrides: Record<string, unknown> = {},
  ): Promise<string> => {
    const res = await request(server())
      .post('/api/employees')
      .set(auth)
      .send({
        employeeNo: `EMP-${digits}${++counter}`,
        firstName: 'Juan',
        lastName: 'Cruz',
        dateHired: '2024-01-01',
        ...overrides,
      })
      .expect(201);
    employeeIds.push(res.body.id);
    return res.body.id;
  };
  const setSalary = (id: string, amount: string) =>
    request(server())
      .put(`/api/employees/${id}/salary`)
      .set(auth)
      .send({ monthlyBasicSalary: amount })
      .expect(200);
  const addComponent = async (id: string, label: string, amount: string) =>
    (
      await request(server())
        .post(`/api/employees/${id}/components`)
        .set(auth)
        .send({ name: `${prefix}${label}`, amount })
        .expect(201)
    ).body;
  const compute = (id: string) =>
    request(server()).get(`/api/employees/${id}/computation`).set(auth);

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser();
    auth = await authHeader(app, user.email);
  });

  afterAll(async () => {
    await deleteTestEmployees(employeeIds);
    await deleteTestComponents(prefix);
    await deleteTestUser(user.id);
    await app.close();
  });

  it('requires a token, 404s for an unknown employee and 400s for a malformed id', async () => {
    await request(server())
      .get(`/api/employees/${randomUUID()}/computation`)
      .expect(401);
    await compute(randomUUID()).expect(404);
    await compute('not-a-uuid').expect(400);
  });

  it('matches the PRD worked example: 30,000 + 2,000 + 1,500 = 33,500 per month', async () => {
    const id = await newEmployee({ middleName: 'dela', lastName: 'Cruz' });
    await setSalary(id, '30000');
    await addComponent(id, 'Rice Allowance', '2000');
    await addComponent(id, 'Transportation', '1500');

    const res = await compute(id).expect(200);
    expect(res.body).toEqual({
      employee: {
        id,
        employeeNo: expect.stringContaining(`EMP-${digits}`),
        name: 'Juan D. Cruz',
      },
      basicSalary: '30000.00',
      components: [
        { name: `${prefix}Rice Allowance`, amount: '2000.00' },
        { name: `${prefix}Transportation`, amount: '1500.00' },
      ],
      componentsTotal: '3500.00',
      monthlyTotal: '33500.00',
      annualSalary: '402000.00',
      dailyRate: '1280.25',
      hourlyRate: '160.03',
      perMinuteRate: '2.67',
      workingDaysDivisor: 314,
      currency: 'PHP',
    });
  });

  it('returns every amount as a string, and only the divisor as a number', async () => {
    const id = await newEmployee();
    await setSalary(id, '12345.67');
    const { body } = await compute(id).expect(200);
    for (const key of [
      'basicSalary',
      'componentsTotal',
      'monthlyTotal',
      'annualSalary',
      'dailyRate',
      'hourlyRate',
      'perMinuteRate',
    ]) {
      expect(typeof body[key]).toBe('string');
    }
    expect(typeof body.workingDaysDivisor).toBe('number');
  });

  it('computes from basic salary alone when there are no components', async () => {
    const id = await newEmployee({ middleName: undefined });
    await setSalary(id, '33500');
    const { body } = await compute(id).expect(200);
    expect(body).toMatchObject({
      components: [],
      componentsTotal: '0.00',
      monthlyTotal: '33500.00',
      annualSalary: '402000.00',
      dailyRate: '1280.25',
    });
    expect(body.employee.name).toBe('Juan Cruz');
  });

  it('does not round between steps: hourly comes from the unrounded daily rate', async () => {
    const id = await newEmployee();
    await setSalary(id, '1010');
    const { body } = await compute(id).expect(200);
    expect(body.dailyRate).toBe('38.60');
    expect(body.hourlyRate).toBe('4.82');
  });

  it('shows an empty state with no basic salary: null rates, components still listed', async () => {
    const id = await newEmployee();
    await addComponent(id, 'Orphan Allowance', '500');
    const { body } = await compute(id).expect(200);
    expect(body).toMatchObject({
      basicSalary: null,
      monthlyTotal: null,
      annualSalary: null,
      dailyRate: null,
      hourlyRate: null,
      perMinuteRate: null,
      componentsTotal: '500.00',
      workingDaysDivisor: 314,
      currency: 'PHP',
    });
    expect(body.components).toHaveLength(1);
  });

  it('recalculates after a salary adjustment and uses only the active salary row', async () => {
    const id = await newEmployee();
    await setSalary(id, '30000');
    await addComponent(id, 'Stable', '3500');
    expect((await compute(id).expect(200)).body.monthlyTotal).toBe('33500.00');

    await setSalary(id, '40000');
    const after = await compute(id).expect(200);
    expect(after.body).toMatchObject({
      basicSalary: '40000.00',
      monthlyTotal: '43500.00',
      annualSalary: '522000.00',
    });
  });

  it('recalculates after a component amount change', async () => {
    const id = await newEmployee();
    await setSalary(id, '30000');
    const component = await addComponent(id, 'Changing', '1000');
    expect((await compute(id).expect(200)).body.monthlyTotal).toBe('31000.00');

    await request(server())
      .patch(`/api/employees/${id}/components/${component.id}`)
      .set(auth)
      .send({ amount: '2500.50' })
      .expect(200);
    const after = await compute(id).expect(200);
    expect(after.body.componentsTotal).toBe('2500.50');
    expect(after.body.monthlyTotal).toBe('32500.50');
  });

  it('excludes a removed component from the total', async () => {
    const id = await newEmployee();
    await setSalary(id, '30000');
    await addComponent(id, 'Kept', '1000');
    const removed = await addComponent(id, 'Removed', '2000');
    expect((await compute(id).expect(200)).body.monthlyTotal).toBe('33000.00');

    await request(server())
      .delete(`/api/employees/${id}/components/${removed.id}`)
      .set(auth)
      .expect(204);
    const after = await compute(id).expect(200);
    expect(after.body.monthlyTotal).toBe('31000.00');
    expect(after.body.components.map((c: { name: string }) => c.name)).toEqual([
      `${prefix}Kept`,
    ]);
  });

  it('excludes a soft deleted component from every employee that used it', async () => {
    const first = await newEmployee();
    const second = await newEmployee();
    await setSalary(first, '10000');
    await setSalary(second, '20000');
    const a = await addComponent(first, 'Shared Gone', '1000');
    await addComponent(second, 'Shared Gone', '2000');
    await addComponent(second, 'Shared Stays', '300');

    await request(server())
      .delete(`/api/salary-components/${a.componentId}`)
      .set(auth)
      .expect(204);

    expect((await compute(first).expect(200)).body).toMatchObject({
      componentsTotal: '0.00',
      monthlyTotal: '10000.00',
    });
    expect((await compute(second).expect(200)).body).toMatchObject({
      componentsTotal: '300.00',
      monthlyTotal: '20300.00',
    });
  });

  it('a component re-added after removal counts once', async () => {
    const id = await newEmployee();
    await setSalary(id, '30000');
    const first = await addComponent(id, 'Again', '1000');
    await request(server())
      .delete(`/api/employees/${id}/components/${first.id}`)
      .set(auth)
      .expect(204);
    await addComponent(id, 'Again', '1200');
    const { body } = await compute(id).expect(200);
    expect(body.componentsTotal).toBe('1200.00');
    expect(body.monthlyTotal).toBe('31200.00');
  });

  describe('GET /computations', () => {
    const computeAll = () =>
      request(server()).get('/api/computations').set(auth);
    const lineFor = async (id: string) =>
      (
        (await computeAll().expect(200)).body as { employee: { id: string } }[]
      ).find((line) => line.employee.id === id);

    it('requires a token', async () => {
      await request(server()).get('/api/computations').expect(401);
    });

    it('has one line per employee with the PRD worked example, per-minute to 4 decimals', async () => {
      const id = await newEmployee({ middleName: 'Dela' });
      await setSalary(id, '30000');
      await addComponent(id, 'Rice Allowance', '2000');
      await addComponent(id, 'Transportation', '1500');

      expect(await lineFor(id)).toEqual({
        employee: {
          id,
          employeeNo: expect.stringContaining(`EMP-${digits}`),
          name: 'Juan D. Cruz',
        },
        basicSalary: '30000.00',
        componentsTotal: '3500.00',
        monthlyTotal: '33500.00',
        annualSalary: '402000.00',
        dailyRate: '1280.25',
        hourlyRate: '160.03',
        perMinuteRate: '2.6672',
      });
    });

    it('agrees with the single-employee computation, apart from the per-minute decimals', async () => {
      const id = await newEmployee();
      await setSalary(id, '27500.75');
      await addComponent(id, 'Meal', '1234.56');
      const single = (await compute(id).expect(200)).body;
      const line = await lineFor(id);
      expect(line).toMatchObject({
        monthlyTotal: single.monthlyTotal,
        annualSalary: single.annualSalary,
        dailyRate: single.dailyRate,
        hourlyRate: single.hourlyRate,
      });
      expect(Number(line!['perMinuteRate' as never])).toBeCloseTo(
        Number(single.perMinuteRate),
        1,
      );
    });

    it('an employee without a salary has null money and rates, but still lists the components total', async () => {
      const id = await newEmployee();
      await addComponent(id, 'Bonus', '900');
      expect(await lineFor(id)).toMatchObject({
        basicSalary: null,
        componentsTotal: '900.00',
        monthlyTotal: null,
        annualSalary: null,
        dailyRate: null,
        hourlyRate: null,
        perMinuteRate: null,
      });
    });

    it('uses only the active salary and active components', async () => {
      const id = await newEmployee();
      await setSalary(id, '10000');
      await setSalary(id, '20000');
      const gone = await addComponent(id, 'Gone', '5000');
      await request(server())
        .delete(`/api/employees/${id}/components/${gone.id}`)
        .set(auth)
        .expect(204);
      await addComponent(id, 'Here', '100');

      expect(await lineFor(id)).toMatchObject({
        basicSalary: '20000.00',
        componentsTotal: '100.00',
        monthlyTotal: '20100.00',
      });
    });

    it('rounds only at the end: the rates come from the unrounded values', async () => {
      const id = await newEmployee();
      await setSalary(id, '33500');
      const line = await lineFor(id);
      // 33,500 x 12 / 314 / 8 = 160.0318..., not 1280.25 / 8 = 160.03125
      expect(line).toMatchObject({
        dailyRate: '1280.25',
        hourlyRate: '160.03',
      });
    });
  });
});
