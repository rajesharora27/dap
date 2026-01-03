import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// =============================================================================
// SECURITY: Critical secrets validation
// =============================================================================
// In production, the application MUST crash if critical secrets are missing.
// This prevents running with insecure defaults that could compromise the system.
// =============================================================================

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Critical secrets that MUST be present in production.
 * Missing any of these will cause immediate application termination.
 */
const CRITICAL_SECRETS = ['JWT_SECRET', 'DATABASE_URL'] as const;

/**
 * Validates that all critical secrets are present in production.
 * @throws {Error} Crashes the application if secrets are missing in production
 */
function validateCriticalSecrets(): void {
  if (!isProduction) return; // Only enforce in production
  
  const missing: string[] = [];
  
  for (const secret of CRITICAL_SECRETS) {
    if (!process.env[secret] || process.env[secret]?.trim() === '') {
      missing.push(secret);
    }
  }
  
  // Check for development fallback values that should never be in production
  const jwtSecret = process.env.JWT_SECRET || '';
  const dangerousPatterns = [
    'dev-secret',
    'change-in-production',
    'fallback',
    'your-secret',
    'secret-key',
    'changeme',
    'password',
    'test'
  ];
  
  const lowerSecret = jwtSecret.toLowerCase();
  for (const pattern of dangerousPatterns) {
    if (lowerSecret.includes(pattern)) {
      console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⛔ SECURITY VIOLATION: INSECURE JWT_SECRET DETECTED                         ║
║                                                                              ║
║  The JWT_SECRET contains a development/test pattern: "${pattern}"            ║
║  This is a critical security vulnerability in production!                   ║
║                                                                              ║
║  Generate a secure secret with: openssl rand -base64 64                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
      process.exit(1);
    }
  }
  
  if (missing.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⛔ FATAL: MISSING CRITICAL ENVIRONMENT VARIABLES IN PRODUCTION              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  The following required secrets are missing:                                 ║
${missing.map(s => `║    • ${s.padEnd(68)}║`).join('\n')}
║                                                                              ║
║  These variables MUST be set in production for security.                     ║
║  The application cannot start without them.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }
  
  // Additional JWT_SECRET length check for production
  if (jwtSecret.length < 32) {
    console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⛔ SECURITY VIOLATION: JWT_SECRET TOO SHORT                                 ║
║                                                                              ║
║  JWT_SECRET must be at least 32 characters in production.                    ║
║  Current length: ${String(jwtSecret.length).padEnd(52)}║
║                                                                              ║
║  Generate a secure secret with: openssl rand -base64 64                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }
}

// Run validation immediately on module load
validateCriticalSecrets();

