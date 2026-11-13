import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { ListEmployeesDto } from './dto/list-employees.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import {
  EmployeeEntity,
  EmployeeListItemEntity,
} from './entities/employee.entity.js';
import { EmployeesService } from './employees.service.js';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Onboard an employee' })
  @ApiCreatedResponse({ type: EmployeeEntity })
  @ApiConflictResponse({ description: 'Employee ID already exists' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees, optionally filtered by ?search=' })
  @ApiOkResponse({ type: [EmployeeListItemEntity] })
  list(@Query() query: ListEmployeesDto) {
    return this.employeesService.list(query.search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one employee' })
  @ApiOkResponse({ type: EmployeeEntity })
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee (Employee ID cannot change)' })
  @ApiOkResponse({ type: EmployeeEntity })
  @ApiNotFoundResponse()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, dto);
  }
}
