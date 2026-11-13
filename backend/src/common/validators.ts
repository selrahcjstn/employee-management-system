import { ValidationOptions, registerDecorator } from 'class-validator';
import { Decimal, MAX_AMOUNT, MONEY_PATTERN } from './money.js';

/** The business timezone: "today" for hire dates is the calendar date in Manila. */
export const BUSINESS_TIMEZONE = 'Asia/Manila';

const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: BUSINESS_TIMEZONE });

/** A real calendar date written as YYYY-MM-DD, not later than today. */
export function IsPastOrTodayDate(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isPastOrTodayDate',
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid date (YYYY-MM-DD) that is not in the future`,
        ...options,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
            return false;
          const parsed = new Date(`${value}T00:00:00Z`);
          if (
            Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== value
          )
            return false;
          return value <= today();
        },
      },
    });
}

/**
 * A money amount sent as a decimal string with at most 2 decimals, between 0 and the maximum.
 * JSON numbers are rejected on purpose: money never passes through a float.
 */
export function IsMoneyString(
  options: { allowZero: boolean },
  validationOptions?: ValidationOptions,
) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isMoneyString',
      target: target.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a decimal string with at most 2 decimals, ${
          options.allowZero ? 'zero or more' : 'greater than 0'
        } and at most ${MAX_AMOUNT}`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !MONEY_PATTERN.test(value))
            return false;
          const amount = new Decimal(value);
          return (
            (options.allowZero ? amount.gte(0) : amount.gt(0)) &&
            amount.lte(MAX_AMOUNT)
          );
        },
      },
    });
}

/** Trims strings before validation; other values pass through for the validators to reject. */
export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Trims and upper-cases strings, for codes like an Employee ID that are saved one way. */
export const trimUpperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;
