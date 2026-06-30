import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Le nom du repo GitHub Pages détermine le sous-chemin de déploiement.
// julien-fabre-stack.github.io/ma-discipline-clean/ -> base '/ma-discipline-clean/'
export default defineConfig({
  base: '/ma-discipline-clean/',
  plugins: [
    react(),
    // Service worker (Workbox) : précache le shell + TOUS les chunks JS/CSS +
    // les assets (images d'exercices, fonds, ciqual est un chunk JS). C'est ce
    // qui permet à l'app ET aux WOD de démarrer en mode avion à froid.
    // Le manifest existant (public/manifest.webmanifest) est conservé tel quel.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      includeAssets: ['icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'],
      workbox: {
        // Tout ce qui est généré dans dist/ est mis en cache hors-ligne.
        globPatterns: ['**/*.{js,css,html,webmanifest,png,webp,jpg,jpeg,svg,woff2,json}'],
        // On ne précache pas les sourcemaps (lourdes et inutiles hors-ligne).
        globIgnores: ['**/*.map'],
        // Le chunk Firebase est volumineux : on relève la limite de précache.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // SPA : toute navigation hors-ligne retombe sur index.html.
        navigateFallback: '/ma-discipline-clean/index.html',
        // Ne pas tenter de mettre en cache / intercepter les appels Firebase :
        // Firestore gère son propre cache hors-ligne (IndexedDB).
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              /googleapis\.com|gstatic\.com|firebaseio\.com|firebaseinstallations|identitytoolkit|securetoken/.test(
                url.href
              ),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    // Doit correspondre à "paths": { "@/*": ["src/*"] } dans tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
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
