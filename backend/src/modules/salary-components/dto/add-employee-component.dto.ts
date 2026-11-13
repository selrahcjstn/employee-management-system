import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IsMoneyString, trim } from '../../../common/validators.js';

export class AddEmployeeComponentDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'An existing component. Send this or name, not both.',
  })
  @IsOptional()
  @IsUUID()
  componentId?: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description:
      'Reuses the active component with this name (any case), or creates it. Send this or componentId.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: '2000.00',
    description:
      'Decimal string, zero or more, at most 2 decimals, at most 99999999.99',
  })
  @Transform(trim)
  @IsMoneyString({ allowZero: true })
  amount: string;
}
