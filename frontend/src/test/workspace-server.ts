import type {
  EmployeeComponent,
  SalaryComponent,
} from '../features/components/types';
import type { Employee } from '../features/employees/types';
import type { Salary, SalaryHistoryEntry } from '../features/salary/types';
import { centavosToAmount, toCentavos } from '../shared/lib/money';
import { employeesServer } from './employees-server';
import { apiError, type FakeReply } from './fake-server';

let counter = 0;
const nextId = (prefix: string) =>
  `${prefix}0000000-0000-4000-8000-${String((counter += 1)).padStart(12, '0')}`;

const NOW = '2026-11-13T00:00:00.000Z';

/** A salary row with sensible defaults. */
export function makeSalary(
  employeeId: string,
  monthlyBasicSalary: string,
  createdAt = '2025-03-01T00:00:00.000Z',
): Salary {
  return {
    id: nextId('1'),
    employeeId,
    monthlyBasicSalary,
    createdAt,
  };
}

export interface SalarySeed {
  current?: Salary;
  /** Newest first, as the API returns it. */
  history?: SalaryHistoryEntry[];
}

export interface WorkspaceSeed {
  salaries?: Record<string, SalarySeed>;
  catalog?: string[];
  /** Employee id -> [component name, amount] pairs. */
  assigned?: Record<string, [string, string][]>;
}

interface Assignment {
  id: string;
  componentId: string;
  amount: string;
}

/** Per-minute rate to four decimals from the annual amount in centavos: annual / 314 / 8 / 60. */
function centavosToAmount4(annualCentavos: bigint): string {
  const tenThousandths = divide(annualCentavos * 100n, 314n * 8n * 60n);
  const whole = tenThousandths / 10000n;
  return `${whole}.${(tenThousandths % 10000n).toString().padStart(4, '0')}`;
}

/** Divides and rounds half up to a whole centavo, like the server's decimal math does for display. */
const divide = (value: bigint, by: bigint) => (value * 2n + by) / (by * 2n);

/**
 * Every endpoint an employee workspace uses, behaving like the real API: employees, their salary
 * and its history, their components and the shared catalog, and the computation that adds them up.
 * One server, so a saved salary shows in the computation the way it does for real. A test can make
 * a call fail through `fail`.
 */
