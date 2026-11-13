import { useQuery } from '@tanstack/react-query';
import { getComputation } from './computation-api';

/** Saving a salary or a component invalidates this prefix, so the numbers recalculate on their own. */
export const computationKey = ['computation'] as const;

export function useComputation(employeeId: string) {
  return useQuery({
    queryKey: [...computationKey, employeeId],
    queryFn: () => getComputation(employeeId),
  });
}
