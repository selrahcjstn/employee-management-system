import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMoneyString, trim } from '../../../common/validators.js';

export class AssignSalaryDto {
  @ApiProperty({
    example: '30000.00',
    description:
      'Monthly basic salary as a decimal string: greater than 0, at most 2 decimals, at most 99999999.99',
  })
  @Transform(trim)
  @IsMoneyString({ allowZero: false })
  monthlyBasicSalary: string;
}
