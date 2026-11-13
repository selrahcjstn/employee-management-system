import axios from 'axios';
import { api } from '../../../shared/api/client';
import type { AssignSalaryResult, Salary, SalaryHistoryEntry } from '../types';

/** The active salary, or null when the employee has none (the API answers 404 for that). */
export async function getCurrentSalary(
  employeeId: string,
): Promise<Salary | null> {
  try {
    const { data } = await api.get<Salary>(`/employees/${employeeId}/salary`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404)
      return null;
    throw error;
  }
}

/** Previous salaries, newest first. */
export async function getSalaryHistory(
  employeeId: string,
): Promise<SalaryHistoryEntry[]> {
  const { data } = await api.get<SalaryHistoryEntry[]>(
    `/employees/${employeeId}/salary/history`,
  );
  return data;
}

/** Assigns the first salary, or adjusts the current one (the old one moves to history). */
export async function assignSalary(
  employeeId: string,
  monthlyBasicSalary: string,
): Promise<AssignSalaryResult> {
  const { data } = await api.put<AssignSalaryResult>(
    `/employees/${employeeId}/salary`,
    { monthlyBasicSalary },
  );
  return data;
}
