/**
 * DevTools Frontend Types
 * TypeScript interfaces for DevTools UI components
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
 * Test suite metadata from backend
 */
export interface TestSuite {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e';
    path: string;
    relativePath: string;
}

/**
 * Test job status response
 */
export interface TestJobStatusResponse {
    id: string;
    status: TestJobStatus;
    output: string;
    fullLength: number;
    exitCode: number | null;
    passed: number;
    failed: number;
    total: number;
    startTime: string;
    endTime?: string;
    duration: number;
}

/**
 * Coverage summary
 */
export interface CoverageSummary {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
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
 * System information from backend
 */
export interface SystemInfo {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: string;
    cpu: string;
    uptime: number;
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
 * Database status
 */
export interface DatabaseStatus {
    connected: boolean;
    database: string;
    pendingMigrations: number;
    appliedMigrations: number;
    migrations: MigrationInfo[];
}

/**
 * Backup info
 */
export interface BackupInfo {
    id: string;
    name: string;
    timestamp: string;
    size: string;
    tables: number;
}

// =============================================================================
// Build & Deploy Types
// =============================================================================

/**
 * Build target options
 */
export type BuildTarget = 'frontend' | 'backend' | 'both';

/**
 * Build history entry
 */
export interface BuildHistoryEntry {
    id: string;
    target: BuildTarget;
    status: 'success' | 'failed' | 'running';
    timestamp: string;
    duration: number;
}

/**
 * Deploy configuration
 */
export interface DeployConfig {
    host: string;
    user: string;
    targetDir: string;
    sshKey?: string;
}

// =============================================================================
// Logs Types
// =============================================================================

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry
 */
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
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
    modified: string;
}

// =============================================================================
// Git Types
// =============================================================================

/**
 * Git status
 */
export interface GitStatus {
    branch: string;
    commit: string;
    modified: string[];
    staged: string[];
    untracked: string[];
    ahead: number;
    behind: number;
}

/**
 * Git commit info
 */
export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
}

/**
 * Git branch info
 */
export interface GitBranch {
    name: string;
    current: boolean;
    tracking?: string;
}

/**
 * Git stash entry
 */
export interface GitStash {
    index: number;
    message: string;
    date: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Generic operation result
 */
export interface OperationResult {
    success: boolean;
    output?: string;
    message?: string;
    error?: string;
}

/**
 * API error response
 */
export interface ApiError {
    error: string;
    message?: string;
    details?: Record<string, unknown>;
}
