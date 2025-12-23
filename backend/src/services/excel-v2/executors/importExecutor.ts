/**
 * Excel Import/Export V2 - Import Executor
 * 
 * Handles atomic database writes using Prisma interactive transactions.
 * If any single operation fails, the entire import is rolled back.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
    EntityType,
    ParsedWorkbook,
    RecordsSummary,
    ImportResult,
    ImportStats,
    ValidationError,
    ValidationWarning,
    RecordPreview,
    ValidatedTaskRow,
    ValidatedLicenseRow,
    ValidatedOutcomeRow,
    ValidatedReleaseRow,
    ValidatedTagRow,
    ValidatedCustomAttributeRow,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ExecuteOptions {
    parsedData: ParsedWorkbook;
    records: RecordsSummary;
    existingEntityId?: string;
}

interface ExecutionContext {
    prisma: Prisma.TransactionClient;
    entityType: EntityType;
    entityId: string;
    entityName: string;
    stats: ImportStats;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

// ============================================================================
// Import Executor
// ============================================================================

/**
 * Execute an import with atomic transactions
 * If any operation fails, the entire import is rolled back
 */
export async function executeImport(
    prisma: PrismaClient,
    options: ExecuteOptions
): Promise<ImportResult> {
    const startTime = Date.now();
    const { parsedData, records, existingEntityId } = options;

    try {
        // Use interactive transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            const stats: ImportStats = {
                tasksCreated: 0,
                tasksUpdated: 0,
                tasksSkipped: 0,
                licensesCreated: 0,
                licensesUpdated: 0,
                outcomesCreated: 0,
                outcomesUpdated: 0,
                releasesCreated: 0,
                releasesUpdated: 0,
                tagsCreated: 0,
                tagsUpdated: 0,
                customAttributesCreated: 0,
                customAttributesUpdated: 0,
                telemetryAttributesCreated: 0,
                telemetryAttributesUpdated: 0,
            };

            const errors: ValidationError[] = [];
            const warnings: ValidationWarning[] = [];

            // Create or update the main entity (Product/Solution)
            let entityId: string;
            if (existingEntityId) {
                entityId = existingEntityId;
                await updateEntity(tx, parsedData.entityType, entityId, parsedData.entity);
            } else {
                entityId = await createEntity(tx, parsedData.entityType, parsedData.entity);
            }

            // Create execution context
            const ctx: ExecutionContext = {
                prisma: tx,
                entityType: parsedData.entityType,
                entityId,
                entityName: parsedData.entity.name,
                stats,
                errors,
                warnings,
            };

            // Execute in order: licenses, outcomes, releases first (referenced by tasks)
            await executeLicenses(ctx, records.licenses);
            await executeOutcomes(ctx, records.outcomes);
            await executeReleases(ctx, records.releases);
            await executeTags(ctx, records.tags);

            // Then tasks (may reference the above)
            await executeTasks(ctx, records.tasks);

            // Finally, custom attributes
            await executeCustomAttributes(ctx, records.customAttributes);

            return {
                entityId,
                entityName: parsedData.entity.name,
                stats,
                errors,
                warnings,
            };
        }, {
            maxWait: 30000, // 30 seconds
            timeout: 60000, // 60 seconds
        });

        return {
            success: true,
            entityType: parsedData.entityType,
            entityId: result.entityId,
            entityName: result.entityName,
            stats: result.stats,
            errors: result.errors,
            warnings: result.warnings,
            duration: Date.now() - startTime,
        };

    } catch (error) {
        console.error('[ImportExecutor] Transaction failed:', error);

        return {
            success: false,
            entityType: parsedData.entityType,
            entityName: parsedData.entity.name,
            stats: createEmptyStats(),
            errors: [{
                sheet: 'Transaction',
                row: 0,
                column: '',
                field: '',
                value: null,
                message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
                code: 'TRANSACTION_FAILED',
                severity: 'error',
            }],
            warnings: [],
            duration: Date.now() - startTime,
        };
    }
}

// ============================================================================
// Entity Operations
// ============================================================================

async function createEntity(
    tx: Prisma.TransactionClient,
    entityType: EntityType,
    entity: ParsedWorkbook['entity']
): Promise<string> {
    if (entityType === 'product') {
        const product = await tx.product.create({
            data: {
                name: entity.name,
                description: entity.description ?? null,
            },
        });
        return product.id;
    } else {
        const solution = await tx.solution.create({
            data: {
                name: entity.name,
                description: entity.description ?? null,
            },
        });
        return solution.id;
    }
}

async function updateEntity(
    tx: Prisma.TransactionClient,
    entityType: EntityType,
    entityId: string,
    entity: ParsedWorkbook['entity']
): Promise<void> {
    if (entityType === 'product') {
        await tx.product.update({
            where: { id: entityId },
            data: {
                name: entity.name,
                description: entity.description ?? null,
            },
        });
    } else {
        await tx.solution.update({
            where: { id: entityId },
            data: {
                name: entity.name,
                description: entity.description ?? null,
            },
        });
    }
}

// ============================================================================
// Task Operations
// ============================================================================

async function executeTasks(
    ctx: ExecutionContext,
    tasks: RecordPreview<ValidatedTaskRow>[]
): Promise<void> {
    for (const preview of tasks) {
        if (preview.action === 'skip') {
            ctx.stats.tasksSkipped++;
            continue;
        }

        const task = preview.data;

        if (preview.action === 'create') {
            await createTask(ctx, task);
            ctx.stats.tasksCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await updateTask(ctx, preview.existingId, task);
            ctx.stats.tasksUpdated++;
        }
    }
}

