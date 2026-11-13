import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { conflictOnUnique, isUniqueViolation } from '../../common/db-errors.js';
import { escapeLike } from '../../common/sql.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { active } from '../../prisma/soft-delete.js';
import { EmployeesService } from '../employees/employees.service.js';
import type { AddEmployeeComponentDto } from './dto/add-employee-component.dto.js';
import { EmployeeComponentEntity } from './entities/salary-component.entity.js';

type Db = PrismaService['db'];
type Client = Pick<Db, 'orm'>;

@Injectable()
export class EmployeeComponentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employees: EmployeesService,
  ) {}

  private get assignments() {
    return this.prisma.db.orm.public.EmployeeSalaryComponent;
  }

  async list(employeeId: string): Promise<EmployeeComponentEntity[]> {
    await this.employees.findOne(employeeId);
    return this.listActive(employeeId);
  }

  /** Active assignments with their component names, sorted by name. Used by computation too. */
  async listActive(employeeId: string): Promise<EmployeeComponentEntity[]> {
    const rows = await this.assignments
      .with(active)
      .where({ employeeId })
      .all();
    if (rows.length === 0) return [];
    const components = await this.prisma.db.orm.public.SalaryComponent.with(
      active,
    )
      .where((c) => c.id.in(rows.map((row) => row.salaryComponentId)))
      .all();
    const names = new Map(components.map((c) => [c.id, c.name]));
    return rows
      .filter((row) => names.has(row.salaryComponentId))
      .map((row) =>
        EmployeeComponentEntity.from(row, names.get(row.salaryComponentId)!),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async add(
    employeeId: string,
    dto: AddEmployeeComponentDto,
  ): Promise<EmployeeComponentEntity> {
    await this.employees.findOne(employeeId);
    if ((dto.componentId === undefined) === (dto.name === undefined)) {
      throw new BadRequestException('Send either componentId or name');
    }
    return this.prisma.db.transaction(async (tx) => {
      const component = dto.componentId
        ? await this.findComponent(tx, dto.componentId)
        : await this.findOrCreateByName(tx, dto.name!);
      try {
        const row = await tx.orm.public.EmployeeSalaryComponent.create({
          employeeId,
          salaryComponentId: component.id,
          amount: dto.amount,
        });
        return EmployeeComponentEntity.from(row, component.name);
      } catch (error) {
        return conflictOnUnique(
          error,
          'Component is already assigned to this employee',
        );
      }
    });
  }

  async updateAmount(
    employeeId: string,
    assignmentId: string,
    amount: string,
  ): Promise<EmployeeComponentEntity> {
    await this.employees.findOne(employeeId);
    const row = await this.assignments
      .with(active)
      .where({ id: assignmentId, employeeId })
      .update({ amount });
    if (!row) throw new NotFoundException('Employee component not found');
    const component = await this.findComponent(
      this.prisma.db,
      row.salaryComponentId,
    );
    return EmployeeComponentEntity.from(row, component.name);
  }

  /** Soft deletes the assignment only; the catalog name stays and can be added again. */
  async remove(employeeId: string, assignmentId: string): Promise<void> {
    await this.employees.findOne(employeeId);
    const row = await this.assignments
      .with(active)
      .where({ id: assignmentId, employeeId })
      .update({ deletedAt: new Date() });
    if (!row) throw new NotFoundException('Employee component not found');
  }

  private async findComponent(client: Client, id: string) {
    const component = await client.orm.public.SalaryComponent.with(active)
      .where({ id })
      .first();
    if (!component) throw new NotFoundException('Component not found');
    return component;
  }

  /** Reuses the active component with this name (any case), or creates it. */
  private async findOrCreateByName(client: Client, name: string) {
    const components = client.orm.public.SalaryComponent;
    const existing = await components
      .with(active)
      .where((c) => c.name.ilike(escapeLike(name)))
      .first();
    if (existing) return existing;
    try {
      return await components.create({ name });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Component name was created by another request, please retry',
        );
      }
      throw error;
    }
  }
}
