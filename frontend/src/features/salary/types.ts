/** The active basic salary as `GET /employees/:id/salary` returns it. */
export interface Salary {
  id: string;
  employeeId: string;
  /** A decimal string ("30000.00"). Never a number. */
  monthlyBasicSalary: string;
  /** When this salary was assigned. */
  createdAt: string;
}

/** A salary that was replaced. `replacedAt` is when the next one took over. */
export interface SalaryHistoryEntry extends Salary {
  replacedAt: string;
}

/** `PUT /employees/:id/salary`. `changed` is false when the amount was already the current one. */
export interface AssignSalaryResult {
  changed: boolean;
  salary: Salary;
}
