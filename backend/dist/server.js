"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const server_1 = require("@apollo/server");
const express5_1 = require("@as-integrations/express5");
const http_1 = require("http");
const ws_1 = require("ws");
const ws_2 = require("graphql-ws/lib/use/ws");
const body_parser_1 = __importDefault(require("body-parser"));
const typeDefs_1 = require("./schema/typeDefs");
const resolvers_1 = require("./schema/resolvers");
const schema_1 = require("@graphql-tools/schema");
const context_1 = require("./context");
async function createApp() {
    const app = (0, express_1.default)();
    // Configure CORS to allow frontend requests
    app.use((0, cors_1.default)({
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://10.207.195.7:5173', // Add external IP as fallback
            'http://172.22.156.32:5173' // Add current network IP
        ], // Allow frontend origins
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight', 'authorization'], // Allow Apollo headers
        methods: ['GET', 'POST', 'OPTIONS']
    }));
    // Simple health / readiness endpoint
    app.get('/health', (_req, res) => {
        const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
        res.json({ status: 'ok', uptime: process.uptime(), fallbackAuth: fb === '1' || fb === 'true', timestamp: new Date().toISOString() });
    });
    const schema = (0, schema_1.makeExecutableSchema)({ typeDefs: typeDefs_1.typeDefs, resolvers: resolvers_1.resolvers });
    const apollo = new server_1.ApolloServer({ schema });
    await apollo.start();
    app.use('/graphql', body_parser_1.default.json(), (0, express5_1.expressMiddleware)(apollo, { context: context_1.createContext }));
    // Create HTTP + WS server wrapper
    const httpServer = (0, http_1.createServer)(app);
    const wsServer = new ws_1.WebSocketServer({ server: httpServer, path: '/graphql' });
    (0, ws_2.useServer)({ schema, context: async () => (0, context_1.createContext)({}) }, wsServer);
    return { app, httpServer };
}
// Runtime start when executed directly (supports both ESM & CJS test environments)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isDirectRun = typeof require !== 'undefined' && require.main === module;
if (isDirectRun) {
    createApp().then(({ httpServer }) => {
        const port = process.env.PORT || 4000;
        const host = process.env.HOST || '0.0.0.0';
        // simple retention / maintenance job
        setInterval(async () => {
            const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
            try {
                if (context_1.prisma && context_1.prisma.telemetry) {
                    await context_1.prisma.telemetry.deleteMany({ where: { createdAt: { lt: cutoff } } });
                }
                if (context_1.prisma && context_1.prisma.lockedEntity) {
                    await context_1.prisma.lockedEntity.deleteMany({ where: { expiresAt: { lt: new Date() } } });
                }
            }
            catch (e) {
                // eslint-disable-next-line no-console
                console.error('maintenance job failed', e.message);
            }
        }, 60 * 1000);
        httpServer.listen(Number(port), host, () => {
            const displayHost = host === '0.0.0.0' ? 'localhost' : host;
            // eslint-disable-next-line no-console
            console.log(`API + WS ready at http://${displayHost}:${port}/graphql (health at /health)`);
        });
    });
}
