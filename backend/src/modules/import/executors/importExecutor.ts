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
    ValidatedProductRefRow,
    ValidatedResourceRow,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ExecuteOptions {
    parsedData: ParsedWorkbook;
    records: RecordsSummary;
    existingEntityId?: string;
    onProgress?: (percent: number, message?: string) => void;
    userId?: string;
}

interface ExecutionContext {
    prisma: Prisma.TransactionClient;
    entityType: EntityType;
    entityId: string;
    entityName: string;
    userId?: string;
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
    const { parsedData, records, existingEntityId, onProgress, userId } = options;

    // Calculate total operations for progress bar
    const totalOps = 1 + // Main entity
        records.licenses.length +
        records.outcomes.length +
        records.releases.length +
        records.tags.length +
        records.tasks.length +
        records.customAttributes.length +
        records.telemetryAttributes.length +
        records.resources.length +
        (records.productRefs ? records.productRefs.length : 0);

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
                productLinksCreated: 0,
                productLinksUpdated: 0,
                productLinksDeleted: 0,
                resourcesCreated: 0,
                resourcesUpdated: 0,
                resourcesDeleted: 0,
            };

            const errors: ValidationError[] = [];
            const warnings: ValidationWarning[] = [];

            // Create or update the main entity (Product/Solution)
            let entityId: string;
            if (existingEntityId) {
                entityId = existingEntityId;
                await updateEntity(tx, parsedData.entityType, entityId, parsedData.entity, userId);
            } else {
                entityId = await createEntity(tx, parsedData.entityType, parsedData.entity, userId);
            }

            // Create execution context
            const ctx: ExecutionContext = {
                prisma: tx,
                entityType: parsedData.entityType,
                entityId,
                entityName: parsedData.entity.name,
                userId,
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

            // Execute product links (Solutions only)
            if (ctx.entityType === 'solution' && records.productRefs) {
                await executeProductRefs(ctx, records.productRefs);
            }

            // Execute resources
            if (records.resources && records.resources.length > 0) {
                await processResources(ctx, records.resources);
            }

            // Build lookup maps for task relations
            // Personal Product tags handled differently (scoped to personalProductId)
            let tags: any[] = [];
            if (ctx.entityType === 'product') {
                tags = await ctx.prisma.productTag.findMany({ where: { productId: entityId } });
            } else if (ctx.entityType === 'solution') {
                tags = await (tx as any).solutionTag.findMany({ where: { solutionId: entityId } });
            } else if (ctx.entityType === 'personal_product') {
                tags = await (tx as any).personalTag.findMany({ where: { personalProductId: entityId } });
            }

            const [outcomes, releases] = await Promise.all([

                ctx.entityType === 'personal_product'
                    ? (tx as any).personalOutcome.findMany({ where: { personalProductId: entityId } })
                    : tx.outcome.findMany({ where: { OR: [{ productId: entityId }, { solutionId: entityId }] } }),

                ctx.entityType === 'personal_product'
                    ? (tx as any).personalRelease.findMany({ where: { personalProductId: entityId } })
                    : tx.release.findMany({ where: { OR: [{ productId: entityId }, { solutionId: entityId }] } }),
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
    entity: ParsedWorkbook['entity'],
    userId?: string
): Promise<string> {
    if (entityType === 'product') {
        const product = await tx.product.create({
            data: {
                name: entity.name,
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
        return product.id;
    } else if (entityType === 'solution') {
        const solution = await tx.solution.create({
            data: {
                name: entity.name,
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
        return solution.id;
    } else {
        // Personal Product
        if (!userId) throw new Error('UserId is required for personal product import');

        const personalProduct = await (tx as any).personalProduct.create({
            data: {
                userId,
                name: entity.name,
                description: entity.description,
                resources: (entity as any).resources,
            }
        });
        return personalProduct.id;
    }
}

async function updateEntity(
    tx: Prisma.TransactionClient,
    entityType: EntityType,
    entityId: string,
    entity: ParsedWorkbook['entity'],
    userId?: string
): Promise<void> {
    if (entityType === 'product') {
        await tx.product.update({
            where: { id: entityId },
            data: {
                name: entity.name,
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
    } else if (entityType === 'solution') {
        await tx.solution.update({
            where: { id: entityId },
            data: {
                name: entity.name,
                resources: (entity as any).resources || ((entity as any).description ? [{ label: 'Description', url: 'https://example.com' }] : []),
            },
        });
    } else {
        // Personal Product
        await (tx as any).personalProduct.update({
            where: { id: entityId },
            data: {
                name: entity.name,
                description: entity.description,
                resources: (entity as any).resources,
            }
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
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalTask.delete({ where: { id: preview.existingId } });
            } else {
                await ctx.prisma.task.delete({ where: { id: preview.existingId } });
            }
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

    // For personal product, create PersonalTask
    if (ctx.entityType === 'personal_product') {
        const levelMap: Record<string, number> = { 'Essential': 1, 'Advantage': 2, 'Signature': 3 };
        const level = levelMap[task.licenseLevel] || 1;

        await (ctx.prisma as any).personalTask.create({
            data: {
                personalProductId: ctx.entityId,
                name: task.name,
                description: task.description ?? null,
                weight: task.weight,
                sequenceNumber: task.sequenceNumber,
                estMinutes: task.estMinutes,
                licenseLevel: level,
                notes: task.notes ?? null,
                howToDoc: task.howToDoc,
                howToVideo: task.howToVideo,
                status: 'NOT_STARTED', // Default
                statusUpdateSource: 'System', // Default
                outcomes: { create: outcomeIds.map(id => ({ personalOutcomeId: id })) },
                releases: { create: releaseIds.map(id => ({ personalReleaseId: id })) },
                taskTags: { create: tagIds.map(id => ({ personalTagId: id })) },
            },
        });
        return;
    }

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

    // For personal product, update PersonalTask
    if (ctx.entityType === 'personal_product') {
        const levelMap: Record<string, number> = { 'Essential': 1, 'Advantage': 2, 'Signature': 3 };
        const level = levelMap[task.licenseLevel] || 1;

        await (ctx.prisma as any).personalTask.update({
            where: { id: taskId },
            data: {
                name: task.name,
                description: task.description ?? null,
                weight: task.weight,
                sequenceNumber: task.sequenceNumber,
                estMinutes: task.estMinutes,
                licenseLevel: level,
                notes: task.notes ?? null,
                howToDoc: task.howToDoc,
                howToVideo: task.howToVideo,
                outcomes: {
                    deleteMany: {},
                    create: outcomeIds.map(id => ({ personalOutcomeId: id }))
                },
                releases: {
                    deleteMany: {},
                    create: releaseIds.map(id => ({ personalReleaseId: id }))
                },
                taskTags: {
                    deleteMany: {},
                    create: tagIds.map(id => ({ personalTagId: id }))
                }
            },
        });
        return;
    }

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
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalLicense.create({
                    data: {
                        personalProductId: ctx.entityId,
                        name: license.name,
                        level: license.level,
                        description: license.description ?? null,
                    },
                });
            } else {
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
            }
            ctx.stats.licensesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalLicense.update({
                    where: { id: preview.existingId },
                    data: {
                        name: license.name,
                        level: license.level,
                        description: license.description ?? null,
                    },
                });
            } else {
                await ctx.prisma.license.update({
                    where: { id: preview.existingId },
                    data: {
                        name: license.name,
                        level: license.level,
                        description: license.description ?? null,
                    },
                });
            }
            ctx.stats.licensesUpdated++;
        } else if (preview.action === 'delete' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalLicense.delete({ where: { id: preview.existingId } });
            } else {
                await ctx.prisma.license.delete({ where: { id: preview.existingId } });
            }
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
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalOutcome.create({
                    data: {
                        personalProductId: ctx.entityId,
                        name: outcome.name,
                        description: outcome.description ?? null,
                    }
                });
            } else {
                const isProduct = ctx.entityType === 'product';
                await ctx.prisma.outcome.create({
                    data: {
                        productId: isProduct ? ctx.entityId : undefined,
                        solutionId: !isProduct ? ctx.entityId : undefined,
                        name: outcome.name,
                        description: outcome.description ?? null,
                    },
                });
            }
            ctx.stats.outcomesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalOutcome.update({
                    where: { id: preview.existingId },
                    data: {
                        name: outcome.name,
                        description: outcome.description ?? null,
                    }
                });
            } else {
                await ctx.prisma.outcome.update({
                    where: { id: preview.existingId },
                    data: {
                        name: outcome.name,
                        description: outcome.description ?? null,
                    },
                });
            }
            ctx.stats.outcomesUpdated++;
        } else if (preview.action === 'delete' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalOutcome.delete({ where: { id: preview.existingId } });
            } else {
                await ctx.prisma.outcome.delete({ where: { id: preview.existingId } });
            }
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
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalRelease.create({
                    data: {
                        personalProductId: ctx.entityId,
                        name: release.name,
                        version: String(release.level), // Release level maps to version in PersonalRelease?
                        // Actually schema has version and releaseDate. Main release has level.
                        // We will map 'level' to 'version' for personal release.
                        description: release.description ?? null,
                    }
                });
            } else {
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
            }
            ctx.stats.releasesCreated++;
        } else if (preview.action === 'update' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalRelease.update({
                    where: { id: preview.existingId },
                    data: {
                        name: release.name,
                        version: String(release.level),
                        description: release.description ?? null,
                    }
                });
            } else {
                await ctx.prisma.release.update({
                    where: { id: preview.existingId },
                    data: {
                        name: release.name,
                        level: release.level,
                        description: release.description ?? null,
                    },
                });
            }
            ctx.stats.releasesUpdated++;
        } else if (preview.action === 'delete' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalRelease.delete({ where: { id: preview.existingId } });
            } else {
                await ctx.prisma.release.delete({ where: { id: preview.existingId } });
            }
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
    // Personal Products support tags
    if (ctx.entityType === 'personal_product') {
        for (const preview of tags) {
            updateProgress(ctx, 'Importing tags...');
            if (preview.action === 'skip') continue;

            const tag = preview.data;

            if (preview.action === 'create') {
                await (ctx.prisma as any).personalTag.create({
                    data: {
                        personalProductId: ctx.entityId,
                        name: tag.name,
                        color: tag.color,
                        description: tag.description ?? null,
                    },
                });
                ctx.stats.tagsCreated++;
            } else if (preview.action === 'update' && preview.existingId) {
                await (ctx.prisma as any).personalTag.update({
                    where: { id: preview.existingId },
                    data: {
                        name: tag.name,
                        color: tag.color,
                        description: tag.description ?? null,
                    },
                });
                ctx.stats.tagsUpdated++;
            } else if (preview.action === 'delete' && preview.existingId) {
                await (ctx.prisma as any).personalTag.delete({ where: { id: preview.existingId } });
                ctx.stats.tagsDeleted++;
            }
        }
        return;
    }

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
    customAttributes: RecordPreview<ValidatedCustomAttributeRow>[]
): Promise<void> {
    // Personal Product logic (JSON customAttrs)
    if (ctx.entityType === 'personal_product') {
        const product = await (ctx.prisma as any).personalProduct.findUnique({
            where: { id: ctx.entityId },
            select: { customAttrs: true }
        });

        const currentAttrs = (product?.customAttrs as Record<string, any>) || {};
        let hasChanges = false;

        for (const preview of customAttributes) {
            if (preview.action === 'skip') continue;

            const attr = preview.data;
            if (preview.action === 'delete') {
                if (currentAttrs[attr.key]) {
                    delete currentAttrs[attr.key];
                    hasChanges = true;
                    ctx.stats.customAttributesDeleted++;
                }
            } else {
                // Create or Update
                if (currentAttrs[attr.key] !== attr.value) {
                    currentAttrs[attr.key] = attr.value;
                    hasChanges = true;
                    if (preview.action === 'create') ctx.stats.customAttributesCreated++;
                    else ctx.stats.customAttributesUpdated++;
                }
            }
        }

        if (hasChanges) {
            await (ctx.prisma as any).personalProduct.update({
                where: { id: ctx.entityId },
                data: { customAttrs: currentAttrs }
            });
        }
        return;
    }

    // For Solutions, we use the JSON customAttrs field
    if (ctx.entityType === 'solution') {
        const solution = await ctx.prisma.solution.findUnique({
            where: { id: ctx.entityId },
            select: { customAttrs: true }
        });

        const currentAttrs = (solution?.customAttrs as Record<string, any>) || {};
        let hasChanges = false;

        for (const preview of customAttributes) {
            if (preview.action === 'skip') continue;

            const attr = preview.data;
            if (preview.action === 'delete') {
                if (currentAttrs[attr.key]) {
                    delete currentAttrs[attr.key];
                    hasChanges = true;
                    ctx.stats.customAttributesDeleted++;
                }
            } else {
                // Create or Update
                if (currentAttrs[attr.key] !== attr.value) {
                    currentAttrs[attr.key] = attr.value;
                    hasChanges = true;
                    if (preview.action === 'create') ctx.stats.customAttributesCreated++;
                    else ctx.stats.customAttributesUpdated++;
                }
            }
        }

        if (hasChanges) {
            await ctx.prisma.solution.update({
                where: { id: ctx.entityId },
                data: { customAttrs: currentAttrs }
            });
        }
        return;
    }

    // For Products, we use the CustomAttribute table
    for (const preview of customAttributes) {
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

    // SYNC: Backfill customAttrs JSON for Frontend compatibility
    // The frontend currently relies on the customAttrs JSON field.
    // We rebuild it from the CustomAttribute table we just updated.
    const allAttributes = await ctx.prisma.customAttribute.findMany({
        where: { productId: ctx.entityId },
        orderBy: { displayOrder: 'asc' }
    });

    const newCustomAttrs: Record<string, any> = {};
    const order: string[] = [];

    for (const attr of allAttributes) {
        newCustomAttrs[attr.attributeName] = attr.attributeValue;
        order.push(attr.attributeName);
    }

    // Add _order for frontend sorting
    if (order.length > 0) {
        newCustomAttrs._order = order;
    }

    await ctx.prisma.product.update({
        where: { id: ctx.entityId },
        data: { customAttrs: newCustomAttrs }
    });
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

        // Resolve or Cache Task ID
        let taskId = taskCache.get(row.taskName);
        if (!taskId) {
            // Find task by name within this product/solution/personal_product
            let task: { id: string } | null = null;

            if (ctx.entityType === 'personal_product') {
                task = await (ctx.prisma as any).personalTask.findFirst({
                    where: {
                        personalProductId: ctx.entityId,
                        name: row.taskName
                    },
                    select: { id: true }
                });
            } else {
                task = await ctx.prisma.task.findFirst({
                    where: {
                        OR: [
                            { productId: ctx.entityId, name: row.taskName },
                            { solutionId: ctx.entityId, name: row.taskName }
                        ]
                    },
                    select: { id: true }
                });
            }

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

        // Delete action
        if (preview.action === 'delete' && preview.existingId) {
            if (ctx.entityType === 'personal_product') {
                await (ctx.prisma as any).personalTelemetryAttribute.delete({ where: { id: preview.existingId } });
            } else {
                await ctx.prisma.telemetryAttribute.delete({ where: { id: preview.existingId } });
            }
            ctx.stats.telemetryAttributesDeleted++;
            continue;
        }

        // Prepare Success Criteria JSON
        const type = (row.attributeType || 'string').toLowerCase();
        const operator = row.operator || 'equals';
        const hasExpectedValue = row.expectedValue !== undefined && row.expectedValue !== null && String(row.expectedValue).trim() !== '';
        const trimmed = hasExpectedValue ? String(row.expectedValue).trim() : '';
        let successCriteria: any;

        if (operator === 'not_null') {
            successCriteria = type === 'timestamp' ? { type: 'timestamp_not_null' } : { type: 'string_not_null' };
        } else if (type === 'boolean') {
            const val = trimmed.toLowerCase() === 'true' || trimmed === '1';
            successCriteria = { type: 'boolean_flag', expectedValue: val };
        } else if (type === 'number') {
            const operatorMap: Record<string, string> = {
                'gte': 'greater_than_or_equal', 'gt': 'greater_than',
                'lte': 'less_than_or_equal', 'lt': 'less_than',
                'equals': 'equals', 'eq': 'equals',
                'greater_than_or_equal': 'greater_than_or_equal', 'greater_than': 'greater_than',
                'less_than_or_equal': 'less_than_or_equal', 'less_than': 'less_than'
            };
            const normalizedOperator = operatorMap[operator] || 'greater_than_or_equal';
            const num = Number(trimmed);
            successCriteria = { type: 'number_threshold', operator: normalizedOperator, threshold: isNaN(num) ? 0 : num };
        } else if (type === 'timestamp') {
            const days = parseInt(trimmed, 10);
            if (operator === 'within_days' || operator === 'withinDays') {
                successCriteria = { type: 'timestamp_comparison', operator: 'lte', withinDays: isNaN(days) ? 30 : days };
            } else {
                successCriteria = { operator: operator, value: trimmed };
            }
        } else if (type === 'string') {
            successCriteria = { type: 'string_match', mode: operator === 'contains' ? 'contains' : 'exact', pattern: trimmed };
        } else {
            let value: any = trimmed;
            try { value = JSON.parse(trimmed); } catch { }
            successCriteria = { operator: operator, value: value };
        }

        // Create or Update
        const commonData = {
            name: row.attributeName,
            dataType: row.attributeType.toUpperCase() as any,
            isRequired: row.isRequired ?? true,
            successCriteria,
        };

        if (ctx.entityType === 'personal_product') {
            const data = { ...commonData, personalTaskId: taskId };
            if (preview.action === 'create') {
                await (ctx.prisma as any).personalTelemetryAttribute.create({ data });
                ctx.stats.telemetryAttributesCreated++;
            } else if (preview.action === 'update' && preview.existingId) {
                await (ctx.prisma as any).personalTelemetryAttribute.update({ where: { id: preview.existingId }, data });
                ctx.stats.telemetryAttributesUpdated++;
            }
        } else {
            const data = { ...commonData, taskId };
            if (preview.action === 'create') {
                await ctx.prisma.telemetryAttribute.create({ data });
                ctx.stats.telemetryAttributesCreated++;
            } else if (preview.action === 'update' && preview.existingId) {
                await ctx.prisma.telemetryAttribute.update({ where: { id: preview.existingId }, data });
                ctx.stats.telemetryAttributesUpdated++;
            }
        }
    }
}

// ============================================================================
// Product Reference Operations (Solutions only)
// ============================================================================

async function executeProductRefs(
    ctx: ExecutionContext,
    productRefs: RecordPreview<ValidatedProductRefRow>[]
): Promise<void> {
    for (const preview of productRefs) {
        updateProgress(ctx, 'Importing product links...');
        if (preview.action === 'skip') continue;

        const row = preview.data;

        // We need to resolve the product ID by name
        // (Validation phase ensures it exists)
        const product = await ctx.prisma.product.findUnique({
            where: { name: row.name },
            select: { id: true }
        });

        if (!product) {
            // Should not happen if validation passed, but safety check
            ctx.errors.push({
                sheet: 'Products',
                row: preview.rowNumber,
                column: 'name',
                field: 'name',
                value: row.name,
                message: `Product "${row.name}" not found during execution`,
                code: 'PRODUCT_NOT_FOUND',
                severity: 'error'
            });
            continue;
        }

        if (preview.action === 'create') {
            await ctx.prisma.solutionProduct.create({
                data: {
                    solutionId: ctx.entityId,
                    productId: product.id,
                    order: row.order
                }
            });
            ctx.stats.productLinksCreated++;
        } else if (preview.action === 'update') {
            // Composite key update
            await ctx.prisma.solutionProduct.update({
                where: {
                    productId_solutionId: {
                        solutionId: ctx.entityId,
                        productId: product.id
                    }
                },
                data: {
                    order: row.order
                }
            });
            ctx.stats.productLinksUpdated++;
        } else if (preview.action === 'delete') {
            await ctx.prisma.solutionProduct.delete({
                where: {
                    productId_solutionId: {
                        solutionId: ctx.entityId,
                        productId: product.id
                    }
                }
            });
            ctx.stats.productLinksDeleted++;
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

async function processResources(ctx: ExecutionContext, resources: RecordPreview<ValidatedResourceRow>[]) {
    // 1. Fetch current resources from JSON
    let entity: { resources: any } | null = null;

    if (ctx.entityType === 'product') {
        entity = await ctx.prisma.product.findUnique({ where: { id: ctx.entityId }, select: { resources: true } });
    } else if (ctx.entityType === 'solution') {
        entity = await ctx.prisma.solution.findUnique({ where: { id: ctx.entityId }, select: { resources: true } });
    } else {
        entity = await (ctx.prisma as any).personalProduct.findUnique({ where: { id: ctx.entityId }, select: { resources: true } });
    }

    let currentResources = (entity?.resources as unknown as ValidatedResourceRow[]) || [];

    for (const { action, data } of resources) {
        if (action === 'create') {
            currentResources.push(data);
            ctx.stats.resourcesCreated++;
        } else if (action === 'update') {
            const index = currentResources.findIndex(r => r.label === data.label);
            if (index !== -1) {
                currentResources[index] = data;
                ctx.stats.resourcesUpdated++;
            }
        } else if (action === 'delete') {
            currentResources = currentResources.filter(r => r.label !== data.label);
            ctx.stats.resourcesDeleted++;
        }
    }

    // 2. Update entity with new JSON
    if (ctx.entityType === 'product') {
        await ctx.prisma.product.update({
            where: { id: ctx.entityId },
            data: { resources: currentResources as any }
        });
    } else if (ctx.entityType === 'personal_product') {
        await (ctx.prisma as any).personalProduct.update({
            where: { id: ctx.entityId },
            data: { resources: currentResources as any }
        });
    } else {
        await ctx.prisma.solution.update({
            where: { id: ctx.entityId },
            data: { resources: currentResources as any }
        });
    }
}

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
        productLinksCreated: 0,
        productLinksUpdated: 0,
        productLinksDeleted: 0,
        resourcesCreated: 0,
        resourcesUpdated: 0,
        resourcesDeleted: 0,
    };
}
