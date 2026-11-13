import type { Employee } from '../features/employees/types';
import {
  makeSalary,
  workspaceServer,
  type SalarySeed,
} from './workspace-server';

export { makeSalary };

/** The workspace server with a salary seed. `fail.save` and `fail.current` make those calls fail. */
export function salaryServer(
  employees: Employee[],
  seeds: Record<string, SalarySeed> = {},
) {
  const server = workspaceServer(employees, { salaries: seeds });
  return {
    ...server,
    fail: {
      get save() {
        return server.fail.salarySave;
      },
      set save(reply) {
        server.fail.salarySave = reply;
      },
      get current() {
        return server.fail.salaryCurrent;
      },
      set current(failing) {
        server.fail.salaryCurrent = failing;
      },
    },
  };
}
