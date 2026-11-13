import DecimalJs from 'decimal.js';

/**
 * Decimal with 50 significant digits and round-half-up, so divisions keep far more
 * precision than money needs and rounding only happens when formatting for display.
 */
export const Decimal = DecimalJs.clone({
  precision: 50,
  rounding: DecimalJs.ROUND_HALF_UP,
});
export type Decimal = InstanceType<typeof Decimal>;

/** Money is Decimal(12,2) in the database; this is the largest amount the API accepts. */
export const MAX_AMOUNT = '99999999.99';

/** Up to 8 integer digits and at most 2 decimals, e.g. "30000", "30000.5", "0.01". */
export const MONEY_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export type MoneyInput = string | number | Decimal;

/** Display rounding: 2 decimals, half up. The only place money is rounded. */
export const toMoneyString = (value: MoneyInput): string =>
  new Decimal(value).toFixed(2);
