import { Injectable } from '@nestjs/common';
import { Decimal, toMoneyString } from '../../common/money.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { active } from '../../prisma/soft-delete.js';

/** What one employee is paid right now, from active rows only. */
export interface EmployeePay {
  basicSalary: string | null;
  /** When the active basic salary was assigned, or null with no salary. */
  basicSalarySince: Date | null;
  componentsCount: number;
  componentsTotal: string;
  /** Basic salary plus active components; null with no basic salary. */
  monthlyTotal: string | null;
}

export const NO_PAY: EmployeePay = {
  basicSalary: null,
  basicSalarySince: null,
  componentsCount: 0,
  componentsTotal: '0.00',
  monthlyTotal: null,
};

/**
 * Pay figures for every employee at once, for the list pages. It reads the active salaries, the
 * active components and the active assignments in three bulk queries (the number of queries does
 * not grow with the number of employees), all through the shared `active` filter, and adds them up
 * in decimals. An assignment counts only while its component is active too.
 */
@Injectable()
export class PaySummaryService {
  constructor(private readonly prisma: PrismaService) {}

  private async activeRows() {
    const { SalaryAssignment, SalaryComponent, EmployeeSalaryComponent } =
      this.prisma.db.orm.public;
    const [salaries, components, assignments] = await Promise.all([
      SalaryAssignment.with(active).all(),
      SalaryComponent.with(active).all(),
      EmployeeSalaryComponent.with(active).all(),
    ]);
    const activeComponents = new Set(components.map((row) => row.id));
    return {
      salaries,
      assignments: assignments.filter((row) =>
        activeComponents.has(row.salaryComponentId),
      ),
    };
  }

  /** The pay of every employee that has a salary or a component; others are `NO_PAY`. */
  async forAll(): Promise<Map<string, EmployeePay>> {
    const { salaries, assignments } = await this.activeRows();

    const componentTotals = new Map<
      string,
      { count: number; total: Decimal }
    >();
    for (const row of assignments) {
      const entry = componentTotals.get(row.employeeId) ?? {
        count: 0,
        total: new Decimal(0),
      };
      entry.count += 1;
      entry.total = entry.total.plus(row.amount);
      componentTotals.set(row.employeeId, entry);
    }

    const pay = new Map<string, EmployeePay>();
    for (const [employeeId, { count, total }] of componentTotals) {
      pay.set(employeeId, {
        ...NO_PAY,
        componentsCount: count,
        componentsTotal: toMoneyString(total),
      });
    }
    for (const salary of salaries) {
      const components = componentTotals.get(salary.employeeId);
      const total = components?.total ?? new Decimal(0);
      pay.set(salary.employeeId, {
        basicSalary: toMoneyString(salary.monthlyBasicSalary),
        basicSalarySince: salary.createdAt,
        componentsCount: components?.count ?? 0,
        componentsTotal: toMoneyString(total),
        monthlyTotal: toMoneyString(total.plus(salary.monthlyBasicSalary)),
      });
    }
    return pay;
  }

  /** How many employees have each active component, by component id. */
  async usageCounts(): Promise<Map<string, number>> {
    const { assignments } = await this.activeRows();
    const counts = new Map<string, number>();
    for (const row of assignments) {
      counts.set(
        row.salaryComponentId,
        (counts.get(row.salaryComponentId) ?? 0) + 1,
      );
    }
    return counts;
  }
}
