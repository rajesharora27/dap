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
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createContext, prisma } from './shared/graphql/context';
import { config as appConfig } from './config/app.config';
import { envConfig } from './config/env';
import { CustomerTelemetryImportService } from './services/telemetry/CustomerTelemetryImportService';
import { SessionManager } from './utils/sessionManager';
import { AutoBackupScheduler } from './services/AutoBackupScheduler';
import { initSentry, captureException } from './shared/monitoring/sentry';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import devToolsRouter, { addLogEntry } from './api/devTools';
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

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  const shouldRateLimit = envConfig.rateLimiting.enabled;
  const windowMs = envConfig.rateLimiting.windowMs;
  const maxRequests = envConfig.rateLimiting.max;

  const generalRateLimiter = shouldRateLimit ? rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  }) : null;

  const graphqlRateLimiter = shouldRateLimit ? rateLimit({
    windowMs,
    max: envConfig.rateLimiting.graphqlMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'GraphQL rate limit exceeded.'
  }) : null;

  if (shouldRateLimit && generalRateLimiter) {
    app.use((req, res, next) => {
      if (req.path === '/health') {
        return next();
      }
      return generalRateLimiter(req, res, next);
    });
  }

  // Configure CORS to allow frontend requests
  // In development with no ALLOWED_ORIGINS set, allow all origins for SSH tunnel access
  const corsOrigin = envConfig.cors.origin === '*' ? true : envConfig.cors.origin;
  app.use(cors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight', 'authorization'], // Allow Apollo headers
    methods: ['GET', 'POST', 'OPTIONS']
  }));

  // Simple health / readiness endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      fallbackAuth: envConfig.auth.bypassEnabled,
      rateLimiting: shouldRateLimit,
      timestamp: new Date().toISOString()
    });
  });

  // Serve telemetry export files
  const telemetryExportsDir = path.join(process.cwd(), 'temp', 'telemetry-exports');
  app.use('/api/downloads/telemetry-exports', express.static(telemetryExportsDir));

  // Serve backup files
  const backupDir = path.join(process.cwd(), 'temp', 'backups');
  app.use('/api/downloads/backups', express.static(backupDir));

  // REST endpoint for telemetry import (multipart file upload)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  // Configure multer for larger SQL backup files (up to 100MB)
  const backupUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
  });

  app.post('/api/telemetry/import/:adoptionPlanId', upload.single('file'), async (req, res) => {
    try {
      const { adoptionPlanId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      if (!adoptionPlanId) {
        return res.status(400).json({ success: false, message: 'Adoption plan ID is required' });
      }

      // Import the telemetry values
      const result = await CustomerTelemetryImportService.importTelemetryValues(adoptionPlanId, file.buffer);

      // NOTE: Re-evaluation is now handled inside CustomerTelemetryImportService to support
      // "missing data" logic (checking batch freshness). Calling evaluateAllTasksTelemetry here
      // would override that logic and incorrectly set status back to DONE for missing tasks.

      res.json(result);
    } catch (error: any) {
      console.error('Telemetry import error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Import failed'
      });
    }
  });

  // REST endpoint for solution telemetry import
  app.post('/api/solution-telemetry/import/:solutionAdoptionPlanId', upload.single('file'), async (req, res) => {
    try {
      const { solutionAdoptionPlanId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      if (!solutionAdoptionPlanId) {
        return res.status(400).json({ success: false, message: 'Solution adoption plan ID is required' });
      }

      // Import the telemetry values
      const result = await CustomerTelemetryImportService.importSolutionTelemetryValues(solutionAdoptionPlanId, file.buffer);

      // NOTE: Re-evaluation is now handled inside CustomerTelemetryImportService

      res.json(result);
    } catch (error: any) {
      console.error('Solution telemetry import error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Import failed'
      });
    }
  });

  // REST endpoint for backup restoration from uploaded SQL file
  app.post('/api/backup/restore-from-file', backupUpload.single('file'), async (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No SQL file uploaded' });
      }

      // Validate file extension
      if (!file.originalname.endsWith('.sql')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only .sql files are accepted.'
        });
      }

      // Save the uploaded file to the backups directory
      const backupsDir = path.join(process.cwd(), 'temp', 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `uploaded_${timestamp}_${file.originalname}`;
      const filePath = path.join(backupsDir, filename);

      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Import the BackupRestoreService dynamically
      const { BackupRestoreService } = await import('./services/BackupRestoreService');

      // Restore from the uploaded file
      const result = await BackupRestoreService.restoreBackup(filename);

      res.json(result);
    } catch (error: any) {
      console.error('Backup restore from file error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Restore from file failed',
        error: error.message
      });
    }
  });

  // SSE endpoint for import progress
  app.get('/api/import/progress/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).send('Missing session ID');
      return;
    }

    // Import dynamically to avoid circular dependencies if any (though unlikely here)
    // or just use the imported service if available.
    // Better to import along with others at top, but for replacing content block safely:
    // I will assume specific import at top or import here using dynamic import if needed.
    // Let's use dynamic import to be safe with tool usage without modifying top of file.
    import('./services/excel-v2/progress/ProgressService').then(({ ProgressService }) => {
      ProgressService.getInstance().addClient(sessionId, res);
    });
  });

  // Development Tools API (Dev mode only)
  app.use('/api/dev', devToolsRouter);

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apollo = new ApolloServer({
    schema,
    csrfPrevention: false,
    introspection: envConfig.features.introspection,
    plugins: envConfig.features.graphqlPlayground
      ? [ApolloServerPluginLandingPageLocalDefault({ includeCookies: true })]
      : [ApolloServerPluginLandingPageProductionDefault({ footer: false })]
  });
  await apollo.start();
  const graphqlMiddleware: any[] = [
    expressMiddleware(apollo, { context: createContext })
  ];
  if (graphqlRateLimiter) {
    graphqlMiddleware.unshift(graphqlRateLimiter);
  }
  app.use('/graphql', ...graphqlMiddleware);

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
