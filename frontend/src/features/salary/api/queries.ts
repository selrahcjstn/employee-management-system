import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { computationKey } from '../../computation/api/queries';
import { employeesKey } from '../../employees/api/queries';
import { assignSalary, getCurrentSalary, getSalaryHistory } from './salary-api';

/** Everything about one employee's salary starts with this, so one invalidation refreshes the current salary and the history. */
export const salaryKey = (employeeId: string) =>
  ['salary', employeeId] as const;

export function useCurrentSalary(employeeId: string) {
  return useQuery({
    queryKey: [...salaryKey(employeeId), 'current'],
    queryFn: () => getCurrentSalary(employeeId),
  });
}

export function useSalaryHistory(employeeId: string) {
  return useQuery({
    queryKey: [...salaryKey(employeeId), 'history'],
    queryFn: () => getSalaryHistory(employeeId),
  });
}

/** A save refreshes the salary and history here, the Employees list, and the computation. */
export function useAssignSalary(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (monthlyBasicSalary: string) =>
      assignSalary(employeeId, monthlyBasicSalary),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: salaryKey(employeeId) }),
        queryClient.invalidateQueries({ queryKey: employeesKey }),
        queryClient.invalidateQueries({ queryKey: computationKey }),
      ]),
  });
}
