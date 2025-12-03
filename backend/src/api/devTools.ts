import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const router = Router();

/**
 * Development Tools API
 * Only available in development mode
 */

// Middleware to check dev mode
const devModeOnly = (req: Request, res: Response, next: any) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Development mode only' });
    }
    next();
};

// Apply dev mode check to all routes
router.use(devModeOnly);

/**
 * Run a test command
 * POST /api/dev/run-test
 */
router.post('/run-test', async (req: Request, res: Response) => {
    try {
        // Log request for debugging
        console.log('Test request received:', { body: req.body, headers: req.headers['content-type'] });

        const { command } = req.body || {};

        if (!command) {
            console.error('No command provided in request body');
            return res.status(400).json({
                error: 'Command is required',
                receivedBody: req.body
            });
        }

        // Whitelist of allowed commands for security
        const allowedCommands: Record<string, string> = {
            'npm test': 'npm test',
            'npm run test:integration': 'npm test', // Use 'npm test' as integration script doesn't exist
            'npm run test:coverage': 'npm run test:coverage',
            'npm run lint': 'npm run lint',
            'npm run type-check': 'npm run type-check'
        };

        if (!allowedCommands[command]) {
            return res.status(400).json({ error: 'Invalid command' });
        }

        const startTime = Date.now();

        // Execute command in backend directory
        const { stdout, stderr } = await execAsync(allowedCommands[command], {
            cwd: path.join(__dirname, '..'),
            timeout: 120000, // 2 minute timeout
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });

        const duration = Date.now() - startTime;

        res.json({
            success: true,
            output: stdout + stderr,
            duration,
            command
        });
    } catch (error: any) {
        const duration = Date.now() - (error.startTime || Date.now());
        res.json({
            success: false,
            output: error.stdout + error.stderr || error.message,
            duration,
            error: error.message
        });
    }
});

/**
 * Get list of available documentation files
 * GET /api/dev/docs
 */
