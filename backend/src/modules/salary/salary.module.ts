import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module.js';
import { SalaryController } from './salary.controller.js';
import { SalaryService } from './salary.service.js';

@Module({
  imports: [EmployeesModule],
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService],
})
export class SalaryModule {}
