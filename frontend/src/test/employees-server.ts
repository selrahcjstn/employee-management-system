import type { Employee, EmployeeInput } from '../features/employees/types';
import {
  apiError,
  delay,
  type FakeReply,
  type RecordedCall,
} from './fake-server';
import { authServer } from './render-app';

let counter = 0;

/** An employee with sensible defaults. Pass the fields a test cares about. */
export function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  counter += 1;
  const number = String(counter).padStart(3, '0');
  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`,
    employeeNo: `EMP-${number}`,
    firstName: `First${number}`,
    middleName: null,
    lastName: `Last${number}`,
    dateHired: '2024-01-15',
    createdAt: '2026-11-13T00:00:00.000Z',
    updatedAt: '2026-11-13T00:00:00.000Z',
    currentBasicSalary: null,
    basicSalarySince: null,
    componentsCount: 0,
    componentsTotal: '0.00',
    monthlyTotal: null,
    ...overrides,
  };
}

interface Options {
  /** How long the list takes to answer, to see the loading state. */
  listDelayMs?: number;
  saveDelayMs?: number;
  /** How long the duplicate check takes to answer, to test a late answer. */
  existsDelayMs?: number;
  /** Fills in what other endpoints own (salary and components) on each employee the list returns. */
  decorate?: (employee: Employee) => Employee;
  /** Failure switches shared with the caller, so a wrapper can add its own next to `list` and `save`. */
  fail?: { list: boolean; save: FakeReply | null; exists: boolean };
  /** Answers other endpoints (the salary ones) before the employee endpoints do. */
  extend?: (
    call: RecordedCall,
    employees: Employee[],
  ) => FakeReply | undefined | Promise<FakeReply | undefined>;
}

/**
 * A scripted backend for the employee endpoints that behaves like the real one: search matches
 * the Employee ID or any name part, a duplicate Employee ID (any letter case) is a 409, and the
 * Employee ID cannot be sent to PATCH. A test can make a call fail by setting `fail`.
 */
export function employeesServer(
  initial: Employee[] = [],
  options: Options = {},
) {
  const employees = [...initial];
  const fail = options.fail ?? { list: false, save: null, exists: false };

  const server = authServer({
    signedIn: true,
    handle: async (call) => {
      const extended = await options.extend?.(call, employees);
      if (extended) return extended;
      // The live duplicate check: the same case-insensitive, trimmed comparison as the real API.
      if (call.url === '/employees/exists' && call.method === 'GET') {
        await delay(options.existsDelayMs ?? 0);
        if (fail.exists) return apiError(500, 'select * from employees');
        const wanted = (call.params?.['employeeNo'] ?? '').trim().toLowerCase();
        return {
          status: 200,
          data: {
            exists: employees.some(
              (employee) => employee.employeeNo.toLowerCase() === wanted,
            ),
          },
        };
      }

      if (call.url === '/employees' && call.method === 'GET') {
        await delay(options.listDelayMs ?? 0);
        if (fail.list)
          return apiError(
            500,
            'password authentication failed for user "postgres"',
          );
        const term = call.params?.['search']?.toLowerCase();
        const matches = employees.filter((employee) =>
          term
            ? [
                employee.employeeNo,
                employee.firstName,
                employee.middleName ?? '',
                employee.lastName,
              ].some((part) => part.toLowerCase().includes(term))
            : true,
        );
        return {
          status: 200,
          data: [...matches]
            .sort((a, b) => a.employeeNo.localeCompare(b.employeeNo))
            .map(options.decorate ?? ((employee) => employee)),
        };
      }

      if (call.url === '/employees' && call.method === 'POST') {
        await delay(options.saveDelayMs ?? 0);
        if (fail.save) return fail.save;
        const input = call.body as EmployeeInput;
        if (
          employees.some(
            (e) =>
              e.employeeNo.toLowerCase() ===
              input.employeeNo.trim().toLowerCase(),
          )
        ) {
          return apiError(409, 'Employee ID already exists');
        }
        const created = makeEmployee({
          ...input,
          employeeNo: input.employeeNo.trim(),
          middleName: input.middleName.trim() || null,
        });
        employees.push(created);
        const { currentBasicSalary: _salary, ...saved } = created;
        return { status: 201, data: saved };
      }

      const patch = /^\/employees\/([^/]+)$/.exec(call.url);
      if (patch && call.method === 'GET') {
        if (!/^[0-9a-f-]{36}$/.test(patch[1]!)) {
          return apiError(400, 'Validation failed (uuid is expected)');
        }
        const employee = employees.find((e) => e.id === patch[1]);
        if (!employee) return apiError(404, 'Employee not found');
        const { currentBasicSalary: _salary, ...saved } = employee;
        return { status: 200, data: saved };
      }
      if (patch && call.method === 'PATCH') {
        await delay(options.saveDelayMs ?? 0);
        if (fail.save) return fail.save;
        const body = call.body as Partial<EmployeeInput>;
        if ('employeeNo' in body) {
          return apiError(400, 'Validation failed', [
            'property employeeNo should not exist',
          ]);
        }
        const employee = employees.find((e) => e.id === patch[1]);
        if (!employee) return apiError(404, 'Employee not found');
        Object.assign(employee, {
          ...body,
          middleName:
            body.middleName === undefined
              ? employee.middleName
              : body.middleName.trim() || null,
        });
        const { currentBasicSalary: _salary, ...saved } = employee;
        return { status: 200, data: saved };
      }

      return undefined;
    },
  });

  return { ...server, employees, fail };
}