async function createTask(
    ctx: ExecutionContext,
    task: ValidatedTaskRow
): Promise<void> {
    await ctx.prisma.task.create({
        data: {
            productId: ctx.entityId,
            name: task.name,
            description: task.description ?? null,
            weight: task.weight,
            sequenceNumber: task.sequenceNumber,
            estMinutes: task.estMinutes,
            licenseLevel: task.licenseLevel,
            notes: task.notes ?? null,
            howToDoc: task.howToDoc,
            howToVideo: task.howToVideo,
        },
    });
}

async function updateTask(
    ctx: ExecutionContext,
    taskId: string,
    task: ValidatedTaskRow
): Promise<void> {
    await ctx.prisma.task.update({
        where: { id: taskId },
        data: {
            name: task.name,
            description: task.description ?? null,
            weight: task.weight,
            sequenceNumber: task.sequenceNumber,
            estMinutes: task.estMinutes,
            licenseLevel: task.licenseLevel,
            notes: task.notes ?? null,
            howToDoc: task.howToDoc,
            howToVideo: task.howToVideo,
        },
    });
}

// ============================================================================
// License Operations
// ============================================================================

async function executeLicenses(
    ctx: ExecutionContext,
    licenses: RecordPreview<ValidatedLicenseRow>[]
): Promise<void> {
    for (const preview of licenses) {
        if (preview.action === 'skip') continue;

        const license = preview.data;

        if (preview.action === 'create') {
            await ctx.prisma.license.create({
                data: {
                    productId: ctx.entityId,
                    name: license.name,
                    level: license.level,
                    description: license.description ?? null,
                },
            });
            ctx.stats.licensesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await ctx.prisma.license.update({
                where: { id: preview.existingId },
                data: {
                    name: license.name,
                    level: license.level,
                    description: license.description ?? null,
                },
            });
            ctx.stats.licensesUpdated++;
        }
    }
}

// ============================================================================
// Outcome Operations
// ============================================================================

async function executeOutcomes(
    ctx: ExecutionContext,
    outcomes: RecordPreview<ValidatedOutcomeRow>[]
): Promise<void> {
    for (const preview of outcomes) {
        if (preview.action === 'skip') continue;

        const outcome = preview.data;

        if (preview.action === 'create') {
            await ctx.prisma.outcome.create({
                data: {
                    productId: ctx.entityId,
                    name: outcome.name,
                    description: outcome.description ?? null,
                },
            });
            ctx.stats.outcomesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await ctx.prisma.outcome.update({
                where: { id: preview.existingId },
                data: {
                    name: outcome.name,
                    description: outcome.description ?? null,
                },
            });
            ctx.stats.outcomesUpdated++;
        }
    }
}

// ============================================================================
// Release Operations
// ============================================================================

async function executeReleases(
    ctx: ExecutionContext,
    releases: RecordPreview<ValidatedReleaseRow>[]
): Promise<void> {
    for (const preview of releases) {
        if (preview.action === 'skip') continue;

        const release = preview.data;

        if (preview.action === 'create') {
            await ctx.prisma.release.create({
                data: {
                    productId: ctx.entityId,
                    name: release.name,
                    level: release.level,
                    description: release.description ?? null,
                },
            });
            ctx.stats.releasesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await ctx.prisma.release.update({
                where: { id: preview.existingId },
                data: {
                    name: release.name,
                    level: release.level,
                    description: release.description ?? null,
                },
            });
            ctx.stats.releasesUpdated++;
        }
    }
}

// ============================================================================
// Tag Operations
// ============================================================================

async function executeTags(
    ctx: ExecutionContext,
    tags: RecordPreview<ValidatedTagRow>[]
): Promise<void> {
    for (const preview of tags) {
        if (preview.action === 'skip') continue;

        const tag = preview.data;

        if (preview.action === 'create') {
            await ctx.prisma.productTag.create({
                data: {
                    productId: ctx.entityId,
                    name: tag.name,
                    color: tag.color,
                    description: tag.description ?? null,
                },
            });
            ctx.stats.tagsCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await ctx.prisma.productTag.update({
                where: { id: preview.existingId },
                data: {
                    name: tag.name,
                    color: tag.color,
                    description: tag.description ?? null,
                },
            });
            ctx.stats.tagsUpdated++;
        }
    }
}

// ============================================================================
// Custom Attribute Operations
// ============================================================================

async function executeCustomAttributes(
    ctx: ExecutionContext,
    attributes: RecordPreview<ValidatedCustomAttributeRow>[]
): Promise<void> {
    for (const preview of attributes) {
        if (preview.action === 'skip') continue;

        const attr = preview.data;

        if (preview.action === 'create') {
            await ctx.prisma.customAttribute.create({
                data: {
                    productId: ctx.entityId,
                    attributeName: attr.key,
                    attributeValue: attr.value,
                    displayOrder: attr.displayOrder,
                },
            });
            ctx.stats.customAttributesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await ctx.prisma.customAttribute.update({
                where: { id: preview.existingId },
                data: {
                    attributeName: attr.key,
                    attributeValue: attr.value,
                    displayOrder: attr.displayOrder,
                },
            });
            ctx.stats.customAttributesUpdated++;
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

function createEmptyStats(): ImportStats {
    return {
        tasksCreated: 0,
        tasksUpdated: 0,
        tasksSkipped: 0,
        licensesCreated: 0,
        licensesUpdated: 0,
        outcomesCreated: 0,
        outcomesUpdated: 0,
        releasesCreated: 0,
        releasesUpdated: 0,
        tagsCreated: 0,
        tagsUpdated: 0,
        customAttributesCreated: 0,
        customAttributesUpdated: 0,
        telemetryAttributesCreated: 0,
        telemetryAttributesUpdated: 0,
    };
}
