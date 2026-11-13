import { z } from 'zod';
import { checkAmount } from '../../shared/lib/money';

/**
 * The component amount: zero or more (PRD Q3), at most 2 decimals, at most 99,999,999.99.
 * Checked as text, because money never goes through a float.
 */
export const amountSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const message = checkAmount(value, {
      name: 'Amount',
      required: 'Amount is required',
      example: '2000',
      allowZero: true,
    });
    if (message) ctx.addIssue({ code: 'custom', message });
  });

/** The same rules as the API (ComponentNameDto): 1 to 100 characters once trimmed. */
export const componentNameSchema = z
  .string()
  .trim()
  .min(1, 'Component name is required')
  .max(100, 'Component name must be 100 characters or fewer');

export const amountFormSchema = z.object({ amount: amountSchema });
export const renameFormSchema = z.object({ name: componentNameSchema });

export type AmountFormValues = z.infer<typeof amountFormSchema>;
export type RenameFormValues = z.infer<typeof renameFormSchema>;
