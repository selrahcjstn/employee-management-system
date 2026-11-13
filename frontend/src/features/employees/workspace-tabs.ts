/** The three tabs of an employee workspace, in order. `path` is the last part of the route. */
export const WORKSPACE_TABS = [
  { path: 'salary', label: 'Salary' },
  { path: 'components', label: 'Components' },
  { path: 'computation', label: 'Computation' },
] as const;

export type WorkspaceTabPath = (typeof WORKSPACE_TABS)[number]['path'];
