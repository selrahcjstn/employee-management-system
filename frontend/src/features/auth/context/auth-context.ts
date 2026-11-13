import { createContext } from 'react';
import type { SessionUser } from '../../../shared/api/types';

export type AuthState =
  | { status: 'restoring' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: SessionUser };

export type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Replaces the signed-in user, for example after the name is changed. */
  setUser: (user: SessionUser) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
