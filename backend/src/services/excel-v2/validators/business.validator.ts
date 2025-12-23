/**
 * Excel Import/Export V2 - Business Validators
 * 
 * Business logic validation beyond schema validation.
 * Checks relationships, duplicates, and data consistency.
 * 
 * NOTE: This validator is designed for dry-run validation.
 * Database lookups are done efficiently using the actual Prisma models.
 */

import { PrismaClient } from '@prisma/client';
import {
    EntityType,
    ParsedWorkbook,
    ValidationError,
    ValidationWarning,
    RecordAction,
    RecordPreview,
    RecordsSummary,
    EntitySummary,
    ImportSummary,
    FieldDiff,
} from '../types';
import {
    generateFieldDiffs,
    TASK_DIFF_FIELDS,
    LICENSE_DIFF_FIELDS,
    OUTCOME_DIFF_FIELDS,
    RELEASE_DIFF_FIELDS,
    TAG_DIFF_FIELDS,
    CUSTOM_ATTRIBUTE_DIFF_FIELDS,
} from '../diff';

// ============================================================================
// Types
// ============================================================================

export interface ValidationContext {
    prisma: PrismaClient;
    entityType: EntityType;
}

export interface ValidationResult {
    isValid: boolean;
    entitySummary: EntitySummary;
    records: RecordsSummary;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: ImportSummary;
}

interface ExistingRecord {
    id: string;
    name: string;
    data: Record<string, unknown>;
}

// ============================================================================
// Business Validator
// ============================================================================

export class BusinessValidator {
    private prisma: PrismaClient;
    private entityType: EntityType;
    private errors: ValidationError[] = [];
    private warnings: ValidationWarning[] = [];

    constructor(context: ValidationContext) {
        this.prisma = context.prisma;
        this.entityType = context.entityType;
    }

    /**
     * Validate parsed workbook data against business rules
     */
    async validate(parsedData: ParsedWorkbook): Promise<ValidationResult> {
        // Fetch existing entity from database
        const existingEntity = await this.fetchExistingEntity(parsedData.entity.name, parsedData.entity.id);

        // Determine entity action
        const entitySummary: EntitySummary = existingEntity
            ? { name: parsedData.entity.name, action: 'update', existingId: existingEntity.id }
            : { name: parsedData.entity.name, action: 'create' };

        // Fetch existing related data if updating
        const existingTasks = existingEntity
            ? await this.fetchExistingTasks(existingEntity.id)
            : new Map<string, ExistingRecord>();
        const existingLicenses = existingEntity
            ? await this.fetchExistingLicenses(existingEntity.id)
            : new Map<string, ExistingRecord>();
        const existingOutcomes = existingEntity
            ? await this.fetchExistingOutcomes(existingEntity.id)
            : new Map<string, ExistingRecord>();
        const existingReleases = existingEntity
            ? await this.fetchExistingReleases(existingEntity.id)
            : new Map<string, ExistingRecord>();
        const existingTags = await this.fetchExistingTags();

        // Process each entity type (cast to unknown first to allow flexible typing)
        const records: RecordsSummary = {
            tasks: this.processRecords(
                'Tasks',
                parsedData.tasks.map(t => ({ row: t.row, data: t.data as unknown as Record<string, unknown> })),
                existingTasks,
                'name',
                TASK_DIFF_FIELDS
            ) as RecordPreview<(typeof parsedData.tasks)[0]['data']>[],
            licenses: this.processRecords(
                'Licenses',
                parsedData.licenses.map(l => ({ row: l.row, data: l.data as unknown as Record<string, unknown> })),
                existingLicenses,
                'name',
                LICENSE_DIFF_FIELDS
            ) as RecordPreview<(typeof parsedData.licenses)[0]['data']>[],
            outcomes: this.processRecords(
                'Outcomes',
                parsedData.outcomes.map(o => ({ row: o.row, data: o.data as unknown as Record<string, unknown> })),
                existingOutcomes,
                'name',
                OUTCOME_DIFF_FIELDS
            ) as RecordPreview<(typeof parsedData.outcomes)[0]['data']>[],
            releases: this.processRecords(
                'Releases',
                parsedData.releases.map(r => ({ row: r.row, data: r.data as unknown as Record<string, unknown> })),
                existingReleases,
                'name',
                RELEASE_DIFF_FIELDS
            ) as RecordPreview<(typeof parsedData.releases)[0]['data']>[],
            tags: this.processRecords(
                'Tags',
                parsedData.tags.map(t => ({ row: t.row, data: t.data as unknown as Record<string, unknown> })),
                existingTags,
                'name',
                TAG_DIFF_FIELDS
            ) as RecordPreview<(typeof parsedData.tags)[0]['data']>[],
            customAttributes: this.processRecords(
                'Custom Attributes',
                parsedData.customAttributes.map(c => ({ row: c.row, data: c.data as unknown as Record<string, unknown> })),
                new Map(),
                'key',
                CUSTOM_ATTRIBUTE_DIFF_FIELDS
            ) as RecordPreview<(typeof parsedData.customAttributes)[0]['data']>[],
            telemetryAttributes: parsedData.telemetryAttributes.map(({ row, data }) => ({
                rowNumber: row,
                action: 'create' as RecordAction,
                data,
            })),
        };

        // Validate task references
        this.validateTaskReferences(parsedData);

        // Calculate summary
        const summary = this.calculateSummary(records);

        return {
            isValid: this.errors.length === 0,
            entitySummary,
            records,
            errors: this.errors,
            warnings: this.warnings,
            summary,
        };
    }

