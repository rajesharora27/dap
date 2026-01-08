import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createContext, prisma } from './shared/graphql/context';
import { config as appConfig } from './config/app.config';
import { envConfig } from './config/env';
import { getSettingValue } from './config/settings-provider';
import { CustomerTelemetryImportService } from './modules/telemetry/customer-telemetry-import.service';
import { PersonalTelemetryService } from './modules/personal-product/personal-telemetry.service';
import { SessionManager } from './modules/auth/session.service';
import jwt from 'jsonwebtoken';
import { AutoBackupScheduler } from './modules/backup/auto-backup.scheduler';
import { initSentry, captureException } from './shared/monitoring/sentry';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import devToolsRouter, { addLogEntry } from './modules/dev-tools/dev-tools.router';
import { queryComplexityPlugin, queryDepthPlugin } from './shared/graphql/queryComplexity';
import { createHealthRouter } from './shared/health';
// Force restart to load permission enforcement - 2025-11-11

export async function createApp() {
  const app = express();
  const isProduction = envConfig.isProd;

  // Initialize Sentry for error tracking
  initSentry();

  // Enable JSON body parsing for all routes
  app.use(express.json());

  // Capture console logs for DevTools (only in dev mode)
  if (process.env.NODE_ENV !== 'production' && !(global as any).__consoleOverridden) {
    (global as any).__consoleOverridden = true;
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      addLogEntry('info', args.map(a => String(a)).join(' '));
      originalConsoleLog.apply(console, args);
    };

    console.error = (...args) => {
      addLogEntry('error', args.map(a => String(a)).join(' '));
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      addLogEntry('warn', args.map(a => String(a)).join(' '));
      originalConsoleWarn.apply(console, args);
    };
  }

  // Request logging middleware for DevTools
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'error' : 'info';
        // Don't log dev tools polling to avoid noise
        if (!req.url.includes('/api/dev/logs') && !req.url.includes('/api/dev/performance')) {
          addLogEntry(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        }
      });
      next();
    });
  }

  // Trust reverse proxy in production
  if (process.env.TRUST_PROXY === 'true' || isProduction) {
    app.set('trust proxy', 1);
  }

  // Security headers - configured for both HTTP (dev) and HTTPS (prod)
  app.use(helmet({
    // Content Security Policy - disabled in dev for hot reload, enabled in prod
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // Required for React
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: null,  // Don't force HTTPS upgrade
      },
    } : false,

    // HSTS - only in production with HTTPS
    hsts: isProduction ? {
      maxAge: 31536000,  // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,

    // Always enable these (work with HTTP)
    xContentTypeOptions: true,      // X-Content-Type-Options: nosniff
    xFrameOptions: { action: 'sameorigin' },  // Prevent clickjacking
    xXssProtection: true,           // X-XSS-Protection: 1; mode=block
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // Disable these for compatibility
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // Dynamic Rate Limiter Factory
  const createDynamicLimiter = (type: 'general' | 'graphql') => {
    let cached: { signature: string; limiter: any } | null = null;

    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Check if feature is enabled globally
      const enabled = await getSettingValue('rate.limit.enabled', envConfig.rateLimiting.enabled);
      if (!enabled) return next();

      // Get configuration
      const windowMs = await getSettingValue('rate.limit.window.ms', envConfig.rateLimiting.windowMs);

      let max: number;
      if (type === 'general') {
        max = await getSettingValue('rate.limit.max', envConfig.rateLimiting.max);
      } else {
        // Fallback to general max if graphql specific setting doesn't exist yet (or add it to settings later)
        // For now using envConfig default for GraphQL if not explicit, but allow override via generic max if we wanted?
        // Let's rely on envConfig for specific graphql max, but allow it to be disabled via the global toggle.
        // Or better: Use 'rate.limit.max' as base? No, GraphQL limits are different.
        // We will just use the env default for max, but allow window/enabled to be dynamic.
        max = envConfig.rateLimiting.graphqlMax;
      }

      // Check cache signature
      const signature = `${windowMs}-${max}`;

      if (!cached || cached.signature !== signature) {
        cached = {
          signature,
          limiter: rateLimit({
            windowMs,
            max,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            message: type === 'graphql' ? 'GraphQL rate limit exceeded.' : 'Too many requests, please try again later.'
          })
        };
      }

      return cached.limiter(req, res, next);
    };
  };

  const generalRateLimiter = createDynamicLimiter('general');
  const graphqlRateLimiter = createDynamicLimiter('graphql');

  app.use((req, res, next) => {
    if (req.path === '/health') {
      return next();
    }
    return generalRateLimiter(req, res, next);
  });

  // Configure CORS to allow frontend requests
  // In development with no ALLOWED_ORIGINS set, allow all origins for SSH tunnel access
  const corsOrigin = envConfig.cors.origin === '*' ? true : envConfig.cors.origin;
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight', 'authorization'], // Allow Apollo headers
    methods: ['GET', 'POST', 'OPTIONS']
  }));


  // Health check endpoints (Kubernetes-compatible)
  // - /health - Detailed health status
  // - /health/live - Liveness probe
  // - /health/ready - Readiness probe
  // - /health/metrics - Prometheus metrics
  app.use('/health', createHealthRouter(prisma));

  // Serve telemetry export files
  const telemetryExportsDir = path.join(process.cwd(), 'temp', 'telemetry-exports');
  app.use('/api/downloads/telemetry-exports', express.static(telemetryExportsDir));

  // Serve backup files
  const backupDir = path.join(process.cwd(), 'temp', 'backups');
  app.use('/api/downloads/backups', express.static(backupDir));

  // Development Tools API (Dev mode only)
  app.use('/api/dev', devToolsRouter);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Build Apollo plugins array with performance features
  const apolloPlugins = [
    // Query complexity limiting - prevents resource exhaustion
    queryComplexityPlugin(schema, {
      maxComplexity: 1000,
      warnThreshold: 500,
      enforceLimit: envConfig.isProd,
    }),
    // Query depth limiting - prevents deeply nested queries
    queryDepthPlugin(15),
    // Landing page based on environment
    ...(envConfig.features.graphqlPlayground
      ? [ApolloServerPluginLandingPageLocalDefault({ includeCookies: true })]
      : [ApolloServerPluginLandingPageProductionDefault({ footer: false })]),
  ];

  const apollo = new ApolloServer({
    schema,
    csrfPrevention: false,
    introspection: envConfig.features.introspection,
    plugins: apolloPlugins,
  });
  await apollo.start();
  const graphqlMiddleware: any[] = [
    expressMiddleware(apollo, { context: createContext })
  ];
  // Always mount the dynamic limiter wrapper, it handles enable/disable internally
  graphqlMiddleware.unshift(graphqlRateLimiter);
  // Add graphql-upload middleware for file upload support
  app.use('/graphql', graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }), ...graphqlMiddleware);

  // Optional: Serve frontend static files in production (if using single-server deployment)
  // Set SERVE_FRONTEND=true to enable this mode
  if (process.env.SERVE_FRONTEND === 'true') {
    const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');

    if (fs.existsSync(frontendDist)) {
      console.log(`Serving frontend static files from: ${frontendDist}`);

      // Serve static assets with caching
      app.use(express.static(frontendDist, {
        maxAge: '1y',
        setHeaders: (res, filepath) => {
          // Don't cache index.html
          if (filepath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        }
      }));

      // Handle client-side routing (SPA) - must be last
      app.get('*', (req, res, next) => {
        // Don't interfere with API routes
        if (req.path.startsWith('/graphql') ||
          req.path.startsWith('/api/') ||
          req.path.startsWith('/health')) {
          return next();
        }
        res.sendFile(path.join(frontendDist, 'index.html'));
      });
    } else {
      console.warn(`Frontend dist directory not found: ${frontendDist}`);
      console.warn('Set SERVE_FRONTEND=false or build frontend first');
    }
  }

  // Create HTTP + WS server wrapper
  const httpServer = createServer(app);
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  useServer({ schema, context: async () => createContext({}) }, wsServer);
  return { app, httpServer };
}

