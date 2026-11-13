import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { isUniqueViolation, sqlState } from '../src/common/db-errors.js';
import { db } from '../src/prisma/db.js';
import {
  authHeader,
  createApp,
  createTestUser,
  deleteTestComponents,
  deleteTestEmployees,
  deleteTestUser,
  randomDigits,
} from './helpers.js';

describe('Salary components (e2e)', () => {
  let app: INestApplication;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let auth: { Authorization: string };
  const employeeIds: string[] = [];
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const digits = randomDigits();
  const prefix = `E2E${tag} `;
  let counter = 0;
  const server = () => app.getHttpServer();
  const name = (label: string) => `${prefix}${label}`;
  const rowsOf = (employeeId: string) =>
    db.orm.public.EmployeeSalaryComponent.where({ employeeId }).all();
  const componentRows = (componentName: string) =>
    db.orm.public.SalaryComponent.where((c) =>
      c.name.ilike(componentName.trim()),
    ).all();
  const capture = (promise: Promise<unknown>) =>
    promise.then(
      () => undefined,
      (caught: unknown) => caught,
    );

  const newEmployee = async (): Promise<string> => {
    const res = await request(server())
      .post('/api/employees')
      .set(auth)
      .send({
        employeeNo: `EMP-${digits}${++counter}`,
        firstName: 'Com',
        lastName: 'Ponent',
        dateHired: '2024-01-01',
      })
      .expect(201);
    employeeIds.push(res.body.id);
    return res.body.id;
  };
  const addByName = (
    employeeId: string,
    componentName: string,
    amount = '2000.00',
  ) =>
    request(server())
      .post(`/api/employees/${employeeId}/components`)
      .set(auth)
      .send({ name: componentName, amount });
  const listFor = (employeeId: string) =>
    request(server()).get(`/api/employees/${employeeId}/components`).set(auth);
  const createComponent = (componentName: string) =>
    request(server())
      .post('/api/salary-components')
      .set(auth)
      .send({ name: componentName });

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

  it('requires a token on every route', async () => {
    const id = randomUUID();
    await request(server()).get('/api/salary-components').expect(401);
    await request(server())
      .post('/api/salary-components')
      .send({ name: 'x' })
      .expect(401);
    await request(server())
      .patch(`/api/salary-components/${id}`)
      .send({ name: 'x' })
      .expect(401);
    await request(server()).delete(`/api/salary-components/${id}`).expect(401);
    await request(server()).get(`/api/employees/${id}/components`).expect(401);
    await request(server())
      .post(`/api/employees/${id}/components`)
      .send({})
      .expect(401);
    await request(server())
      .patch(`/api/employees/${id}/components/${id}`)
      .send({})
      .expect(401);
    await request(server())
      .delete(`/api/employees/${id}/components/${id}`)
      .expect(401);
  });

  describe('component catalog', () => {
    it('creates a component (name trimmed) and lists active components sorted by name', async () => {
      const created = await createComponent(`  ${name('Bravo')}  `).expect(201);
      expect(created.body.name).toBe(name('Bravo'));
      await createComponent(name('Alpha')).expect(201);

      const list = await request(server())
        .get('/api/salary-components')
        .set(auth)
        .expect(200);
      const names: string[] = list.body
        .map((c: { name: string }) => c.name)
        .filter((n: string) => n.startsWith(prefix));
      expect(names).toEqual([name('Alpha'), name('Bravo')]);
    });

    it('rejects a duplicate name with 409, ignoring case and surrounding spaces', async () => {
      await createComponent(name('Dup')).expect(201);
      const same = await createComponent(name('Dup')).expect(409);
      expect(same.body).toMatchObject({
        statusCode: 409,
        message: 'Component name already exists',
      });
      await createComponent(`  ${name('DUP').toLowerCase()}  `).expect(409);
    });

    it('validates the name', async () => {
      for (const body of [
        {},
        { name: '' },
        { name: '   ' },
        { name: 'x'.repeat(101) },
        { name: 5 },
        { name: 'ok', extra: 1 },
      ]) {
        const res = await request(server())
          .post('/api/salary-components')
          .set(auth)
          .send(body)
          .expect(400);
        expect(res.body.errors.length).toBeGreaterThan(0);
      }
    });

    it('renames a component, 409 on a collision with another active name, 404 for an unknown id', async () => {
      const a = await createComponent(name('RenameA')).expect(201);
      await createComponent(name('RenameB')).expect(201);

      const renamed = await request(server())
        .patch(`/api/salary-components/${a.body.id}`)
        .set(auth)
        .send({ name: name('RenamedA') })
        .expect(200);
      expect(renamed.body.name).toBe(name('RenamedA'));

      await request(server())
        .patch(`/api/salary-components/${a.body.id}`)
        .set(auth)
        .send({ name: name('renameb') })
        .expect(409);
      await request(server())
        .patch(`/api/salary-components/${a.body.id}`)
        .set(auth)
        .send({ name: name('RENAMEDA') })
        .expect(200);
      await request(server())
        .patch(`/api/salary-components/${randomUUID()}`)
        .set(auth)
        .send({ name: name('Nope') })
        .expect(404);
      await request(server())
        .patch('/api/salary-components/not-a-uuid')
        .set(auth)
        .send({ name: 'x' })
        .expect(400);
    });

    it('soft deletes a component: it leaves the list, stays in the database, and its name can be reused', async () => {
      const made = await createComponent(name('Gone')).expect(201);
      await request(server())
        .delete(`/api/salary-components/${made.body.id}`)
        .set(auth)
        .expect(204);

      const list = await request(server())
        .get('/api/salary-components')
        .set(auth)
        .expect(200);
      expect(list.body.map((c: { id: string }) => c.id)).not.toContain(
        made.body.id,
      );
      const rows = await db.orm.public.SalaryComponent.where({
        id: made.body.id,
      }).all();
      expect(rows).toHaveLength(1);
      expect(rows[0]!.deletedAt).not.toBeNull();

      await request(server())
        .delete(`/api/salary-components/${made.body.id}`)
        .set(auth)
        .expect(404);
      await request(server())
        .patch(`/api/salary-components/${made.body.id}`)
        .set(auth)
        .send({ name: name('Gone2') })
        .expect(404);
      await createComponent(name('Gone')).expect(201);
    });
  });

  describe('employee components', () => {
    it('adds a component by name (creating it) and lists it', async () => {
      const id = await newEmployee();
      const res = await addByName(id, name('Rice Allowance')).expect(201);
      expect(res.body).toMatchObject({
        name: name('Rice Allowance'),
        amount: '2000.00',
      });

      const list = await listFor(id).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({
        id: res.body.id,
        componentId: res.body.componentId,
      });
    });

    it('blocks adding the same component twice to one employee, also with different case or spaces', async () => {
      const id = await newEmployee();
      await addByName(id, name('Rice Twice')).expect(201);
      const dup = await addByName(id, name('Rice Twice')).expect(409);
      expect(dup.body.message).toBe(
        'Component is already assigned to this employee',
      );
      await addByName(id, `  ${name('rice twice').toUpperCase()} `).expect(409);
      expect(await rowsOf(id)).toHaveLength(1);
    });

    it('reuses an existing component name for another employee without creating a second catalog entry', async () => {
      const first = await newEmployee();
      const second = await newEmployee();
      const a = await addByName(first, name('Shared'), '1000.00').expect(201);
      const b = await addByName(second, name('shared'), '1500.50').expect(201);

      expect(b.body.componentId).toBe(a.body.componentId);
      expect(b.body.name).toBe(name('Shared'));
      expect(await componentRows(name('Shared'))).toHaveLength(1);
      expect((await listFor(second).expect(200)).body[0].amount).toBe(
        '1500.50',
      );
    });

    it('adds by componentId, and rejects both, neither, an unknown id and a deleted component', async () => {
      const id = await newEmployee();
      const comp = await createComponent(name('ById')).expect(201);
      const url = `/api/employees/${id}/components`;

      const ok = await request(server())
        .post(url)
        .set(auth)
        .send({ componentId: comp.body.id, amount: '10' })
        .expect(201);
      expect(ok.body.componentId).toBe(comp.body.id);

      await request(server())
        .post(url)
        .set(auth)
        .send({ amount: '10' })
        .expect(400);
      await request(server())
        .post(url)
        .set(auth)
        .send({ componentId: comp.body.id, name: name('Both'), amount: '10' })
        .expect(400);
      await request(server())
        .post(url)
        .set(auth)
        .send({ componentId: randomUUID(), amount: '10' })
        .expect(404);
      await request(server())
        .post(url)
        .set(auth)
        .send({ componentId: 'not-a-uuid', amount: '10' })
        .expect(400);

      const doomed = await createComponent(name('Doomed')).expect(201);
      await request(server())
        .delete(`/api/salary-components/${doomed.body.id}`)
        .set(auth)
        .expect(204);
      await request(server())
        .post(url)
        .set(auth)
        .send({ componentId: doomed.body.id, amount: '10' })
        .expect(404);
    });

    it('returns 404 for an unknown employee and 400 for a malformed id', async () => {
      await addByName(randomUUID(), name('Nobody')).expect(404);
      await listFor(randomUUID()).expect(404);
      await listFor('not-a-uuid').expect(400);
    });

    it.each([
      ['negative', '-1'],
      ['non-numeric', 'abc'],
      ['empty', ''],
      ['3 decimals', '10.123'],
      ['over the maximum', '100000000'],
      ['a JSON number', 100],
      ['null', null],
    ])('rejects a %s amount with 400', async (_label, amount) => {
      const id = await newEmployee();
      await request(server())
        .post(`/api/employees/${id}/components`)
        .set(auth)
        .send({ name: name(`Bad ${counter}`), amount })
        .expect(400);
      expect(await rowsOf(id)).toHaveLength(0);
    });

    it('accepts a zero amount', async () => {
      const id = await newEmployee();
      const res = await addByName(id, name('Zero'), '0').expect(201);
      expect(res.body.amount).toBe('0.00');
    });

    it('supports several components per employee, each with its own amount, listed by name', async () => {
      const id = await newEmployee();
      await addByName(id, name('Transportation'), '1500').expect(201);
      await addByName(id, name('Rice Allowance'), '2000').expect(201);
      const list = await listFor(id).expect(200);
      expect(
        list.body.map((c: { name: string; amount: string }) => [
          c.name,
          c.amount,
        ]),
      ).toEqual([
        [name('Rice Allowance'), '2000.00'],
        [name('Transportation'), '1500.00'],
      ]);
    });

    it("updates an assigned component's amount, and 404s for another employee's assignment", async () => {
      const owner = await newEmployee();
      const other = await newEmployee();
      const made = await addByName(owner, name('Updatable'), '100').expect(201);

      const updated = await request(server())
        .patch(`/api/employees/${owner}/components/${made.body.id}`)
        .set(auth)
        .send({ amount: '250.75' })
        .expect(200);
      expect(updated.body).toMatchObject({
        id: made.body.id,
        amount: '250.75',
        name: name('Updatable'),
      });

      await request(server())
        .patch(`/api/employees/${other}/components/${made.body.id}`)
        .set(auth)
        .send({ amount: '1' })
        .expect(404);
      await request(server())
        .patch(`/api/employees/${owner}/components/${made.body.id}`)
        .set(auth)
        .send({ amount: '-1' })
        .expect(400);
      await request(server())
        .patch(`/api/employees/${owner}/components/${randomUUID()}`)
        .set(auth)
        .send({ amount: '1' })
        .expect(404);
    });

    it('removing soft deletes the assignment (row stays), and the component can be added again', async () => {
      const id = await newEmployee();
      const first = await addByName(id, name('Removable')).expect(201);
      await request(server())
        .delete(`/api/employees/${id}/components/${first.body.id}`)
        .set(auth)
        .expect(204);

      expect((await listFor(id).expect(200)).body).toEqual([]);
      const afterRemove = await rowsOf(id);
      expect(afterRemove).toHaveLength(1);
      expect(afterRemove[0]!.deletedAt).not.toBeNull();
      expect(await componentRows(name('Removable'))).toHaveLength(1);

      await request(server())
        .delete(`/api/employees/${id}/components/${first.body.id}`)
        .set(auth)
        .expect(404);
      await request(server())
        .patch(`/api/employees/${id}/components/${first.body.id}`)
        .set(auth)
        .send({ amount: '1' })
        .expect(404);

      const again = await addByName(id, name('Removable'), '3000').expect(201);
      expect(again.body.id).not.toBe(first.body.id);
      expect(await rowsOf(id)).toHaveLength(2);
      expect((await listFor(id).expect(200)).body).toHaveLength(1);
    });

    it('a rename applies to every employee using the component', async () => {
      const first = await newEmployee();
      const second = await newEmployee();
      const a = await addByName(first, name('Old Name')).expect(201);
      await addByName(second, name('Old Name')).expect(201);

      await request(server())
        .patch(`/api/salary-components/${a.body.componentId}`)
        .set(auth)
        .send({ name: name('New Name') })
        .expect(200);
      expect((await listFor(first).expect(200)).body[0].name).toBe(
        name('New Name'),
      );
      expect((await listFor(second).expect(200)).body[0].name).toBe(
        name('New Name'),
      );
    });

    it('deleting a component soft deletes all its active assignments, for every employee, in one go', async () => {
      const first = await newEmployee();
      const second = await newEmployee();
      const keep = await newEmployee();
      const a = await addByName(first, name('Cascade')).expect(201);
      await addByName(second, name('Cascade')).expect(201);
      await addByName(keep, name('Survivor')).expect(201);

      await request(server())
        .delete(`/api/salary-components/${a.body.componentId}`)
        .set(auth)
        .expect(204);

      expect((await listFor(first).expect(200)).body).toEqual([]);
      expect((await listFor(second).expect(200)).body).toEqual([]);
      expect((await listFor(keep).expect(200)).body).toHaveLength(1);
      for (const employeeId of [first, second]) {
        const rows = await rowsOf(employeeId);
        expect(rows).toHaveLength(1);
        expect(rows[0]!.deletedAt).not.toBeNull();
      }
    });
  });

  describe('database constraints', () => {
    it('uq_active_component_name: no two active names with the same lower(trim(name))', async () => {
      await db.orm.public.SalaryComponent.create({ name: name('DB Name') });
      for (const duplicate of [name('db name'), `  ${name('DB NAME')}  `]) {
        const error = await capture(
          db.orm.public.SalaryComponent.create({ name: duplicate }),
        );
        expect(isUniqueViolation(error)).toBe(true);
      }
    });

    it('uq_active_component_name: soft deleted rows never block a new active one', async () => {
      const deletedAt = new Date();
      await db.orm.public.SalaryComponent.create({
        name: name('DB Reuse'),
        deletedAt,
      });
      await db.orm.public.SalaryComponent.create({
        name: name('DB Reuse'),
        deletedAt,
      });
      await db.orm.public.SalaryComponent.create({ name: name('DB Reuse') });
      expect(await componentRows(name('DB Reuse'))).toHaveLength(3);
    });

    it('uq_active_component_per_employee: one active assignment per employee and component, any number soft deleted', async () => {
      const id = await newEmployee();
      const component = await db.orm.public.SalaryComponent.create({
        name: name('DB Per Employee'),
      });
      const assign = (extra: { deletedAt?: Date } = {}) =>
        db.orm.public.EmployeeSalaryComponent.create({
          employeeId: id,
          salaryComponentId: component.id,
          amount: '10',
          ...extra,
        });

      await assign();
      expect(isUniqueViolation(await capture(assign()))).toBe(true);

      const deletedAt = new Date();
      await assign({ deletedAt });
      await assign({ deletedAt });
      expect(await rowsOf(id)).toHaveLength(3);
    });

    it('CHECK amount >= 0: the database rejects a negative amount', async () => {
      const id = await newEmployee();
      const component = await db.orm.public.SalaryComponent.create({
        name: name('DB Check'),
      });
      const error = await capture(
        db.orm.public.EmployeeSalaryComponent.create({
          employeeId: id,
          salaryComponentId: component.id,
          amount: '-0.01',
        }),
      );
      expect(sqlState(error)).toBe('23514');
    });
  });

  describe('pay figures on the lists (active rows only)', () => {
    const putSalary = (employeeId: string, amount: string) =>
      request(server())
        .put(`/api/employees/${employeeId}/salary`)
        .set(auth)
        .send({ monthlyBasicSalary: amount })
        .expect(200);
    const listEmployees = async () =>
      new Map<string, Record<string, unknown>>(
        (
          (await request(server()).get('/api/employees').set(auth).expect(200))
            .body as { id: string }[]
        ).map((e) => [e.id, e as unknown as Record<string, unknown>]),
      );
    const usage = async (componentName: string) =>
      (
        (
          await request(server())
            .get('/api/salary-components')
            .set(auth)
            .expect(200)
        ).body as { name: string; usageCount: number }[]
      ).find((c) => c.name === componentName)?.usageCount;

    it('the employee list has the components count, the components total and the monthly total', async () => {
      const id = await newEmployee();
      await putSalary(id, '30000');
      await addByName(id, name('Rice'), '2000').expect(201);
      await addByName(id, name('Transport'), '1500.50').expect(201);

      const row = (await listEmployees()).get(id)!;
      expect(row).toMatchObject({
        currentBasicSalary: '30000.00',
        componentsCount: 2,
        componentsTotal: '3500.50',
        monthlyTotal: '33500.50',
      });
      expect(row['basicSalarySince']).toEqual(expect.any(String));
    });

    it('an employee with no salary and no components has zeros and nulls, not an error', async () => {
      const id = await newEmployee();
      expect((await listEmployees()).get(id)).toMatchObject({
        currentBasicSalary: null,
        basicSalarySince: null,
        componentsCount: 0,
        componentsTotal: '0.00',
        monthlyTotal: null,
      });
    });

    it('components without a salary still count, but there is no monthly total', async () => {
      const id = await newEmployee();
      await addByName(id, name('Alone'), '700').expect(201);
      expect((await listEmployees()).get(id)).toMatchObject({
        currentBasicSalary: null,
        componentsCount: 1,
        componentsTotal: '700.00',
        monthlyTotal: null,
      });
    });

    it('leaves out a removed assignment, and a superseded salary counts only once', async () => {
      const id = await newEmployee();
      await putSalary(id, '10000');
      await putSalary(id, '12000');
      const added = await addByName(id, name('Removed'), '500').expect(201);
      await addByName(id, name('Kept'), '300').expect(201);
      await request(server())
        .delete(`/api/employees/${id}/components/${added.body.id}`)
        .set(auth)
        .expect(204);

      expect((await listEmployees()).get(id)).toMatchObject({
        currentBasicSalary: '12000.00',
        componentsCount: 1,
        componentsTotal: '300.00',
        monthlyTotal: '12300.00',
      });
    });

    it('usageCount is how many employees have each component, and it falls when one is removed', async () => {
      const [a, b] = [await newEmployee(), await newEmployee()];
      const componentName = name('Usage Count');
      const first = await addByName(a, componentName).expect(201);
      await addByName(b, componentName).expect(201);
      expect(await usage(componentName)).toBe(2);

      await request(server())
        .delete(`/api/employees/${a}/components/${first.body.id}`)
        .set(auth)
        .expect(204);
      expect(await usage(componentName)).toBe(1);
    });

    it('a component nobody uses has usageCount 0', async () => {
      const componentName = name('Unused');
      await createComponent(componentName).expect(201);
      expect(await usage(componentName)).toBe(0);
    });

    it('deleting a component removes it from the list, from its employees and from their totals', async () => {
      const id = await newEmployee();
      await putSalary(id, '20000');
      const componentName = name('Doomed');
      const added = await addByName(id, componentName, '800').expect(201);
      await request(server())
        .delete(`/api/salary-components/${added.body.componentId}`)
        .set(auth)
        .expect(204);

      expect(await usage(componentName)).toBeUndefined();
      expect((await listEmployees()).get(id)).toMatchObject({
        componentsCount: 0,
        componentsTotal: '0.00',
        monthlyTotal: '20000.00',
      });
    });
  });
});
