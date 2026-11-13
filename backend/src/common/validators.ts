import { ValidationOptions, registerDecorator } from 'class-validator';

/** The business timezone: "today" for hire dates is the calendar date in Manila. */
export const BUSINESS_TIMEZONE = 'Asia/Manila';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: BUSINESS_TIMEZONE });

/** A real calendar date written as YYYY-MM-DD, not later than today. */
export function IsPastOrTodayDate(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isPastOrTodayDate',
      target: target.constructor,
      propertyName,
      options: { message: `${propertyName} must be a valid date (YYYY-MM-DD) that is not in the future`, ...options },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
          const parsed = new Date(`${value}T00:00:00Z`);
          if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
          return value <= today();
        },
      },
    });
}

/** Trims strings before validation; other values pass through for the validators to reject. */
export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
