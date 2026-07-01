import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Config Vitest SÉPARÉE de vite.config.ts : elle n'embarque ni le plugin
// React ni VitePWA (inutiles pour tester de la logique pure, et le plugin
// PWA ralentirait chaque run). Seul l'alias @/ est répliqué.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node', // logique pure : pas besoin de jsdom pour l'instant
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
