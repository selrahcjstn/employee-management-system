import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useDebouncedValue } from '../../../shared/lib/use-debounced-value';
import { employeeNoProblem } from '../schemas';
import { employeeNoExists } from './employees-api';

export const DUPLICATE_CHECK_DELAY_MS = 400;

/**
 * Whether the Employee ID being typed is already taken, asked of the server 400ms after typing
 * stops, or at once when the field loses focus. It only asks about a value that passes the format
 * rules, and only while `enabled`. It is a hint for the form: an answer that arrives for an older
 * value is ignored, a failed check says nothing, and the 409 on submit is still the real answer.
 */
export function useEmployeeNoTaken(value: string, enabled: boolean) {
  const typed = value.trim().toUpperCase();
  const settled = useDebouncedValue(typed, DUPLICATE_CHECK_DELAY_MS);
  const [blurred, setBlurred] = useState<string | null>(null);
  // Asking at once on blur only applies while the value is still the one that was left.
  const target = blurred === typed ? typed : settled;

  const valid = employeeNoProblem(target) === undefined;

  const query = useQuery({
    queryKey: ['employee-no-exists', target],
    queryFn: () => employeeNoExists(target),
    enabled: enabled && valid,
    retry: false,
    // A new employee may have taken the ID a moment ago, so an old answer is not reused.
    staleTime: 0,
    gcTime: 0,
  });

  return {
    /** True only when the answer is for what is typed now. */
    taken: target === typed && query.data === true,
    /** Call when the field loses focus, to ask without waiting. */
    onBlur: () => setBlurred(typed),
  };
}
