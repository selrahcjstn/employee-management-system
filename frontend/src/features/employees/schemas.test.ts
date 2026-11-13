import { afterEach, describe, expect, it, vi } from 'vitest';
import { editEmployeeSchema, employeeSchema } from './schemas';

const valid = {
  employeeNo: 'EMP-001',
  firstName: 'Ana',
  middleName: '',
  lastName: 'Reyes',
  dateHired: '2024-01-15',
};

const messages = (input: object) => {
  const result = employeeSchema.safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('employeeSchema', () => {
  afterEach(() => vi.useRealTimers());

  it('accepts a complete employee and trims the text fields', () => {
    const result = employeeSchema.parse({
      ...valid,
      employeeNo: ' EMP-001 ',
      middleName: ' Cruz ',
    });
    expect(result.employeeNo).toBe('EMP-001');
    expect(result.middleName).toBe('Cruz');
  });

  it('requires the Employee ID, first name, last name and date hired', () => {
    expect(
      messages({ employeeNo: ' ', firstName: '', lastName: '', dateHired: '' }),
    ).toEqual([
      'Employee ID is required',
      'First name is required',
      'Last name is required',
      'Date hired is required',
    ]);
  });

  it('allows the middle name to be empty', () => {
    expect(messages({ middleName: '' })).toEqual([]);
  });

  it('limits lengths like the API', () => {
    expect(messages({ employeeNo: 'x'.repeat(51) })).toEqual([
      'Employee ID must be 50 characters or fewer',
    ]);
    expect(messages({ firstName: 'x'.repeat(101) })).toEqual([
      'First name must be 100 characters or fewer',
    ]);
    expect(messages({ middleName: 'x'.repeat(101) })).toEqual([
      'Middle name must be 100 characters or fewer',
    ]);
  });

  it('rejects a date that is not a real day', () => {
    expect(messages({ dateHired: '2026-02-30' })).toEqual([
      'Enter a valid date',
    ]);
    expect(messages({ dateHired: 'soon' })).toEqual(['Enter a valid date']);
  });

  it('rejects a date after today in Manila, and allows today', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-13T17:00:00Z')); // already Nov 14 in Manila
    expect(messages({ dateHired: '2026-11-14' })).toEqual([]);
    expect(messages({ dateHired: '2026-11-15' })).toEqual([
      'Date hired cannot be in the future',
    ]);
  });

  describe('Employee ID format', () => {
    it.each(['EMP-001', 'EMP-1042', 'EMP-0000001'])(
      'accepts %s',
      (employeeNo) => {
        expect(messages({ employeeNo })).toEqual([]);
      },
    );

    it.each([
      'EMP001',
      'E-001',
      'EMP-12',
      'EMP-12a',
      'EMP-',
      'EMP 001',
      'ABC-001',
    ])('rejects %s', (employeeNo) => {
      expect(messages({ employeeNo })).toEqual([
        'Employee ID must look like EMP-001',
      ]);
    });

    it('saves it in upper case, so emp-001 becomes EMP-001', () => {
      expect(
        employeeSchema.parse({ ...valid, employeeNo: ' emp-007 ' }).employeeNo,
      ).toBe('EMP-007');
    });
  });

  describe('editEmployeeSchema', () => {
    it('does not check the format, so a row created before the rule (EMP001) can still be edited', () => {
      expect(
        editEmployeeSchema.safeParse({ ...valid, employeeNo: 'EMP001' })
          .success,
      ).toBe(true);
    });

    it('still checks the other fields', () => {
      expect(
        editEmployeeSchema.safeParse({ ...valid, firstName: '' }).success,
      ).toBe(false);
    });
  });
});
