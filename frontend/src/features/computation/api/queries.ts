import { useQuery } from '@tanstack/react-query';
import { getComputation, getComputations } from './computation-api';

/** Saving a salary or a component invalidates this prefix, so the numbers recalculate on their own. */
export const computationKey = ['computation'] as const;

export function useComputation(employeeId: string) {
  return useQuery({
    queryKey: [...computationKey, employeeId],
    queryFn: () => getComputation(employeeId),
  });
}

/** The overview of every employee. It shares the `computation` prefix, so a saved salary or component refreshes it too. */
export function useComputations() {
  return useQuery({
    queryKey: [...computationKey, 'all'],
    queryFn: getComputations,
  });
}
