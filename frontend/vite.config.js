import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },

  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:7860',
        changeOrigin: true,
        secure: false,
        ws: false,
=======
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      },
    },
  },

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 8080,
    strictPort: true,
    allowedHosts: true,
  },
});
