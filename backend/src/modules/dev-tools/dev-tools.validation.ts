/**
 * DevTools Validation Schemas
 * Zod validation for DevTools API inputs
 * 
 * @module dev-tools
 */

import { z } from 'zod';
import { ALLOWED_TEST_COMMANDS, type AllowedTestCommand } from './dev-tools.types';

// =============================================================================
// Test Runner Validation
// =============================================================================

/**
 * Validation for run-test command
 */
export const runTestCommandSchema = z.object({
    command: z.enum(ALLOWED_TEST_COMMANDS)
});

/**
 * Validation for run-stream (async test execution)
 */
export const runTestsStreamSchema = z.object({
    pattern: z.string().max(200).optional(),
    coverage: z.boolean().optional().default(false),
    tests: z.array(z.string()).max(50).optional()
});

/**
 * Validation for test status query params
 */
export const testStatusParamsSchema = z.object({
    jobId: z.string().min(1, 'Job ID is required')
});

export const testStatusQuerySchema = z.object({
    offset: z.coerce.number().int().min(0).optional().default(0)
});

// =============================================================================
// Build & Deploy Validation
// =============================================================================

/**
 * Validation for build target
 */
export const buildTargetSchema = z.object({
    target: z.enum(['frontend', 'backend', 'both'] as const)
});

/**
 * Validation for deploy request
 */
export const deploySchema = z.object({
    host: z.string().min(1, 'Host is required').max(255),
    user: z.string().min(1, 'User is required').max(100),
    targetDir: z.string().min(1, 'Target directory is required').max(500),
    sshKey: z.string().max(5000).optional()
});

// =============================================================================
// Database Validation
// =============================================================================

/**
 * Validation for backup request
 */
export const backupSchema = z.object({
    customName: z.string().max(100).regex(/^[a-zA-Z0-9_-]*$/, 'Invalid backup name').optional()
});

// =============================================================================
// Git Validation
// =============================================================================

/**
 * Validation for git commit
 */
export const gitCommitSchema = z.object({
    message: z.string().min(1, 'Commit message is required').max(500),
    files: z.array(z.string()).max(100).optional()
});

/**
 * Validation for git branch operations
 */
export const gitBranchSchema = z.object({
    name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9/_-]+$/, 'Invalid branch name'),
    baseBranch: z.string().max(100).optional()
});

// =============================================================================
// Logs Validation
// =============================================================================

/**
 * Validation for log query
 */
export const logsQuerySchema = z.object({
    level: z.enum(['debug', 'info', 'warn', 'error'] as const).optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional().default(500)
});

// =============================================================================
// Helper function to validate request
// =============================================================================

/**
 * Validates request body against a Zod schema
 * Returns validated data or throws Error with details
 */
export function validateRequest<T extends z.ZodType>(
    schema: T,
    data: unknown
): z.infer<T> {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.issues
            .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ');
        throw new Error(`Validation failed: ${errors}`);
    }
    return result.data;
}
