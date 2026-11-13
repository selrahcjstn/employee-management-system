import { ApiProperty } from '@nestjs/swagger';
import { toMoneyString } from '../../../common/money.js';

export interface SalaryRow {
  id: string;
  employeeId: string;
  monthlyBasicSalary: string;
  deletedAt: Date | null;
  createdAt: Date;
}

export class SalaryEntity {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) employeeId: string;
  @ApiProperty({ example: '30000.00', description: 'Decimal string' })
  monthlyBasicSalary: string;
  @ApiProperty() createdAt: Date;

  static from(row: SalaryRow): SalaryEntity {
    const entity = new SalaryEntity();
    entity.id = row.id;
    entity.employeeId = row.employeeId;
    entity.monthlyBasicSalary = toMoneyString(row.monthlyBasicSalary);
    entity.createdAt = row.createdAt;
    return entity;
  }
}

export class SalaryHistoryEntity extends SalaryEntity {
  @ApiProperty({ description: 'When this salary was replaced by a newer one' })
  replacedAt: Date;

  static override from(row: SalaryRow): SalaryHistoryEntity {
    const entity = Object.assign(
      new SalaryHistoryEntity(),
      SalaryEntity.from(row),
    );
    entity.replacedAt = row.deletedAt!;
    return entity;
  }
}

export class AssignSalaryResultEntity {
  @ApiProperty({
    description:
      'false when the amount equals the current salary and nothing was written',
  })
  changed: boolean;
  @ApiProperty({ type: SalaryEntity }) salary: SalaryEntity;
}
