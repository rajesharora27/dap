/**
 * Excel Import/Export - Core Types
 * 
 * This file defines all TypeScript types used across the V2 import/export system.
 * These types are the foundation for Zod schemas, parsers, validators, and executors.
 */

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType = 'product' | 'solution' | 'personal_product';

export type RecordAction = 'create' | 'update' | 'delete' | 'skip';

export type ImportPhase = 'parsing' | 'validating' | 'writing' | 'complete' | 'error';

export type ErrorSeverity = 'error' | 'warning';

// ============================================================================
// License Levels (matches Prisma enum)
// ============================================================================

export type LicenseLevel = 'ESSENTIAL' | 'ADVANTAGE' | 'SIGNATURE';

export const LICENSE_LEVELS: readonly LicenseLevel[] = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'] as const;

// Map display names to enum values
export const LICENSE_LEVEL_MAP: Record<string, LicenseLevel> = {
    'essential': 'ESSENTIAL',
    'advantage': 'ADVANTAGE',
    'signature': 'SIGNATURE',
    'premier': 'SIGNATURE', // Alias
};

// ============================================================================
// Raw Row Types (parsed from Excel, before validation)
// ============================================================================

export interface RawProductRow {
    id?: string | null;
    name?: string | null;
    description?: string | null;
    resources?: string | null; // JSON string or comma-separated links if we want to support it
}

export interface RawSolutionRow {
    id?: string | null;
    name?: string | null;
    description?: string | null;
    resources?: string | null;
    linkedProducts?: string | null; // Comma-separated product names
}

export interface RawTaskRow {
    id?: string | null;
    name?: string | null;
    description?: string | null;
    weight?: number | string | null;
    sequenceNumber?: number | string | null;
    estMinutes?: number | string | null;
    licenseLevel?: string | null;
    notes?: string | null;
    howToDoc?: string | null;      // URLs, comma or newline separated
    howToVideo?: string | null;    // URLs, comma or newline separated
    outcomes?: string | null;      // Names, comma separated
    releases?: string | null;      // Names, comma separated
    tags?: string | null;          // Names, comma separated
}

export interface RawLicenseRow {
    id?: string | null;
    name?: string | null;
    level?: number | string | null;
    description?: string | null;
}

export interface RawOutcomeRow {
    id?: string | null;
    name?: string | null;
    description?: string | null;
}

export interface RawReleaseRow {
    id?: string | null;
    name?: string | null;
    level?: number | string | null;
    description?: string | null;
}

export interface RawTagRow {
    id?: string | null;
    name?: string | null;
    color?: string | null;
    description?: string | null;
}

export interface RawCustomAttributeRow {
    id?: string | null;
    key?: string | null;
    value?: string | null;
    displayOrder?: number | string | null;
}

export interface RawTelemetryAttributeRow {
    taskName?: string | null;
    attributeName?: string | null;
    attributeType?: string | null;
    expectedValue?: string | null;
    operator?: string | null;
    apiEndpoint?: string | null;
}

export interface RawProductRefRow {
    id?: string | null;
    name?: string | null;
    order?: number | string | null;
    description?: string | null;
}

export interface RawResourceRow {
    id?: string | null;
    label?: string | null;
    url?: string | null;
}

// ============================================================================
// Validated Row Types (after Zod validation)
// ============================================================================

export interface ValidatedProductRow {
    id?: string;
    name: string;
    description?: string;
    resources?: Array<{ label: string; url: string }>;
}

export interface ValidatedSolutionRow {
    id?: string;
    name: string;
    description?: string;
    resources?: Array<{ label: string; url: string }>;
    linkedProducts: string[];
}

export interface ValidatedTaskRow {
    id?: string;
    name: string;
    description?: string;
    weight: number;
    sequenceNumber: number;
    estMinutes: number;
    licenseLevel: LicenseLevel;
    notes?: string;
    howToDoc: string[];
    howToVideo: string[];
    outcomes: string[];
    releases: string[];
    tags: string[];
}

export interface ValidatedLicenseRow {
    id?: string;
    name: string;
    level: number;
    description?: string;
}

export interface ValidatedOutcomeRow {
    id?: string;
    name: string;
    description?: string;
}

export interface ValidatedReleaseRow {
    id?: string;
    name: string;
    level: number;
    description?: string;
}

export interface ValidatedTagRow {
    id?: string;
    name: string;
    color: string;
    description?: string;
}

export interface ValidatedCustomAttributeRow {
    id?: string;
    key: string;
    value: string;
    displayOrder: number;
}

export interface ValidatedTelemetryAttributeRow {
    taskName: string;
    attributeName: string;
    attributeType: string;
    expectedValue?: string;
    operator: string;
    isRequired: boolean;
    apiEndpoint?: string;
}

export interface ValidatedResourceRow {
    id?: string;
    label: string;
    url: string;
}

export interface ValidatedProductRefRow {
    id?: string;
    name: string;
    order: number;
    description?: string;
}

// ============================================================================
// Validation Error/Warning Types
// ============================================================================

export interface ValidationError {
    sheet: string;
    row: number;
    column: string;
    field: string;
    value: unknown;
    message: string;
    code: string;
    severity: 'error';
}

