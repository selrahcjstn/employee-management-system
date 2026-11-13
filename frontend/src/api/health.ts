import { api } from './client';

export interface Health {
  status: string;
  database: string;
}

export async function fetchHealth(): Promise<Health> {
  const { data } = await api.get<Health>('/health');
  return data;
}
