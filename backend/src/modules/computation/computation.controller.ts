import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ComputationService } from './computation.service.js';
import {
  ComputationEntity,
  ComputationSummaryEntity,
} from './entities/computation.entity.js';

@ApiTags('computation')
@ApiBearerAuth()
@Controller('employees/:id/computation')
export class ComputationController {
  constructor(private readonly computation: ComputationService) {}

  @Get()
  @ApiOperation({
    summary:
      'Annual, daily, hourly and per-minute rates with the salary breakdown (PHP)',
  })
  @ApiOkResponse({ type: ComputationEntity })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  compute(@Param('id', ParseUUIDPipe) id: string) {
    return this.computation.compute(id);
  }
}

@ApiTags('computation')
@ApiBearerAuth()
@Controller('computations')
export class ComputationsController {
  constructor(private readonly computation: ComputationService) {}

  @Get()
  @ApiOperation({
    summary:
      'One line per employee with the monthly total and the annual, daily, hourly and per-minute rates (PHP)',
  })
  @ApiOkResponse({ type: [ComputationSummaryEntity] })
  computeAll() {
    return this.computation.computeAll();
  }
}
