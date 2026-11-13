import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module.js';
import { EmployeeComponentsController } from './employee-components.controller.js';
import { EmployeeComponentsService } from './employee-components.service.js';
import { SalaryComponentsController } from './salary-components.controller.js';
import { SalaryComponentsService } from './salary-components.service.js';

@Module({
  imports: [EmployeesModule],
  controllers: [SalaryComponentsController, EmployeeComponentsController],
  providers: [SalaryComponentsService, EmployeeComponentsService],
  exports: [EmployeeComponentsService],
})
export class SalaryComponentsModule {}
