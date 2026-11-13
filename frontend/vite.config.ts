import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      // Matches FRONTEND_ORIGIN in backend/.env.example.
      port: 5173,
      strictPort: true,
      // The browser talks to /api on this origin and Vite forwards it to the backend, so the
      // httpOnly refresh cookie is first-party and no CORS preflight is needed in development.
      proxy: {
        '/api': {
          target: env['VITE_API_PROXY_TARGET'] ?? 'http://localhost:3000',
          changeOrigin: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});
