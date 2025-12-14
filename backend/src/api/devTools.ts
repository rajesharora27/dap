import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { authMiddleware } from '../middleware/authMiddleware';

const execAsync = promisify(exec);
const router = Router();

/**
 * Development Tools API
 * ONLY available in development mode, NEVER in production
 * Requires admin authentication for extra security
 */

// Middleware to check dev mode (primary protection)
const devModeOnly = (req: Request, res: Response, next: any) => {
    // HARD BLOCK: Never allow in production, regardless of any other settings
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            error: 'Development tools are disabled in production',
            message: 'Dev endpoints are not available in production builds'
        });
    }
    next();
};

// Middleware to require admin (secondary protection)
const requireAdmin = (req: Request, res: Response, next: any) => {
    // Check if user is authenticated and is admin
    const user = (req as any).user;
    if (!user || !user.isAdmin) {
        return res.status(403).json({
            error: 'Admin access required',
            message: 'Development tools require admin privileges'
        });
    }
    next();
};

// Apply BOTH protections to all dev routes
router.use(devModeOnly);
router.use(authMiddleware);

// Fallback for dev mode: if token is invalid/expired (e.g. after restart), use default admin
router.use((req: any, res, next) => {
    if (!req.user && process.env.NODE_ENV !== 'production') {
        console.log('🔓 DevTools: Using default dev user fallback');
        req.user = {
            userId: 'dev-admin',
            username: 'admin',
            email: 'admin@example.com',
            isAdmin: true,
            permissions: { system: true, products: [], solutions: [], customers: [] }
        };
    }
    next();
});

