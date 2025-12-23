/**
 * Excel Import/Export V2 - Import Service
 * 
 * Main orchestration service combining parsing, validation, caching,
 * and execution into a clean API.
 */

import { PrismaClient } from '@prisma/client';
import {
    EntityType,
    DryRunResult,
    ValidationError,
} from './types';
import { parseWorkbookFromBuffer, parseWorkbookFromBase64 } from './parsers';
import { validateWorkbook } from './validators';
import {
    storeImportSession,
    getImportSession,
    removeImportSession,
    extendImportSession,
} from './cache';
import { executeImport } from './executors';

// ============================================================================
// Types
// ============================================================================

export interface DryRunOptions {
    entityType?: EntityType; // If not provided, auto-detect
}

export interface CommitOptions {
    sessionId: string;
}

export interface CommitResult {
    success: boolean;
    entityId?: string;
    entityName: string;
    errors: ValidationError[];
    message: string;
}

// ============================================================================
// Import Service
// ============================================================================

/**
 * Perform a dry run validation of an Excel file
 * Returns validation results and a session ID for later commit
 */
export async function dryRun(
    prisma: PrismaClient,
    fileContent: Buffer | string, // Buffer or base64 string
    options: DryRunOptions = {}
): Promise<DryRunResult> {
    // Parse the workbook
    const parseResult = typeof fileContent === 'string'
        ? await parseWorkbookFromBase64(fileContent, options.entityType)
        : await parseWorkbookFromBuffer(fileContent, options.entityType);

    // If parsing failed, return early
    if (!parseResult.success || !parseResult.data) {
        return {
            sessionId: '',
            isValid: false,
            entityType: options.entityType ?? 'product',
            entitySummary: {
                name: 'Unknown',
                action: 'create',
            },
            records: {
                tasks: [],
                licenses: [],
                outcomes: [],
                releases: [],
                tags: [],
                customAttributes: [],
                telemetryAttributes: [],
            },
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            summary: {
                totalRecords: 0,
                toCreate: 0,
                toUpdate: 0,
                toDelete: 0,
                toSkip: 0,
                errorCount: parseResult.errors.length,
                warningCount: parseResult.warnings.length,
            },
        };
    }

    // Validate against business rules
    const validationResult = await validateWorkbook(prisma, parseResult.data);

    // Combine all errors and warnings
    const allErrors = [...parseResult.errors, ...validationResult.errors];
    const allWarnings = [...parseResult.warnings, ...validationResult.warnings];

    // Create the dry run result
    const dryRunResult: DryRunResult = {
        sessionId: '', // Will be set after storing
        isValid: allErrors.length === 0,
        entityType: parseResult.data.entityType,
        entitySummary: validationResult.entitySummary,
        records: validationResult.records,
        errors: allErrors,
        warnings: allWarnings,
        summary: {
            ...validationResult.summary,
            errorCount: allErrors.length,
            warningCount: allWarnings.length,
        },
    };

    // Store in cache for later commit
    const sessionId = storeImportSession(
        parseResult.data.entityType,
        parseResult.data,
        dryRunResult
    );

    // Update session ID in result
    dryRunResult.sessionId = sessionId;

    return dryRunResult;
}

/**
 * Extend the session timeout (user is still reviewing)
 */
export function extendSession(sessionId: string): boolean {
    return extendImportSession(sessionId);
}

/**
 * Cancel an import session
 */
export function cancelSession(sessionId: string): boolean {
    return removeImportSession(sessionId);
}

/**
 * Get session details for debugging
 */
export function getSessionDetails(sessionId: string) {
    return getImportSession(sessionId);
}

/**
 * Commit an import using a previously validated session
 */
export async function commitImport(
    prisma: PrismaClient,
    options: CommitOptions
): Promise<CommitResult> {
    const session = getImportSession(options.sessionId);

    if (!session) {
        return {
            success: false,
            entityName: 'Unknown',
            errors: [{
                sheet: 'Session',
                row: 0,
                column: '',
                field: 'sessionId',
                value: options.sessionId,
                message: 'Import session not found or has expired. Please run dry-run again.',
                code: 'SESSION_NOT_FOUND',
                severity: 'error',
            }],
            message: 'Session not found or expired',
        };
    }

    // Check if there were validation errors
    if (!session.dryRunResult.isValid) {
        return {
            success: false,
            entityName: session.parsedData.entity.name,
            errors: session.dryRunResult.errors,
            message: 'Cannot commit import with validation errors',
        };
    }

    // Execute the actual import with Prisma transaction
    const result = await executeImport(prisma, {
        parsedData: session.parsedData,
        records: session.dryRunResult.records,
        existingEntityId: session.dryRunResult.entitySummary.existingId,
    });

    // Remove session after successful commit
    if (result.success) {
        removeImportSession(options.sessionId);
    }

    return {
        success: result.success,
        entityId: result.entityId,
        entityName: result.entityName,
        errors: result.errors,
        message: result.success
            ? `Successfully imported ${result.entityName}`
            : `Import failed: ${result.errors[0]?.message ?? 'Unknown error'}`,
    };
}

// ============================================================================
// Export the service functions
// ============================================================================

export const ImportService = {
    dryRun,
    commitImport,
    extendSession,
    cancelSession,
    getSessionDetails,
};
