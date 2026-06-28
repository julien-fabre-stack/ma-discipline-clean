import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le nom du repo GitHub Pages détermine le sous-chemin de déploiement.
// julien-fabre-stack.github.io/ma-discipline-clean/ -> base '/ma-discipline-clean/'
export default defineConfig({
  base: '/ma-discipline-clean/',
  plugins: [react()],
  resolve: {
    // Doit correspondre à "paths": { "@/*": ["src/*"] } dans tsconfig.json.
    // TypeScript et Vite ont chacun leur propre résolution de modules ;
    // l'alias doit donc être déclaré aux deux endroits.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Séparation des dépendances tierces en chunks stables.
        // - react-vendor : React + ReactDOM, change rarement -> bon cache navigateur
        // - firebase     : SDK Firebase (auth + firestore), gros et stable
        // Les onglets eux-mêmes sont déjà découpés via React.lazy() dans App.tsx,
        // donc Vite génère un chunk distinct par feature chargée à la demande.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase';
            }
          }
        },
      },
    },
  },
});
