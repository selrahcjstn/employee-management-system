import { execSync } from 'node:child_process';
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

const SEED_EMAIL = 'seed-admin@test.local';
const SAMPLE_NUMBERS = ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004'];

const runSeed = () =>
  execSync('npx tsx prisma/seed.ts', {
    encoding: 'utf8',
    env: {
      ...process.env,
      SEED_ADMIN_EMAIL: SEED_EMAIL,
      SEED_ADMIN_PASSWORD: 'Seed-password-1',
      SEED_ADMIN_NAME: 'Seed Admin',
    },
  });

describe('Seed script (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let auth: { Authorization: string };

  const sampleEmployees = () =>
    db.orm.public.Employee.where((e) => e.employeeNo.in(SAMPLE_NUMBERS)).all();

  const cleanUp = async () => {
    const employees = await sampleEmployees();
    await deleteTestEmployees(employees.map((e) => e.id));
    await db.orm.public.SalaryComponent.where((c) =>
      c.name.in([
        'Rice Allowance',
        'Transportation',
        'Communication Allowance',
      ]),
    ).deleteAll();
    const admin = await db.orm.public.User.where({ email: SEED_EMAIL }).first();
    if (admin) await deleteTestUser(admin.id);
  };

  beforeAll(async () => {
    await cleanUp();
    app = await createApp();
    user = await createTestUser();
    auth = await authHeader(app, user.email);
  });

  afterAll(async () => {
    await cleanUp();
    await deleteTestUser(user.id);
    await app.close();
  });

  it('creates the admin and four sample employees, and is idempotent', async () => {
    const first = runSeed();
    expect(first).toContain(`Created admin ${SEED_EMAIL}`);
    for (const employeeNo of SAMPLE_NUMBERS) {
      expect(first).toContain(`Created employee ${employeeNo}`);
    }

    const again = runSeed();
    expect(again).not.toContain('Created');
    expect(await sampleEmployees()).toHaveLength(4);
    expect(
      await db.orm.public.User.where({ email: SEED_EMAIL }).all(),
    ).toHaveLength(1);
  }, 60_000);

  it('stores the admin password hashed, never in plain text', async () => {
    const admin = await db.orm.public.User.where({ email: SEED_EMAIL }).first();
    expect(admin?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(admin?.passwordHash).not.toContain('Seed-password-1');
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: SEED_EMAIL, password: 'Seed-password-1' })
      .expect(200);
  });

  it('seeds the PRD worked example: EMP-001 computes to 33,500 per month', async () => {
    const [juan] = await db.orm.public.Employee.where({
      employeeNo: 'EMP-001',
    }).all();
    const res = await request(app.getHttpServer())
      .get(`/api/employees/${juan!.id}/computation`)
      .set(auth)
      .expect(200);
    expect(res.body).toMatchObject({
      basicSalary: '30000.00',
      componentsTotal: '3500.00',
      monthlyTotal: '33500.00',
      annualSalary: '402000.00',
      dailyRate: '1280.25',
      hourlyRate: '160.03',
      perMinuteRate: '2.67',
    });
    expect(res.body.employee.name).toBe('Juan D. Cruz');
  });

  it('includes an employee with no salary, for the "Not assigned" state', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/employees')
      .query({ search: 'Villanueva' })
      .set(auth)
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({
      employeeNo: 'EMP-004',
      currentBasicSalary: null,
    });
  });

  it('shares one catalog entry between employees that use the same component', async () => {
    const rice = await db.orm.public.SalaryComponent.where({
      name: 'Rice Allowance',
    }).all();
    expect(rice).toHaveLength(1);
  });
});
