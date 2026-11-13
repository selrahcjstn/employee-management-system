import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { conflictOnUnique } from '../../common/db-errors.js';
import { escapeLike } from '../../common/sql.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { NO_PAY, PaySummaryService } from '../pay/pay-summary.service.js';
import {
  EmployeeEntity,
  EmployeeListItemEntity,
} from './entities/employee.entity.js';

const DUPLICATE_MESSAGE = 'Employee ID already exists';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pay: PaySummaryService,
  ) {}

  private get employees() {
    return this.prisma.db.orm.public.Employee;
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    try {
      const row = await this.employees.create({
        employeeNo: dto.employeeNo,
        firstName: dto.firstName,
        middleName: dto.middleName || null,
        lastName: dto.lastName,
        dateHired: dto.dateHired,
      });
      return EmployeeEntity.from(row);
    } catch (error) {
      return conflictOnUnique(error, DUPLICATE_MESSAGE);
    }
  }

  async list(search?: string): Promise<EmployeeListItemEntity[]> {
    const pattern = search ? `%${escapeLike(search)}%` : undefined;
    const query = pattern
      ? this.employees.where((e) =>
          or(
            e.employeeNo.ilike(pattern),
            e.firstName.ilike(pattern),
            e.middleName.ilike(pattern),
            e.lastName.ilike(pattern),
          ),
        )
      : this.employees;
    const rows = await query.orderBy((e) => e.employeeNo.asc()).all();
    const pay = await this.pay.forAll();
    return rows.map((row) =>
      EmployeeListItemEntity.withPay(row, pay.get(row.id) ?? NO_PAY),
    );
  }

  async findOne(id: string): Promise<EmployeeEntity> {
    const row = await this.employees.where({ id }).first();
    if (!row) throw new NotFoundException('Employee not found');
    return EmployeeEntity.from(row);
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeEntity> {
    const changes = {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.middleName !== undefined && {
        middleName: dto.middleName || null,
      }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.dateHired !== undefined && { dateHired: dto.dateHired }),
    };
    if (Object.keys(changes).length === 0)
      throw new BadRequestException('Nothing to update');
    const row = await this.employees.where({ id }).update(changes);
    if (!row) throw new NotFoundException('Employee not found');
    return EmployeeEntity.from(row);
  }
}