    /**
     * Fetch existing entity from database
     */
    private async fetchExistingEntity(name: string, id?: string): Promise<{ id: string; name: string } | null> {
        if (this.entityType === 'product') {
            const product = await this.prisma.product.findFirst({
                where: id ? { id } : { name },
                select: { id: true, name: true },
            });
            return product;
        } else {
            const solution = await this.prisma.solution.findFirst({
                where: id ? { id } : { name },
                select: { id: true, name: true },
            });
            return solution;
        }
    }

    /**
     * Fetch existing tasks for a product/solution
     */
    private async fetchExistingTasks(entityId: string): Promise<Map<string, ExistingRecord>> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const tasks = await this.prisma.task.findMany({
                where: { productId: entityId },
            });
            for (const task of tasks) {
                map.set(task.name.toLowerCase(), {
                    id: task.id,
                    name: task.name,
                    data: task as unknown as Record<string, unknown>,
                });
            }
        } else {
            // For solutions, use CustomerSolutionTask
            const tasks = await this.prisma.customerSolutionTask.findMany({
                where: {
                    solutionAdoptionPlan: {
                        solutionId: entityId,
                    }
                },
            });
            for (const task of tasks) {
                map.set(task.name.toLowerCase(), {
                    id: task.id,
                    name: task.name,
                    data: task as unknown as Record<string, unknown>,
                });
            }
        }
        return map;
    }

    /**
     * Fetch existing licenses for a product
     */
    private async fetchExistingLicenses(entityId: string): Promise<Map<string, ExistingRecord>> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const licenses = await this.prisma.license.findMany({
                where: { productId: entityId },
            });
            for (const license of licenses) {
                map.set(license.name.toLowerCase(), {
                    id: license.id,
                    name: license.name,
                    data: license as unknown as Record<string, unknown>,
                });
            }
        }
        // Solutions don't have licenses directly in this schema
        return map;
    }

    /**
     * Fetch existing outcomes for a product
     */
    private async fetchExistingOutcomes(entityId: string): Promise<Map<string, ExistingRecord>> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const outcomes = await this.prisma.outcome.findMany({
                where: { productId: entityId },
            });
            for (const outcome of outcomes) {
                map.set(outcome.name.toLowerCase(), {
                    id: outcome.id,
                    name: outcome.name,
                    data: outcome as unknown as Record<string, unknown>,
                });
            }
        }
        return map;
    }

    /**
     * Fetch existing releases for a product
     */
    private async fetchExistingReleases(entityId: string): Promise<Map<string, ExistingRecord>> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const releases = await this.prisma.release.findMany({
                where: { productId: entityId },
            });
            for (const release of releases) {
                map.set(release.name.toLowerCase(), {
                    id: release.id,
                    name: release.name,
                    data: release as unknown as Record<string, unknown>,
                });
            }
        }
        return map;
    }

    /**
     * Fetch existing tags (product tags are global per product, but for import we check all)
     */
    private async fetchExistingTags(): Promise<Map<string, ExistingRecord>> {
        const map = new Map<string, ExistingRecord>();
        // ProductTag has the name field - these are the actual tag definitions
        const tags = await this.prisma.productTag.findMany();
        for (const tag of tags) {
            map.set(tag.name.toLowerCase(), {
                id: tag.id,
                name: tag.name,
                data: tag as unknown as Record<string, unknown>,
            });
        }
        return map;
    }

    /**
     * Process records for a sheet type - determine create/update/skip action
     */
    private processRecords(
        sheetName: string,
        incoming: Array<{ row: number; data: Record<string, unknown> }>,
        existing: Map<string, ExistingRecord>,
        matchField: 'name' | 'key',
        diffFields: string[]
    ): RecordPreview<unknown>[] {
        const previews: RecordPreview<unknown>[] = [];
        const seenNames = new Map<string, number>();

        for (const { row, data } of incoming) {
            const matchValue = (data[matchField] as string)?.toLowerCase();

            // Check for duplicates within import
            if (matchValue && seenNames.has(matchValue)) {
                this.addWarning(sheetName, row, matchField,
                    `Duplicate ${matchField} "${data[matchField]}" found (first at row ${seenNames.get(matchValue)})`,
                    'DUPLICATE_WITHIN_IMPORT'
                );
            }
            if (matchValue) {
                seenNames.set(matchValue, row);
            }

            // Determine action based on existing data
            const existingRecord = matchValue ? existing.get(matchValue) : undefined;

            if (existingRecord) {
                // Generate diff for updates
                const changes: FieldDiff[] = generateFieldDiffs(existingRecord.data, data, diffFields);

                if (changes.length === 0) {
                    // No changes - skip
                    previews.push({
                        rowNumber: row,
                        action: 'skip',
                        data,
                        existingData: existingRecord.data,
                        existingId: existingRecord.id,
                        changes: [],
                    });
                } else {
                    // Has changes - update
                    previews.push({
                        rowNumber: row,
                        action: 'update',
                        data,
                        existingData: existingRecord.data,
                        existingId: existingRecord.id,
                        changes,
                    });
                }
            } else {
                // New record - create
                previews.push({
                    rowNumber: row,
                    action: 'create',
                    data,
                });
            }
        }

        return previews;
    }

    /**
     * Validate task references to outcomes, releases, tags
     */
    private validateTaskReferences(parsedData: ParsedWorkbook): void {
        const outcomeNames = new Set(parsedData.outcomes.map(o => o.data.name.toLowerCase()));
        const releaseNames = new Set(parsedData.releases.map(r => r.data.name.toLowerCase()));
        const tagNames = new Set(parsedData.tags.map(t => t.data.name.toLowerCase()));

        for (const { row, data: task } of parsedData.tasks) {
            // Validate weight range
            if (task.weight < 0 || task.weight > 100) {
                this.addError('Tasks', row, 'weight', 'weight', task.weight,
                    `Weight must be between 0 and 100, got ${task.weight}`,
                    'INVALID_WEIGHT'
                );
            }

            // Validate outcome references
            for (const outcomeName of task.outcomes) {
                if (!outcomeNames.has(outcomeName.toLowerCase())) {
                    this.addWarning('Tasks', row, 'outcomes',
                        `Outcome "${outcomeName}" referenced but not defined in Outcomes sheet`,
                        'MISSING_OUTCOME_REFERENCE'
                    );
                }
            }

            // Validate release references
            for (const releaseName of task.releases) {
                if (!releaseNames.has(releaseName.toLowerCase())) {
                    this.addWarning('Tasks', row, 'releases',
                        `Release "${releaseName}" referenced but not defined in Releases sheet`,
                        'MISSING_RELEASE_REFERENCE'
                    );
                }
            }

            // Validate tag references (just warn, global tags might exist)
            for (const tagName of task.tags) {
                if (!tagNames.has(tagName.toLowerCase())) {
                    this.addWarning('Tasks', row, 'tags',
                        `Tag "${tagName}" not in Tags sheet (will use existing global tag if available)`,
                        'TAG_NOT_IN_SHEET'
                    );
                }
            }
        }
    }

    /**
     * Calculate summary statistics
     */
    private calculateSummary(records: RecordsSummary): ImportSummary {
        let totalRecords = 0;
        let toCreate = 0;
        let toUpdate = 0;
        let toDelete = 0;
        let toSkip = 0;

        const countActions = (previews: RecordPreview<unknown>[]) => {
            for (const preview of previews) {
                totalRecords++;
                switch (preview.action) {
                    case 'create': toCreate++; break;
                    case 'update': toUpdate++; break;
                    case 'delete': toDelete++; break;
                    case 'skip': toSkip++; break;
                }
            }
        };

        countActions(records.tasks);
        countActions(records.licenses);
        countActions(records.outcomes);
        countActions(records.releases);
        countActions(records.tags);
        countActions(records.customAttributes);
        countActions(records.telemetryAttributes);

        return {
            totalRecords,
            toCreate,
            toUpdate,
            toDelete,
            toSkip,
            errorCount: this.errors.length,
            warningCount: this.warnings.length,
        };
    }

    /**
     * Add a validation error
     */
    private addError(
        sheet: string,
        row: number,
        column: string,
        field: string,
        value: unknown,
        message: string,
        code: string
    ): void {
        this.errors.push({
            sheet,
            row,
            column,
            field,
            value,
            message,
            code,
            severity: 'error',
        });
    }

    /**
     * Add a validation warning
     */
    private addWarning(
        sheet: string,
        row: number,
        column: string | undefined,
        message: string,
        code: string
    ): void {
        this.warnings.push({
            sheet,
            row,
            column,
            message,
            code,
            severity: 'warning',
        });
    }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Validate parsed workbook data
 */
export async function validateWorkbook(
    prisma: PrismaClient,
    parsedData: ParsedWorkbook
): Promise<ValidationResult> {
    const validator = new BusinessValidator({
        prisma,
        entityType: parsedData.entityType,
    });
    return validator.validate(parsedData);
}
