/**
 * DevTools Types
 * TypeScript interfaces for the DevTools module
 * 
 * @module dev-tools
 */

// =============================================================================
// Test Runner Types
// =============================================================================

/**
 * Status of a test job execution
 */
export type TestJobStatus = 'running' | 'completed' | 'error';

/**
 * Test job tracking interface
 */
export interface TestJob {
    id: string;
    status: TestJobStatus;
    output: string;
    exitCode: number | null;
    startTime: Date;
    endTime?: Date;
    passed: number;
    failed: number;
    total: number;
}

/**
 * Test suite metadata
 */
export interface TestSuite {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e';
    path: string;
    relativePath: string;
}

/**
 * Request body for running tests
 */
export interface RunTestsInput {
    pattern?: string;
    coverage?: boolean;
    tests?: string[];
}

/**
 * Response for test job creation
 */
export interface TestJobResponse {
    jobId: string;
    status: 'started';
    message: string;
}

/**
 * Response for test job status
 */
export interface TestStatusResponse {
    id: string;
    status: TestJobStatus;
    output: string;
    fullLength: number;
    exitCode: number | null;
    passed: number;
    failed: number;
    total: number;
    startTime: Date;
    endTime?: Date;
    duration: number;
}

// =============================================================================
// Environment Types
// =============================================================================

/**
 * Environment variable with secret flag
 */
export interface EnvVariable {
    key: string;
    value: string;
    isSecret: boolean;
}

/**
 * System information response
 */
export interface SystemInfo {
    node: string;
    npm: string;
    env: string;
    git: {
        branch: string;
        commit: string;
    };
    uptime: number;
    memory: NodeJS.MemoryUsage;
}

// =============================================================================
// Database Types
// =============================================================================

/**
 * Database migration info
 */
export interface MigrationInfo {
    name: string;
    status: 'applied' | 'pending';
    appliedAt: string;
}

/**
 * Database status response
 */
export interface DatabaseStatus {
    connected: boolean;
    database: string;
    pendingMigrations: number;
    appliedMigrations: number;
    migrations: MigrationInfo[];
}

/**
 * Database operation result
 */
export interface DatabaseOperationResult {
    success: boolean;
    output: string;
    error?: string;
}

// =============================================================================
// Build & Deploy Types
// =============================================================================

/**
 * Build target options
 */
export type BuildTarget = 'frontend' | 'backend' | 'both';

/**
 * Build request input
 */
export interface BuildInput {
    target: BuildTarget;
}

/**
 * Deploy request input
 */
export interface DeployInput {
    host: string;
    user: string;
    targetDir: string;
    sshKey?: string;
}

/**
 * Build/Deploy operation result
 */
export interface OperationResult {
    success: boolean;
    output: string;
    error?: string;
}

// =============================================================================
// Logs Types
// =============================================================================

/**
 * Log entry
 */
export interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    meta?: Record<string, unknown>;
}

// =============================================================================
// Documentation Types
// =============================================================================

/**
 * Documentation file metadata
 */
export interface DocFile {
    name: string;
    path: string;
    category: string;
    description: string;
    size: string;
    modified: Date;
}

/**
 * Documentation content response
 */
export interface DocContent {
    path: string;
    content: string;
    size: number;
    modified: Date;
}

// =============================================================================
// Git Types
// =============================================================================

/**
 * Git status response
 */
export interface GitStatus {
    branch: string;
    commit: string;
    modified: string[];
    staged: string[];
    untracked: string[];
}

/**
 * Git commit input
 */
export interface GitCommitInput {
    message: string;
    files?: string[];
}

// =============================================================================
// Allowed Commands (Security)
// =============================================================================

/**
 * Whitelisted test commands for security
 */
export const ALLOWED_TEST_COMMANDS = [
    'npm test',
    'npm run test:integration',
    'npm run test:coverage',
    'npm run lint',
    'npm run type-check',
    'npm run test:crud'
] as const;

export type AllowedTestCommand = typeof ALLOWED_TEST_COMMANDS[number];
