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
    ValidatedTelemetryAttributeRow,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ExecuteOptions {
    parsedData: ParsedWorkbook;
    records: RecordsSummary;
    existingEntityId?: string;
    onProgress?: (percent: number, message?: string) => void;
}

interface ExecutionContext {
    prisma: Prisma.TransactionClient;
    entityType: EntityType;
    entityId: string;
    entityName: string;
    stats: ImportStats;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    progress: {
        total: number;
        current: number;
        callback?: (percent: number, message?: string) => void;
    };
}

function updateProgress(ctx: ExecutionContext, message?: string) {
    if (!ctx.progress.callback) return;
    ctx.progress.current++;

    // Throttle updates to avoid overwhelming the client/connection
    // Update every 5 items or if it's the first few
    if (ctx.progress.current <= 5 || ctx.progress.current % 5 === 0 || ctx.progress.current === ctx.progress.total) {
        const percent = Math.min(99, Math.round((ctx.progress.current / ctx.progress.total) * 100));
        ctx.progress.callback(percent, message);
    }
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
    const { parsedData, records, existingEntityId, onProgress } = options;

    // Calculate total operations for progress bar
    const totalOps = 1 + // Main entity
        records.licenses.length +
        records.outcomes.length +
        records.releases.length +
        records.tags.length +
        records.tasks.length +
        records.customAttributes.length +
        records.telemetryAttributes.length;

    try {
        // Report start
        onProgress?.(0, 'Starting transaction...');

        // Use interactive transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            const stats: ImportStats = {
                tasksCreated: 0,
                tasksUpdated: 0,
                tasksDeleted: 0,
                tasksSkipped: 0,
                licensesCreated: 0,
                licensesUpdated: 0,
                licensesDeleted: 0,
                outcomesCreated: 0,
                outcomesUpdated: 0,
                outcomesDeleted: 0,
                releasesCreated: 0,
                releasesUpdated: 0,
                releasesDeleted: 0,
                tagsCreated: 0,
                tagsUpdated: 0,
                tagsDeleted: 0,
                customAttributesCreated: 0,
                customAttributesUpdated: 0,
                customAttributesDeleted: 0,
                telemetryAttributesCreated: 0,
                telemetryAttributesUpdated: 0,
                telemetryAttributesDeleted: 0,
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
                progress: {
                    total: totalOps,
                    current: 0,
                    callback: onProgress
                }
            };

            updateProgress(ctx, `Processing ${parsedData.entityType}...`);

            // Execute in order: licenses, outcomes, releases, tags first (referenced by tasks)
            await executeLicenses(ctx, records.licenses);
            await executeOutcomes(ctx, records.outcomes);
            await executeReleases(ctx, records.releases);
            await executeTags(ctx, records.tags);

            // Build lookup maps for task relations
            const [outcomes, releases, tags] = await Promise.all([
                tx.outcome.findMany({ where: { OR: [{ productId: entityId }, { solutionId: entityId }] } }),
                tx.release.findMany({ where: { OR: [{ productId: entityId }, { solutionId: entityId }] } }),
                ctx.entityType === 'product'
                    ? tx.productTag.findMany({ where: { productId: entityId } })
                    : (tx as any).solutionTag.findMany({ where: { solutionId: entityId } }),
            ]);

            const outcomeMap = new Map((outcomes as any[]).map(o => [o.name.toLowerCase(), o.id]));
            const releaseMap = new Map((releases as any[]).map(r => [r.name.toLowerCase(), r.id]));
            const tagMap = new Map((tags as any[]).map(t => [t.name.toLowerCase(), t.id]));

            // Then tasks (may reference the above)
            await executeTasks(ctx, records.tasks, { outcomeMap, releaseMap, tagMap });

            // Finally, custom attributes and telemetry
            await executeCustomAttributes(ctx, records.customAttributes);
            await executeTelemetryAttributes(ctx, records.telemetryAttributes);

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
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
        return product.id;
    } else {
        const solution = await tx.solution.create({
            data: {
                name: entity.name,
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
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
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
    } else {
        await tx.solution.update({
            where: { id: entityId },
            data: {
                name: entity.name,
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
    }
}

// ============================================================================
// Task Operations
// ============================================================================

async function executeTasks(
    ctx: ExecutionContext,
    tasks: RecordPreview<ValidatedTaskRow>[],
    lookups: {
        outcomeMap: Map<string, string>;
        releaseMap: Map<string, string>;
        tagMap: Map<string, string>;
    }
): Promise<void> {
    for (const preview of tasks) {
        updateProgress(ctx, 'Importing tasks...');
        if (preview.action === 'skip') {
            ctx.stats.tasksSkipped++;
            continue;
        }

        const task = preview.data;

        if (preview.action === 'create') {
            await createTask(ctx, task, lookups);
            ctx.stats.tasksCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await updateTask(ctx, preview.existingId, task, lookups);
            ctx.stats.tasksUpdated++;
        } else if (preview.action === 'delete' && preview.existingId) {
            await ctx.prisma.task.delete({ where: { id: preview.existingId } });
            ctx.stats.tasksDeleted++;
        }
    }
}

async function createTask(
    ctx: ExecutionContext,
    task: ValidatedTaskRow,
    lookups: {
        outcomeMap: Map<string, string>;
        releaseMap: Map<string, string>;
        tagMap: Map<string, string>;
    }
): Promise<void> {
    const isProduct = ctx.entityType === 'product';

    // Resolve relation IDs
    const outcomeIds = (task.outcomes || []).map(name => lookups.outcomeMap.get(name.toLowerCase())).filter((id): id is string => !!id);
    const releaseIds = (task.releases || []).map(name => lookups.releaseMap.get(name.toLowerCase())).filter((id): id is string => !!id);
    const tagIds = (task.tags || []).map(name => lookups.tagMap.get(name.toLowerCase())).filter((id): id is string => !!id);

    await ctx.prisma.task.create({
        data: {
            productId: isProduct ? ctx.entityId : undefined,
            solutionId: !isProduct ? ctx.entityId : undefined,
            name: task.name,
            description: task.description ?? null,
            weight: task.weight,
            sequenceNumber: task.sequenceNumber,
            estMinutes: task.estMinutes,
            licenseLevel: task.licenseLevel,
            notes: task.notes ?? null,
            howToDoc: task.howToDoc,
            howToVideo: task.howToVideo,
            outcomes: { create: outcomeIds.map(id => ({ outcomeId: id })) },
            releases: { create: releaseIds.map(id => ({ releaseId: id })) },
            [isProduct ? 'taskTags' : 'solutionTaskTags']: { create: tagIds.map(id => ({ tagId: id })) },
        },
    });
}

async function updateTask(
    ctx: ExecutionContext,
    taskId: string,
    task: ValidatedTaskRow,
    lookups: {
        outcomeMap: Map<string, string>;
        releaseMap: Map<string, string>;
        tagMap: Map<string, string>;
    }
): Promise<void> {
    // Resolve relation IDs
    const outcomeIds = (task.outcomes || []).map(name => lookups.outcomeMap.get(name.toLowerCase())).filter((id): id is string => !!id);
    const releaseIds = (task.releases || []).map(name => lookups.releaseMap.get(name.toLowerCase())).filter((id): id is string => !!id);
    const tagIds = (task.tags || []).map(name => lookups.tagMap.get(name.toLowerCase())).filter((id): id is string => !!id);

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
            // Clear and recreate relations
            outcomes: {
                deleteMany: {},
                create: outcomeIds.map(id => ({ outcomeId: id }))
            },
            releases: {
                deleteMany: {},
                create: releaseIds.map(id => ({ releaseId: id }))
            },
            [ctx.entityType === 'product' ? 'taskTags' : 'solutionTaskTags']: {
                deleteMany: {},
                create: tagIds.map(id => ({ tagId: id }))
            },
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
        updateProgress(ctx, 'Importing licenses...');
        if (preview.action === 'skip') continue;

        const license = preview.data;

        if (preview.action === 'create') {
            const isProduct = ctx.entityType === 'product';
            await ctx.prisma.license.create({
                data: {
                    productId: isProduct ? ctx.entityId : undefined,
                    solutionId: !isProduct ? ctx.entityId : undefined,
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
        } else if (preview.action === 'delete' && preview.existingId) {
            await ctx.prisma.license.delete({ where: { id: preview.existingId } });
            ctx.stats.licensesDeleted++;
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
        updateProgress(ctx, 'Importing outcomes...');
        if (preview.action === 'skip') continue;

        const outcome = preview.data;

        if (preview.action === 'create') {
            const isProduct = ctx.entityType === 'product';
            await ctx.prisma.outcome.create({
                data: {
                    productId: isProduct ? ctx.entityId : undefined,
                    solutionId: !isProduct ? ctx.entityId : undefined,
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
        } else if (preview.action === 'delete' && preview.existingId) {
            await ctx.prisma.outcome.delete({ where: { id: preview.existingId } });
            ctx.stats.outcomesDeleted++;
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
        updateProgress(ctx, 'Importing releases...');
        if (preview.action === 'skip') continue;

        const release = preview.data;

        if (preview.action === 'create') {
            const isProduct = ctx.entityType === 'product';
            await ctx.prisma.release.create({
                data: {
                    productId: isProduct ? ctx.entityId : undefined,
                    solutionId: !isProduct ? ctx.entityId : undefined,
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
        } else if (preview.action === 'delete' && preview.existingId) {
            await ctx.prisma.release.delete({ where: { id: preview.existingId } });
            ctx.stats.releasesDeleted++;
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
        updateProgress(ctx, 'Importing tags...');
        if (preview.action === 'skip') continue;

        const tag = preview.data;

        if (preview.action === 'create') {
            if (ctx.entityType === 'product') {
                await ctx.prisma.productTag.create({
                    data: {
                        productId: ctx.entityId,
                        name: tag.name,
                        color: tag.color,
                        description: tag.description ?? null,
                    },
                });
            } else {
                await (ctx.prisma as any).solutionTag.create({
                    data: {
                        solutionId: ctx.entityId,
                        name: tag.name,
                        color: tag.color,
                        description: tag.description ?? null,
                    },
                });
            }
            ctx.stats.tagsCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            if (ctx.entityType === 'product') {
                await ctx.prisma.productTag.update({
                    where: { id: preview.existingId },
                    data: {
                        name: tag.name,
                        color: tag.color,
                        description: tag.description ?? null,
                    },
                });
            } else {
                await (ctx.prisma as any).solutionTag.update({
                    where: { id: preview.existingId },
                    data: {
                        name: tag.name,
                        color: tag.color,
                        description: tag.description ?? null,
                    },
                });
            }
            ctx.stats.tagsUpdated++;
        } else if (preview.action === 'delete' && preview.existingId) {
            if (ctx.entityType === 'product') {
                await ctx.prisma.productTag.delete({ where: { id: preview.existingId } });
            } else {
                await (ctx.prisma as any).solutionTag.delete({ where: { id: preview.existingId } });
            }
            ctx.stats.tagsDeleted++;
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
    // Solutions store attributes in JSON on the model itself, not in this table
    if (ctx.entityType !== 'product') return;

    for (const preview of attributes) {
        updateProgress(ctx, 'Importing custom attributes...');
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
            try {
                await ctx.prisma.customAttribute.update({
                    where: { id: preview.existingId },
                    data: {
                        attributeName: attr.key,
                        attributeValue: attr.value,
                        displayOrder: attr.displayOrder,
                    },
                });
                ctx.stats.customAttributesUpdated++;
            } catch (error) {
                // If update fails because record doesn't exist, create it instead
                if (String(error).includes('Record to update not found')) {
                    await ctx.prisma.customAttribute.create({
                        data: {
                            productId: ctx.entityId,
                            attributeName: attr.key,
                            attributeValue: attr.value,
                            displayOrder: attr.displayOrder,
                        },
                    });
                    ctx.stats.customAttributesCreated++;
                } else {
                    throw error;
                }
            }
        } else if (preview.action === 'delete' && preview.existingId) {
            await ctx.prisma.customAttribute.delete({ where: { id: preview.existingId } });
            ctx.stats.customAttributesDeleted++;
        }
    }
}

// ============================================================================
// Telemetry Operations
// ============================================================================

async function executeTelemetryAttributes(
    ctx: ExecutionContext,
    telemetryAttributes: RecordPreview<ValidatedTelemetryAttributeRow>[]
): Promise<void> {
    // Cache task IDs to avoid repeated lookups
    const taskCache = new Map<string, string>();

    for (const preview of telemetryAttributes) {
        updateProgress(ctx, 'Importing telemetry...');
        if (preview.action === 'skip') continue;

        const row = preview.data;

        // Resolve Task ID
        let taskId = taskCache.get(row.taskName);
        if (!taskId) {
            // Find task by name within this product/solution
            const task = await ctx.prisma.task.findFirst({
                where: {
                    OR: [
                        { productId: ctx.entityId, name: row.taskName },
                        { solutionId: ctx.entityId, name: row.taskName }
                    ]
                },
                select: { id: true }
            });

            if (!task) {
                ctx.warnings.push({
                    sheet: 'Telemetry',
                    row: preview.rowNumber,
                    column: 'taskName',
                    field: 'taskName',
                    message: `Task "${row.taskName}" not found. skipping telemetry attribute.`,
                    code: 'TASK_NOT_FOUND',
                    severity: 'warning'
                });
                continue;
            }
            taskId = task.id;
            taskCache.set(row.taskName, taskId);
        }

        // Prepare Success Criteria JSON based on type and operator
        const type = (row.attributeType || 'string').toLowerCase();
        const operator = row.operator || 'equals';
        const hasExpectedValue = row.expectedValue !== undefined && row.expectedValue !== null && String(row.expectedValue).trim() !== '';
        const trimmed = hasExpectedValue ? String(row.expectedValue).trim() : '';

        let successCriteria: any;

        // Handle special operators that don't require a value first
        if (operator === 'not_null') {
            // not_null applies to string and timestamp types
            if (type === 'timestamp') {
                successCriteria = { type: 'timestamp_not_null' };
            } else {
                successCriteria = { type: 'string_not_null' };
            }
        } else if (type === 'boolean') {
            // Boolean: true/false check
            const val = trimmed.toLowerCase() === 'true' || trimmed === '1';
            successCriteria = {
                type: 'boolean_flag',
                expectedValue: val
            };
        } else if (type === 'number') {
            // Number threshold comparison (gte, gt, lte, lt, equals)
            // Map short operator names to UI-compatible full names
            const operatorMap: Record<string, string> = {
                'gte': 'greater_than_or_equal',
                'gt': 'greater_than',
                'lte': 'less_than_or_equal',
                'lt': 'less_than',
                'equals': 'equals',
                'eq': 'equals',
                // Already full names - no change needed
                'greater_than_or_equal': 'greater_than_or_equal',
                'greater_than': 'greater_than',
                'less_than_or_equal': 'less_than_or_equal',
                'less_than': 'less_than'
            };
            const normalizedOperator = operatorMap[operator] || 'greater_than_or_equal';
            const num = Number(trimmed);
            successCriteria = {
                type: 'number_threshold',
                operator: normalizedOperator,
                threshold: isNaN(num) ? 0 : num
            };
        } else if (type === 'timestamp') {
            // Timestamp comparison (within_days)
            const days = parseInt(trimmed, 10);
            if (operator === 'within_days' || operator === 'withinDays') {
                successCriteria = {
                    type: 'timestamp_comparison',
                    operator: 'lte',
                    withinDays: isNaN(days) ? 30 : days
                };
            } else {
                // Fallback for timestamp with value
                successCriteria = {
                    operator: operator,
                    value: trimmed
                };
            }
        } else if (type === 'string') {
            // String match (exact or contains)
            successCriteria = {
                type: 'string_match',
                mode: operator === 'contains' ? 'contains' : 'exact',
                pattern: trimmed
            };
        } else {
            // Generic / JSON / Legacy fallback
            let value: any = trimmed;
            try { value = JSON.parse(trimmed); } catch { }
            successCriteria = {
                operator: operator,
                value: value
            };
        }

        if (preview.action === 'create') {
            await ctx.prisma.telemetryAttribute.create({
                data: {
                    taskId,
                    name: row.attributeName,
                    dataType: row.attributeType.toUpperCase() as any,
                    isRequired: row.isRequired ?? true,
                    successCriteria,
                },
            });
            ctx.stats.telemetryAttributesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            await ctx.prisma.telemetryAttribute.update({
                where: { id: preview.existingId },
                data: {
                    name: row.attributeName,
                    dataType: row.attributeType.toUpperCase() as any,
                    isRequired: row.isRequired ?? true,
                    successCriteria,
                },
            });
            ctx.stats.telemetryAttributesUpdated++;
        } else if (preview.action === 'delete' && preview.existingId) {
            await ctx.prisma.telemetryAttribute.delete({ where: { id: preview.existingId } });
            ctx.stats.telemetryAttributesDeleted++;
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
        tasksDeleted: 0,
        tasksSkipped: 0,
        licensesCreated: 0,
        licensesUpdated: 0,
        licensesDeleted: 0,
        outcomesCreated: 0,
        outcomesUpdated: 0,
        outcomesDeleted: 0,
        releasesCreated: 0,
        releasesUpdated: 0,
        releasesDeleted: 0,
        tagsCreated: 0,
        tagsUpdated: 0,
        tagsDeleted: 0,
        customAttributesCreated: 0,
        customAttributesUpdated: 0,
        customAttributesDeleted: 0,
        telemetryAttributesCreated: 0,
        telemetryAttributesUpdated: 0,
        telemetryAttributesDeleted: 0,
    };
}
