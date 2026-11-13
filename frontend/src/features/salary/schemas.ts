import { z } from 'zod';

/** The highest amount the API accepts is 99,999,999.99: at most 8 digits before the point, 2 after. */
const MAX_WHOLE_DIGITS = 8;

/**
 * Checks the amount as text, because money never goes through a float. The same rules as the API
 * (AssignSalaryDto): greater than 0, at most 2 decimals, at most 99,999,999.99.
 */
export const salarySchema = z.object({
  monthlyBasicSalary: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const fail = (message: string) =>
        ctx.addIssue({ code: 'custom', message });
      if (!value) return fail('Monthly basic salary is required');
      if (value.startsWith('-')) return fail('Salary must be greater than 0');
      const match = /^(\d+)(?:\.(\d*))?$/.exec(value);
      if (!match) return fail('Enter a number, for example 30000 or 30000.50');
      const [, whole = '', decimals = ''] = match;
      if (decimals.length > 2) return fail('Use at most 2 decimal places');
      if (/^0*$/.test(whole + decimals))
        return fail('Salary must be greater than 0');
      if (whole.replace(/^0+/, '').length > MAX_WHOLE_DIGITS)
        return fail('Salary cannot be more than ₱99,999,999.99');
    }),
});

export type SalaryFormValues = z.infer<typeof salarySchema>;

/** "30000" and "30000.5" become "30000.00" and "30000.50": one spelling to compare and to send. */
export function normalizeAmount(value: string): string {
  const [whole = '0', decimals = ''] = value.trim().split('.');
  return `${whole.replace(/^0+(?=\d)/, '')}.${decimals.padEnd(2, '0')}`;
}
