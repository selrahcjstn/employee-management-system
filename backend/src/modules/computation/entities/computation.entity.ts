import { ApiProperty } from '@nestjs/swagger';

class ComputationEmployee {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'EMP-001' }) employeeNo: string;
  @ApiProperty({ example: 'Juan D. Cruz' }) name: string;
}

class ComputationComponent {
  @ApiProperty({ example: 'Rice Allowance' }) name: string;
  @ApiProperty({ example: '2000.00' }) amount: string;
}

export class ComputationEntity {
  @ApiProperty({ type: ComputationEmployee }) employee: ComputationEmployee;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '30000.00',
    description:
      'Active basic salary, or null when none is assigned (empty state)',
  })
  basicSalary: string | null;

  @ApiProperty({ type: [ComputationComponent] })
  components: ComputationComponent[];

  @ApiProperty({ example: '3500.00' }) componentsTotal: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '33500.00',
    description:
      'Basic salary plus active components; null with no basic salary',
  })
  monthlyTotal: string | null;

  @ApiProperty({ nullable: true, type: String, example: '402000.00' })
  annualSalary: string | null;
  @ApiProperty({ nullable: true, type: String, example: '1280.25' })
  dailyRate: string | null;
  @ApiProperty({ nullable: true, type: String, example: '160.03' })
  hourlyRate: string | null;
  @ApiProperty({ nullable: true, type: String, example: '2.67' })
  perMinuteRate: string | null;

  @ApiProperty({ example: 314 }) workingDaysDivisor: number;
  @ApiProperty({ example: 'PHP' }) currency: string;
}

export class ComputationSummaryEntity {
  @ApiProperty({ type: ComputationEmployee }) employee: ComputationEmployee;

  @ApiProperty({ nullable: true, type: String, example: '30000.00' })
  basicSalary: string | null;
  @ApiProperty({ example: '3500.00' }) componentsTotal: string;
  @ApiProperty({
    nullable: true,
    type: String,
    example: '33500.00',
    description:
      'Basic salary plus active components; null with no basic salary',
  })
  monthlyTotal: string | null;
  @ApiProperty({ nullable: true, type: String, example: '402000.00' })
  annualSalary: string | null;
  @ApiProperty({ nullable: true, type: String, example: '1280.25' })
  dailyRate: string | null;
  @ApiProperty({ nullable: true, type: String, example: '160.03' })
  hourlyRate: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    example: '2.6672',
    description: 'Four decimals here, because the rate is small',
  })
  perMinuteRate: string | null;
}
