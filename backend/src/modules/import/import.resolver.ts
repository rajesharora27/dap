/**
 * Excel Import - GraphQL Resolvers
 * 
 * Resolvers for the two-phase import workflow.
 */

import { prisma } from '../../shared/graphql/context';
import { requireUser, ensureRole } from '../../shared/auth/auth-helpers';
import {
    ExcelImportService,
    ExcelExportService,
    generateProductSampleCsv,
    generateTaskSampleCsv
} from './index';

import { TaskService } from '../task/task.service';

import { EntityType as ImportEntityType } from './types';

interface Context {
    user?: { id: string; role: string };
}

function mapEntityType(gqlType?: string): ImportEntityType | undefined {
    if (!gqlType) return undefined;
    return gqlType.toLowerCase() as ImportEntityType;
}

export const ImportQueryResolvers = {
    exportProduct: async (_: any, { productId }: any) => {
        const excelService = new ExcelExportService();
        const result = await excelService.exportProduct(productId);
        return {
            filename: result.filename,
            content: result.buffer.toString('base64'),
            size: result.size,
            mimeType: result.mimeType,
            stats: result.stats
        };
    },
    exportSolution: async (_: any, { solutionId }: any) => {
        const excelService = new ExcelExportService();
        const result = await excelService.exportSolution(solutionId);
        return {
            filename: result.filename,
            content: result.buffer.toString('base64'),
            size: result.size,
            mimeType: result.mimeType,
            stats: result.stats
        };
    },
    exportTasksCsv: async (_: any, { productId }: any, context: any) => {
        ensureRole(context, ['ADMIN', 'SME']);
        return TaskService.exportTasksCsv(context.user.id, productId);
    },
    downloadTaskSampleCsv: async () => {
        return generateTaskSampleCsv();
    },
    exportProductsCsv: async (_: any, __: any, context: any) => {
        ensureRole(context, ['ADMIN', 'SME']);
        // Assuming TaskService or a new ProductService has this
        return TaskService.exportTasksCsv(context.user.id, null as any); // Placeholder if same service handles it
    },
    downloadProductSampleCsv: async () => {
        return generateProductSampleCsv();
    }
};

// ============================================================================
// Mutation Resolvers
// ============================================================================

export const ImportMutationResolvers = {
    /**
     * Perform a dry run validation of an Excel file
     */
    importDryRun: async (
        _: unknown,
        args: { content: string; entityType?: string },
        context: Context
    ) => {
        requireUser(context);

        try {
            const mappedType = mapEntityType(args.entityType);

            // If forcing global type, check permissions
            if (mappedType === 'product' || mappedType === 'solution') {
                ensureRole(context, ['ADMIN', 'SME']);
            }

            const result = await ExcelImportService.dryRun(prisma, args.content, {
                entityType: mappedType,
                userId: context.user?.id,
            });

            // If auto-detected as global type, check permissions
            if (result.entityType === 'product' || result.entityType === 'solution') {
                ensureRole(context, ['ADMIN', 'SME']);
            }

            // Convert internal types to GraphQL types
            return {
                sessionId: result.sessionId,
                isValid: result.isValid,
                entityType: result.entityType.toUpperCase(),
                entitySummary: result.entitySummary,
                records: {
                    tasks: result.records.tasks.map(formatRecordPreview),
                    licenses: result.records.licenses.map(formatRecordPreview),
                    outcomes: result.records.outcomes.map(formatRecordPreview),
                    releases: result.records.releases.map(formatRecordPreview),
                    tags: result.records.tags.map(formatRecordPreview),
                    customAttributes: result.records.customAttributes.map(formatRecordPreview),
                    telemetryAttributes: result.records.telemetryAttributes.map(formatRecordPreview),
                    productRefs: result.records.productRefs.map(formatRecordPreview),
                    resources: result.records.resources.map(formatRecordPreview),
                },
                errors: result.errors,
                warnings: result.warnings,
                summary: result.summary,
            };
        } catch (error) {
            console.error('[Import] Dry run failed:', error);
            throw new Error(`Import validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    },

    /**
     * Commit a previously validated import
     */
    importCommit: async (
        _: unknown,
        args: { sessionId: string },
        context: Context
    ) => {
        requireUser(context);

        try {
            // Verify permission based on session content
            const session = ExcelImportService.getSessionDetails(args.sessionId);
            if (!session) {
                throw new Error('Session not found or expired');
            }

            const type = session.parsedData.entityType;
            if (type === 'product' || type === 'solution') {
                ensureRole(context, ['ADMIN', 'SME']);
            }

            const result = await ExcelImportService.commitImport(prisma, {
                sessionId: args.sessionId,
                userId: context.user?.id,
            });

            return {
                success: result.success,
                entityId: result.entityId,
                entityName: result.entityName,
                stats: result.stats,
                errors: result.errors,
                message: result.message,
            };
        } catch (error) {
            console.error('[Import] Commit failed:', error);
            throw new Error(`Import commit failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    },

    /**
     * Extend an import session timeout
     */
    importExtendSession: async (
        _: unknown,
        args: { sessionId: string },
        context: Context
    ) => {
        requireUser(context);
        return ExcelImportService.extendSession(args.sessionId);
    },

    /**
     * Cancel an import session
     */
    importCancelSession: async (
        _: unknown,
        args: { sessionId: string },
        context: Context
    ) => {
        requireUser(context);
        return ExcelImportService.cancelSession(args.sessionId);
    },
    importTasksCsv: async (_: any, { productId, csv, mode }: any, context: any) => {
        ensureRole(context, ['ADMIN', 'SME']);
        return TaskService.importTasksCsv(context.user.id, productId, csv, mode);
    },
    importProductsCsv: async (_: any, { csv }: any, context: any) => {
        ensureRole(context, ['ADMIN', 'SME']);
        // Need to check if there is an importProductsCsv in TaskService or similar
        return TaskService.importTasksCsv(context.user.id, null as any, csv, 'APPEND' as any); // Placeholder
    },
};

// ============================================================================
// Subscription Resolvers
// ============================================================================

import { pubsub, EVENTS } from '../../shared/graphql/pubsub';
import { withFilter } from 'graphql-subscriptions';

export const ImportSubscriptionResolvers = {
    importProgress: {
        subscribe: withFilter(
            () => (pubsub as any).asyncIterator([EVENTS.IMPORT_PROGRESS]),
            (payload, variables) => {
                return payload.importProgress.sessionId === variables.sessionId;
            }
        )
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatRecordPreview(preview: {
    rowNumber: number;
    action: string;
    data: unknown;
    existingData?: unknown;
    existingId?: string;
    changes?: Array<{
        field: string;
        oldValue: unknown;
        newValue: unknown;
        displayOld: string;
        displayNew: string;
    }>;
}) {
    return {
        rowNumber: preview.rowNumber,
        action: preview.action,
        data: preview.data,
        existingData: preview.existingData ?? null,
        existingId: preview.existingId ?? null,
        changes: preview.changes ?? null,
    };
}
