import { ApiProperty } from '@nestjs/swagger';
import { toMoneyString } from '../../../common/money.js';

export interface SalaryComponentRow {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeComponentRow {
  id: string;
  salaryComponentId: string;
  amount: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SalaryComponentEntity {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Rice Allowance' }) name: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(row: SalaryComponentRow): SalaryComponentEntity {
    const entity = new SalaryComponentEntity();
    entity.id = row.id;
    entity.name = row.name;
    entity.createdAt = row.createdAt;
    entity.updatedAt = row.updatedAt;
    return entity;
  }
}

export class EmployeeComponentEntity {
  @ApiProperty({
    format: 'uuid',
    description: 'The assignment id (use it in PATCH/DELETE)',
  })
  id: string;
  @ApiProperty({ format: 'uuid' }) componentId: string;
  @ApiProperty({ example: 'Rice Allowance' }) name: string;
  @ApiProperty({ example: '2000.00', description: 'Decimal string' })
  amount: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(
    row: EmployeeComponentRow,
    name: string,
  ): EmployeeComponentEntity {
    const entity = new EmployeeComponentEntity();
    entity.id = row.id;
    entity.componentId = row.salaryComponentId;
    entity.name = name;
    entity.amount = toMoneyString(row.amount);
    entity.createdAt = row.createdAt;
    entity.updatedAt = row.updatedAt;
    return entity;
  }
}
