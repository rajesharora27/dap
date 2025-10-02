import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /graphql (HTTP & WS) to backend port 4000 so browser only needs firewall-open 5173
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Extract backend URL from GraphQL endpoint or use default
  const graphqlEndpoint = env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
  const backendUrl = graphqlEndpoint.replace('/graphql', '');
  
  return {
    plugins: [react()],
    server: {
      host: env.FRONTEND_HOST || '0.0.0.0',
      port: parseInt(env.FRONTEND_PORT || '5173'),
      strictPort: true,
      proxy: {
        '/graphql': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
          // Preserve path exactly
          rewrite: (path) => path
        }
      }
    }
  };
});
