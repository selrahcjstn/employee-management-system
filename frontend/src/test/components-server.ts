import type { Employee } from '../features/employees/types';
import type {
  EmployeeComponent,
  SalaryComponent,
} from '../features/components/types';
import { apiError, type FakeReply } from './fake-server';
import { employeesServer } from './employees-server';

let counter = 0;
const nextId = () =>
  `20000000-0000-4000-8000-${String((counter += 1)).padStart(12, '0')}`;

const NOW = '2026-11-13T00:00:00.000Z';

interface Assignment {
  id: string;
  componentId: string;
  amount: string;
}

/**
 * Employees plus the component endpoints, behaving like the real API: names are shared and unique
 * ignoring case, adding a name the employee already has is a 409, a rename changes it for every
 * employee, and removing deletes only that employee's assignment. A test can make the next write
 * fail by setting `fail.write`.
 */
export function componentsServer(
  employees: Employee[],
  seed: {
    catalog?: string[];
    /** Employee id -> [component name, amount] pairs. */
    assigned?: Record<string, [string, string][]>;
  } = {},
) {
  const catalog: SalaryComponent[] = [];
  const named = (name: string) => {
    const existing = catalog.find(
      (entry) => entry.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing) return existing;
    const created = {
      id: nextId(),
      name: name.trim(),
      createdAt: NOW,
      updatedAt: NOW,
    };
    catalog.push(created);
    return created;
  };
  for (const name of seed.catalog ?? []) named(name);

  const assignments = new Map<string, Assignment[]>(
    employees.map((employee) => [
      employee.id,
      (seed.assigned?.[employee.id] ?? []).map(([name, amount]) => ({
        id: nextId(),
        componentId: named(name).id,
        amount,
      })),
    ]),
  );
  const fail: { write: FakeReply | null; list: boolean } = {
    write: null,
    list: false,
  };

  const view = (row: Assignment): EmployeeComponent => ({
    id: row.id,
    componentId: row.componentId,
    name: catalog.find((entry) => entry.id === row.componentId)!.name,
    amount: row.amount,
    createdAt: NOW,
    updatedAt: NOW,
  });

  const server = employeesServer(employees, {
    extend: (call) => {
      if (call.url === '/salary-components' && call.method === 'GET') {
        return { status: 200, data: catalog };
      }

      const rename = /^\/salary-components\/([^/]+)$/.exec(call.url);
      if (rename && call.method === 'PATCH') {
        if (fail.write) return fail.write;
        const { name } = call.body as { name: string };
        const target = catalog.find((entry) => entry.id === rename[1]);
        if (!target) return apiError(404, 'Component not found');
        const clash = catalog.find(
          (entry) =>
            entry !== target &&
            entry.name.toLowerCase() === name.trim().toLowerCase(),
        );
        if (clash) return apiError(409, 'Component name already exists');
        target.name = name.trim();
        return { status: 200, data: target };
      }

      const list = /^\/employees\/([^/]+)\/components(?:\/([^/]+))?$/.exec(
        call.url,
      );
      if (!list) return undefined;
      const rows = assignments.get(list[1]!);
      if (!rows) return apiError(404, 'Employee not found');

      if (!list[2] && call.method === 'GET') {
        if (fail.list)
          return apiError(500, 'select * from employee_components');
        return { status: 200, data: rows.map(view) };
      }
      if (!list[2] && call.method === 'POST') {
        if (fail.write) return fail.write;
        const body = call.body as {
          componentId?: string;
          name?: string;
          amount: string;
        };
        const component = body.componentId
          ? catalog.find((entry) => entry.id === body.componentId)
          : named(body.name ?? '');
        if (!component) return apiError(404, 'Component not found');
        if (rows.some((row) => row.componentId === component.id)) {
          return apiError(409, 'Employee already has this component');
        }
        const row = {
          id: nextId(),
          componentId: component.id,
          amount: body.amount,
        };
        rows.push(row);
        return { status: 201, data: view(row) };
      }
      const row = rows.find((entry) => entry.id === list[2]);
      if (list[2] && !row) return apiError(404, 'Component not found');
      if (row && call.method === 'PATCH') {
        if (fail.write) return fail.write;
        row.amount = (call.body as { amount: string }).amount;
        return { status: 200, data: view(row) };
      }
      if (row && call.method === 'DELETE') {
        if (fail.write) return fail.write;
        rows.splice(rows.indexOf(row), 1);
        return { status: 204 };
      }
      return undefined;
    },
  });

  return { ...server, catalog, assignments, fail };
}
