import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le nom du repo GitHub Pages détermine le sous-chemin de déploiement.
// julien-fabre-stack.github.io/ma-discipline-clean/ -> base '/ma-discipline-clean/'
export default defineConfig({
  base: '/ma-discipline-clean/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
