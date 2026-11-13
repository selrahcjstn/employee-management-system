import axios, { type InternalAxiosRequestConfig } from 'axios';
import { refreshSession } from './refresh';
import { sessionEvents, tokenStore } from './token-store';

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error(
    'VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.',
  );
}

/** The client for all API calls. `withCredentials` lets the browser send the httpOnly refresh cookie. */
export const api = axios.create({ baseURL, withCredentials: true });

/** Same server, no interceptors. Used for refresh, so refreshing can never trigger a refresh. */
export const authClient = axios.create({ baseURL, withCredentials: true });

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const isAuthCall = (url: string | undefined) => url?.startsWith('/auth/');

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) throw error;
  const original = error.config as RetriableConfig | undefined;
  if (
    error.response?.status !== 401 ||
    !original ||
    original._retried ||
    isAuthCall(original.url)
  ) {
    throw error;
  }
  original._retried = true;
  try {
    // Parallel 401s all wait for the same in-flight refresh.
    await refreshSession();
  } catch {
    tokenStore.set(null);
    sessionEvents.expired();
    throw error;
  }
  return api(original);
});
