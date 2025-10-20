/**
 * Frontend Configuration System
 * Configuration for frontend Apollo Client and environment settings
 */

export interface FrontendConfig {
  apiUrl: string;
  frontendUrl: string;
  environment: string;
}

// Check if we're in a Vite build environment
const isViteEnv = typeof import.meta !== 'undefined' && import.meta.env;

// Environment-based configuration
const getConfig = (): FrontendConfig => {
  const environment = isViteEnv ? import.meta.env.MODE : 'development';
  
  const configs = {
    development: {
      // Development: Use relative paths, Vite proxy will forward to backend
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql') : '/graphql',
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173') : 'http://localhost:5173',
      environment: 'development'
    },
    production: {
      // Production: Use relative paths, reverse proxy will forward to backend
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql') : '/graphql',
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'https://your-domain.com') : 'https://your-domain.com',
      environment: 'production'
    },
    staging: {
      // Staging: Use relative paths, reverse proxy will forward to backend
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql') : '/graphql',
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'https://staging.your-domain.com') : 'https://staging.your-domain.com',
      environment: 'staging'
    }
  };

  return configs[environment as keyof typeof configs] || configs.development;
};

export const frontendConfig = getConfig();

// Helper functions
export const getApiUrl = (): string => frontendConfig.apiUrl;
export const getFrontendUrl = (): string => frontendConfig.frontendUrl;
export const isProduction = (): boolean => frontendConfig.environment === 'production';
export const isDevelopment = (): boolean => frontendConfig.environment === 'development';

export default frontendConfig;