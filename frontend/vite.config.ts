import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), '..'), '');
  const isDev = mode === 'development';

  const allowedHosts = [
    'dap-8321890.ztna.sse.cisco.io',
    'dap.cxsaaslab.com',
    '172.22.156.32',
    'localhost',
    'centos1.rajarora.csslab',
    '.ztna.sse.cisco.io',
    '.cxsaaslab.com',
    '.rajarora.csslab'
  ];

  return {
    envDir: '..',
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react({
        fastRefresh: true,
        babel: isDev
          ? {
            parserOpts: { plugins: ['classProperties', 'classPrivateProperties'] }
          }
          : undefined
      })
    ],
    server: {
      host: env.FRONTEND_HOST || '0.0.0.0',
      port: parseInt(env.FRONTEND_PORT || '5173', 10),
      strictPort: true,
      hmr: { overlay: true },
      allowedHosts,
      proxy: {
        '/dap/graphql': {
          target: env.VITE_GRAPHQL_PROXY || 'http://localhost:4000',
          changeOrigin: true,
          ws: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/dap/, '')
        },
        '/dap/api': {
          target: env.VITE_API_PROXY || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/dap/, '')
        },
        '/graphql': {
          target: env.VITE_GRAPHQL_PROXY || 'http://localhost:4000',
          changeOrigin: true,
          ws: true,
          secure: false
        },
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@apollo/client', '@mui/material', '@mui/icons-material'],
      force: false
    },
    css: {
      devSourcemap: isDev
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    build: {
      sourcemap: isDev,
      target: isDev ? 'esnext' : 'es2018',
      minify: isDev ? false : 'esbuild',
      cssCodeSplit: true
    },
    warmup: isDev
      ? {
        clientFiles: ['src/pages/**/*.tsx', 'src/components/**/*.tsx'],
        serverFiles: ['src/apollo/**/*.ts', 'src/graphql/**/*.ts']
      }
      : undefined,
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.4.0'),
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString())
    }
  };
});
