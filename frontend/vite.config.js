import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // /api so'rovlarini backendga yo'naltirish
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // yuklangan rasmlar ham backenddan olinadi
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
