import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /graphql (HTTP & WS) to backend port 4000 so browser only needs firewall-open 5173
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
        // Preserve path exactly
        rewrite: (path) => path
      }
    }
  }
});
