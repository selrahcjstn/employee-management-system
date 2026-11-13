import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AssignSalaryDto } from './dto/assign-salary.dto.js';
import {
  AssignSalaryResultEntity,
  SalaryEntity,
  SalaryHistoryEntity,
} from './entities/salary.entity.js';
import { SalaryService } from './salary.service.js';

@ApiTags('salary')
@ApiBearerAuth()
@Controller('employees/:id/salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Put()
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Assign or adjust the monthly basic salary (old row is soft deleted, new row inserted)',
  })
  @ApiOkResponse({ type: AssignSalaryResultEntity })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignSalaryDto) {
    return this.salaryService.assign(id, dto.monthlyBasicSalary);
  }

  @Get()
  @ApiOperation({ summary: 'Get the active basic salary' })
  @ApiOkResponse({ type: SalaryEntity })
  @ApiNotFoundResponse({
    description: 'Employee not found, or no salary assigned',
  })
  getCurrent(@Param('id', ParseUUIDPipe) id: string) {
    return this.salaryService.getCurrent(id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Previous (soft deleted) salaries, newest first' })
  @ApiOkResponse({ type: [SalaryHistoryEntity] })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  history(@Param('id', ParseUUIDPipe) id: string) {
    return this.salaryService.history(id);
  }
}
