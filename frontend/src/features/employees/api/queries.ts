import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Employee, EmployeeInput } from '../types';
import {
  createEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from './employees-api';

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

/** One employee, loaded once for the whole workspace and shared by its tabs and the breadcrumb. */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: [...employeesKey, 'detail', id],
    queryFn: () => getEmployee(id),
    // An unknown id will not become known by asking again.
    retry: false,
    // The workspace and the breadcrumb both read it; the second reader should not ask again.
    staleTime: 60_000,
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
