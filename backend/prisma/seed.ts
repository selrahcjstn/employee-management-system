import 'dotenv/config';
import { hashPassword } from '../src/common/password.js';
import { db } from '../src/prisma/db.js';
import { active } from '../src/prisma/soft-delete.js';

interface SampleEmployee {
  employeeNo: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateHired: string;
  /** Monthly basic salary, or null to leave the employee without one ("Not assigned"). */
  salary: string | null;
  components: [name: string, amount: string][];
}

/** The first employee is the PRD worked example: 30,000 + 2,000 + 1,500 = 33,500 per month. */
const SAMPLE_EMPLOYEES: SampleEmployee[] = [
  {
    employeeNo: 'EMP-001',
    firstName: 'Juan',
    middleName: 'Dela',
    lastName: 'Cruz',
    dateHired: '2023-01-16',
    salary: '30000.00',
    components: [
      ['Rice Allowance', '2000.00'],
      ['Transportation', '1500.00'],
    ],
  },
  {
    employeeNo: 'EMP-002',
    firstName: 'Maria',
    middleName: 'Santos',
    lastName: 'Reyes',
    dateHired: '2022-08-01',
    salary: '45000.00',
    components: [
      ['Rice Allowance', '2000.00'],
      ['Communication Allowance', '800.50'],
    ],
  },
  {
    employeeNo: 'EMP-003',
    firstName: 'Jose',
    middleName: null,
    lastName: 'Garcia',
    dateHired: '2024-03-04',
    salary: '28500.00',
    components: [],
  },
  {
    employeeNo: 'EMP-004',
    firstName: 'Ana',
    middleName: 'Lim',
    lastName: 'Villanueva',
    dateHired: '2025-06-02',
    salary: null,
    components: [],
  },
];

const email = process.env['SEED_ADMIN_EMAIL']?.trim().toLowerCase();
const password = process.env['SEED_ADMIN_PASSWORD'];
const fullName = process.env['SEED_ADMIN_NAME']?.trim() || 'Administrator';

if (!email || !password) {
  throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
}

const users = db.orm.public.User;
if (await users.where({ email }).first()) {
  console.log(`Admin ${email} already exists, skipped`);
} else {
  await users.create({
    email,
    passwordHash: await hashPassword(password),
    fullName,
    role: 'admin',
  });
  console.log(`Created admin ${email}`);
}

for (const sample of SAMPLE_EMPLOYEES) {
  if (
    await db.orm.public.Employee.where({
      employeeNo: sample.employeeNo,
    }).first()
  ) {
    console.log(`Employee ${sample.employeeNo} already exists, skipped`);
    continue;
  }
  await db.transaction(async (tx) => {
    const employee = await tx.orm.public.Employee.create({
      employeeNo: sample.employeeNo,
      firstName: sample.firstName,
      middleName: sample.middleName,
      lastName: sample.lastName,
      dateHired: sample.dateHired,
    });
    if (sample.salary) {
      await tx.orm.public.SalaryAssignment.create({
        employeeId: employee.id,
        monthlyBasicSalary: sample.salary,
      });
    }
    for (const [name, amount] of sample.components) {
      const component =
        (await tx.orm.public.SalaryComponent.with(active)
          .where({ name })
          .first()) ?? (await tx.orm.public.SalaryComponent.create({ name }));
      await tx.orm.public.EmployeeSalaryComponent.create({
        employeeId: employee.id,
        salaryComponentId: component.id,
        amount,
      });
    }
  });
  console.log(`Created employee ${sample.employeeNo}`);
}

await db.close();
