import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Employee, EmployeeInput } from '../types';
import { createEmployee, listEmployees, updateEmployee } from './employees-api';

/** Every employee query starts with this, so one invalidation refreshes them all (and the pages that reuse the list). */
export const employeesKey = ['employees'] as const;

/** The list for a search. While a new search loads, the previous rows stay on screen instead of flashing empty. */
export function useEmployees(search: string) {
  return useQuery({
    queryKey: [...employeesKey, { search }],
    queryFn: () => listEmployees(search),
    placeholderData: keepPreviousData,
  });
}

/** Creates an employee, or updates `employee` when one is given. A save refreshes every employee list. */
export function useSaveEmployee(employee: Employee | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeNo, ...editable }: EmployeeInput) =>
      employee
        ? updateEmployee(employee.id, editable)
        : createEmployee({ employeeNo, ...editable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeesKey }),
  });
}
