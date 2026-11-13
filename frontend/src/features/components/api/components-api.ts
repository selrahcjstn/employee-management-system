import { api } from '../../../shared/api/client';
import type {
  AddComponentInput,
  EmployeeComponent,
  SalaryComponent,
} from '../types';

/** Every active component name, for suggestions. */
export async function listCatalog(): Promise<SalaryComponent[]> {
  const { data } = await api.get<SalaryComponent[]>('/salary-components');
  return data;
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
