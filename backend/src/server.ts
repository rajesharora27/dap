import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import bodyParser from 'body-parser';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createContext, prisma } from './context';
import { config, getCorsOrigins } from './config/app.config';

export async function createApp() {
  const app = express();

  // Configure CORS to allow frontend requests
  app.use(cors({
    origin: getCorsOrigins(), // Use configuration system
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight', 'authorization'], // Allow Apollo headers
    methods: ['GET', 'POST', 'OPTIONS']
  }));

  // Simple health / readiness endpoint
  app.get('/health', (_req, res) => {
    const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
    res.json({ status: 'ok', uptime: process.uptime(), fallbackAuth: fb === '1' || fb === 'true', timestamp: new Date().toISOString() });
  });
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const apollo = new ApolloServer({ schema });
  await apollo.start();
  app.use('/graphql', bodyParser.json(), expressMiddleware(apollo, { context: createContext }));

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
