import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsPastOrTodayDate, trim } from '../../../common/validators.js';

/**
 * What an Employee ID may contain: letters, digits and hyphens (ASCII only). There is no fixed
 * shape such as EMP-001: the ID is typed by a person, and the only rule beyond this is that it is
 * unique ignoring case. It is saved in upper case.
 */
export const EMPLOYEE_NO_PATTERN = /^[A-Za-z0-9-]+$/;
export const EMPLOYEE_NO_MIN = 3;
export const EMPLOYEE_NO_MAX = 50;

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'EMP-001',
    maxLength: 50,
    description:
      'Business Employee ID, typed by the user: 3 to 50 letters, digits or hyphens. Saved in upper case. Unique (ignoring case) and immutable.',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(EMPLOYEE_NO_MIN, {
    message: 'Employee ID must be at least 3 characters',
  })
  @MaxLength(EMPLOYEE_NO_MAX)
  @Matches(EMPLOYEE_NO_PATTERN, {
    message: 'Employee ID can only use letters, numbers and hyphens',
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
