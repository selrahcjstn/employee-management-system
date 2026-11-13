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
import { ComponentNameDto } from './dto/component-name.dto.js';
import {
  SalaryComponentEntity,
  SalaryComponentListItemEntity,
} from './entities/salary-component.entity.js';
import { SalaryComponentsService } from './salary-components.service.js';

@ApiTags('salary-components')
@ApiBearerAuth()
@Controller('salary-components')
export class SalaryComponentsController {
  constructor(private readonly components: SalaryComponentsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List active components with how many employees use each (also used for autocomplete)',
  })
  @ApiOkResponse({ type: [SalaryComponentListItemEntity] })
  list() {
    return this.components.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a component name' })
  @ApiCreatedResponse({ type: SalaryComponentEntity })
  @ApiConflictResponse({ description: 'Component name already exists' })
  create(@Body() dto: ComponentNameDto) {
    return this.components.create(dto.name);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Rename a component. Applies to every employee using it.',
  })
  @ApiOkResponse({ type: SalaryComponentEntity })
  @ApiNotFoundResponse()
  @ApiConflictResponse({ description: 'Component name already exists' })
  rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ComponentNameDto,
  ) {
    return this.components.rename(id, dto.name);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Soft delete a component and all its active assignments (one transaction)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.components.remove(id);
  }
}