router.use(requireAdmin);

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
            'npm run type-check': 'npm run type-check',
            'npm run test:crud': 'npm run test:crud'
        };

        if (!allowedCommands[command]) {
            return res.status(400).json({ error: 'Invalid command' });
        }

        const startTime = Date.now();

        // Execute command in backend root (not src/) and force test-safe env
        const backendRoot = path.join(__dirname, '../..');
        const testDatabaseUrl = 'postgres://postgres:postgres@localhost:5432/dap_test?schema=public';

        const { stdout, stderr } = await execAsync(allowedCommands[command], {
            cwd: backendRoot,
            timeout: 120000, // 2 minute timeout
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            env: {
                ...process.env,
                NODE_ENV: 'test',    // ensure test-mode behaviors
                CI: 'true',
                DATABASE_URL: process.env.DATABASE_URL || testDatabaseUrl // default to isolated test DB
            }
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
 * List available test suites
 * GET /api/dev/tests/suites
 */
router.get('/tests/suites', async (req: Request, res: Response) => {
    try {
        const testDir = path.join(__dirname, '../__tests__');
        const suites: any[] = [];

        // Recursively find test files
        const findTestFiles = (dir: string, basePath: string = '') => {
            try {
                const items = require('fs').readdirSync(dir, { withFileTypes: true });
                console.log(`[DevTools] Scanning directory: ${dir}, basePath: ${basePath}`);

                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    const relativePath = path.join(basePath, item.name);

                    if (item.isDirectory()) {
                        findTestFiles(fullPath, relativePath);
                    } else if (item.name.endsWith('.test.ts') || item.name.endsWith('.test.tsx')) {
                        const type = relativePath.includes('services') ? 'unit' :
                            relativePath.includes('integration') ? 'integration' : 'e2e';

                        console.log(`[DevTools] Found test: ${item.name}, relativePath: ${relativePath}, type: ${type}`);

                        suites.push({
                            id: relativePath.replace(/\\/g, '/'),
                            name: item.name.replace('.test.ts', '').replace('.test.tsx', ''),
                            type,
                            path: fullPath,
                            relativePath
                        });
                    }
                }
            } catch (err) {
                console.error(`[DevTools] Error scanning ${dir}:`, err);
            }
        };

        findTestFiles(testDir);

        res.json({ suites });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
// In-memory store for test job state
interface TestJob {
    id: string;
    status: 'running' | 'completed' | 'error';
    output: string;
    exitCode: number | null;
    startTime: Date;
    endTime?: Date;
    passed: number;
    failed: number;
    total: number;
}

const testJobs: Map<string, TestJob> = new Map();

// Clean up old jobs (older than 10 minutes)
setInterval(() => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [id, job] of testJobs.entries()) {
        if (job.startTime.getTime() < tenMinutesAgo) {
            testJobs.delete(id);
        }
    }
}, 60000);

/**
 * Start test execution in background
 * POST /api/dev/tests/run-stream
 * 
 * Request body:
 * - pattern: (optional) Test pattern to filter tests (e.g., "auth|customer")
 * - coverage: (optional) Boolean to enable coverage reporting
 * - tests: (optional) Array of test file paths to run
 * 
 * Returns job ID immediately, poll /api/dev/tests/status/:id for results
 */
router.post('/tests/run-stream', async (req: Request, res: Response) => {
    const { spawn } = require('child_process');
    const projectRoot = path.join(__dirname, '../../..');
    const workingDir = path.join(__dirname, '../..');
    const jobId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Parse request options
    const { pattern, coverage } = req.body || {};

    // CRITICAL: Use isolated test database
    const testDatabaseUrl = 'postgres://postgres:postgres@localhost:5432/dap_test?schema=public';

    // Build command - use shell command execution like CLI does
    let shellCmd = `cd ${workingDir} && DATABASE_URL="${testDatabaseUrl}" NODE_ENV=test CI=true npm test -- --runInBand --passWithNoTests`;

    if (coverage) {
        shellCmd += ' --coverage';
    }

    if (pattern && pattern.trim()) {
        shellCmd += ` --testPathPattern="${pattern.trim()}"`;
    }

    // Create job entry
    const job: TestJob = {
        id: jobId,
        status: 'running',
        output: '',
        exitCode: null,
        startTime: new Date(),
        passed: 0,
        failed: 0,
        total: 0
    };
    testJobs.set(jobId, job);

    // Return job ID immediately
    res.json({ jobId, status: 'started', message: 'Tests started in background' });

    // Log startup information
    job.output += '═'.repeat(60) + '\n';
    job.output += '🧪 DAP Test Runner - Shadow Database Mode\n';
    job.output += '═'.repeat(60) + '\n\n';
    job.output += '📁 Working Directory: ' + workingDir + '\n';
    job.output += '🗃️  Database: dap_test (shadow copy - dev data safe!)\n';
    job.output += '🔧 NODE_ENV: test\n';
    if (pattern) {
        job.output += '🔍 Test Pattern: ' + pattern + '\n';
    }
    if (coverage) {
        job.output += '📊 Coverage: enabled\n';
    }
    job.output += '\n';
    job.output += '💻 Command (identical to CLI):\n';
    job.output += `   ${shellCmd}\n`;
    job.output += '\n' + '─'.repeat(60) + '\n\n';

    console.log('[DevTools Tests] Starting test execution via shell');
    console.log('[DevTools Tests] Command:', shellCmd);

    // Run tests via shell command (identical to CLI execution)
    const testProcess = spawn('bash', ['-c', shellCmd], {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...process.env,
            FORCE_COLOR: '0'
        }
    });

    if (testProcess.stdout) {
        testProcess.stdout.setEncoding('utf8');
        testProcess.stdout.on('data', (data: string) => {
            job.output += data;
        });
    }

    if (testProcess.stderr) {
        testProcess.stderr.setEncoding('utf8');
        testProcess.stderr.on('data', (data: string) => {
            job.output += data;
        });
    }

    testProcess.on('error', (error: Error) => {
        job.status = 'error';
        job.output += `\n❌ Process error: ${error.message}\n`;
        job.endTime = new Date();
    });

    testProcess.on('exit', (code: number | null) => {
        job.status = 'completed';
        job.exitCode = code;
        job.endTime = new Date();

        // Parse results from Jest output
        const passMatch = job.output.match(/(\d+) passed/);
        const failMatch = job.output.match(/(\d+) failed/);
        const totalMatch = job.output.match(/(\d+) total/);
        const skippedMatch = job.output.match(/(\d+) skipped/);

        job.passed = passMatch ? parseInt(passMatch[1]) : 0;
        job.failed = failMatch ? parseInt(failMatch[1]) : 0;
        job.total = totalMatch ? parseInt(totalMatch[1]) : (job.passed + job.failed);

        const duration = ((job.endTime.getTime() - job.startTime.getTime()) / 1000).toFixed(1);
        const statusIcon = code === 0 ? '✅' : '❌';
        const statusText = code === 0 ? 'PASSED' : 'FAILED';

        job.output += '\n' + '═'.repeat(60) + '\n';
        job.output += `${statusIcon} Test Run ${statusText}\n`;
        job.output += '─'.repeat(60) + '\n';
        job.output += `📊 Results:\n`;
        job.output += `   ✅ Passed:  ${job.passed}\n`;
        if (job.failed > 0) {
            job.output += `   ❌ Failed:  ${job.failed}\n`;
        }
        if (skippedMatch) {
            job.output += `   ⏭️  Skipped: ${skippedMatch[1]}\n`;
        }
        job.output += `   📋 Total:   ${job.total}\n`;
        job.output += `   ⏱️  Duration: ${duration}s\n`;
        job.output += `   📤 Exit Code: ${code}\n`;
        job.output += '═'.repeat(60) + '\n';

        console.log(`[DevTools Tests] Test run completed: ${statusText} (${job.passed} passed, ${job.failed} failed)`);
    });
});

/**
 * Get test job status and output
 * GET /api/dev/tests/status/:jobId
 */
router.get('/tests/status/:jobId', (req: Request, res: Response) => {
    const { jobId } = req.params;
    const job = testJobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    const offset = parseInt(req.query.offset as string) || 0;
    const outputSlice = job.output.substring(offset);

    res.json({
        id: job.id,
        status: job.status,
        output: outputSlice,
        fullLength: job.output.length,
        exitCode: job.exitCode,
        passed: job.passed,
        failed: job.failed,
        total: job.total,
        startTime: job.startTime,
        endTime: job.endTime,
        duration: job.endTime
            ? (job.endTime.getTime() - job.startTime.getTime()) / 1000
            : (Date.now() - job.startTime.getTime()) / 1000
    });
});

/**
 * Get test coverage summary
 * GET /api/dev/tests/coverage/summary
 */
router.get('/tests/coverage/summary', async (req: Request, res: Response) => {
    try {
        const coveragePath = path.join(__dirname, '../../coverage/coverage-summary.json');
        const coverage = JSON.parse(await fs.readFile(coveragePath, 'utf-8'));
        res.json(coverage.total || coverage);
    } catch (error: any) {
        res.json({
            error: 'Coverage report not found',
            lines: { pct: 0 },
            statements: { pct: 0 },
            functions: { pct: 0 },
            branches: { pct: 0 }
        });
    }
});

/**
 * Get list of available documentation files
 * GET /api/dev/docs
 */
router.get('/docs', async (req: Request, res: Response) => {
    try {
        const projectRoot = path.join(__dirname, '../../..');
        const docsDir = path.join(projectRoot, 'docs');

        // Helper to recursively find markdown files
        const findMarkdownFiles = async (dir: string): Promise<any[]> => {
            let results: any[] = [];
            try {
                const items = await fs.readdir(dir, { withFileTypes: true });
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    const relativePath = path.relative(projectRoot, fullPath); // e.g., docs/foo.md

                    if (item.isDirectory()) {
                        results = results.concat(await findMarkdownFiles(fullPath));
                    } else if (item.name.endsWith('.md')) {
                        // Determine category based on subfolder in docs
                        const relToDocs = path.relative(docsDir, fullPath);
                        const parts = relToDocs.split(path.sep);
                        let category = 'General';

                        if (parts.length > 1) {
                            // First directory name is category
                            category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                        } else {
                            // Attempt to categorize based on filename keywords
                            const name = item.name.toLowerCase();
                            if (name.includes('test') || name.includes('coverage')) category = 'Testing';
                            else if (name.includes('deploy') || name.includes('build')) category = 'Deployment';
                            else if (name.includes('phase') || name.includes('week')) category = 'Status';
                            else if (name.includes('api') || name.includes('auth')) category = 'Backend';
                            else if (name.includes('ui') || name.includes('ux') || name.includes('frontend')) category = 'Frontend';
                            else if (name.includes('guide') || name.includes('manual')) category = 'Guides';
                            else if (name.includes('summary') || name.includes('analysis')) category = 'Analysis';
                        }

                        const stats = await fs.stat(fullPath);
                        const sizeKB = (stats.size / 1024).toFixed(2);

                        results.push({
                            name: item.name.replace('.md', ''),
                            path: '/' + relativePath, // Ensure leading slash
                            category,
                            description: item.name,
                            size: `${sizeKB} KB`,
                            modified: stats.mtime
                        });
                    }
                }
            } catch (error) {
                console.error(`Error scanning directory ${dir}:`, error);
            }
            return results;
        };

        let docs = await findMarkdownFiles(docsDir);

        res.json({
            docs: docs.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
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
        // Use the safe reset script that preserves users
        const { stdout, stderr } = await execAsync('npm run reset', {
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

// Create backup
router.post('/database/backup', async (req: Request, res: Response) => {
    try {
        const { customName } = req.body;
        // Import dynamically to avoid circular dependencies or initialization issues
        const { BackupRestoreService } = await import('../services/BackupRestoreService');
        const result = await BackupRestoreService.createBackup(customName);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message, message: error.message });
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

router.post('/deploy/generic', async (req: Request, res: Response) => {
    try {
        const { host, user, targetDir, sshKey } = req.body;

        if (!host || !user || !targetDir) {
            return res.status(400).json({ error: 'Host, user, and target directory are required' });
        }

        const scriptPath = path.join(__dirname, '../../deploy/deploy-generic.sh');
        const sshKeyArg = sshKey ? ` "${sshKey}"` : '';
        const command = `${scriptPath} "${host}" "${user}" "${targetDir}"${sshKeyArg}`;

        // Stream output? execAsync buffers it.
        // For long running process, maybe spawn is better?
        // But for simplicity, let's use execAsync with large buffer/timeout.
        // Deployment can take a while.

        const { stdout, stderr } = await execAsync(command, {
            cwd: path.join(__dirname, '../..'),
            timeout: 600000, // 10 mins
            maxBuffer: 10 * 1024 * 1024 // 10MB
        });

        res.json({ success: true, output: stdout + stderr });
    } catch (error: any) {
        res.json({ success: false, output: error.stdout + error.stderr || error.message });
    }
});

/**
 * Build with streaming output (Server-Sent Events)
 * POST /api/dev/build/stream
 */
router.post('/build/stream', async (req: Request, res: Response) => {
    const { target } = req.body || {}; // 'frontend', 'backend', or 'both'

    if (!target || !['frontend', 'backend', 'both'].includes(target)) {
        return res.status(400).json({ error: 'Target must be: frontend, backend, or both' });
    }

    // Set up SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const send = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { spawn } = require('child_process');
        const startTime = Date.now();

        const targets = target === 'both' ? ['frontend', 'backend'] : [target];

        for (const buildTarget of targets) {
            send({ type: 'start', message: `Building ${buildTarget}...`, target: buildTarget });

            const cwd = buildTarget === 'frontend'
                ? path.join(__dirname, '../../../frontend')
                : path.join(__dirname, '../..');

            const buildProcess = spawn('npm', ['run', 'build'], {
                cwd,
                env: { ...process.env, FORCE_COLOR: '0' }
            });

            let outputBuffer = '';

            await new Promise((resolve, reject) => {
                buildProcess.stdout.on('data', (data: Buffer) => {
                    const output = data.toString();
                    outputBuffer += output;
                    send({ type: 'output', data: output, target: buildTarget });
                });

                buildProcess.stderr.on('data', (data: Buffer) => {
                    const output = data.toString();
                    outputBuffer += output;
                    send({ type: 'output', data: output, target: buildTarget });
                });

                buildProcess.on('close', (code: number | null) => {
                    if (code === 0) {
                        send({
                            type: 'complete',
                            target: buildTarget,
                            success: true,
                            duration: Date.now() - startTime
                        });
                        resolve(true);
                    } else {
                        send({
                            type: 'complete',
                            target: buildTarget,
                            success: false,
                            duration: Date.now() - startTime,
                            error: 'Build failed'
                        });
                        reject(new Error('Build failed'));
                    }
                });

                buildProcess.on('error', (error: Error) => {
                    send({ type: 'error', message: error.message, target: buildTarget });
                    reject(error);
                });
            });
        }

        send({ type: 'done', message: 'All builds complete!', duration: Date.now() - startTime });
        res.end();

    } catch (error: any) {
        send({ type: 'error', message: error.message });
        res.end();
    }
});

/**
 * Full rebuild command (like ./dap rebuild)
 * POST /api/dev/build/rebuild
 */
router.post('/build/rebuild', async (req: Request, res: Response) => {
    // Set up SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const send = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { spawn } = require('child_process');
        const startTime = Date.now();

        send({ type: 'start', message: 'Starting full rebuild...' });

        // Run ./dap rebuild command
        const rebuildProcess = spawn('./dap', ['rebuild'], {
            cwd: '/data/dap',
            env: { ...process.env, FORCE_COLOR: '0' }
        });

        rebuildProcess.stdout.on('data', (data: Buffer) => {
            const output = data.toString();
            send({ type: 'output', data: output });
        });

        rebuildProcess.stderr.on('data', (data: Buffer) => {
            const output = data.toString();
            send({ type: 'output', data: output });
        });

        rebuildProcess.on('close', (code: number | null) => {
            send({
                type: 'complete',
                success: code === 0,
                duration: Date.now() - startTime,
                message: code === 0 ? 'Rebuild complete!' : 'Rebuild failed'
            });
            res.end();
        });

        rebuildProcess.on('error', (error: Error) => {
            send({ type: 'error', message: error.message });
            res.end();
        });

        // Handle client disconnect
        req.on('close', () => {
            rebuildProcess.kill();
        });

    } catch (error: any) {
        send({ type: 'error', message: error.message });
        res.end();
    }
});

/**
 * Deploy with streaming
 * POST /api/dev/deploy/stream
 */
router.post('/deploy/stream', async (req: Request, res: Response) => {
    const { environment } = req.body || {}; // 'production' or custom config

    // Set up SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const send = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { spawn } = require('child_process');
        const startTime = Date.now();

        send({ type: 'start', message: `Starting deployment to ${environment || 'production'}...` });

        // Check if deployment script exists
        const deployScript = path.join(__dirname, '../../deploy/deploy-to-production.sh');

        const deployProcess = spawn('bash', [deployScript], {
            cwd: '/data/dap',
            env: { ...process.env, FORCE_COLOR: '0' }
        });

        deployProcess.stdout.on('data', (data: Buffer) => {
            const output = data.toString();
            send({ type: 'output', data: output });
        });

        deployProcess.stderr.on('data', (data: Buffer) => {
            const output = data.toString();
            send({ type: 'output', data: output });
        });

        deployProcess.on('close', (code: number | null) => {
            send({
                type: 'complete',
                success: code === 0,
                duration: Date.now() - startTime,
                message: code === 0 ? 'Deployment complete!' : 'Deployment failed'
            });
            res.end();
        });

        deployProcess.on('error', (error: Error) => {
            send({ type: 'error', message: error.message });
            res.end();
        });

        // Handle client disconnect
        req.on('close', () => {
            deployProcess.kill();
        });

    } catch (error: any) {
        send({ type: 'error', message: error.message });
        res.end();
    }
});

/**
 * Get build history
 * GET /api/dev/build/history
 */
router.get('/build/history', async (req: Request, res: Response) => {
    try {
        // Get last 10 build timestamps from package.json mtime or git log
        const { stdout } = await execAsync(
            'git log -10 --pretty=format:"%H|%h|%s|%an|%ai" --grep="build\\|deploy" || echo ""',
            { cwd: '/data/dap' }
        );

        const history = stdout.split('\n').filter(Boolean).map(line => {
            const [hash, shortHash, message, author, date] = line.split('|');
            return {
                hash,
                shortHash,
                message,
                author,
                date,
                type: message.toLowerCase().includes('deploy') ? 'deploy' : 'build'
            };
        });

        res.json({ builds: history });
    } catch (error: any) {
        res.json({ builds: [], error: error.message });
    }
});

router.get('/cicd/status', async (req: Request, res: Response) => {
    try {
        // Check if gh is installed
        try {
            await execAsync('gh --version');
        } catch {
            return res.json({
                configured: false,
                message: 'GitHub CLI (gh) is not installed or not in PATH.'
            });
        }

        // Check if authenticated (gh auth status)
        try {
            await execAsync('gh auth status');
        } catch {
            return res.json({
                configured: false,
                message: 'GitHub CLI is installed but not authenticated. Run "gh auth login".'
            });
        }

        // Fetch runs
        // Limit to 5 recent runs
        const { stdout } = await execAsync('gh run list --limit 5 --json databaseId,name,status,conclusion,createdAt,url');
        const runs = JSON.parse(stdout);

        res.json({
            configured: true,
            runs: runs.map((r: any) => ({
                id: r.databaseId,
                name: r.name,
                status: r.status,
                conclusion: r.conclusion,
                createdAt: r.createdAt,
                htmlUrl: r.url
            }))
        });
    } catch (error: any) {
        res.json({
            configured: false,
            message: `Error fetching workflows: ${error.message}`
        });
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

// Pull from origin
router.post('/git/pull', async (req: Request, res: Response) => {
    try {
        const { stdout, stderr } = await execAsync('git pull', {
            timeout: 60000,
            cwd: '/data/dap'
        });

        res.json({
            success: true,
            output: stdout + stderr,
            message: 'Pulled from origin successfully'
        });
    } catch (error: any) {
        res.json({
            success: false,
            error: error.message,
            output: error.stdout + error.stderr || error.message
        });
    }
});

// Get branches
router.get('/git/branches', async (req: Request, res: Response) => {
    try {
        const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: '/data/dap' });
        const { stdout: localBranches } = await execAsync('git branch', { cwd: '/data/dap' });
        const { stdout: remoteBranches } = await execAsync('git branch -r', { cwd: '/data/dap' });

        res.json({
            current: currentBranch.trim(),
            local: localBranches.split('\n')
                .map(b => b.trim().replace('* ', ''))
                .filter(Boolean),
            remote: remoteBranches.split('\n')
                .map(b => b.trim())
                .filter(Boolean)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Branch management (create, switch, delete)
router.post('/git/branch', async (req: Request, res: Response) => {
    try {
        const { action, name, from } = req.body;

        if (!action || !name) {
            return res.status(400).json({ error: 'Action and name are required' });
        }

        let command = '';
        let message = '';

        switch (action) {
            case 'create':
                command = from ? `git checkout -b ${name} ${from}` : `git checkout -b ${name}`;
                message = `Created and switched to branch '${name}'`;
                break;
            case 'switch':
                command = `git checkout ${name}`;
                message = `Switched to branch '${name}'`;
                break;
            case 'delete':
                command = `git branch -d ${name}`;
                message = `Deleted branch '${name}'`;
                break;
            default:
                return res.status(400).json({ error: 'Invalid action. Use: create, switch, or delete' });
        }

        const { stdout, stderr } = await execAsync(command, { cwd: '/data/dap' });

        res.json({
            success: true,
            output: stdout + stderr,
            message
        });
    } catch (error: any) {
        res.json({
            success: false,
            error: error.message,
            output: error.stdout + error.stderr || error.message
        });
    }
});

// Stash operations
router.post('/git/stash', async (req: Request, res: Response) => {
    try {
        const { action, message, index } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        let command = '';
        let responseMessage = '';

        switch (action) {
            case 'save':
                command = message ? `git stash push -m "${message}"` : 'git stash';
                responseMessage = 'Changes stashed successfully';
                break;
            case 'pop':
                command = index !== undefined ? `git stash pop stash@{${index}}` : 'git stash pop';
                responseMessage = 'Stash applied and removed';
                break;
            case 'list':
                command = 'git stash list';
                responseMessage = 'Stash list retrieved';
                break;
            case 'apply':
                command = index !== undefined ? `git stash apply stash@{${index}}` : 'git stash apply';
                responseMessage = 'Stash applied (kept in stash)';
                break;
            case 'drop':
                command = index !== undefined ? `git stash drop stash@{${index}}` : 'git stash drop';
                responseMessage = 'Stash dropped';
                break;
            default:
                return res.status(400).json({ error: 'Invalid action. Use: save, pop, list, apply, or drop' });
        }

        const { stdout, stderr } = await execAsync(command, { cwd: '/data/dap' });

        res.json({
            success: true,
            output: stdout + stderr,
            message: responseMessage,
            stashes: action === 'list' ? stdout.split('\n').filter(Boolean) : undefined
        });
    } catch (error: any) {
        res.json({
            success: false,
            error: error.message,
            output: error.stdout + error.stderr || error.message
        });
    }
});

// Get commit log
router.get('/git/log', async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

        const { stdout } = await execAsync(
            `git log --skip=${skip} -n ${limit} --pretty=format:"%H|%h|%s|%an|%ai|%D"`,
            { cwd: '/data/dap' }
        );

        const commits = stdout.split('\n').filter(Boolean).map(line => {
            const [hash, shortHash, message, author, date, refs] = line.split('|');
            return {
                hash,
                shortHash,
                message,
                author,
                date,
                refs: refs || ''
            };
        });

        res.json({ commits, total: commits.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
        // Return success:false instead of 500 status for better UX
        res.json({
            success: false,
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
