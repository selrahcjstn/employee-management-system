import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Matches FRONTEND_ORIGIN in backend/.env.example.
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // CSS is not processed in tests, except as raw text: a few tests read the theme and the
    // reduced-motion rule from tokens.css and index.css.
    css: { include: [/\.css\?raw$/] },
    env: { VITE_API_URL: 'http://localhost:3000/api' },
  },
});
