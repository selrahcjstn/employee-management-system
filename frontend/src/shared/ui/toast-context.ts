import { createContext } from 'react';

export interface ToastApi {
  /** Confirms something that worked. Fades out after 4 seconds. */
  success: (message: string) => void;
  /** Reports something that failed. Stays until it is dismissed. */
  error: (message: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
