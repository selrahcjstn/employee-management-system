import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateEmployeeDto,
  EMPLOYEE_NO_PATTERN,
} from './create-employee.dto.js';

const base = { firstName: 'Ana', lastName: 'Reyes', dateHired: '2024-01-15' };

/** The validation messages for one Employee ID typed into an otherwise valid employee. */
async function messagesFor(employeeNo: unknown): Promise<string[]> {
  const dto = plainToInstance(CreateEmployeeDto, { ...base, employeeNo });
  const errors = await validate(dto);
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('CreateEmployeeDto employeeNo', () => {
  it.each(['EMP-001', 'EMP001', 'emp-001', 'ABC', 'a-1', 'X'.repeat(50)])(
    'accepts %s',
    async (value) => {
      expect(await messagesFor(value)).toEqual([]);
    },
  );

  it.each(['EMP 001', 'EMP_001', 'EMP.001', 'EMP/001', 'EMPÉ01', 'EMP#01'])(
    'rejects %s for its characters',
    async (value) => {
      expect(await messagesFor(value)).toContain(
        'Employee ID can only use letters, numbers and hyphens',
      );
    },
  );

  it('rejects fewer than 3 characters once trimmed', async () => {
    expect(await messagesFor('  AB ')).toContain(
      'Employee ID must be at least 3 characters',
    );
  });

  it('rejects more than 50 characters', async () => {
    expect((await messagesFor('X'.repeat(51))).length).toBeGreaterThan(0);
  });

  it('rejects an empty, missing or non-text ID', async () => {
    expect((await messagesFor('   ')).length).toBeGreaterThan(0);
    expect((await messagesFor(undefined)).length).toBeGreaterThan(0);
    expect((await messagesFor(123)).length).toBeGreaterThan(0);
  });

  it('exports the pattern with ASCII letters, digits and hyphens only', () => {
    expect(EMPLOYEE_NO_PATTERN.test('Az-09')).toBe(true);
    expect(EMPLOYEE_NO_PATTERN.test('é')).toBe(false);
  });
});
