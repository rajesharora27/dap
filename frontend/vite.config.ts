import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /graphql (HTTP & WS) to backend port 4000 so browser only needs firewall-open 5173
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: env.FRONTEND_HOST || '0.0.0.0',
      port: parseInt(env.FRONTEND_PORT || '5173'),
      strictPort: true,
      // Allow access through reverse proxy domains
      allowedHosts: [
        'dap-8321890.ztna.sse.cisco.io',
        'dap.cxsaaslab.com',              // CNAME record
        '172.22.156.32',
        'localhost',
        'centos1.rajarora.csslab',        // Direct hostname access
        '.ztna.sse.cisco.io',             // Allow all subdomains
        '.cxsaaslab.com',                 // Allow all cxsaaslab.com subdomains
        '.rajarora.csslab'                // Allow all rajarora.csslab subdomains
      ],
      proxy: {
        '/graphql': {
          target: 'http://localhost:4000',  // Backend GraphQL server
          changeOrigin: true,
          ws: true,  // WebSocket support for subscriptions
          secure: false
        },
        '/api': {
          target: 'http://localhost:4000',  // Backend REST API and file downloads
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
