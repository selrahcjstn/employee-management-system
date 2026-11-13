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

/** What an Employee ID may contain: letters, digits and hyphens. There is no fixed shape: a person types it. */
export const EMPLOYEE_NO_PATTERN = /^[A-Za-z0-9-]+$/;
export const EMPLOYEE_NO_MIN = 3;
export const EMPLOYEE_NO_MAX = 50;

/**
 * What is wrong with a (trimmed) Employee ID, as one message, or undefined when it is fine: it must
 * be 3 to 50 letters, digits or hyphens. The same rules as the API (CreateEmployeeDto).
 */
export function employeeNoProblem(value: string): string | undefined {
  if (!value) return 'Employee ID is required';
  if (!EMPLOYEE_NO_PATTERN.test(value)) {
    return 'Employee ID can only use letters, numbers and hyphens';
  }
  if (value.length < EMPLOYEE_NO_MIN) {
    return 'Employee ID must be at least 3 characters';
  }
  if (value.length > EMPLOYEE_NO_MAX) {
    return `Employee ID must be ${EMPLOYEE_NO_MAX} characters or fewer`;
  }
  return undefined;
}

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

/**
 * A new employee: the Employee ID is trimmed, 3 to 50 letters, digits or hyphens, and saved in
 * upper case (uniqueness, ignoring case, is checked by the server).
 */
export const employeeSchema = employeeFields.extend({
  employeeNo: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = employeeNoProblem(value);
      if (message) ctx.addIssue({ code: 'custom', message });
    })
    .transform((value) => value.toUpperCase()),
});

/**
 * An existing employee: the Employee ID cannot change and is not sent, so it is not checked here
 * and a row with an older kind of ID can still be edited.
 */
export const editEmployeeSchema = employeeFields;

export type EmployeeFormValues = z.infer<typeof employeeFields>;
