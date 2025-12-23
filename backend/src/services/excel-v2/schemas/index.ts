/**
 * Excel Import/Export V2 - Zod Schemas
 * 
 * Strict validation schemas for all entity types.
 * These schemas are used to validate parsed Excel data before import.
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * UUID schema - accepts standard UUIDs or CUIDs
 */
export const IdSchema = z.string()
    .refine(
        (val) => {
            // Accept UUIDs (v4 format) or CUIDs (starts with 'c')
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const cuidRegex = /^c[a-z0-9]{20,}$/i;
            return uuidRegex.test(val) || cuidRegex.test(val);
        },
        { message: 'Invalid ID format (must be UUID or CUID)' }
    )
    .optional();

/**
 * URL schema with custom error messages
 */
export const UrlSchema = z.string()
    .url({ message: 'Invalid URL format' })
    .refine(
        (url) => url.startsWith('http://') || url.startsWith('https://'),
        { message: 'URL must start with http:// or https://' }
    );

/**
 * Non-empty string schema
 */
export const NonEmptyString = z.string()
    .min(1, { message: 'This field is required' })
    .max(255, { message: 'Maximum 255 characters allowed' });

/**
 * License level enum (matches Prisma enum)
 */
export const LicenseLevelSchema = z.enum(['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'], {
    message: 'License level must be Essential, Advantage, or Signature',
});

// ============================================================================
// Product Schema
// ============================================================================

export const ProductRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('Product name is required'),
    description: z.string().max(5000).optional().nullable(),
});

export type ProductRow = z.infer<typeof ProductRowSchema>;

// ============================================================================
// Solution Schema
// ============================================================================

export const SolutionRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('Solution name is required'),
    description: z.string().max(5000).optional().nullable(),
    linkedProducts: z.array(z.string().min(1)).default([]),
});

export type SolutionRow = z.infer<typeof SolutionRowSchema>;

// ============================================================================
// Task Schema
// ============================================================================

export const TaskRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('Task name is required'),
    description: z.string().max(2000).optional().nullable(),
    weight: z.number()
        .min(0, { message: 'Weight must be >= 0' })
        .max(100, { message: 'Weight must be <= 100' })
        .default(1),
    sequenceNumber: z.number()
        .int({ message: 'Sequence must be a whole number' })
        .positive({ message: 'Sequence must be positive' })
        .default(1),
    estMinutes: z.number()
        .int({ message: 'Estimated minutes must be a whole number' })
        .nonnegative({ message: 'Estimated minutes must be >= 0' })
        .default(60),
    licenseLevel: LicenseLevelSchema.default('ESSENTIAL'),
    notes: z.string().max(5000).optional().nullable(),
    howToDoc: z.array(UrlSchema).default([]),
    howToVideo: z.array(UrlSchema).default([]),
    outcomes: z.array(z.string().min(1)).default([]),
    releases: z.array(z.string().min(1)).default([]),
    tags: z.array(z.string().min(1)).default([]),
});

export type TaskRow = z.infer<typeof TaskRowSchema>;

// ============================================================================
// License Schema
// ============================================================================

export const LicenseRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('License name is required'),
    level: z.number()
        .int({ message: 'Level must be a whole number' })
        .min(1, { message: 'Level must be >= 1' })
        .max(10, { message: 'Level must be <= 10' }),
    description: z.string().max(2000).optional().nullable(),
});

export type LicenseRow = z.infer<typeof LicenseRowSchema>;

// ============================================================================
// Outcome Schema
// ============================================================================

export const OutcomeRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('Outcome name is required'),
    description: z.string().max(2000).optional().nullable(),
});

export type OutcomeRow = z.infer<typeof OutcomeRowSchema>;

// ============================================================================
// Release Schema
// ============================================================================

export const ReleaseRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('Release name is required'),
    level: z.number()
        .int({ message: 'Level must be a whole number' })
        .min(1, { message: 'Level must be >= 1' })
        .max(10, { message: 'Level must be <= 10' }),
    description: z.string().max(2000).optional().nullable(),
});

export type ReleaseRow = z.infer<typeof ReleaseRowSchema>;

// ============================================================================
// Tag Schema
// ============================================================================

/**
 * Hex color validation
 */
const HexColorSchema = z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
    .default('#808080');

export const TagRowSchema = z.object({
    id: IdSchema,
    name: NonEmptyString.describe('Tag name is required'),
    color: HexColorSchema,
    description: z.string().max(500).optional().nullable(),
});

export type TagRow = z.infer<typeof TagRowSchema>;

// ============================================================================
// Custom Attribute Schema
// ============================================================================

export const CustomAttributeRowSchema = z.object({
    id: IdSchema,
    key: NonEmptyString.describe('Attribute key is required'),
    value: z.string().min(1, { message: 'Attribute value is required' }),
    displayOrder: z.number().int().nonnegative().default(0),
});

export type CustomAttributeRow = z.infer<typeof CustomAttributeRowSchema>;

// ============================================================================
// Telemetry Attribute Schema
// ============================================================================

export const TelemetryOperatorSchema = z.enum(['equals', 'contains', 'gt', 'gte', 'lt', 'lte'], {
    message: 'Operator must be: equals, contains, gt, gte, lt, or lte',
});

export const TelemetryTypeSchema = z.enum(['string', 'number', 'boolean', 'json'], {
    message: 'Type must be: string, number, boolean, or json',
});

export const TelemetryAttributeRowSchema = z.object({
    taskName: NonEmptyString.describe('Task name is required'),
    attributeName: NonEmptyString.describe('Attribute name is required'),
    attributeType: TelemetryTypeSchema.default('string'),
    expectedValue: z.string().optional().nullable(),
    operator: TelemetryOperatorSchema.default('equals'),
    apiEndpoint: UrlSchema.optional().nullable(),
});

export type TelemetryAttributeRow = z.infer<typeof TelemetryAttributeRowSchema>;

// ============================================================================
// Schema Registry (for dynamic validation)
// ============================================================================

export const SchemaRegistry = {
    product: ProductRowSchema,
    solution: SolutionRowSchema,
    task: TaskRowSchema,
    license: LicenseRowSchema,
    outcome: OutcomeRowSchema,
    release: ReleaseRowSchema,
    tag: TagRowSchema,
    customAttribute: CustomAttributeRowSchema,
    telemetryAttribute: TelemetryAttributeRowSchema,
} as const;

export type SchemaName = keyof typeof SchemaRegistry;
