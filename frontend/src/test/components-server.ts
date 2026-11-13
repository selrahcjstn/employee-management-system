import type { Employee } from '../features/employees/types';
import { workspaceServer, type WorkspaceSeed } from './workspace-server';

/** The workspace server with a components seed. `fail.write` and `fail.list` make those calls fail. */
export function componentsServer(
  employees: Employee[],
  seed: Pick<WorkspaceSeed, 'catalog' | 'assigned'> = {},
) {
  const server = workspaceServer(employees, seed);
  return {
    ...server,
    fail: {
      get write() {
        return server.fail.componentsWrite;
      },
      set write(reply) {
        server.fail.componentsWrite = reply;
      },
      get list() {
        return server.fail.componentsList;
      },
      set list(failing) {
        server.fail.componentsList = failing;
      },
    },
  };
}
