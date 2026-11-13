import { api } from '../../../shared/api/client';
import type { Computation, ComputationSummary } from '../types';

export async function getComputation(employeeId: string): Promise<Computation> {
  const { data } = await api.get<Computation>(
    `/employees/${employeeId}/computation`,
  );
  return data;
}

/** Every employee's monthly total and rates, in one request. */
export async function getComputations(): Promise<ComputationSummary[]> {
  const { data } = await api.get<ComputationSummary[]>('/computations');
  return data;
}
