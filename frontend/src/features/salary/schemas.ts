import { z } from 'zod';
import { checkAmount } from '../../shared/lib/money';

/**
 * The same rules as the API (AssignSalaryDto): greater than 0, at most 2 decimals, at most
 * 99,999,999.99. Checked as text, because money never goes through a float.
 */
export const salarySchema = z.object({
  monthlyBasicSalary: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = checkAmount(value, {
        name: 'Salary',
        required: 'Monthly basic salary is required',
        example: '30000',
        allowZero: false,
      });
      if (message) ctx.addIssue({ code: 'custom', message });
    }),
});

export type SalaryFormValues = z.infer<typeof salarySchema>;
