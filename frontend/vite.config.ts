import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), '..'), '');
  const isDev = mode === 'development';
  const configuredBase = process.env.VITE_BASE_PATH || env.VITE_BASE_PATH;
  const configuredGraphQLEndpoint = process.env.VITE_GRAPHQL_ENDPOINT || env.VITE_GRAPHQL_ENDPOINT;
  // If the app is configured to call GraphQL under /dap/*, it must also be built/served under /dap/
  // otherwise the generated asset URLs (e.g. /assets/*.js) will 404 when loaded from /dap/.
  const inferredBase =
    !configuredBase && configuredGraphQLEndpoint?.startsWith('/dap/')
      ? '/dap/'
      : '/';

  const allowedHosts = [
    'dap-8321890.ztna.sse.cisco.io',
    'dap.cxsaaslab.com',
    '172.22.156.32',
    'localhost',
    'centos1.rajarora.csslab',
    '.ztna.sse.cisco.io',
    '.cxsaaslab.com',
    '.rajarora.csslab',
    'dev.rajarora.csslab'
  ];

  return {
    envDir: '..',
    base: configuredBase || inferredBase,
    resolve: {
      alias: {
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@': path.resolve(__dirname, './src')
      }
    },
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
      watch: {
        // Ignore .env file changes to prevent unnecessary restarts
        // The env is loaded at startup, changes require manual restart
        ignored: ['**/.env', '**/.env.*']
      },
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
      cssCodeSplit: true,
      // Performance: Manual chunk splitting for optimal bundle sizes
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React vendor chunk
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Apollo/GraphQL chunk
            'vendor-apollo': ['@apollo/client', 'graphql'],
            // MUI core chunk
            'vendor-mui-core': ['@mui/material', '@mui/system'],
            // MUI icons (often large)
            'vendor-mui-icons': ['@mui/icons-material'],
            // Date/Chart libraries
            'vendor-charts': ['recharts', 'date-fns'],
            // DnD and utilities
            'vendor-utils': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            // Excel handling
            'vendor-excel': ['xlsx', 'exceljs'],
          },
        },
      },
      // Increase chunk size warning limit for vendor chunks
      chunkSizeWarningLimit: 600,
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
