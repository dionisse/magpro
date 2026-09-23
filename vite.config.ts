import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Code split: vendor libs separate from app code
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Smaller chunk warnings threshold
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable minification
    minify: 'esbuild',
  },
  // Dev server: reachable derrière un proxy/tunnel et toujours à jour.
  // Important : ne JAMAIS mettre en cache les réponses du serveur de dev.
  // Avec `public, max-age=31536000, immutable`, le navigateur réutilise
  // l'index.html / le JS / le CSS pendant un an : après une modification,
  // l'aperçu continue d'afficher l'ancienne version du site.
  server: {
    host: true,
    allowedHosts: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
});
