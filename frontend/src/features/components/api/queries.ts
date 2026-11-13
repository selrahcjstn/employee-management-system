import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { computationKey } from '../../computation/api/queries';
import type { AddComponentInput } from '../types';
import {
  addEmployeeComponent,
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

/** Runs after any change here: the lists, the catalog and the computation all read the same rows. */
function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: componentsKey }),
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
