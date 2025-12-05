
import express from 'express';
import cors from 'cors';
import devToolsRouter from './api/devTools';
import { envConfig } from './config/env';

const app = express();
const PORT = 4001;

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins in dev
    credentials: true
}));

app.use(express.json());

// Mount DevTools router
app.use('/api/dev', devToolsRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'dev-tools' });
});

app.listen(PORT, () => {
    console.log(`🚀 DevTools Server running on port ${PORT}`);
    console.log(`   - Dev API: http://localhost:${PORT}/api/dev`);
});
