/**
 * Application Configuration System
 * Centralized configuration for frontend and backend deployment
 */

export interface AppConfig {
  frontend: {
    host: string;
    port: number;
    url: string;
  };
  backend: {
    host: string;
    port: number;
    url: string;
    graphqlEndpoint: string;
  };
  database: {
    url: string;
  };
  cors: {
    allowedOrigins: string[];
  };
}

// Environment-based configuration
const environments = {
  development: {
    frontend: {
      host: process.env.FRONTEND_HOST || '0.0.0.0',
      port: parseInt(process.env.FRONTEND_PORT || '5173'),
      url: process.env.FRONTEND_URL || 'http://localhost:5173'
    },
    backend: {
      host: process.env.BACKEND_HOST || '0.0.0.0', // Listen on all interfaces for SSH tunnel access
      port: parseInt(process.env.BACKEND_PORT || '4000'),
      url: process.env.BACKEND_URL || 'http://localhost:4000',
      graphqlEndpoint: process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dap?schema=public'
    },
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173'
      ]
    }
  },
  production: {
    frontend: {
      host: process.env.FRONTEND_HOST || '0.0.0.0',
      port: parseInt(process.env.FRONTEND_PORT || '5173'),
      url: process.env.FRONTEND_URL || 'https://your-domain.com'
    },
    backend: {
      host: process.env.BACKEND_HOST || '0.0.0.0',
      port: parseInt(process.env.BACKEND_PORT || '4000'),
      url: process.env.BACKEND_URL || 'https://api.your-domain.com',
      graphqlEndpoint: process.env.GRAPHQL_ENDPOINT || 'https://api.your-domain.com/graphql'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dap?schema=public'
    },
    cors: {
      allowedOrigins: [
        process.env.FRONTEND_URL || 'https://your-domain.com',
        process.env.ALLOWED_ORIGINS?.split(',') || []
      ].flat().filter(Boolean)
    }
  },
  staging: {
    frontend: {
      host: process.env.FRONTEND_HOST || '0.0.0.0',
      port: parseInt(process.env.FRONTEND_PORT || '5173'),
      url: process.env.FRONTEND_URL || 'https://staging.your-domain.com'
    },
    backend: {
      host: process.env.BACKEND_HOST || '0.0.0.0',
      port: parseInt(process.env.BACKEND_PORT || '4000'),
      url: process.env.BACKEND_URL || 'https://api-staging.your-domain.com',
      graphqlEndpoint: process.env.GRAPHQL_ENDPOINT || 'https://api-staging.your-domain.com/graphql'
    },
    database: {
      url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dap?schema=public'
    },
    cors: {
      allowedOrigins: [
        process.env.FRONTEND_URL || 'https://staging.your-domain.com',
        process.env.ALLOWED_ORIGINS?.split(',') || []
      ].flat().filter(Boolean)
    }
  }
};

// Get current environment
const NODE_ENV = (process.env.NODE_ENV as keyof typeof environments) || 'development';

// Export the configuration for the current environment
export const config: AppConfig = environments[NODE_ENV];

// Helper functions
export const getApiUrl = (): string => config.backend.graphqlEndpoint;
export const getFrontendUrl = (): string => config.frontend.url;
export const getBackendUrl = (): string => config.backend.url;
export const getDatabaseUrl = (): string => config.database.url;
export const getCorsOrigins = (): string[] => config.cors.allowedOrigins;

// Validation function
export const validateConfig = (): void => {
  const required = [
    'frontend.host',
    'frontend.port',
    'backend.host', 
    'backend.port',
    'database.url'
  ];
  
  for (const key of required) {
    const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], config);
    if (!value) {
      throw new Error(`Configuration error: ${key} is required but not set`);
    }
  }
};

export default config;