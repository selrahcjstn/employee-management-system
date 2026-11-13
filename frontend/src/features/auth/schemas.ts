import { z } from 'zod';

/** Matches the backend LoginDto: a valid email (max 255) and a non-empty password (max 72). */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be 255 characters or fewer')
    .pipe(z.email('Enter a valid email address')),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(72, 'Password must be 72 characters or fewer'),
});

export type LoginValues = z.infer<typeof loginSchema>;
