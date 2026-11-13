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

/** EMP- and at least three digits, as the API requires for a new employee. */
export const EMPLOYEE_NO_PATTERN = /^EMP-\d{3,}$/;

/**
 * The same rules as the API (CreateEmployeeDto), so mistakes show before anything is sent. The
 * Employee ID is saved in upper case, so it is checked and sent that way.
 */
const employeeFields = z.object({
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

/** A new employee: the Employee ID must be EMP- and at least 3 digits, and is saved in upper case. */
export const employeeSchema = employeeFields.extend({
  employeeNo: employeeFields.shape.employeeNo
    .transform((value) => value.toUpperCase())
    .refine((value) => EMPLOYEE_NO_PATTERN.test(value), {
      message: 'Employee ID must look like EMP-001',
    }),
});

/**
 * An existing employee: the Employee ID cannot change and is not sent, so a row created before the
 * format rule (such as EMP001) can still be edited.
 */
export const editEmployeeSchema = employeeFields;

export type EmployeeFormValues = z.infer<typeof employeeFields>;
