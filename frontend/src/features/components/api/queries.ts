import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { computationKey } from '../../computation/api/queries';
import { employeesKey } from '../../employees/api/queries';
import type { AddComponentInput } from '../types';
import {
  addEmployeeComponent,
  createComponent,
  deleteComponent,
  listCatalog,
  listEmployeeComponents,
  removeEmployeeComponent,
  renameComponent,
  updateEmployeeComponent,
} from './components-api';

/** Every component query starts with this, so one invalidation refreshes the catalog and every employee's list. */
export const componentsKey = ['components'] as const;

export function useCatalog() {
  return useQuery({
    queryKey: [...componentsKey, 'catalog'],
    queryFn: listCatalog,
  });
}

export function useEmployeeComponents(employeeId: string) {
  return useQuery({
    queryKey: [...componentsKey, 'employee', employeeId],
    queryFn: () => listEmployeeComponents(employeeId),
  });
}

/** Runs after any change here: the lists, the catalog, the employee list (counts and totals) and the computation all read the same rows. */
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: componentsKey }),
      queryClient.invalidateQueries({ queryKey: employeesKey }),
      queryClient.invalidateQueries({ queryKey: computationKey }),
    ]);
}

export function useAddComponent(employeeId: string) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (input: AddComponentInput) =>
      addEmployeeComponent(employeeId, input),
    onSuccess: refresh,
  });
}

export function useUpdateAmount(employeeId: string) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: ({
      assignmentId,
      amount,
    }: {
      assignmentId: string;
      amount: string;
    }) => updateEmployeeComponent(employeeId, assignmentId, amount),
    onSuccess: refresh,
  });
}

export function useRemoveComponent(employeeId: string) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      removeEmployeeComponent(employeeId, assignmentId),
    onSuccess: refresh,
  });
}

export function useRenameComponent() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: ({
      componentId,
      name,
    }: {
      componentId: string;
      name: string;
    }) => renameComponent(componentId, name),
    onSuccess: refresh,
  });
}

/** Creates a catalog name (no employee involved). */
export function useCreateComponent() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (name: string) => createComponent(name),
    onSuccess: refresh,
  });
}

/** Deletes a component everywhere: it leaves the catalog and every employee that had it. */
export function useDeleteComponent() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: (componentId: string) => deleteComponent(componentId),
    onSuccess: refresh,
  });
}