// Define schema for strict validation
// NOTE: In production, defaults are NOT used for critical secrets (validated above)
const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  BACKEND_PORT: z.coerce.number().default(4000),

  // Database - REQUIRED, no fallback
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_PROVIDER: z.string().default('postgresql'),

  // Authentication - Development fallback ONLY for non-production
  // In production, validateCriticalSecrets() ensures these are set
  JWT_SECRET: isProduction
    ? z.string().min(32, 'JWT_SECRET must be at least 32 characters')
    : z.string().min(32).default('dev-secret-at-least-32-chars-long-for-safety'),
  JWT_REFRESH_SECRET: isProduction
    ? z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters').optional()
    : z.string().min(32).default('dev-refresh-secret-32-chars-long-min').optional(),
  JWT_EXPIRES_IN: z.string().default('8h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  AUTH_BYPASS: z.string().optional().transform(v => v === '1' || v === 'true'),
  AUTH_FALLBACK: z.string().optional().transform(v => v === '1' || v === 'true'),
  
  // Default password for new users (admin-created accounts)
  DEFAULT_USER_PASSWORD: isProduction
    ? z.string().min(8, 'DEFAULT_USER_PASSWORD must be at least 8 characters').optional()
    : z.string().min(6).default('DAP123').optional(),

  // RBAC
  RBAC_STRICT: z.string().optional().transform(v => v === '1' || v === 'true'),
  RBAC_WARN: z.string().optional().transform(v => v === '1' || v === 'true'),
  RBAC_AUTO_GRANT: z.string().optional().transform(v => v === '1' || v === 'true'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().optional().transform(v => v === '1' || v === 'true'),
  RATE_LIMIT_WINDOW_MS: z.string().optional().transform(v => parseInt(v || '900000', 10)),
  RATE_LIMIT_MAX: z.string().optional().transform(v => parseInt(v || '5000', 10)),
  RATE_LIMIT_GRAPHQL_MAX: z.string().optional().transform(v => parseInt(v || '10000', 10)),

  // CORS
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY: z.string().optional().transform(v => v === '1' || v === 'true'),

  // Feature Flags
  GRAPHQL_PLAYGROUND: z.string().optional().transform(v => v === '1' || v === 'true'),
  APOLLO_INTROSPECTION: z.string().optional().transform(v => v === '1' || v === 'true'),
  ENABLE_CACHE: z.string().optional().transform(v => v === '1' || v === 'true'),
  SHOW_DEV_MENU: z.string().optional().transform(v => v === '1' || v === 'true'),

  // DevTools
  DEVTOOLS_ENABLED: z.string().optional().transform(v => v === '1' || v === 'true'),
  DEVTOOLS_PORT: z.coerce.number().default(4001),

  // Data Management
  AUTO_SEED: z.string().optional().transform(v => v === '1' || v === 'true'),
  SEED_ON_START: z.string().optional().transform(v => v === '1' || v === 'true'),
  RESET_DB: z.string().optional().transform(v => v === '1' || v === 'true'),

  // AI Agent
  AI_AGENT_ENABLED: z.string().optional().transform(v => v === '1' || v === 'true'),
  LLM_PROVIDER: z.enum(['cisco', 'openai', 'gemini', 'anthropic', 'mock']).default('mock'),
  AI_DEBUG_MODE: z.string().optional().transform(v => v === '1' || v === 'true'),
  LLM_MAX_TOKENS: z.string().optional().transform(v => parseInt(v || '2000', 10)),
  LLM_TIMEOUT: z.string().optional().transform(v => parseInt(v || '30000', 10)),

  // AI Provider Keys (Optional in schema, but checked logic-side if provider is selected)
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Cisco AI
  CISCO_AI_TIER: z.string().optional(),
  CISCO_AI_MODEL: z.string().optional(),
  CISCO_AI_CLIENT_ID: z.string().optional(),
  CISCO_AI_CLIENT_SECRET: z.string().optional(),
  CISCO_AI_API_KEY: z.string().optional(),
  CISCO_AI_API_VERSION: z.string().optional(),
  CISCO_AI_TOKEN_URL: z.string().optional(),
  CISCO_AI_ENDPOINT: z.string().optional(),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

const env = parsedEnv.data;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDev = env.NODE_ENV === 'development';

export const envConfig = {
  isDev,
  isTest,
  isProd,
  auth: {
    required: isProd,
    bypassEnabled: env.AUTH_BYPASS || (isDev || isTest),
    /**
     * JWT signing secret. In production, this MUST be a secure random string.
     * The application will crash at startup if this is missing or insecure in production.
     */
    jwtSecret: env.JWT_SECRET,
    /**
     * Optional separate secret for refresh tokens. Falls back to jwtSecret if not set.
     */
    jwtRefreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    /**
     * Default password for admin-created user accounts.
     * Users will be prompted to change this on first login.
     * In production, consider using a more secure default or requiring admin to set.
     */
    defaultUserPassword: env.DEFAULT_USER_PASSWORD || 'ChangeMe123!',
    defaultDevUser: {
      id: 'dev-admin',
      userId: 'dev-admin',
      username: 'dev',
      email: 'dev@localhost',
      role: 'ADMIN',
      roles: ['ADMIN'],
      isAdmin: true
    }
  },
  rbac: {
    enforceStrict: env.RBAC_STRICT ?? isProd,
    warnOnViolation: env.RBAC_WARN ?? isDev,
    autoGrantPermissions: env.RBAC_AUTO_GRANT ?? isDev
  },
  database: {
    autoSeed: env.AUTO_SEED ?? isDev,
    seedOnStart: env.SEED_ON_START ?? isDev,
    resetOnRestart: env.RESET_DB ?? false
  },
  cors: {
    origin: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
      : isDev
        ? '*'
        : [env.FRONTEND_URL || 'https://myapps.cxsaaslab.com'],
    credentials: true
  },
  rateLimiting: {
    enabled: env.RATE_LIMIT_ENABLED ?? isProd,
    windowMs: env.RATE_LIMIT_WINDOW_MS || 900000,
    max: env.RATE_LIMIT_MAX || (isDev ? 10000 : 100),
    graphqlMax: env.RATE_LIMIT_GRAPHQL_MAX || (isDev ? 5000 : 300)
  },
  logging: {
    level: env.LOG_LEVEL,
    pretty: env.LOG_PRETTY ?? isDev,
    redact: isProd ? ['password', 'token'] : []
  },
  features: {
    graphqlPlayground: env.GRAPHQL_PLAYGROUND ?? (isDev || isTest),
    introspection: env.APOLLO_INTROSPECTION ?? (isDev || isTest),
    caching: env.ENABLE_CACHE ?? isProd,
    showDevMenu: env.SHOW_DEV_MENU ?? isDev,
    devTools: {
      enabled: env.DEVTOOLS_ENABLED ?? isDev,
      port: env.DEVTOOLS_PORT
    }
  },
  llm: {
    provider: env.LLM_PROVIDER,
    openaiApiKey: env.OPENAI_API_KEY,
    geminiApiKey: env.GEMINI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    model: process.env.LLM_MODEL, // Keep direct access for dynamic override
    maxTokens: env.LLM_MAX_TOKENS,
    timeout: env.LLM_TIMEOUT,
    enabled: env.AI_AGENT_ENABLED ?? true,
    debugMode: env.AI_DEBUG_MODE ?? isDev
  }
};

export type EnvConfig = typeof envConfig;

