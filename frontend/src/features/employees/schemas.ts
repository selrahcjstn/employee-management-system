import { z } from 'zod';
import { todayInManila } from '../../shared/lib/today';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date: 2026-02-30 matches the format but is not a day. */
function isRealDate(value: string): boolean {
  if (!DATE_FORMAT.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  return date.toISOString().slice(0, 10) === value;
}

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

/** The same rules as the API (CreateEmployeeDto), so mistakes show before anything is sent. */
export const employeeSchema = z.object({
  employeeNo: required('Employee ID', 50),
  firstName: required('First name', 100),
  middleName: z
    .string()
    .trim()
    .max(100, 'Middle name must be 100 characters or fewer'),
  lastName: required('Last name', 100),
  dateHired: z
    .string()
    .min(1, 'Date hired is required')
    .superRefine((value, ctx) => {
      if (!value) return;
      if (!isRealDate(value)) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid date' });
      } else if (value > todayInManila()) {
        // Compared when the form is submitted, not when the page loaded, so a page left open overnight stays right.
        ctx.addIssue({
          code: 'custom',
          message: 'Date hired cannot be in the future',
        });
      }
    }),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
