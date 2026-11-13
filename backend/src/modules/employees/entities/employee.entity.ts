import { ApiProperty } from '@nestjs/swagger';
import type { EmployeePay } from '../../pay/pay-summary.service.js';

export interface EmployeeRow {
  id: string;
  employeeNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateHired: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeEntity {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ description: 'Employee ID shown to users' })
  employeeNo: string;
  @ApiProperty() firstName: string;
  @ApiProperty({ nullable: true, type: String }) middleName: string | null;
  @ApiProperty() lastName: string;
  @ApiProperty({ example: '2026-01-15' }) dateHired: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(row: EmployeeRow): EmployeeEntity {
    const entity = new EmployeeEntity();
    entity.id = row.id;
    entity.employeeNo = row.employeeNo;
    entity.firstName = row.firstName;
    entity.middleName = row.middleName;
    entity.lastName = row.lastName;
    entity.dateHired = row.dateHired;
    entity.createdAt = row.createdAt;
    entity.updatedAt = row.updatedAt;
    return entity;
  }
}

export class EmployeeListItemEntity extends EmployeeEntity {
  @ApiProperty({
    nullable: true,
    type: String,
    example: '30000.00',
    description: 'Active basic salary, or null when not assigned',
  })
  currentBasicSalary: string | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'When the active basic salary was assigned, or null with none',
  })
  basicSalarySince: Date | null;

  @ApiProperty({ example: 2, description: 'Active components' })
  componentsCount: number;

  @ApiProperty({ example: '3500.00', description: 'Sum of active components' })
  componentsTotal: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '33500.00',
    description: 'Basic salary plus active components; null with no salary',
  })
  monthlyTotal: string | null;

  static withPay(row: EmployeeRow, pay: EmployeePay): EmployeeListItemEntity {
    return Object.assign(
      new EmployeeListItemEntity(),
      EmployeeEntity.from(row),
      {
        currentBasicSalary: pay.basicSalary,
        basicSalarySince: pay.basicSalarySince,
        componentsCount: pay.componentsCount,
        componentsTotal: pay.componentsTotal,
        monthlyTotal: pay.monthlyTotal,
      },
    );
  }
}
