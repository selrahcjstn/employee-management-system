import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMoneyString, trim } from '../../../common/validators.js';

export class UpdateEmployeeComponentDto {
  @ApiProperty({
    example: '2500.00',
    description:
      'Decimal string, zero or more, at most 2 decimals, at most 99999999.99',
  })
  @Transform(trim)
  @IsMoneyString({ allowZero: true })
  amount: string;
}
