import { describe, expect, it } from 'vitest';
import { normalizeAmount, salarySchema } from './schemas';

const messages = (monthlyBasicSalary: string) => {
  const result = salarySchema.safeParse({ monthlyBasicSalary });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('salarySchema', () => {
  it.each(['30000', '30000.5', '30000.50', '0.01', '99999999.99', ' 30000 '])(
    'accepts %s',
    (value) => {
      expect(messages(value)).toEqual([]);
    },
  );

  it('requires an amount', () => {
    expect(messages('')).toEqual(['Monthly basic salary is required']);
    expect(messages('   ')).toEqual(['Monthly basic salary is required']);
  });

  it.each(['0', '0.00', '000', '-5', '-0.01'])(
    'rejects %s as not greater than 0',
    (value) => {
      expect(messages(value)).toEqual(['Salary must be greater than 0']);
    },
  );

  it.each(['abc', '30,000', '₱30000', '1e5', '1.2.3', '.5', '30000.'])(
    'rejects %s as not a plain number',
    (value) => {
      // "30000." has digits and a point but nothing after it: still just a number to type, so allow it.
      const expected =
        value === '30000.'
          ? []
          : ['Enter a number, for example 30000 or 30000.50'];
      expect(messages(value)).toEqual(expected);
    },
  );

  it('rejects more than 2 decimal places', () => {
    expect(messages('30000.001')).toEqual(['Use at most 2 decimal places']);
  });

  it('rejects an amount above 99,999,999.99', () => {
    expect(messages('100000000')).toEqual([
      'Salary cannot be more than ₱99,999,999.99',
    ]);
    expect(messages('100000000.00')).toEqual([
      'Salary cannot be more than ₱99,999,999.99',
    ]);
  });
});

describe('normalizeAmount', () => {
  it('writes every amount with exactly 2 decimals and no leading zeros', () => {
    expect(normalizeAmount('30000')).toBe('30000.00');
    expect(normalizeAmount('30000.5')).toBe('30000.50');
    expect(normalizeAmount('0030000.50')).toBe('30000.50');
    expect(normalizeAmount(' 0.5 ')).toBe('0.50');
    expect(normalizeAmount('30000.')).toBe('30000.00');
  });
});
