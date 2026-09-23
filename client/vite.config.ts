import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@geomarket/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) for tunnels and local network
    port: 5173,
    allowedHosts: true, // Allow all tunnel domains (loca.lt, trycloudflare.com, ngrok, etc.)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
