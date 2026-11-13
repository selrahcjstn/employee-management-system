import type { Employee } from '../features/employees/types';
import type { Salary, SalaryHistoryEntry } from '../features/salary/types';
import { apiError, type FakeReply } from './fake-server';
import { employeesServer } from './employees-server';

let counter = 0;

/** A salary row with sensible defaults. */
export function makeSalary(
  employeeId: string,
  monthlyBasicSalary: string,
  createdAt = '2025-03-01T00:00:00.000Z',
): Salary {
  counter += 1;
  return {
    id: `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    employeeId,
    monthlyBasicSalary,
    createdAt,
  };
}

interface Seed {
  current?: Salary;
  /** Newest first, as the API returns it. */
  history?: SalaryHistoryEntry[];
}

/**
 * Employees plus the salary endpoints, behaving like the real API: no salary is a 404, an
 * adjustment moves the current salary to the history, and the same amount changes nothing.
 * A test can make the next PUT fail by setting `fail.save`.
 */
export function salaryServer(
  employees: Employee[],
  seeds: Record<string, Seed> = {},
) {
  const rows = new Map<
    string,
    { current?: Salary; history: SalaryHistoryEntry[] }
  >(
    employees.map((employee) => [
      employee.id,
      {
        current: seeds[employee.id]?.current,
        history: [...(seeds[employee.id]?.history ?? [])],
      },
    ]),
  );
  const fail: { save: FakeReply | null; current: boolean } = {
    save: null,
    current: false,
  };

  const server = employeesServer(employees, {
    extend: (call, list) => {
      const match = /^\/employees\/([^/]+)\/salary(\/history)?$/.exec(call.url);
      if (!match) return undefined;
      const entry = rows.get(match[1]!);
      if (!entry) return apiError(404, 'Employee not found');

      if (call.method === 'GET' && match[2]) {
        return { status: 200, data: entry.history };
      }
      if (call.method === 'GET') {
        if (fail.current) return apiError(500, 'select failed');
        return entry.current
          ? { status: 200, data: entry.current }
          : apiError(404, 'No salary assigned');
      }
      if (call.method === 'PUT') {
        if (fail.save) return fail.save;
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
          match[1]!,
          monthlyBasicSalary,
          '2026-11-13T00:00:00.000Z',
        );
        const employee = list.find((e) => e.id === match[1]);
        if (employee) employee.currentBasicSalary = monthlyBasicSalary;
        return { status: 200, data: { changed: true, salary: entry.current } };
      }
      return undefined;
    },
  });

  return { ...server, rows, fail };
}
