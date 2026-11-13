/** A name in the shared catalog of salary components ("Rice Allowance"). Renaming it renames it for everyone. */
export interface SalaryComponent {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** A component as assigned to one employee, from `GET /employees/:id/components`. */
export interface EmployeeComponent {
  /** The assignment (what PATCH and DELETE use). */
  id: string;
  /** The catalog entry it points to (what a rename changes). */
  componentId: string;
  name: string;
  /** A decimal string ("2000.00"). Never a number. */
  amount: string;
  createdAt: string;
  updatedAt: string;
}

/** Adds an existing catalog entry, or a new one by name; the API reuses an active entry with the same name. */
export type AddComponentInput =
  { componentId: string; amount: string } | { name: string; amount: string };
