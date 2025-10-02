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
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql') : 'http://localhost:4000/graphql',
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173') : 'http://localhost:5173',
      environment: 'development'
    },
    production: {
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || 'https://api.your-domain.com/graphql') : 'https://api.your-domain.com/graphql',
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'https://your-domain.com') : 'https://your-domain.com',
      environment: 'production'
    },
    staging: {
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || 'https://api-staging.your-domain.com/graphql') : 'https://api-staging.your-domain.com/graphql',
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