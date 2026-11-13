import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto.js';

/** Employee ID is immutable: it is not accepted here, and the global pipe rejects it as an unknown field. */
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['employeeNo'] as const),
) {}
