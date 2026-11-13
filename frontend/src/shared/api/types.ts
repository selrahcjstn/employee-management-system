/** The signed-in user, as the API returns it. Never includes a password hash. */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The body of a successful login or refresh. */
export interface Session {
  accessToken: string;
  user: SessionUser;
}
