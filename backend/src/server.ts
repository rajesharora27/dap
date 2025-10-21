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

  // REST endpoint for telemetry import (multipart file upload)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
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
  createApp().then(({ httpServer }) => {
    const port = config.backend.port;
    const host = config.backend.host;
    // simple retention / maintenance job
    setInterval(async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      try {
        if (prisma && prisma.telemetry) {
          await prisma.telemetry.deleteMany({ where: { createdAt: { lt: cutoff } } });
        }
        if (prisma && prisma.lockedEntity) {
          await prisma.lockedEntity.deleteMany({ where: { expiresAt: { lt: new Date() } } });
        }
      } catch (e) {
        console.error('maintenance job failed', (e as any).message);
      }
    }, 60 * 1000);
    httpServer.listen(Number(port), host, () => {
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      console.log(`API + WS ready at http://${displayHost}:${port}/graphql (health at /health)`);
    });
  });
}
