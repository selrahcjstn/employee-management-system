import { describe, expect, it } from 'vitest';
import {
  centavosToAmount,
  checkAmount,
  normalizeAmount,
  toCentavos,
} from './money';

describe('centavos', () => {
  it('reads decimal strings exactly and writes them back with two decimals', () => {
    expect(toCentavos('30000.50')).toBe(3000050n);
    expect(toCentavos('0.1')).toBe(10n);
    expect(toCentavos('99999999.99')).toBe(9999999999n);
    expect(centavosToAmount(3000050n)).toBe('30000.50');
    expect(centavosToAmount(5n)).toBe('0.05');
  });
});

describe('normalizeAmount', () => {
  it('writes every amount with exactly 2 decimals and no leading zeros', () => {
    expect(normalizeAmount('2000')).toBe('2000.00');
    expect(normalizeAmount('2000.5')).toBe('2000.50');
    expect(normalizeAmount('0002000')).toBe('2000.00');
    expect(normalizeAmount(' 0 ')).toBe('0.00');
  });
});

describe('checkAmount', () => {
  const rules = (allowZero: boolean) => ({
    name: 'Amount',
    required: 'Amount is required',
    example: '2000',
    allowZero,
  });

  it('accepts plain amounts, and zero only when allowed', () => {
    expect(checkAmount('2000', rules(true))).toBeUndefined();
    expect(checkAmount('0', rules(true))).toBeUndefined();
    expect(checkAmount('0.00', rules(true))).toBeUndefined();
    expect(checkAmount('0', rules(false))).toBe(
      'Amount must be greater than 0',
    );
  });

  it('names what is wrong', () => {
    expect(checkAmount('  ', rules(true))).toBe('Amount is required');
    expect(checkAmount('-1', rules(true))).toBe('Amount cannot be negative');
    expect(checkAmount('-1', rules(false))).toBe(
      'Amount must be greater than 0',
    );
    expect(checkAmount('1,000', rules(true))).toBe(
      'Enter a number, for example 2000 or 2000.50',
    );
    expect(checkAmount('1.234', rules(true))).toBe(
      'Use at most 2 decimal places',
    );
    expect(checkAmount('100000000', rules(true))).toBe(
      'Amount cannot be more than ₱99,999,999.99',
    );
    expect(checkAmount('99999999.99', rules(true))).toBeUndefined();
  });
});
