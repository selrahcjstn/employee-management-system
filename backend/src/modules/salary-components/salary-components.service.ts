import { Injectable, NotFoundException } from '@nestjs/common';
import { conflictOnUnique } from '../../common/db-errors.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { active } from '../../prisma/soft-delete.js';
import { SalaryComponentEntity } from './entities/salary-component.entity.js';

const DUPLICATE_MESSAGE = 'Component name already exists';

@Injectable()
export class SalaryComponentsService {
  constructor(private readonly prisma: PrismaService) {}

  private get components() {
    return this.prisma.db.orm.public.SalaryComponent;
  }

  async list(): Promise<SalaryComponentEntity[]> {
    const rows = await this.components
      .with(active)
      .orderBy((c) => c.name.asc())
      .all();
    return rows.map((row) => SalaryComponentEntity.from(row));
  }

  async create(name: string): Promise<SalaryComponentEntity> {
    try {
      return SalaryComponentEntity.from(await this.components.create({ name }));
    } catch (error) {
      return conflictOnUnique(error, DUPLICATE_MESSAGE);
    }
  }

  /** The catalog name is shared, so a rename applies to every employee using it. */
  async rename(id: string, name: string): Promise<SalaryComponentEntity> {
    try {
      const row = await this.components
        .with(active)
        .where({ id })
        .update({ name });
      if (!row) throw new NotFoundException('Component not found');
      return SalaryComponentEntity.from(row);
    } catch (error) {
      return conflictOnUnique(error, DUPLICATE_MESSAGE);
    }
  }

  /** Soft deletes the component and all its active assignments in one transaction. */
  async remove(id: string): Promise<void> {
    await this.prisma.db.transaction(async (tx) => {
      const deletedAt = new Date();
      const row = await tx.orm.public.SalaryComponent.with(active)
        .where({ id })
        .update({ deletedAt });
      if (!row) throw new NotFoundException('Component not found');
      await tx.orm.public.EmployeeSalaryComponent.with(active)
        .where({ salaryComponentId: id })
        .updateAll({ deletedAt });
    });
  }
}
