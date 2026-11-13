import { Injectable } from '@nestjs/common';
import { Decimal, toMoneyString } from '../../common/money.js';
import { EmployeesService } from '../employees/employees.service.js';
import { EmployeeComponentsService } from '../salary-components/employee-components.service.js';
import { SalaryService } from '../salary/salary.service.js';
import { formatEmployeeName } from './employee-name.js';
import { ComputationEntity } from './entities/computation.entity.js';
import { WORKING_DAYS_DIVISOR, computeRates } from './rates.js';

@Injectable()
export class ComputationService {
  constructor(
    private readonly employees: EmployeesService,
    private readonly salary: SalaryService,
    private readonly employeeComponents: EmployeeComponentsService,
  ) {}

  /**
   * Monthly salary = active basic salary + active components, computed on the server in
   * decimals. With no basic salary the rates are null so the client can show an empty state.
   */
  async compute(employeeId: string): Promise<ComputationEntity> {
    const employee = await this.employees.findOne(employeeId);
    const [salary, components] = await Promise.all([
      this.salary.findActive(employeeId),
      this.employeeComponents.listActive(employeeId),
    ]);

    const componentsTotal = components.reduce(
      (sum, component) => sum.plus(component.amount),
      new Decimal(0),
    );
    const monthlyTotal = salary
      ? new Decimal(salary.monthlyBasicSalary).plus(componentsTotal)
      : null;
    const rates = monthlyTotal ? computeRates(monthlyTotal) : undefined;

    return {
      employee: {
        id: employee.id,
        employeeNo: employee.employeeNo,
        name: formatEmployeeName(
          employee.firstName,
          employee.middleName,
          employee.lastName,
        ),
      },
      basicSalary: salary ? toMoneyString(salary.monthlyBasicSalary) : null,
      components: components.map(({ name, amount }) => ({ name, amount })),
      componentsTotal: toMoneyString(componentsTotal),
      monthlyTotal: monthlyTotal ? toMoneyString(monthlyTotal) : null,
      annualSalary: rates?.annualSalary ?? null,
      dailyRate: rates?.dailyRate ?? null,
      hourlyRate: rates?.hourlyRate ?? null,
      perMinuteRate: rates?.perMinuteRate ?? null,
      workingDaysDivisor: WORKING_DAYS_DIVISOR,
      currency: 'PHP',
    };
  }
}
