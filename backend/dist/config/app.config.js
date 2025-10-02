"use strict";
/**
 * Application Configuration System
 * Centralized configuration for frontend and backend deployment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.getCorsOrigins = exports.getDatabaseUrl = exports.getBackendUrl = exports.getFrontendUrl = exports.getApiUrl = exports.config = void 0;
// Environment-based configuration
const environments = {
    development: {
        frontend: {
            host: process.env.FRONTEND_HOST || 'localhost',
            port: parseInt(process.env.FRONTEND_PORT || '5173'),
            url: process.env.FRONTEND_URL || 'http://localhost:5173'
        },
        backend: {
            host: process.env.BACKEND_HOST || 'localhost',
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
const NODE_ENV = process.env.NODE_ENV || 'development';
// Export the configuration for the current environment
exports.config = environments[NODE_ENV];
// Helper functions
const getApiUrl = () => exports.config.backend.graphqlEndpoint;
exports.getApiUrl = getApiUrl;
const getFrontendUrl = () => exports.config.frontend.url;
exports.getFrontendUrl = getFrontendUrl;
const getBackendUrl = () => exports.config.backend.url;
exports.getBackendUrl = getBackendUrl;
const getDatabaseUrl = () => exports.config.database.url;
exports.getDatabaseUrl = getDatabaseUrl;
const getCorsOrigins = () => exports.config.cors.allowedOrigins;
exports.getCorsOrigins = getCorsOrigins;
// Validation function
const validateConfig = () => {
    const required = [
        'frontend.host',
        'frontend.port',
        'backend.host',
        'backend.port',
        'database.url'
    ];
    for (const key of required) {
        const value = key.split('.').reduce((obj, k) => obj?.[k], exports.config);
        if (!value) {
            throw new Error(`Configuration error: ${key} is required but not set`);
        }
    }
};
exports.validateConfig = validateConfig;
exports.default = exports.config;