export interface ValidationWarning {
    sheet: string;
    row: number;
    column?: string;
    field?: string;
    message: string;
    code: string;
    severity: 'warning';
}

export type ValidationIssue = ValidationError | ValidationWarning;

// ============================================================================
// Diff Types (for update previews)
// ============================================================================

export interface FieldDiff {
    field: string;
    oldValue: unknown;
    newValue: unknown;
    displayOld: string;
    displayNew: string;
}

export interface RecordDiff {
    entityType: string;
    entityName: string;
    changes: FieldDiff[];
}

// ============================================================================
// Record Preview Types (for dry run results)
// ============================================================================

export interface RecordPreview<T = unknown> {
    rowNumber: number;
    action: RecordAction;
    data: T;
    existingData?: T;
    existingId?: string;
    changes?: FieldDiff[];
}

// ============================================================================
// Parsed Workbook Structure
// ============================================================================

export interface ParsedWorkbook {
    entityType: EntityType;
    entity: ValidatedProductRow | ValidatedSolutionRow;
    tasks: Array<{ row: number; data: ValidatedTaskRow }>;
    licenses: Array<{ row: number; data: ValidatedLicenseRow }>;
    outcomes: Array<{ row: number; data: ValidatedOutcomeRow }>;
    releases: Array<{ row: number; data: ValidatedReleaseRow }>;
    tags: Array<{ row: number; data: ValidatedTagRow }>;
    customAttributes: Array<{ row: number; data: ValidatedCustomAttributeRow }>;
    telemetryAttributes: Array<{ row: number; data: ValidatedTelemetryAttributeRow }>;
    productRefs: Array<{ row: number; data: ValidatedProductRefRow }>; // Only for Solutions
    resources: Array<{ row: number; data: ValidatedResourceRow }>;
}

// ============================================================================
// Dry Run Result Types
// ============================================================================

export interface EntitySummary {
    name: string;
    action: 'create' | 'update';
    existingId?: string;
}

export interface RecordsSummary {
    tasks: RecordPreview<ValidatedTaskRow>[];
    licenses: RecordPreview<ValidatedLicenseRow>[];
    outcomes: RecordPreview<ValidatedOutcomeRow>[];
    releases: RecordPreview<ValidatedReleaseRow>[];
    tags: RecordPreview<ValidatedTagRow>[];
    customAttributes: RecordPreview<ValidatedCustomAttributeRow>[];
    telemetryAttributes: RecordPreview<ValidatedTelemetryAttributeRow>[];
    productRefs: RecordPreview<ValidatedProductRefRow>[];
    resources: RecordPreview<ValidatedResourceRow>[];
}

export interface ImportSummary {
    totalRecords: number;
    toCreate: number;
    toUpdate: number;
    toDelete: number;
    toSkip: number;
    errorCount: number;
    warningCount: number;
}

export interface DryRunResult {
    sessionId: string;
    isValid: boolean;
    entityType: EntityType;
    entitySummary: EntitySummary;
    records: RecordsSummary;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    summary: ImportSummary;
}

// ============================================================================
// Import Execution Types
// ============================================================================

export interface ImportStats {
    tasksCreated: number;
    tasksUpdated: number;
    tasksDeleted: number;
    tasksSkipped: number;
    licensesCreated: number;
    licensesUpdated: number;
    licensesDeleted: number;
    outcomesCreated: number;
    outcomesUpdated: number;
    outcomesDeleted: number;
    releasesCreated: number;
    releasesUpdated: number;
    releasesDeleted: number;
    tagsCreated: number;
    tagsUpdated: number;
    tagsDeleted: number;
    customAttributesCreated: number;
    customAttributesUpdated: number;
    customAttributesDeleted: number;
    telemetryAttributesCreated: number;
    telemetryAttributesUpdated: number;
    telemetryAttributesDeleted: number;
    productLinksCreated: number;
    productLinksDeleted: number;
    productLinksUpdated: number;
    resourcesCreated: number;
    resourcesUpdated: number;
    resourcesDeleted: number;
}

export interface ImportResult {
    success: boolean;
    entityType: EntityType;
    entityId?: string;
    entityName: string;
    stats: ImportStats;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    duration: number; // milliseconds
}

// ============================================================================
// Progress Streaming Types
// ============================================================================

export interface ImportProgress {
    sessionId: string;
    phase: ImportPhase;
    current: number;
    total: number;
    message: string;
    percentage: number;
    entityName?: string;
}

// ============================================================================
// Session Cache Types
// ============================================================================

export interface CachedImportSession {
    id: string;
    entityType: EntityType;
    parsedData: ParsedWorkbook;
    dryRunResult: DryRunResult;
    createdAt: Date;
    expiresAt: Date;
}

// ============================================================================
// Column Definition Types (shared between import/export)
// ============================================================================

export interface ColumnDefinition {
    key: string;
    header: string;
    width: number;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array';
    enum?: readonly string[];
    arraySeparator?: string;
    hidden?: boolean;
}

export interface SheetDefinition {
    name: string;
    columns: ColumnDefinition[];
}
