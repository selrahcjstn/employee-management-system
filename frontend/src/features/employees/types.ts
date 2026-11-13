/** An employee as `GET /employees` returns it. */
export interface Employee {
  id: string;
  /** The business "Employee ID" (EMP-001). Not the same as `id`, which is the database key. */
  employeeNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  /** A calendar date, YYYY-MM-DD. */
  dateHired: string;
  createdAt: string;
  updatedAt: string;
  /** The active basic salary as a decimal string ("30000.00"), or null when none is assigned. */
  currentBasicSalary: string | null;
}

/** What the form sends. `middleName` is an empty string when there is none. */
export interface EmployeeInput {
  employeeNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateHired: string;
}

/** "Juan Dela Cruz": first, middle (if any) and last name. */
export function fullName(
  employee: Pick<Employee, 'firstName' | 'middleName' | 'lastName'>,
): string {
  return [employee.firstName, employee.middleName, employee.lastName]
    .filter(Boolean)
    .join(' ');
}
