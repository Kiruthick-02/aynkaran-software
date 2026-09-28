import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const apiTarget = (process.env.VITE_API_URL || 'https://aynkaran-backend.onrender.com').replace(/\/$/, '');
const removeBrowserOrigin = (proxy) => {
  proxy.on('proxyReq', (proxyRequest) => proxyRequest.removeHeader('origin'));
};

export default defineConfig({
  base: './',
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
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: removeBrowserOrigin,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: removeBrowserOrigin,
      },
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1400,
  },

  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 8080,
    strictPort: true,
    allowedHosts: true,
  },
});
