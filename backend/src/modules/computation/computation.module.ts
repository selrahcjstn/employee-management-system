import { Module } from '@nestjs/common';
import { EmployeesModule } from '../employees/employees.module.js';
import { SalaryComponentsModule } from '../salary-components/salary-components.module.js';
import { SalaryModule } from '../salary/salary.module.js';
import {
  ComputationController,
  ComputationsController,
} from './computation.controller.js';
import { ComputationService } from './computation.service.js';

@Module({
  imports: [EmployeesModule, SalaryModule, SalaryComponentsModule],
  controllers: [ComputationController, ComputationsController],
  providers: [ComputationService],
})
export class ComputationModule {}
