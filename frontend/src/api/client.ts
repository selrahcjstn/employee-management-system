import axios from 'axios';

/**
 * The one HTTP client. `/api` is proxied to the backend by Vite in development, and
 * `withCredentials` lets the browser send the httpOnly refresh cookie to `/api/auth/*`.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  withCredentials: true,
});
