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

  describe('Employee ID rules: letters, digits and hyphens, 3 to 50, trimmed, saved in upper case', () => {
    it.each([
      'EMP-001',
      'EMP001',
      'emp-001',
      'ABC',
      'a1-b2',
      'STAFF-42',
      'X'.repeat(50),
    ])('accepts %s', (employeeNo) => {
      expect(messages({ employeeNo })).toEqual([]);
    });

    it.each([
      ['EMP 001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMP_001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMP.001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMP/001', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMPÉ01', 'Employee ID can only use letters, numbers and hyphens'],
      ['EMP#01', 'Employee ID can only use letters, numbers and hyphens'],
      ['AB', 'Employee ID must be at least 3 characters'],
      ['  AB  ', 'Employee ID must be at least 3 characters'],
    ])('rejects "%s"', (employeeNo, message) => {
      expect(messages({ employeeNo })).toEqual([message]);
    });

    it('rejects 51 characters', () => {
      expect(messages({ employeeNo: 'X'.repeat(51) })).toEqual([
        'Employee ID must be 50 characters or fewer',
      ]);
    });

    it('no longer insists on the EMP-001 shape', () => {
      expect(messages({ employeeNo: 'EMP001' })).toEqual([]);
      expect(messages({ employeeNo: 'STAFF-7' })).toEqual([]);
    });

    it('trims and upper-cases what it returns, so emp-007 is saved as EMP-007', () => {
      expect(
        employeeSchema.parse({ ...valid, employeeNo: ' emp-007 ' }).employeeNo,
      ).toBe('EMP-007');
    });
  });

  describe('editEmployeeSchema', () => {
    it('does not check the ID at all, so a row with any older kind of ID can still be edited', () => {
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
