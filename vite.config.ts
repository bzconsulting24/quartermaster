import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      '.ts.net', // Allow all Tailscale hosts
      'localhost',
      '.local'
    ],
    proxy: {
      '/api': {
        // Use backend service name when running in Docker, localhost otherwise
        target: process.env.DOCKER_ENV ? 'http://backend:4000' : 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
});
