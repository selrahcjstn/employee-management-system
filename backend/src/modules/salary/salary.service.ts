import { Injectable, NotFoundException } from '@nestjs/common';
import { conflictOnUnique } from '../../common/db-errors.js';
import { Decimal } from '../../common/money.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { active, softDeleted } from '../../prisma/soft-delete.js';
import { EmployeesService } from '../employees/employees.service.js';
import {
  AssignSalaryResultEntity,
  SalaryEntity,
  SalaryHistoryEntity,
} from './entities/salary.entity.js';

@Injectable()
export class SalaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employees: EmployeesService,
  ) {}

  private get salaries() {
    return this.prisma.db.orm.public.SalaryAssignment;
  }

  /** The one active salary row, or null when none is assigned. Used by computation too. */
  findActive(employeeId: string) {
    return this.salaries.with(active).where({ employeeId }).first();
  }

  async getCurrent(employeeId: string): Promise<SalaryEntity> {
    await this.employees.findOne(employeeId);
    const row = await this.findActive(employeeId);
    if (!row) throw new NotFoundException('No basic salary assigned');
    return SalaryEntity.from(row);
  }

  async history(employeeId: string): Promise<SalaryHistoryEntity[]> {
    await this.employees.findOne(employeeId);
    const rows = await this.salaries
      .with(softDeleted)
      .where({ employeeId })
      .orderBy((row) => row.deletedAt.desc())
      .all();
    return rows.map((row) => SalaryHistoryEntity.from(row));
  }

  /**
   * Assigns or adjusts the basic salary. An adjustment soft deletes the active row and inserts a
   * new one in one transaction, so history is kept and a failed insert leaves the old row active.
   */
  async assign(
    employeeId: string,
    amount: string,
  ): Promise<AssignSalaryResultEntity> {
    await this.employees.findOne(employeeId);
    try {
      return await this.prisma.db.transaction(async (tx) => {
        const salaries = tx.orm.public.SalaryAssignment;
        const current = await salaries
          .with(active)
          .where({ employeeId })
          .forUpdate()
          .first();
        if (current && new Decimal(current.monthlyBasicSalary).equals(amount)) {
          return { changed: false, salary: SalaryEntity.from(current) };
        }
        if (current) {
          await salaries
            .with(active)
            .where({ id: current.id })
            .update({ deletedAt: new Date() });
        }
        const created = await salaries.create({
          employeeId,
          monthlyBasicSalary: amount,
        });
        return { changed: true, salary: SalaryEntity.from(created) };
      });
    } catch (error) {
      return conflictOnUnique(
        error,
        'Salary was changed by another request, please retry',
      );
    }
  }
}
