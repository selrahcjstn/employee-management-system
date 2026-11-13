import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatPeso } from './format';
import { todayInManila } from './today';

describe('formatPeso', () => {
  it('formats a decimal string as pesos with thousands separators and two decimals', () => {
    expect(formatPeso('33500.00')).toBe('₱33,500.00');
    expect(formatPeso('30000')).toBe('₱30,000.00');
    expect(formatPeso('0.5')).toBe('₱0.50');
    expect(formatPeso('99999999.99')).toBe('₱99,999,999.99');
  });
});

describe('formatDate', () => {
  it('formats a calendar date as "MMM d, yyyy"', () => {
    expect(formatDate('2023-01-16')).toBe('Jan 16, 2023');
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
    expect(formatDate('2026-11-13')).toBe('Nov 13, 2026');
  });
});

describe('todayInManila', () => {
  afterEach(() => vi.useRealTimers());

  it('is a YYYY-MM-DD date', () => {
    expect(todayInManila()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is the Manila date, which is already tomorrow late in the UTC day', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-13T17:00:00Z'));
    expect(todayInManila()).toBe('2026-11-14');
    vi.setSystemTime(new Date('2026-11-13T15:59:00Z'));
    expect(todayInManila()).toBe('2026-11-13');
  });
});
