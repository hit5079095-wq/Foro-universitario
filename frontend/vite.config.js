import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite sirve el frontend en :5173 y redirige /api (incluida /api/docs)
// al backend Express en :3000, así las rutas relativas funcionan igual que antes.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