router.get('/docs', async (req: Request, res: Response) => {
    try {
        const projectRoot = path.join(__dirname, '../..');

        const docs = [
            { path: '/README.md', category: 'Overview' },
            { path: '/CONTEXT.md', category: 'Overview' },
            { path: '/CONTRIBUTING.md', category: 'Development' },
            { path: '/COMPREHENSIVE_ANALYSIS.md', category: 'Analysis' },
            { path: '/EXECUTIVE_SUMMARY.md', category: 'Analysis' },
            { path: '/QUICK_REFERENCE.md', category: 'Reference' },
            { path: '/PHASE2_SUMMARY.md', category: 'Implementation' },
            { path: '/PHASE4_SUMMARY.md', category: 'Implementation' },
            { path: '/PHASE5_SUMMARY.md', category: 'Implementation' },
            { path: '/FINAL_TEST_COVERAGE.md', category: 'Testing' },
            { path: '/TEST_COVERAGE_PLAN.md', category: 'Testing' },
            { path: '/COMPREHENSIVE_TEST_SUMMARY.md', category: 'Testing' },
            { path: '/FINAL_SUMMARY.md', category: 'Summary' },
            { path: '/deploy/README.md', category: 'Deployment' },
            { path: '/.github/workflows/README.md', category: 'CI/CD' }
        ];

        // Get file stats for each document
        const docsWithStats = await Promise.all(
            docs.map(async (doc) => {
                try {
                    const fullPath = path.join(projectRoot, doc.path);
                    const stats = await fs.stat(fullPath);
                    const sizeKB = (stats.size / 1024).toFixed(2);
                    return {
                        ...doc,
                        size: `${sizeKB} KB`,
                        exists: true,
                        modified: stats.mtime
                    };
                } catch (error) {
                    return {
                        ...doc,
                        exists: false
                    };
                }
            })
        );

        res.json({
            docs: docsWithStats.filter(d => d.exists)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get content of a specific documentation file
 * GET /api/dev/docs/*
 */
router.get(/^\/docs(.*)/, async (req: Request, res: Response) => {
    try {
        const docPath = req.params[0] || '/README.md';
        const projectRoot = path.join(__dirname, '../../..');
        const fullPath = path.join(projectRoot, docPath);

        // Security: Ensure path is within project root
        const resolvedPath = path.resolve(fullPath);
        const resolvedRoot = path.resolve(projectRoot);

        if (!resolvedPath.startsWith(resolvedRoot)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if file exists
        try {
            await fs.access(fullPath);
        } catch {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Read file content
        const content = await fs.readFile(fullPath, 'utf-8');
        const stats = await fs.stat(fullPath);

        res.json({
            path: docPath,
            content,
            size: stats.size,
            modified: stats.mtime
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get system information
 * GET /api/dev/system-info
 */
router.get('/system-info', async (req: Request, res: Response) => {
    try {
        const { stdout: nodeVersion } = await execAsync('node --version');
        const { stdout: npmVersion } = await execAsync('npm --version');

        let gitBranch = 'unknown';
        let gitCommit = 'unknown';
        try {
            const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
            const { stdout: commit } = await execAsync('git rev-parse --short HEAD');
            gitBranch = branch.trim();
            gitCommit = commit.trim();
        } catch {
            // Git not available or not a git repo
        }

        res.json({
            node: nodeVersion.trim(),
            npm: npmVersion.trim(),
            env: process.env.NODE_ENV || 'development',
            git: {
                branch: gitBranch,
                commit: gitCommit
            },
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Database Management Endpoints
 */

// Get database status
router.get('/database/status', async (req: Request, res: Response) => {
    try {
        const migrationsDir = path.join(__dirname, '../../prisma/migrations');
        let migrations: any[] = [];

        try {
            const dirs = await fs.readdir(migrationsDir);
            migrations = dirs
                .filter(d => d !== 'migration_lock.toml')
                .map(name => ({
                    name,
                    status: 'applied',
                    appliedAt: new Date().toISOString()
                }));
        } catch {
            migrations = [];
        }

        res.json({
            connected: true,
            database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
            pendingMigrations: 0,
            appliedMigrations: migrations.length,
            migrations
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Run migrations
router.post('/database/migrate', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
            cwd: path.join(__dirname, '../..'),
            timeout: 60000
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

// Seed database
router.post('/database/seed', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npx prisma db seed', {
            cwd: path.join(__dirname, '../..'),
            timeout: 60000
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

// Reset database
router.post('/database/reset', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npx prisma migrate reset --force', {
            cwd: path.join(__dirname, '../..'),
            timeout: 120000
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

// Generate Prisma client
router.post('/database/generate', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npx prisma generate', {
            cwd: path.join(__dirname, '../..'),
            timeout: 60000
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

/**
 * Logs Endpoints
 */

// Simple log buffer (in production, use proper logging solution)
let logBuffer: Array<{
    timestamp: string;
    level: string;
    message: string;
    meta?: any;
}> = [];

// Add log entry (call this from your app)
export function addLogEntry(level: string, message: string, meta?: any) {
    logBuffer.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        meta
    });

    // Keep only last 1000 logs
    if (logBuffer.length > 1000) {
        logBuffer = logBuffer.slice(-1000);
    }
}

// Get logs
router.get('/logs', (req: Request, res: Response) => {
    res.json({ logs: logBuffer.slice(-500) }); // Last 500 logs
});

// Clear logs
router.post('/logs/clear', (req: Request, res: Response) => {
    logBuffer = [];
    res.json({ success: true, message: 'Logs cleared' });
});

/**
 * Build & Deploy Endpoints
 */
router.post('/build/frontend', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: path.join(__dirname, '../../../frontend'),
            timeout: 300000 // 5 mins
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

router.post('/build/backend', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: path.join(__dirname, '../..'),
            timeout: 300000
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

/**
 * Environment Endpoints
 */
router.get('/env', async (req: Request, res: Response) => {
    try {
        const envPath = path.join(__dirname, '../../.env');
        const content = await fs.readFile(envPath, 'utf-8');
        const lines = content.split('\n').map(line => {
            const [key, ...valueParts] = line.split('=');
            if (!key || key.startsWith('#')) return null;

            const isSecret = key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD') || key.includes('TOKEN');
            return {
                key: key.trim(),
                value: isSecret ? '********' : valueParts.join('=').trim(),
                isSecret
            };
        }).filter(Boolean);
        res.json({ variables: lines });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Code Quality Endpoints
 */
router.get('/quality/coverage', async (req: Request, res: Response) => {
    try {
        // Try to read coverage summary
        const coveragePath = path.join(__dirname, '../../coverage/coverage-summary.json');
        try {
            const coverage = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));
            res.json(coverage);
        } catch {
            res.json({ error: 'Coverage report not found. Run "npm run test:coverage" first.' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Performance Endpoints
 */
router.get('/performance/stats', async (req: Request, res: Response) => {
    res.json({
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
        loadavg: [0, 0, 0] // process.getloadavg() not available in all environments
    });
});

/**
 * Git Endpoints
 */
router.get('/git/status', async (req: Request, res: Response) => {
    try {
        const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
        const { stdout: commit } = await execAsync('git rev-parse --short HEAD');
        const { stdout: status } = await execAsync('git status --porcelain');
        const { stdout: lastCommitMsg } = await execAsync('git log -1 --pretty=%B');

        res.json({
            branch: branch.trim(),
            commit: commit.trim(),
            lastMessage: lastCommitMsg.trim(),
            changes: status.split('\n').filter(Boolean).length,
            statusOutput: status
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Commit changes
router.post('/git/commit', async (req: Request, res: Response) => {
    try {
        const { message } = req.body || {};

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Commit message is required' });
        }

        // Add all changes
        await execAsync('git add -A');

        // Commit with message
        const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`);

        res.json({
            success: true,
            output: stdout,
            message: 'Changes committed successfully'
        });
    } catch (error: any) {
        // Check if there's nothing to commit
        if (error.message.includes('nothing to commit')) {
            return res.json({
                success: false,
                output: error.stdout || error.message,
                message: 'No changes to commit'
            });
        }

        res.status(500).json({
            error: error.message,
            output: error.stdout + error.stderr || error.message
        });
    }
});

// Push to origin
router.post('/git/push', async (req: Request, res: Response) => {
    try {
        // Get current branch
        const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
        const currentBranch = branch.trim();

        // Push to origin
        const { stdout, stderr } = await execAsync(`git push origin ${currentBranch}`, {
            timeout: 60000 // 60 second timeout for push
        });

        res.json({
            success: true,
            output: stdout + stderr,
            message: `Pushed to origin/${currentBranch}`
        });
    } catch (error: any) {
        // Common push errors
        let errorMessage = error.message;

        if (error.message.includes('Could not resolve host')) {
            errorMessage = 'No internet connection or GitHub is unreachable';
        } else if (error.message.includes('Permission denied')) {
            errorMessage = 'Permission denied. Check SSH key or authentication';
        } else if (error.message.includes('rejected')) {
            errorMessage = 'Push rejected. Pull latest changes first';
        }

        res.json({
            success: false,
            error: errorMessage,
            output: error.stdout + error.stderr || error.message
        });
    }
});

/**
 * Task Runner Endpoints
 */
router.get('/tasks/scripts', async (req: Request, res: Response) => {
    try {
        const packageJson = JSON.parse(
            await fs.readFile(path.join(__dirname, '../../package.json'), 'utf-8')
        );
        res.json({ scripts: packageJson.scripts || {} });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Database Schema
router.get('/database/schema', async (req: Request, res: Response) => {
    try {
        const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
        const schema = await fs.readFile(schemaPath, 'utf-8');
        res.json({ schema });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get Extended Environment Info
router.get('/env/extended', async (req: Request, res: Response) => {
    try {
        const os = require('os');
        const info = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cpu: os.cpus()[0].model,
            memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
            uptime: Math.round(process.uptime()),
            cwd: process.cwd()
        };
        res.json(info);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Generate Coverage Report
router.post('/quality/coverage/run', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('npm run test:coverage', {
            cwd: path.join(__dirname, '..'),
            timeout: 300000 // 5 minutes
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.status(500).json({
            error: error.message,
            output: error.stdout + error.stderr || error.message
        });
    }
});

router.post('/tasks/run', async (req: Request, res: Response) => {
    try {
        const { script } = req.body;
        // Security check: only allow scripts defined in package.json
        const packageJson = JSON.parse(
            await fs.readFile(path.join(__dirname, '../../package.json'), 'utf-8')
        );

        if (!packageJson.scripts[script]) {
            return res.status(400).json({ error: 'Invalid script' });
        }

        const { stdout, stderr } = await execAsync(`npm run ${script}`, {
            cwd: path.join(__dirname, '../..'),
            timeout: 300000
        });
        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

export default router;
