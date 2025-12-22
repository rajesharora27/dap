import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define schema for strict validation
const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  BACKEND_PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_PROVIDER: z.string().default('postgresql'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('dev-secret-at-least-32-chars-long-for-safety'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  AUTH_BYPASS: z.string().optional().transform(v => v === '1' || v === 'true'),
  AUTH_FALLBACK: z.string().optional().transform(v => v === '1' || v === 'true'),

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
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
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

