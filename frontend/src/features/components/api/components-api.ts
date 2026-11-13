import { api } from '../../../shared/api/client';
import type {
  AddComponentInput,
  CatalogComponent,
  EmployeeComponent,
  SalaryComponent,
} from '../types';

/** Every active component, with how many employees have it. Also the source of the name suggestions. */
export async function listCatalog(): Promise<CatalogComponent[]> {
  const { data } = await api.get<CatalogComponent[]>('/salary-components');
  return data;
}

/** Creates a name in the catalog only: no amount, no employee. */
export async function createComponent(name: string): Promise<SalaryComponent> {
  const { data } = await api.post<SalaryComponent>('/salary-components', {
    name,
  });
  return data;
}

/** Deletes the component and, in the same transaction, removes it from every employee that has it. */
export async function deleteComponent(componentId: string): Promise<void> {
  await api.delete(`/salary-components/${componentId}`);
}

export async function listEmployeeComponents(
  employeeId: string,
): Promise<EmployeeComponent[]> {
  const { data } = await api.get<EmployeeComponent[]>(
    `/employees/${employeeId}/components`,
  );
  return data;
}

export async function addEmployeeComponent(
  employeeId: string,
  input: AddComponentInput,
): Promise<EmployeeComponent> {
  const { data } = await api.post<EmployeeComponent>(
    `/employees/${employeeId}/components`,
    input,
  );
  return data;
}

export async function updateEmployeeComponent(
  employeeId: string,
  assignmentId: string,
  amount: string,
): Promise<EmployeeComponent> {
  const { data } = await api.patch<EmployeeComponent>(
    `/employees/${employeeId}/components/${assignmentId}`,
    { amount },
  );
  return data;
}

/** Takes the component off this employee only. */
export async function removeEmployeeComponent(
  employeeId: string,
  assignmentId: string,
): Promise<void> {
  await api.delete(`/employees/${employeeId}/components/${assignmentId}`);
}

/** Renames the catalog entry, so it changes for every employee who has it. */
export async function renameComponent(
  componentId: string,
  name: string,
): Promise<SalaryComponent> {
  const { data } = await api.patch<SalaryComponent>(
    `/salary-components/${componentId}`,
    { name },
  );
  return data;
}
