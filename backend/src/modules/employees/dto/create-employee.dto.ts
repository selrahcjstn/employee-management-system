import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsPastOrTodayDate, trim } from '../../../common/validators.js';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'EMP-001',
    maxLength: 50,
    description:
      'Business Employee ID. Unique (case-insensitive) and immutable.',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeNo: string;

  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: '2026-01-15',
    description: 'YYYY-MM-DD, not in the future',
  })
  @IsPastOrTodayDate()
  dateHired: string;
}
