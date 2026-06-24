import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// base: './' => percorsi relativi, così funziona sia su
// utente.github.io (root) sia su utente.github.io/repo (sottocartella).
// Il routing dell'app è già a hash (#dashboard…), ideale per GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor splitting: librerie grandi in chunk dedicati → meglio cache-abili
        // e scaricabili in parallelo. three/@react-three finiscono in un chunk che
        // viene richiesto SOLO dai moduli lazy (viewer 3D, moodboard), quindi non
        // pesa sul caricamento iniziale (prestazioni mobile / PageSpeed).
        manualChunks(id: string) {
          // Helper di preload di Vite: condiviso da entry e chunk lazy. Va in un
          // micro-chunk dedicato, altrimenti Rollup può emetterlo dentro un vendor
          // pesante (es. three) costringendo l'entry a scaricarlo all'avvio.
          if (id.includes('vite/preload-helper')) return 'preload-helper';
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/]@?firebase[\\/]/.test(id)) return 'vendor-firebase';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/[\\/]node_modules[\\/](three|@react-three)[\\/]/.test(id)) return 'vendor-three';
          if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'vendor-motion';
        }
      }
    }
  }
});
