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
    TELEMETRY_ATTRIBUTE_DIFF_FIELDS,
    PRODUCT_REF_DIFF_FIELDS,
    RESOURCE_DIFF_FIELDS,
} from '../diff';

/**
 * Produces a deterministic JSON string with sorted keys.
 * This ensures round-trip compatibility by eliminating key order differences.
 */
function stableStringify(obj: unknown): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(stableStringify).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj as object).sort();
    const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${stableStringify((obj as any)[k])}`);
    return '{' + pairs.join(',') + '}';
}

/**
 * Normalizes operator to UI-compatible full form.
 * This ensures consistency between Excel import and UI display.
 */
function normalizeOperator(op: string): string {
    const normalized = (op || 'equals').toLowerCase().trim();
    const mapping: Record<string, string> = {
        // Short to full
        'gte': 'greater_than_or_equal',
        'gt': 'greater_than',
        'lte': 'less_than_or_equal',
        'lt': 'less_than',
        'eq': 'equals',
        // Already full - pass through
        'greater_than_or_equal': 'greater_than_or_equal',
        'greater_than': 'greater_than',
        'less_than_or_equal': 'less_than_or_equal',
        'less_than': 'less_than',
        'equals': 'equals',
        'not_null': 'not_null',
        'contains': 'contains',
        'exact': 'exact',
        'within_days': 'within_days',
    };
    return mapping[normalized] || normalized;
}

// ============================================================================
// Types
// ============================================================================

export interface ValidationContext {
    prisma: PrismaClient;
    entityType: EntityType;
    userId?: string;
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

interface ExistingData {
    byName: Map<string, ExistingRecord>;
    byId: Map<string, ExistingRecord>;
}

const EMPTY_EXISTING_DATA: ExistingData = {
    byName: new Map(),
    byId: new Map()
};

// ============================================================================
// Business Validator
// ============================================================================

export class BusinessValidator {
    private prisma: PrismaClient;
    private entityType: EntityType;
    private userId?: string;
    private errors: ValidationError[] = [];
    private warnings: ValidationWarning[] = [];

    constructor(context: ValidationContext) {
        this.prisma = context.prisma;
        this.entityType = context.entityType;
        this.userId = context.userId;
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

        const existingTasks = existingEntity
            ? await this.fetchExistingTasks(existingEntity.id)
            : EMPTY_EXISTING_DATA;
        const existingLicenses = existingEntity
            ? await this.fetchExistingLicenses(existingEntity.id)
            : EMPTY_EXISTING_DATA;
        const existingOutcomes = existingEntity
            ? await this.fetchExistingOutcomes(existingEntity.id)
            : EMPTY_EXISTING_DATA;
        const existingReleases = existingEntity
            ? await this.fetchExistingReleases(existingEntity.id)
            : EMPTY_EXISTING_DATA;
        const existingTags = existingEntity
            ? await this.fetchExistingTags(existingEntity.id)
            : EMPTY_EXISTING_DATA;
        const existingTelemetryAttributes = existingEntity
            ? await this.fetchExistingTelemetryAttributes(existingEntity.id)
            : EMPTY_EXISTING_DATA;

        const existingCustomAttributes = existingEntity
            ? await this.fetchExistingCustomAttributes(existingEntity.id)
            : EMPTY_EXISTING_DATA;

        const existingProductRefs = existingEntity && this.entityType === 'solution'
            ? await this.fetchExistingProductRefs(existingEntity.id)
            : EMPTY_EXISTING_DATA;

        const existingResources = existingEntity
            ? await this.fetchExistingResources(existingEntity.id)
            : EMPTY_EXISTING_DATA;

        // Process each entity type (cast to unknown first to allow flexible typing)
        const records: RecordsSummary = {
            tasks: this.processRecords(
                'Tasks',
                parsedData.tasks.map(t => ({ row: t.row, data: t.data as unknown as Record<string, unknown> })),
                existingTasks,
                'name',
                TASK_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.tasks)[0]['data']>[],

            // ... (other fields will be implicitly structured by the following calls in real execution, 
            // but here we are initializing the object structure. Wait, 'records' is defined as object literal.
            // I need to add 'resources: ...' to the object literal.

            // The previous view of business.validator.ts showed lines 165-180.
            // It showed 'tasks: ...' starting at line 173.
            // I need to see the END of the object literal to add 'resources'.

            // Let me look at view_file result from step 2908 again. 
            // It only showed the beginning of 'records'. 
            // I need to find where 'records' object literal ends to add 'resources'.

            // I will abort this specific tool call and read more of business.validator.ts first.
            // Actually, I can use the previous error message context or just read more.
            // I'll read more to be safe.

            // Wait, I can't abort a tool call in the middle of a list of tool calls in thought process easily.
            // I will just read the file in a separate step before applying this specific change.
            // So I will removed this last tool call from this turn.

            licenses: this.processRecords(
                'Licenses',
                parsedData.licenses.map(l => ({ row: l.row, data: l.data as unknown as Record<string, unknown> })),
                existingLicenses,
                'name',
                LICENSE_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.licenses)[0]['data']>[],
            outcomes: this.processRecords(
                'Outcomes',
                parsedData.outcomes.map(o => ({ row: o.row, data: o.data as unknown as Record<string, unknown> })),
                existingOutcomes,
                'name',
                OUTCOME_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.outcomes)[0]['data']>[],
            releases: this.processRecords(
                'Releases',
                parsedData.releases.map(r => ({ row: r.row, data: r.data as unknown as Record<string, unknown> })),
                existingReleases,
                'name',
                RELEASE_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.releases)[0]['data']>[],
            tags: this.processRecords(
                'Tags',
                parsedData.tags.map(t => ({ row: t.row, data: t.data as unknown as Record<string, unknown> })),
                existingTags,
                'name',
                TAG_DIFF_FIELDS,
                false // detect deletions (ENABLED - user wants "scoped" deletion)
            ) as RecordPreview<(typeof parsedData.tags)[0]['data']>[],
            customAttributes: this.processRecords(
                'Custom Attributes',
                parsedData.customAttributes.map(c => ({ row: c.row, data: c.data as unknown as Record<string, unknown> })),
                existingCustomAttributes,
                'key',
                CUSTOM_ATTRIBUTE_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.customAttributes)[0]['data']>[],
            telemetryAttributes: this.processRecords(
                'Telemetry Attributes',
                parsedData.telemetryAttributes.map(t => {
                    // Normalize incoming expectedValue to match DB format
                    let normalizedExpectedValue = t.data.expectedValue ?? '';
                    if (typeof normalizedExpectedValue === 'string' && normalizedExpectedValue.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(normalizedExpectedValue);
                            normalizedExpectedValue = stableStringify(parsed);
                        } catch { /* keep original */ }
                    }

                    return {
                        row: t.row,
                        data: {
                            ...t.data,
                            expectedValue: normalizedExpectedValue,
                            // Normalize operator to match DB format
                            operator: normalizeOperator(t.data.operator),
                            compositeKey: `${(t.data.taskName || '').toLowerCase()}:${(t.data.attributeName || '').toLowerCase()}`
                        } as unknown as Record<string, unknown>
                    };
                }),
                existingTelemetryAttributes,
                'compositeKey',
                TELEMETRY_ATTRIBUTE_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.telemetryAttributes)[0]['data']>[],
            productRefs: this.processRecords(
                'Products',
                parsedData.productRefs?.map(p => ({ row: p.row, data: p.data as unknown as Record<string, unknown> })) || [],
                existingProductRefs,
                'name',
                PRODUCT_REF_DIFF_FIELDS,
                false // detect deletions
            ) as RecordPreview<(typeof parsedData.productRefs)[0]['data']>[],
            resources: this.processRecords(
                'Resources',
                parsedData.resources.map(r => ({ row: r.row, data: r.data as unknown as Record<string, unknown> })),
                existingResources,
                'label', // Primary key
                RESOURCE_DIFF_FIELDS,
                true // detect deletions
            ) as RecordPreview<(typeof parsedData.resources)[0]['data']>[],
        };

        // Validate task references and total weight
        this.validateTaskReferences(parsedData, existingTasks, records.tasks);

        // Calculate summary
        const summary = this.calculateSummary(records);

        // Validate Product Refs exist
        if (this.entityType === 'solution') {
            await this.validateProductExistence(records.productRefs);
        }

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
            // Priority: Name match (Legacy behavior - changing name creates new product)
            return await this.prisma.product.findUnique({
                where: { name },
                select: { id: true, name: true },
            });
        } else if (this.entityType === 'solution') {
            return await this.prisma.solution.findFirst({
                where: { name },
                select: { id: true, name: true },
            });
        } else {
            // Personal Product
            if (!this.userId) return null;
            return await (this.prisma as any).personalProduct.findFirst({
                where: { name, userId: this.userId },
                select: { id: true, name: true },
            });
        }
    }

    /**
     * Fetch existing tasks for a product/solution
     */
    private async fetchExistingTasks(entityId: string): Promise<ExistingData> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const tasks = await this.prisma.task.findMany({
                where: { productId: entityId },
                include: {
                    outcomes: { include: { outcome: true } },
                    releases: { include: { release: true } },
                    taskTags: { include: { tag: true } }
                }
            });
            for (const task of tasks) {
                const data = task as unknown as Record<string, unknown>;

                // Normalize Decimal weight to number
                if (task.weight && typeof task.weight === 'object' && 'toNumber' in task.weight) {
                    data.weight = (task.weight as any).toNumber();
                }

                // Map relations to string arrays (names) - SORT ALPHABETICALLY for consistent diffing
                data.outcomes = task.outcomes.map(to => to.outcome.name).sort();
                data.releases = task.releases.map(tr => tr.release.name).sort();
                data.tags = task.taskTags.map(tt => tt.tag.name).sort();

                map.set(task.name.toLowerCase(), {
                    id: task.id,
                    name: task.name,
                    data,
                });
            }
        } else if (this.entityType === 'solution') {
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
        } else {
            // Personal Product
            const tasks = await (this.prisma as any).personalTask.findMany({
                where: { personalProductId: entityId },
                include: {
                    outcomes: { include: { personalOutcome: true } },
                    releases: { include: { personalRelease: true } },
                }
            });
            for (const task of tasks) {
                const data = task as unknown as Record<string, unknown>;
                // Normalize Decimal weight to number
                if (task.weight && typeof task.weight === 'object' && 'toNumber' in task.weight) {
                    data.weight = (task.weight as any).toNumber();
                }

                // Map relations
                data.outcomes = task.outcomes.map((to: any) => to.personalOutcome.name).sort();
                data.releases = task.releases.map((tr: any) => tr.personalRelease.name).sort();
                // No tags

                map.set(task.name.toLowerCase(), {
                    id: task.id,
                    name: task.name,
                    data,
                });
            }
        }
        return this.createExistingData(map);
    }

    /**
     * Fetch existing licenses for a product
     */
    private async fetchExistingLicenses(entityId: string): Promise<ExistingData> {
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
        } else if (this.entityType === 'personal_product') {
            const licenses = await (this.prisma as any).personalLicense.findMany({
                where: { personalProductId: entityId },
            });
            for (const license of licenses) {
                map.set(license.name.toLowerCase(), {
                    id: license.id,
                    name: license.name,
                    data: license as unknown as Record<string, unknown>,
                });
            }
        }
        return this.createExistingData(map);
    }

    /**
     * Fetch existing outcomes for a product
     */
    private async fetchExistingOutcomes(entityId: string): Promise<ExistingData> {
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
        } else if (this.entityType === 'personal_product') {
            const outcomes = await (this.prisma as any).personalOutcome.findMany({
                where: { personalProductId: entityId },
            });
            for (const outcome of outcomes) {
                map.set(outcome.name.toLowerCase(), {
                    id: outcome.id,
                    name: outcome.name,
                    data: outcome as unknown as Record<string, unknown>,
                });
            }
        }
        return this.createExistingData(map);
    }

    /**
     * Fetch existing releases for a product
     */
    private async fetchExistingReleases(entityId: string): Promise<ExistingData> {
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
        } else if (this.entityType === 'personal_product') {
            const releases = await (this.prisma as any).personalRelease.findMany({
                where: { personalProductId: entityId },
            });
            for (const release of releases) {
                map.set(release.name.toLowerCase(), {
                    id: release.id,
                    name: release.name,
                    data: release as unknown as Record<string, unknown>,
                });
            }
        }
        return this.createExistingData(map);
    }

    /**
     * Fetch existing custom attributes for a product
     */
    private async fetchExistingCustomAttributes(entityId: string): Promise<ExistingData> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const attributes = await this.prisma.customAttribute.findMany({
                where: { productId: entityId },
            });
            for (const attr of attributes) {
                // Map to format matching columns
                // key, value, displayOrder
                const data: Record<string, unknown> = {
                    id: attr.id,
                    key: attr.attributeName,
                    value: attr.attributeValue ?? '',
                    displayOrder: attr.displayOrder
                };

                map.set(attr.attributeName.toLowerCase(), {
                    id: attr.id,
                    name: attr.attributeName, // Use name as second key match
                    data
                });
            }

            // ALSO fetch legacy JSON attributes to prevent false "Create" flags
            // This ensures that "Same File" import detects legacy attributes as existing
            const product = await this.prisma.product.findUnique({
                where: { id: entityId },
                select: { customAttrs: true }
            });

            if (product?.customAttrs && typeof product.customAttrs === 'object') {
                for (const [key, value] of Object.entries(product.customAttrs as Record<string, unknown>)) {
                    const lowerKey = key.toLowerCase();
                    // Only add if not already in structured table map
                    if (!map.has(lowerKey)) {
                        map.set(lowerKey, {
                            id: `legacy-${key}`, // Virtual ID to satisfy ExistingRecord interface
                            name: key,
                            data: {
                                key,
                                value: String(value ?? ''),
                                displayOrder: 99
                            }
                        });
                    }
                }
            }
        } else if (this.entityType === 'personal_product') {
            // Personal Product uses JSON customAttrs directly
            const personalProduct = await (this.prisma as any).personalProduct.findUnique({
                where: { id: entityId },
                select: { customAttrs: true }
            });

            if (personalProduct?.customAttrs && typeof personalProduct.customAttrs === 'object') {
                for (const [key, value] of Object.entries(personalProduct.customAttrs as Record<string, unknown>)) {
                    const lowerKey = key.toLowerCase();
                    map.set(lowerKey, {
                        id: `personal-${key}`,
                        name: key,
                        data: {
                            key,
                            value: String(value ?? ''),
                            displayOrder: 99
                        }
                    });
                }
            }
        }
        return this.createExistingData(map);
    }

    /**
     * Fetch existing telemetry attributes for a product/solution
     */
    private async fetchExistingTelemetryAttributes(entityId: string): Promise<ExistingData> {
        const map = new Map<string, ExistingRecord>();

        if (this.entityType === 'product') {
            const attributes = await this.prisma.telemetryAttribute.findMany({
                where: {
                    task: { productId: entityId }
                },
                include: {
                    task: { select: { name: true } }
                }
            });

            for (const attr of attributes) {
                // Key: taskName:attributeName (lowercase)
                const key = `${attr.task.name.toLowerCase()}:${attr.name.toLowerCase()}`;

                // Map DB fields to Excel columns format
                const data: Record<string, unknown> = {
                    id: attr.id,
                    taskName: attr.task.name,
                    attributeName: attr.name,
                    attributeType: (attr.dataType || 'string').toLowerCase(),
                    expectedValue: '',
                    operator: 'equals',
                    apiEndpoint: undefined,
                };

                // Fix Expected Value mapping
                const criteria = attr.successCriteria as any;
                data.operator = 'equals'; // Default
                data.expectedValue = '';  // Default

                if (criteria && typeof criteria === 'object') {
                    // Extract operator - use type-aware extraction matching ExportService.getTelemetryOperator
                    if (criteria.type) {
                        // Typed criteria format
                        switch (criteria.type) {
                            case 'boolean_flag':
                                data.operator = 'equals';
                                data.expectedValue = String(criteria.expectedValue ?? '');
                                break;
                            case 'number_threshold':
                                data.operator = normalizeOperator(criteria.operator || 'gte');
                                data.expectedValue = String(criteria.threshold ?? '');
                                break;
                            case 'string_match':
                                data.operator = criteria.mode === 'exact' ? 'equals' : 'contains';
                                data.expectedValue = String(criteria.pattern ?? '');
                                break;
                            case 'string_not_null':
                                data.operator = 'not_null';
                                data.expectedValue = '';
                                break;
                            case 'timestamp_not_null':
                                data.operator = 'not_null';
                                data.expectedValue = '';
                                break;
                            case 'timestamp_comparison':
                                data.operator = 'within_days';
                                data.expectedValue = String(criteria.withinDays ?? '');
                                break;
                            default:
                                // Unknown type, try legacy extraction
                                data.operator = normalizeOperator(criteria.operator);
                                const valueField = criteria.value ?? criteria.threshold ?? criteria.target;
                                if (valueField !== undefined && valueField !== null) {
                                    data.expectedValue = typeof valueField === 'object' ? stableStringify(valueField) : String(valueField);
                                }
                        }
                    } else {
                        // Legacy format without type field
                        data.operator = normalizeOperator(criteria.operator);
                        const valueField = criteria.value ?? criteria.threshold ?? criteria.target;
                        if (valueField !== undefined && valueField !== null) {
                            data.expectedValue = typeof valueField === 'object' ? stableStringify(valueField) : String(valueField);
                        }
                    }
                }

                data.isRequired = attr.isRequired ?? true;
                // apiEndpoint? Not in Prisma Schema (viewed earlier)? 
                // Line 470 ' TelemetryAttribute ' in Schema (Step 1486) did NOT show apiEndpoint.
                // Columns.ts has 'apiEndpoint'.
                // If Schema lacks it, we ignore it or it's in a different place?
                // Step 1486 showed lines 467-484. No apiEndpoint.
                // Wait, User asked about "apiEndpoint for Telemetry" in previous session Summary.
                // "Consider apiEndpoint for Telemetry".
                // If it's missing in DB, we can't fetch it.
                // We'll leave it undefined in existing data (so diff might show it added if user provides it).

                map.set(key, {
                    id: attr.id,
                    name: key,
                    data
                });
            }
        } else if (this.entityType === 'personal_product') {
            const attributes = await (this.prisma as any).personalTelemetryAttribute.findMany({
                where: {
                    personalTask: { personalProductId: entityId }
                },
                include: {
                    personalTask: { select: { name: true } }
                }
            });

            for (const attr of attributes) {
                const key = `${attr.personalTask.name.toLowerCase()}:${attr.name.toLowerCase()}`;
                const data: Record<string, unknown> = {
                    id: attr.id,
                    taskName: attr.personalTask.name,
                    attributeName: attr.name,
                    attributeType: (attr.dataType || 'string').toLowerCase(),
                    expectedValue: '',
                    operator: 'equals',
                };

                const criteria = attr.successCriteria as any;
                if (criteria && typeof criteria === 'object') {
                    if (criteria.type) {
                        switch (criteria.type) {
                            case 'boolean_flag':
                                data.operator = 'equals';
                                data.expectedValue = String(criteria.expectedValue ?? '');
                                break;
                            case 'number_threshold':
                                data.operator = normalizeOperator(criteria.operator || 'gte');
                                data.expectedValue = String(criteria.threshold ?? '');
                                break;
                            case 'string_match':
                                data.operator = criteria.mode === 'exact' ? 'equals' : 'contains';
                                data.expectedValue = String(criteria.pattern ?? '');
                                break;
                            case 'string_not_null':
                                data.operator = 'not_null';
                                data.expectedValue = '';
                                break;
                            case 'timestamp_not_null':
                                data.operator = 'not_null';
                                data.expectedValue = '';
                                break;
                            case 'timestamp_comparison':
                                data.operator = 'within_days';
                                data.expectedValue = String(criteria.withinDays ?? '');
                                break;
                        }
                    } else {
                        data.operator = criteria.operator || 'equals';
                        data.expectedValue = String(criteria.value || criteria.expectedValue || '');
                    }
                }

                map.set(key, {
                    id: attr.id,
                    name: key,
                    data
                });
            }
        }
        return this.createExistingData(map);
    }

    private async fetchExistingTags(entityId: string): Promise<ExistingData> {
        const map = new Map<string, ExistingRecord>();
        if (this.entityType === 'product') {
            const tags = await this.prisma.productTag.findMany({
                where: { productId: entityId }
            });
            for (const tag of tags) {
                map.set(tag.name.toLowerCase(), {
                    id: tag.id,
                    name: tag.name,
                    data: tag as unknown as Record<string, unknown>,
                });
            }
        } else if (this.entityType === 'solution') {
            const tags = await this.prisma.solutionTag.findMany({
                where: { solutionId: entityId }
            });
            for (const tag of tags) {
                map.set(tag.name.toLowerCase(), {
                    id: tag.id,
                    name: tag.name,
                    data: tag as unknown as Record<string, unknown>,
                });
            }
        } else if (this.entityType === 'personal_product') {
            const tags = await (this.prisma as any).personalTag.findMany({
                where: { personalProductId: entityId }
            });
            for (const tag of tags) {
                map.set(tag.name.toLowerCase(), {
                    id: tag.id,
                    name: tag.name,
                    data: tag as unknown as Record<string, unknown>,
                });
            }
        }
        return this.createExistingData(map);
    }

    private createExistingData(byNameMap: Map<string, ExistingRecord>): ExistingData {
        const byId = new Map<string, ExistingRecord>();
        for (const record of byNameMap.values()) {
            byId.set(record.id, record);
        }
        return { byName: byNameMap, byId };
    }

    private async fetchExistingProductRefs(solutionId: string): Promise<ExistingData> {
        const map = new Map<string, ExistingRecord>();
        const products = await this.prisma.solutionProduct.findMany({
            where: { solutionId },
            include: { product: true }
        });

        for (const sp of products) {
            const data: Record<string, unknown> = {
                id: sp.productId, // Use Product ID as the key ID
                name: sp.product.name,
                order: sp.order,
                description: (sp.product as any).description
            };

            map.set(sp.product.name.toLowerCase(), {
                id: sp.productId,
                name: sp.product.name,
                data
            });
        }

        return this.createExistingData(map);
    }

    private async validateProductExistence(previews: RecordPreview<unknown>[]): Promise<void> {
        // Collect all product names from create/update actions
        const namesToCheck = new Set<string>();
        for (const preview of previews) {
            if (preview.action === 'skip' || preview.action === 'delete') continue;
            const data = preview.data as any;
            if (data.name) namesToCheck.add(data.name);
        }

        if (namesToCheck.size === 0) return;

        // Check which ones exist
        const found = await this.prisma.product.findMany({
            where: {
                name: { in: Array.from(namesToCheck) }
            },
            select: { name: true }
        });

        const foundNames = new Set(found.map(f => f.name.toLowerCase()));

        for (const preview of previews) {
            if (preview.action === 'skip' || preview.action === 'delete') continue;
            const name = (preview.data as any).name;
            if (name && !foundNames.has(name.toLowerCase())) {
                this.addError(
                    'Products',
                    preview.rowNumber,
                    'name',
                    'name',
                    name,
                    `Product "${name}" does not exist in the database. Please create the product first or check for typos.`,
                    'PRODUCT_NOT_FOUND'
                );
            }
        }
    }

    /**
     * Process records for a sheet type - determine create/update/skip action
     */
    private processRecords(
        sheetName: string,
        incoming: Array<{ row: number; data: Record<string, unknown> }>,
        existing: ExistingData,
        matchField: string,
        diffFields: string[],
        ignoreDeletions: boolean = false
    ): RecordPreview<unknown>[] {
        const previews: RecordPreview<unknown>[] = [];
        const seenNames = new Map<string, number>();
        const matchedExistingIds = new Set<string>();

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
            let existingRecord: ExistingRecord | undefined;
            const id = data.id as string | undefined;

            if (id && existing.byId.has(id)) {
                existingRecord = existing.byId.get(id);
            } else if (matchValue) {
                existingRecord = existing.byName.get(matchValue);
            }

            if (existingRecord) {
                matchedExistingIds.add(existingRecord.id);
                const changes: FieldDiff[] = generateFieldDiffs(existingRecord.data, data, diffFields);

                if (changes.length === 0) {
                    previews.push({
                        rowNumber: row,
                        action: 'skip',
                        data,
                        existingData: existingRecord.data,
                        existingId: existingRecord.id,
                        changes: [],
                    });
                } else {
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
                previews.push({
                    rowNumber: row,
                    action: 'create',
                    data,
                });
            }
        }

        // Detect Deletions
        if (!ignoreDeletions) {
            for (const [id, record] of existing.byId.entries()) {
                if (!matchedExistingIds.has(id)) {
                    previews.push({
                        rowNumber: 0,
                        action: 'delete',
                        data: record.data,
                        existingId: id,
                        existingData: record.data,
                        changes: [],
                    });
                }
            }
        }

        return previews;
    }

    /**
     * Validate task references to outcomes, releases, tags
     */
    private validateTaskReferences(
        parsedData: ParsedWorkbook,
        existingTasks: ExistingData,
        taskPreviews: RecordPreview<unknown>[]
    ): void {
        const outcomeNames = new Set(parsedData.outcomes.map(o => o.data.name.toLowerCase()));
        const releaseNames = new Set(parsedData.releases.map(r => r.data.name.toLowerCase()));
        const tagNames = new Set(parsedData.tags.map(t => t.data.name.toLowerCase()));

        // Calculate final total weight after import:
        // 1. Start with weights of existing tasks that are NOT being modified (action: 'skip')
        // 2. Add weights of tasks from Excel (create, update, skip all contribute their Excel weight)

        // Get set of task names in Excel (normalized)
        const excelTaskNames = new Set(parsedData.tasks.map(t => t.data.name.toLowerCase()));

        // Weight from existing tasks NOT in Excel (they will remain unchanged)
        let existingUnmodifiedWeight = 0;
        for (const [key, existing] of existingTasks.byName) {
            if (!excelTaskNames.has(key)) {
                existingUnmodifiedWeight += Number(existing.data.weight) || 0;
            }
        }

        // Weight from tasks in Excel (these will be the final weights for these tasks)
        let excelTasksWeight = 0;

        for (const { row, data: task } of parsedData.tasks) {
            // Validate weight range
            if (task.weight < 0 || task.weight > 100) {
                this.addError('Tasks', row, 'weight', 'weight', task.weight,
                    `Weight must be between 0 and 100, got ${task.weight}`,
                    'INVALID_WEIGHT'
                );
            }

            // Accumulate Excel tasks weight
            excelTasksWeight += task.weight ?? 0;

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

        // Validate total weight doesn't exceed 100%
        const totalWeight = existingUnmodifiedWeight + excelTasksWeight;
        if (totalWeight > 100) {
            this.addError('Tasks', 0, 'weight', 'weight', totalWeight,
                `Total task weight after import (${totalWeight}%) will exceed 100%. Excel tasks: ${excelTasksWeight}%, Existing unchanged tasks: ${existingUnmodifiedWeight}%. Please adjust weights.`,
                'TOTAL_WEIGHT_EXCEEDED'
            );
        }
    }

    private async fetchExistingResources(entityId: string): Promise<ExistingData> {
        const map = new Map<string, ExistingRecord>();

        // Fetch entity with resources
        let entityResources: any[] = [];

        if (this.entityType === 'product') {
            const product = await this.prisma.product.findUnique({
                where: { id: entityId },
                select: { resources: true }
            });
            if (product?.resources && Array.isArray(product.resources)) {
                entityResources = product.resources;
            }
        } else if (this.entityType === 'solution') {
            const solution = await this.prisma.solution.findUnique({
                where: { id: entityId },
                select: { resources: true }
            });
            if (solution?.resources && Array.isArray(solution.resources)) {
                entityResources = solution.resources;
            }
        } else if (this.entityType === 'personal_product') {
            const personalProduct = await (this.prisma as any).personalProduct.findUnique({
                where: { id: entityId },
                select: { resources: true }
            });
            if (personalProduct?.resources && Array.isArray(personalProduct.resources)) {
                entityResources = personalProduct.resources;
            }
        }

        // Map resources to ExistingRecord format
        // Use label as the unique ID since there are no real IDs
        for (const r of entityResources) {
            if (r.label && r.url) {
                map.set(r.label.toLowerCase(), {
                    id: r.label, // Use label as ID
                    name: r.label,
                    data: { label: r.label, url: r.url } as unknown as Record<string, unknown>,
                });
            }
        }

        return this.createExistingData(map);
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
        if (records.productRefs) countActions(records.productRefs);
        countActions(records.resources);

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
    parsedData: ParsedWorkbook,
    userId?: string
): Promise<ValidationResult> {
    const validator = new BusinessValidator({
        prisma,
        entityType: parsedData.entityType,
        userId,
    });
    return validator.validate(parsedData);
}
