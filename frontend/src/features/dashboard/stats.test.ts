import { describe, expect, it } from 'vitest';
import { makeEmployee } from '../../test/employees-server';
import { centavosToAmount, toCentavos } from '../../shared/lib/money';
import { computeStats } from './stats';

const TODAY = '2026-11-13';

describe('money in centavos', () => {
  it('reads decimal strings exactly', () => {
    expect(toCentavos('30000.50')).toBe(3000050n);
    expect(toCentavos('30000')).toBe(3000000n);
    expect(toCentavos('0.1')).toBe(10n);
    expect(toCentavos('99999999.99')).toBe(9999999999n);
  });

  it('writes them back with two decimals', () => {
    expect(centavosToAmount(3000050n)).toBe('30000.50');
    expect(centavosToAmount(5n)).toBe('0.05');
    expect(centavosToAmount(0n)).toBe('0.00');
  });
});

describe('computeStats', () => {
  it('is all zeros for no employees, with no average', () => {
    const stats = computeStats([], TODAY);
    expect(stats).toMatchObject({
      total: 0,
      hiredRecently: 0,
      withSalary: 0,
      payroll: '0.00',
      average: null,
    });
    expect(stats.withoutSalary).toEqual([]);
  });

  it('adds salaries without float error, and averages only those who have one', () => {
    const stats = computeStats(
      [
        makeEmployee({ currentBasicSalary: '0.10' }),
        makeEmployee({ currentBasicSalary: '0.20' }),
        makeEmployee({ currentBasicSalary: null }),
      ],
      TODAY,
    );
    // 0.1 + 0.2 is 0.30000000000000004 as floats.
    expect(stats.payroll).toBe('0.30');
    expect(stats.average).toBe('0.15');
    expect(stats.withSalary).toBe(2);
    expect(stats.total).toBe(3);
  });

  it('rounds the average half up to the centavo', () => {
    const stats = computeStats(
      [
        makeEmployee({ currentBasicSalary: '0.01' }),
        makeEmployee({ currentBasicSalary: '0.02' }),
      ],
      TODAY,
    );
    expect(stats.average).toBe('0.02'); // 0.015
    expect(
      computeStats(
        [
          makeEmployee({ currentBasicSalary: '30000.00' }),
          makeEmployee({ currentBasicSalary: '45000.00' }),
          makeEmployee({ currentBasicSalary: '28500.00' }),
        ],
        TODAY,
      ).average,
    ).toBe('34500.00');
  });

  it('lists employees without a salary, in the given order', () => {
    const a = makeEmployee({ currentBasicSalary: null });
    const b = makeEmployee({ currentBasicSalary: '1.00' });
    const c = makeEmployee({ currentBasicSalary: null });
    expect(computeStats([a, b, c], TODAY).withoutSalary).toEqual([a, c]);
  });

  it('counts hires from 29 days ago up to today, and not future dates or older ones', () => {
    const hired = (dateHired: string) => makeEmployee({ dateHired });
    const stats = computeStats(
      [
        hired('2026-11-13'), // today
        hired('2026-10-15'), // 29 days ago: first day in
        hired('2026-10-14'), // 30 days ago: out
        hired('2026-11-14'), // tomorrow: not a hire yet
      ],
      TODAY,
    );
    expect(stats.hiredRecently).toBe(2);
  });

  it('counts the 30 days across a year change', () => {
    expect(
      computeStats([makeEmployee({ dateHired: '2025-12-20' })], '2026-01-10')
        .hiredRecently,
    ).toBe(1);
  });

  it('orders employees with a salary from the highest, leaving out those without', () => {
    const low = makeEmployee({ currentBasicSalary: '28500.00' });
    const none = makeEmployee({ currentBasicSalary: null });
    const high = makeEmployee({ currentBasicSalary: '45000.00' });
    const tie = makeEmployee({ currentBasicSalary: '28500.00' });
    expect(computeStats([low, none, high, tie], TODAY).bySalary).toEqual([
      high,
      low,
      tie,
    ]);
  });

  it('lists the five newest hires, latest first, skipping start dates still ahead', () => {
    const hired = (dateHired: string) => makeEmployee({ dateHired });
    const dates = [
      '2026-01-01',
      '2026-11-10',
      '2026-03-05',
      '2025-12-31',
      '2026-11-13',
      '2026-07-07',
      '2027-01-01',
    ];
    const stats = computeStats(dates.map(hired), TODAY);
    expect(stats.recentHires.map((e) => e.dateHired)).toEqual([
      '2026-11-13',
      '2026-11-10',
      '2026-07-07',
      '2026-03-05',
      '2026-01-01',
    ]);
  });

  it('finds the highest, lowest and median salary, averaging the middle two', () => {
    const pay = (amount: string) =>
      makeEmployee({ currentBasicSalary: amount });
    const odd = computeStats(
      [pay('30000.00'), pay('45000.00'), pay('28500.00')],
      TODAY,
    ).salaryRange!;
    expect(odd.highest.currentBasicSalary).toBe('45000.00');
    expect(odd.lowest.currentBasicSalary).toBe('28500.00');
    expect(odd.median).toBe('30000.00');

    const even = computeStats(
      [pay('0.01'), pay('0.02'), pay('100.00'), pay('200.00')],
      TODAY,
    ).salaryRange!;
    expect(even.median).toBe('50.01'); // (0.02 + 100.00) / 2 = 50.01
    expect(
      computeStats([makeEmployee({ currentBasicSalary: null })], TODAY)
        .salaryRange,
    ).toBeNull();
  });

  it('works out the average tenure in years and who has been here longest', () => {
    const stats = computeStats(
      [
        makeEmployee({ dateHired: '2026-11-13' }), // 0 years
        makeEmployee({ dateHired: '2024-11-13' }), // 2 years (730 days)
        makeEmployee({ dateHired: '2023-11-13' }), // 3 years (1096 days)
        makeEmployee({ dateHired: '2027-01-01' }), // not started: left out
      ],
      TODAY,
    ).tenure!;
    expect(stats.averageYears).toBe(1.7);
    expect(stats.longest.dateHired).toBe('2023-11-13');
    expect(computeStats([], TODAY).tenure).toBeNull();
  });
});
