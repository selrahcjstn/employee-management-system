import Decimal from 'decimal.js';

export { Decimal };

/** Money is Decimal(12,2) in the database; this is the largest amount the API accepts. */
export const MAX_AMOUNT = '99999999.99';

/** Up to 8 integer digits and at most 2 decimals, e.g. "30000", "30000.5", "0.01". */
export const MONEY_PATTERN = /^\d{1,8}(\.\d{1,2})?$/;

export const toMoneyString = (value: Decimal.Value): string =>
  new Decimal(value).toFixed(2);
