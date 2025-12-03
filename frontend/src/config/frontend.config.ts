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

// Helper to get BASE_URL for constructing API paths (exported for use elsewhere)
export const getBasePath = (): string => {
  if (typeof import.meta === 'undefined' || !import.meta.env) return '/';
  const basePath = import.meta.env.BASE_URL || '/';
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
};

// Environment-based configuration
const getConfig = (): FrontendConfig => {
  const environment = isViteEnv ? import.meta.env.MODE : 'development';
  const basePath = getBasePath();
  
  const configs = {
    development: {
      // Development: Use relative paths with BASE_URL support
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || `${basePath}/graphql`) : `${basePath}/graphql`,
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173') : 'http://localhost:5173',
      environment: 'development'
    },
    production: {
      // Production: Use relative paths with BASE_URL support for subpath deployment
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || `${basePath}/graphql`) : `${basePath}/graphql`,
      frontendUrl: isViteEnv ? (import.meta.env.VITE_FRONTEND_URL || 'https://your-domain.com') : 'https://your-domain.com',
      environment: 'production'
    },
    staging: {
      // Staging: Use relative paths with BASE_URL support for subpath deployment
      apiUrl: isViteEnv ? (import.meta.env.VITE_GRAPHQL_ENDPOINT || `${basePath}/graphql`) : `${basePath}/graphql`,
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

// Get the base URL for dev tools API endpoints
// Returns relative URL when in production (via Apache) or absolute localhost URL for development
export const getDevApiBaseUrl = (): string => {
  const basePath = getBasePath();
  // If we're running in the browser and not on localhost, use relative URLs through Apache proxy
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return basePath; // Returns '/dap' for subpath deployment
  }
  // Local development - use localhost
  return 'http://localhost:4000';
};

export default frontendConfig;