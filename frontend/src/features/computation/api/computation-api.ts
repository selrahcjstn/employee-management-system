import { api } from '../../../shared/api/client';
import type { Computation } from '../types';

export async function getComputation(employeeId: string): Promise<Computation> {
  const { data } = await api.get<Computation>(
    `/employees/${employeeId}/computation`,
  );
  return data;
}
