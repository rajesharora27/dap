import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || undefined });

export const isProd = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
export const isDev = !isProd && !isTest;

const bool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const int = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const envConfig = {
  isDev,
  isTest,
  isProd,
  auth: {
    required: isProd,
    bypassEnabled: bool(process.env.AUTH_BYPASS, isDev || isTest),
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || (isDev ? '7d' : '24h'),
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
    enforceStrict: bool(process.env.RBAC_STRICT, isProd),
    warnOnViolation: bool(process.env.RBAC_WARN, isDev),
    autoGrantPermissions: bool(process.env.RBAC_AUTO_GRANT, isDev)
  },
  database: {
    autoSeed: bool(process.env.AUTO_SEED, isDev),
    seedOnStart: bool(process.env.SEED_ON_START, isDev),
    resetOnRestart: bool(process.env.RESET_DB, false)
  },
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
      : isDev
        ? '*'
        : [process.env.FRONTEND_URL || 'https://myapps.cxsaaslab.com'],
    credentials: true
  },
  rateLimiting: {
    enabled: bool(process.env.RATE_LIMIT_ENABLED, isProd),
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(process.env.RATE_LIMIT_MAX, isDev ? 10000 : 100),
    graphqlMax: int(process.env.RATE_LIMIT_GRAPHQL_MAX, isDev ? 5000 : 300)
  },
  logging: {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    pretty: bool(process.env.LOG_PRETTY, isDev),
    redact: isProd ? ['password', 'token'] : []
  },
  features: {
    graphqlPlayground: bool(process.env.GRAPHQL_PLAYGROUND, isDev || isTest),
    introspection: bool(process.env.APOLLO_INTROSPECTION, isDev || isTest),
    caching: bool(process.env.ENABLE_CACHE, isProd)
  }
};

export type EnvConfig = typeof envConfig;