// Runtime start when executed directly (supports both ESM & CJS test environments)
// @ts-ignore
const isDirectRun = typeof require !== 'undefined' && require.main === module;
if (isDirectRun) {
  createApp().then(async ({ httpServer }) => {
    const port = appConfig.backend.port;
    const host = appConfig.backend.host;

    // Clear all sessions on startup to force re-authentication
    // Only in production - in development, we want to preserve sessions during hot-reload
    if (envConfig.isProd) {
      console.log('🔐 Server starting - clearing all sessions for security...');
      try {
        await SessionManager.clearAllSessions();
      } catch (e) {
        console.error('⚠️  Failed to clear sessions on startup:', (e as any).message);
      }
    } else {
      console.log('🔓 Development mode - preserving existing sessions');
    }

    // Initialize auto-backup scheduler
    console.log('🔄 Initializing auto-backup scheduler...');
    try {
      const autoBackupScheduler = AutoBackupScheduler.getInstance();
      autoBackupScheduler.start();
      console.log('✅ Auto-backup scheduler initialized');
    } catch (e) {
      console.error('⚠️  Failed to initialize auto-backup scheduler:', (e as any).message);
    }

    // Seed initial application settings
    console.log('⚙️  Seeding application settings...');
    try {
      const { SettingsService } = await import('./modules/settings');
      await SettingsService.seedInitialSettings();
      // Preload settings cache for fast runtime access
      const { preloadSettingsCache } = await import('./config/settings-provider');
      await preloadSettingsCache();
    } catch (e) {
      console.error('⚠️  Failed to seed settings:', (e as any).message);
    }

    // Run maintenance job every minute
    // - Clear old telemetry (30+ days)
    // - Clear expired sessions (7+ days)
    // - Clear expired locks
    setInterval(async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      try {
        // Clean old telemetry data
        if (prisma && prisma.telemetry) {
          const telemetryResult = await prisma.telemetry.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } }
          });
          if (telemetryResult.count > 0) {
            console.log(`🧹 Cleaned up ${telemetryResult.count} old telemetry record(s)`);
          }
        }

        // Run session maintenance
        await SessionManager.runMaintenance();
      } catch (e) {
        console.error('❌ Maintenance job failed:', (e as any).message);
      }
    }, 60 * 1000); // Every minute
    httpServer.listen(Number(port), host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      console.log(`API + WS ready at http://${displayHost}:${port}/graphql (health at /health)`);
    });
  });
}
