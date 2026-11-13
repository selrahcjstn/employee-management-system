import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeeComponentsService } from './employee-components.service.js';
import { AddEmployeeComponentDto } from './dto/add-employee-component.dto.js';
import { UpdateEmployeeComponentDto } from './dto/update-employee-component.dto.js';
import { EmployeeComponentEntity } from './entities/salary-component.entity.js';

@ApiTags('employee-components')
@ApiBearerAuth()
@Controller('employees/:id/components')
export class EmployeeComponentsController {
  constructor(private readonly employeeComponents: EmployeeComponentsService) {}

  @Get()
  @ApiOperation({ summary: "List the employee's active components" })
  @ApiOkResponse({ type: [EmployeeComponentEntity] })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  list(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeComponents.list(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Add a component to an employee: an existing componentId, or a name (reused or created)',
  })
  @ApiCreatedResponse({ type: EmployeeComponentEntity })
  @ApiConflictResponse({
    description: 'Component is already assigned to this employee',
  })
  add(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddEmployeeComponentDto,
  ) {
    return this.employeeComponents.add(id, dto);
  }

  @Patch(':ecId')
  @ApiOperation({ summary: "Update an assigned component's amount" })
  @ApiOkResponse({ type: EmployeeComponentEntity })
  @ApiNotFoundResponse()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ecId', ParseUUIDPipe) ecId: string,
    @Body() dto: UpdateEmployeeComponentDto,
  ) {
    return this.employeeComponents.updateAmount(id, ecId, dto.amount);
  }

  @Delete(':ecId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove a component from an employee (soft delete the assignment)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ecId', ParseUUIDPipe) ecId: string,
  ) {
    return this.employeeComponents.remove(id, ecId);
  }
}
