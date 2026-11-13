import type { Employee } from '../employees/types';

/** How many days count as "recently hired". */
export const RECENT_DAYS = 30;

/**
 * Money is added as whole centavos in a BigInt, so a total of many salaries has no float error.
 * "30000.50" -> 3000050n.
 */
export function toCentavos(amount: string): bigint {
  const [whole = '0', decimals = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(decimals.padEnd(2, '0').slice(0, 2));
}

/** 3000050n -> "30000.50", the decimal string the formatters expect. */
export function centavosToAmount(centavos: bigint): string {
  const whole = centavos / 100n;
  const decimals = (centavos % 100n).toString().padStart(2, '0');
  return `${whole}.${decimals}`;
}

/** A calendar date YYYY-MM-DD moved by whole days (UTC math, so no timezone or daylight saving shift). */
function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const moved = new Date(Date.UTC(year!, month! - 1, day! + days));
  return moved.toISOString().slice(0, 10);
}

export interface EmployeeStats {
  total: number;
  /** Hired from 29 days ago up to and including today. */
  hiredRecently: number;
  withSalary: number;
  /** Employees with no active basic salary, in the order they were given. */
  withoutSalary: Employee[];
  /** The sum of current basic salaries, as a decimal string. */
  payroll: string;
  /** The payroll divided by the employees who have a salary, rounded half up to the centavo; null when none has one. */
  average: string | null;
  /** Employees who have a salary, the highest first (ties keep the given order). */
  bySalary: Employee[];
  /** The newest hires, latest first, at most RECENT_HIRES_SHOWN. People whose start date is still ahead are not included. */
  recentHires: Employee[];
  /** Highest, lowest and middle basic salary; null when nobody has one. */
  salaryRange: { highest: Employee; lowest: Employee; median: string } | null;
  /** How long people have been here; null when there is no one who has started. */
  tenure: { averageYears: number; longest: Employee } | null;
}

export const RECENT_HIRES_SHOWN = 5;

const DAY_MS = 86_400_000;

/** Whole days from one calendar date (YYYY-MM-DD) to another. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/** The middle salary in centavos; with two in the middle, their average rounded half up. */
function median(sorted: bigint[]): bigint {
  const middle = sorted.length / 2;
  if (Number.isInteger(middle)) {
    return (sorted[middle - 1]! + sorted[middle]! + 1n) / 2n;
  }
  return sorted[Math.floor(middle)]!;
}

/** Everything the dashboard shows, worked out from the employee list. `today` is the Manila date, YYYY-MM-DD. */
export function computeStats(
  employees: Employee[],
  today: string,
): EmployeeStats {
  const recentFrom = addDays(today, -(RECENT_DAYS - 1));
  let payroll = 0n;
  let hiredRecently = 0;
  const withoutSalary: Employee[] = [];

  for (const employee of employees) {
    if (employee.currentBasicSalary === null) {
      withoutSalary.push(employee);
    } else {
      payroll += toCentavos(employee.currentBasicSalary);
    }
    if (employee.dateHired >= recentFrom && employee.dateHired <= today) {
      hiredRecently += 1;
    }
  }

  const withSalary = employees.length - withoutSalary.length;
  const average =
    withSalary === 0
      ? null
      : centavosToAmount(
          (payroll * 2n + BigInt(withSalary)) / (BigInt(withSalary) * 2n),
        );

  const bySalary = employees
    .filter((employee) => employee.currentBasicSalary !== null)
    .sort((a, b) => {
      const difference =
        toCentavos(b.currentBasicSalary!) - toCentavos(a.currentBasicSalary!);
      return difference > 0n ? 1 : difference < 0n ? -1 : 0;
    });
  const started = employees
    .filter((employee) => employee.dateHired <= today)
    .sort((a, b) => b.dateHired.localeCompare(a.dateHired));
  const longest = started[started.length - 1];
  const totalDays = started.reduce(
    (sum, employee) => sum + daysBetween(employee.dateHired, today),
    0,
  );

  return {
    total: employees.length,
    hiredRecently,
    withSalary,
    withoutSalary,
    payroll: centavosToAmount(payroll),
    average,
    bySalary,
    recentHires: started.slice(0, RECENT_HIRES_SHOWN),
    salaryRange:
      bySalary.length === 0
        ? null
        : {
            highest: bySalary[0]!,
            lowest: bySalary[bySalary.length - 1]!,
            median: centavosToAmount(
              median(
                bySalary
                  .map((employee) => toCentavos(employee.currentBasicSalary!))
                  .reverse(),
              ),
            ),
          },
    tenure: longest
      ? {
          averageYears:
            Math.round((totalDays / started.length / 365.25) * 10) / 10,
          longest,
        }
      : null,
  };
}
