import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trim } from '../../../common/validators.js';
import { EMPLOYEE_NO_MAX } from './create-employee.dto.js';

export class EmployeeExistsDto {
  @ApiProperty({
    example: 'EMP-001',
    description:
      'The Employee ID to look for. Trimmed; the case does not matter.',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(EMPLOYEE_NO_MAX)
  employeeNo: string;
}