export function workspaceServer(
  employees: Employee[],
  seed: WorkspaceSeed = {},
) {
  // --- salary
  const rows = new Map<
    string,
    { current?: Salary; history: SalaryHistoryEntry[] }
  >(
    employees.map((employee) => [
      employee.id,
      {
        current: seed.salaries?.[employee.id]?.current,
        history: [...(seed.salaries?.[employee.id]?.history ?? [])],
      },
    ]),
  );

  // --- components
  const catalog: SalaryComponent[] = [];
  const named = (name: string) => {
    const existing = catalog.find(
      (entry) => entry.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (existing) return existing;
    const created = {
      id: nextId('2'),
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
        id: nextId('2'),
        componentId: named(name).id,
        amount,
      })),
    ]),
  );
  const view = (row: Assignment): EmployeeComponent => ({
    id: row.id,
    componentId: row.componentId,
    name: catalog.find((entry) => entry.id === row.componentId)!.name,
    amount: row.amount,
    createdAt: NOW,
    updatedAt: NOW,
  });

  const fail = {
    list: false,
    save: null as FakeReply | null,
    exists: false,
    salarySave: null as FakeReply | null,
    salaryCurrent: false,
    componentsWrite: null as FakeReply | null,
    componentsList: false,
    catalog: false,
    computation: false,
  };

  /** What the real list adds to each employee, worked out from the current salary and components. */
  const decorate = (employee: Employee): Employee => {
    const current = rows.get(employee.id)?.current;
    const mine = assignments.get(employee.id) ?? [];
    const componentsTotal = mine.reduce(
      (sum, row) => sum + toCentavos(row.amount),
      0n,
    );
    return {
      ...employee,
      currentBasicSalary: current?.monthlyBasicSalary ?? null,
      basicSalarySince: current?.createdAt ?? null,
      componentsCount: mine.length,
      componentsTotal: centavosToAmount(componentsTotal),
      monthlyTotal: current
        ? centavosToAmount(
            toCentavos(current.monthlyBasicSalary) + componentsTotal,
          )
        : null,
    };
  };

  const server = employeesServer(employees, {
    decorate,
    fail,
    extend: (call, list) => {
      // --- salary
      const salary = /^\/employees\/([^/]+)\/salary(\/history)?$/.exec(
        call.url,
      );
      if (salary) {
        const entry = rows.get(salary[1]!);
        if (!entry) return apiError(404, 'Employee not found');
        if (call.method === 'GET' && salary[2]) {
          return { status: 200, data: entry.history };
        }
        if (call.method === 'GET') {
          if (fail.salaryCurrent) return apiError(500, 'select failed');
          return entry.current
            ? { status: 200, data: entry.current }
            : apiError(404, 'No salary assigned');
        }
        if (call.method === 'PUT') {
          if (fail.salarySave) return fail.salarySave;
          const { monthlyBasicSalary } = call.body as {
            monthlyBasicSalary: string;
          };
          if (entry.current?.monthlyBasicSalary === monthlyBasicSalary) {
            return {
              status: 200,
              data: { changed: false, salary: entry.current },
            };
          }
          if (entry.current) {
            entry.history.unshift({
              ...entry.current,
              replacedAt: '2026-11-13T00:00:00.000Z',
            });
          }
          entry.current = makeSalary(
            salary[1]!,
            monthlyBasicSalary,
            '2026-11-13T00:00:00.000Z',
          );
          return {
            status: 200,
            data: { changed: true, salary: entry.current },
          };
        }
        return undefined;
      }

      // --- computation for everyone
      if (call.url === '/computations' && call.method === 'GET') {
        if (fail.computation) return apiError(500, 'select sum(amount) failed');
        return {
          status: 200,
          data: list
            .toSorted((a, b) => a.employeeNo.localeCompare(b.employeeNo))
            .map((employee) => {
              const full = decorate(employee);
              const base = {
                employee: {
                  id: employee.id,
                  employeeNo: employee.employeeNo,
                  name: `${employee.firstName} ${employee.lastName}`,
                },
                basicSalary: full.currentBasicSalary,
                componentsTotal: full.componentsTotal,
                monthlyTotal: full.monthlyTotal,
              };
              if (full.monthlyTotal === null) {
                return {
                  ...base,
                  annualSalary: null,
                  dailyRate: null,
                  hourlyRate: null,
                  perMinuteRate: null,
                };
              }
              const annual = toCentavos(full.monthlyTotal) * 12n;
              return {
                ...base,
                annualSalary: centavosToAmount(annual),
                dailyRate: centavosToAmount(divide(annual, 314n)),
                hourlyRate: centavosToAmount(divide(annual, 314n * 8n)),
                // Four decimals: scale by 100 for two more digits.
                perMinuteRate: centavosToAmount4(annual),
              };
            }),
        };
      }

      // --- computation
      const computation = /^\/employees\/([^/]+)\/computation$/.exec(call.url);
      if (computation && call.method === 'GET') {
        const employee = list.find((e) => e.id === computation[1]);
        if (!employee) return apiError(404, 'Employee not found');
        if (fail.computation) return apiError(500, 'select sum(amount) failed');
        const basic =
          rows.get(employee.id)?.current?.monthlyBasicSalary ?? null;
        const items = (assignments.get(employee.id) ?? []).map(view);
        const componentsTotal = items.reduce(
          (sum, item) => sum + toCentavos(item.amount),
          0n,
        );
        const base = {
          employee: {
            id: employee.id,
            employeeNo: employee.employeeNo,
            name: `${employee.firstName} ${employee.lastName}`,
          },
          components: items.map(({ name, amount }) => ({ name, amount })),
          componentsTotal: centavosToAmount(componentsTotal),
        };
        if (basic === null) {
          return {
            status: 200,
            data: {
              ...base,
              basicSalary: null,
              monthlyTotal: null,
              annualSalary: null,
              dailyRate: null,
              hourlyRate: null,
              perMinuteRate: null,
            },
          };
        }
        const monthly = toCentavos(basic) + componentsTotal;
        const annual = monthly * 12n;
        return {
          status: 200,
          data: {
            ...base,
            basicSalary: basic,
            monthlyTotal: centavosToAmount(monthly),
            annualSalary: centavosToAmount(annual),
            dailyRate: centavosToAmount(divide(annual, 314n)),
            hourlyRate: centavosToAmount(divide(annual, 314n * 8n)),
            perMinuteRate: centavosToAmount(divide(annual, 314n * 8n * 60n)),
          },
        };
      }

      // --- component catalog
      if (call.url === '/salary-components' && call.method === 'GET') {
        if (fail.catalog)
          return apiError(500, 'select * from salary_components');
        const usage = (componentId: string) =>
          [...assignments.values()]
            .flat()
            .filter((row) => row.componentId === componentId).length;
        return {
          status: 200,
          data: [...catalog]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => ({ ...entry, usageCount: usage(entry.id) })),
        };
      }
      if (call.url === '/salary-components' && call.method === 'POST') {
        if (fail.componentsWrite) return fail.componentsWrite;
        const { name } = call.body as { name: string };
        if (
          catalog.some(
            (entry) => entry.name.toLowerCase() === name.trim().toLowerCase(),
          )
        ) {
          return apiError(409, 'Component name already exists');
        }
        return { status: 201, data: named(name) };
      }
      const removeCatalog = /^\/salary-components\/([^/]+)$/.exec(call.url);
      if (removeCatalog && call.method === 'DELETE') {
        if (fail.componentsWrite) return fail.componentsWrite;
        const target = catalog.find((entry) => entry.id === removeCatalog[1]);
        if (!target) return apiError(404, 'Component not found');
        catalog.splice(catalog.indexOf(target), 1);
        // The real API soft deletes the assignments in the same transaction.
        for (const mine of assignments.values()) {
          for (let i = mine.length - 1; i >= 0; i--) {
            if (mine[i]!.componentId === target.id) mine.splice(i, 1);
          }
        }
        return { status: 204 };
      }
      const rename = /^\/salary-components\/([^/]+)$/.exec(call.url);
      if (rename && call.method === 'PATCH') {
        if (fail.componentsWrite) return fail.componentsWrite;
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

      // --- an employee's components
      const own = /^\/employees\/([^/]+)\/components(?:\/([^/]+))?$/.exec(
        call.url,
      );
      if (!own) return undefined;
      const mine = assignments.get(own[1]!);
      if (!mine) return apiError(404, 'Employee not found');

      if (!own[2] && call.method === 'GET') {
        if (fail.componentsList) {
          return apiError(500, 'select * from employee_components');
        }
        return { status: 200, data: mine.map(view) };
      }
      if (!own[2] && call.method === 'POST') {
        if (fail.componentsWrite) return fail.componentsWrite;
        const body = call.body as {
          componentId?: string;
          name?: string;
          amount: string;
        };
        const component = body.componentId
          ? catalog.find((entry) => entry.id === body.componentId)
          : named(body.name ?? '');
        if (!component) return apiError(404, 'Component not found');
        if (mine.some((row) => row.componentId === component.id)) {
          return apiError(409, 'Employee already has this component');
        }
        const row = {
          id: nextId('2'),
          componentId: component.id,
          amount: body.amount,
        };
        mine.push(row);
        return { status: 201, data: view(row) };
      }
      const row = mine.find((entry) => entry.id === own[2]);
      if (own[2] && !row) return apiError(404, 'Component not found');
      if (row && call.method === 'PATCH') {
        if (fail.componentsWrite) return fail.componentsWrite;
        row.amount = (call.body as { amount: string }).amount;
        return { status: 200, data: view(row) };
      }
      if (row && call.method === 'DELETE') {
        if (fail.componentsWrite) return fail.componentsWrite;
        mine.splice(mine.indexOf(row), 1);
        return { status: 204 };
      }
      return undefined;
    },
  });

  return { ...server, rows, catalog, assignments, fail };
}
