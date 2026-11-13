import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtAuthGuard } from './common/jwt-auth.guard.js';
import { RejectInvalidTextMiddleware } from './common/reject-invalid-text.middleware.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ComputationModule } from './modules/computation/computation.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SalaryComponentsModule } from './modules/salary-components/salary-components.module.js';
import { SalaryModule } from './modules/salary/salary.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    EmployeesModule,
    SalaryModule,
    SalaryComponentsModule,
    ComputationModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RejectInvalidTextMiddleware).forRoutes('*');
  }
}
