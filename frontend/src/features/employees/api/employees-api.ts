import { api } from '../../../shared/api/client';
import type { Employee, EmployeeInput } from '../types';

/** The employee as POST and PATCH return it: everything except the salary, which only the list adds. */
export type SavedEmployee = Omit<Employee, 'currentBasicSalary'>;

/** All employees with their current basic salary, optionally filtered by Employee ID or any part of a name. */
export async function listEmployees(search: string): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>('/employees', {
    params: search ? { search } : undefined,
  });
  return data;
}

/** One employee. A malformed or unknown id is a 400 or 404, which the workspace shows as "not found". */
export async function getEmployee(id: string): Promise<SavedEmployee> {
  const { data } = await api.get<SavedEmployee>(`/employees/${id}`);
  return data;
}

/** Whether an employee already has this Employee ID (ignoring case). The 409 on create stays the source of truth. */
export async function employeeNoExists(employeeNo: string): Promise<boolean> {
  const { data } = await api.get<{ exists: boolean }>('/employees/exists', {
    params: { employeeNo },
  });
  return data.exists;
}

export async function createEmployee(
  input: EmployeeInput,
): Promise<SavedEmployee> {
  const { data } = await api.post<SavedEmployee>('/employees', input);
  return data;
}

/** The Employee ID is not sent: it cannot change, and the API rejects it as an unknown field. */
export async function updateEmployee(
  id: string,
  input: Omit<EmployeeInput, 'employeeNo'>,
): Promise<SavedEmployee> {
  const { data } = await api.patch<SavedEmployee>(`/employees/${id}`, input);
  return data;
}
