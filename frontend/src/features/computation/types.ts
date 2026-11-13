/**
 * The salary breakdown and rates from `GET /employees/:id/computation`. Every amount is a decimal
 * string, worked out by the server; the page only shows them. The money fields are null when the
 * employee has no basic salary.
 */
export interface Computation {
  employee: { id: string; employeeNo: string; name: string };
  basicSalary: string | null;
  components: { name: string; amount: string }[];
  componentsTotal: string;
  monthlyTotal: string | null;
  annualSalary: string | null;
  dailyRate: string | null;
  hourlyRate: string | null;
  perMinuteRate: string | null;
}

/** One line of `GET /computations`: an employee's monthly total and rates. Money and rates are null without a basic salary. */
export interface ComputationSummary {
  employee: { id: string; employeeNo: string; name: string };
  basicSalary: string | null;
  componentsTotal: string;
  monthlyTotal: string | null;
  annualSalary: string | null;
  dailyRate: string | null;
  hourlyRate: string | null;
  /** Four decimals, because the rate is small. */
  perMinuteRate: string | null;
}
