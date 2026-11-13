import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  IsPastOrTodayDate,
  trim,
  trimUpperCase,
} from '../../../common/validators.js';

/** The business Employee ID: EMP- and at least three digits (EMP-001, EMP-1042). */
export const EMPLOYEE_NO_PATTERN = /^EMP-\d{3,}$/;

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'EMP-001',
    maxLength: 50,
    description:
      'Business Employee ID: EMP- and at least 3 digits. Saved in upper case. Unique and immutable.',
  })
  @Transform(trimUpperCase)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(EMPLOYEE_NO_PATTERN, {
    message: 'Employee ID must look like EMP-001',
  })
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
