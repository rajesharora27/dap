import express from 'express';
import cors from 'cors';
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
import { createContext, prisma } from './context';
import { config, getCorsOrigins } from './config/app.config';
import { CustomerTelemetryImportService } from './services/telemetry/CustomerTelemetryImportService';
import { SessionManager } from './utils/sessionManager';
import { AutoBackupScheduler } from './services/AutoBackupScheduler';
// Force restart to load permission enforcement - 2025-11-11

export async function createApp() {
  const app = express();

  // Trust reverse proxy in production
  if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Configure CORS to allow frontend requests
  // In development with no ALLOWED_ORIGINS set, allow all origins for SSH tunnel access
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const hasCustomOrigins = !!process.env.ALLOWED_ORIGINS;
  
  app.use(cors({
    origin: (isDevelopment && !hasCustomOrigins) ? true : getCorsOrigins(), // Allow all in dev for SSH tunnels
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight', 'authorization'], // Allow Apollo headers
    methods: ['GET', 'POST', 'OPTIONS']
  }));

  // Simple health / readiness endpoint
  app.get('/health', (_req, res) => {
    const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
    res.json({ status: 'ok', uptime: process.uptime(), fallbackAuth: fb === '1' || fb === 'true', timestamp: new Date().toISOString() });
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

      // Evaluate all task statuses immediately after import (same as GraphQL mutation)
      // Import the resolver dynamically to avoid circular dependencies
      const { CustomerAdoptionMutationResolvers } = await import('./schema/resolvers/customerAdoption');
      await CustomerAdoptionMutationResolvers.evaluateAllTasksTelemetry(
        {}, 
        { adoptionPlanId }, 
        { user: { id: 'system', role: 'ADMIN' } }
      );

      res.json(result);
    } catch (error: any) {
      console.error('Telemetry import error:', error);
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

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apollo = new ApolloServer({ schema });
  await apollo.start();
  app.use('/graphql', bodyParser.json(), expressMiddleware(apollo, { context: createContext }));

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
    const port = config.backend.port;
    const host = config.backend.host;
    
    // Clear all sessions on startup to force re-authentication
    console.log('🔐 Server starting - clearing all sessions for security...');
    try {
      await SessionManager.clearAllSessions();
    } catch (e) {
      console.error('⚠️  Failed to clear sessions on startup:', (e as any).message);
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
