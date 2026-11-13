import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Employee ID shown to users' }) employeeNo: string;
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
