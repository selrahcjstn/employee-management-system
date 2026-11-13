import { api } from '../../../shared/api/client';
import type { SessionUser } from '../../../shared/api/types';

/** Changes the signed-in user's full name. The password is not changed here. */
export async function updateFullName(fullName: string): Promise<SessionUser> {
  const { data } = await api.patch<SessionUser>('/users/me', { fullName });
  return data;
}
