import { WORKING_DAYS_DIVISOR, computeRates } from './rates.js';

describe('computeRates', () => {
  it('matches the PRD worked example (basic 30,000 + 2,000 + 1,500 = 33,500)', () => {
    expect(computeRates('33500.00')).toEqual({
      annualSalary: '402000.00',
      dailyRate: '1280.25',
      hourlyRate: '160.03',
      perMinuteRate: '2.67',
    });
  });

  it('uses the constant divisor 314', () => {
    expect(WORKING_DAYS_DIVISOR).toBe(314);
  });

  it('never rounds between steps: hourly comes from the unrounded daily rate', () => {
    // Found by search: dividing the rounded daily (38.60) by 8 gives 4.825 -> 4.83,
    // while the unrounded daily gives 4.8248... -> 4.82. The spec requires 4.82.
    const rates = computeRates('1010.00');
    expect(rates.dailyRate).toBe('38.60');
    expect(rates.hourlyRate).toBe('4.82');
    expect(rates.hourlyRate).not.toBe('4.83');
  });

  it('is exact for amounts that binary floats cannot represent', () => {
    expect(computeRates('0.10').annualSalary).toBe('1.20');
    expect(computeRates('0.30').annualSalary).toBe('3.60');
    expect(computeRates('99999999.99').annualSalary).toBe('1199999999.88');
  });

  it('accepts decimal strings with any number of trailing zeros', () => {
    expect(computeRates('33500')).toEqual(computeRates('33500.00'));
  });
});
