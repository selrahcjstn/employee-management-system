import { Decimal, toMoneyString, type MoneyInput } from '../../common/money.js';

/** Annual working-day divisor from the spec. A constant, not user-editable. */
export const WORKING_DAYS_DIVISOR = 314;
export const MONTHS_PER_YEAR = 12;
export const HOURS_PER_DAY = 8;
export const MINUTES_PER_HOUR = 60;

export interface Rates {
  annualSalary: string;
  dailyRate: string;
  hourlyRate: string;
  perMinuteRate: string;
}

/**
 * Annual = monthly x 12, daily = annual / 314, hourly = daily / 8, per-minute = hourly / 60.
 * Every step uses the unrounded value of the step before; rounding happens only in the
 * returned strings.
 */
export function computeRates(monthlySalary: MoneyInput): Rates {
  const annual = new Decimal(monthlySalary).times(MONTHS_PER_YEAR);
  const daily = annual.div(WORKING_DAYS_DIVISOR);
  const hourly = daily.div(HOURS_PER_DAY);
  const perMinute = hourly.div(MINUTES_PER_HOUR);
  return {
    annualSalary: toMoneyString(annual),
    dailyRate: toMoneyString(daily),
    hourlyRate: toMoneyString(hourly),
    perMinuteRate: toMoneyString(perMinute),
  };
}
