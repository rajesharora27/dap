/**
 * Excel Import/Export V2 - Workbook Parser
 * 
 * Main orchestrator for parsing Excel workbooks.
 * Supports both Product and Solution imports.
 */

import ExcelJS from 'exceljs';
import { z } from 'zod';
import {
    EntityType,
    ValidationError,
    ValidationWarning,
    ValidatedProductRow,
    ValidatedSolutionRow,
    ValidatedTaskRow,
    ValidatedLicenseRow,
    ValidatedOutcomeRow,
    ValidatedReleaseRow,
    ValidatedTagRow,
    ValidatedCustomAttributeRow,
    ValidatedTelemetryAttributeRow,
    ParsedWorkbook,
} from '../types';
import {
    PRODUCT_INFO_COLUMNS,
    SOLUTION_INFO_COLUMNS,
    TASK_COLUMNS,
    LICENSE_COLUMNS,
    OUTCOME_COLUMNS,
    RELEASE_COLUMNS,
    TAG_COLUMNS,
    CUSTOM_ATTRIBUTE_COLUMNS,
    TELEMETRY_ATTRIBUTE_COLUMNS,
} from '../columns';
import {
    ProductRowSchema,
    SolutionRowSchema,
    TaskRowSchema,
    LicenseRowSchema,
    OutcomeRowSchema,
    ReleaseRowSchema,
    TagRowSchema,
    CustomAttributeRowSchema,
    TelemetryAttributeRowSchema,
} from '../schemas';
import {
    findWorksheet,
    parseWorksheetRows,
    getWorksheetNames,
} from './utils';

// ============================================================================
// Types
// ============================================================================

export interface ParseResult {
    success: boolean;
    data?: ParsedWorkbook;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

interface SheetParseResult<T> {
    rows: Array<{ row: number; data: T }>;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

// ============================================================================
// Workbook Parser
// ============================================================================

export class WorkbookParser {
    private workbook: ExcelJS.Workbook;
    private entityType: EntityType;
    private errors: ValidationError[] = [];
    private warnings: ValidationWarning[] = [];

    constructor(workbook: ExcelJS.Workbook, entityType: EntityType) {
        this.workbook = workbook;
        this.entityType = entityType;
    }

    /**
     * Parse a workbook from a buffer (base64 decoded)
     */
    static async fromBuffer(buffer: Buffer, entityType?: EntityType): Promise<WorkbookParser> {
        const workbook = new ExcelJS.Workbook();
        // Convert Buffer to ArrayBuffer for exceljs compatibility
        const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
        );
        await workbook.xlsx.load(arrayBuffer as ArrayBuffer);

        // Auto-detect entity type if not specified
        const detectedType = entityType ?? WorkbookParser.detectEntityType(workbook);

        return new WorkbookParser(workbook, detectedType);
    }

    /**
     * Auto-detect whether this is a Product or Solution workbook
     */
    static detectEntityType(workbook: ExcelJS.Workbook): EntityType {
        const sheetNames = workbook.worksheets.map(ws => ws.name.toLowerCase());

        // Look for Solution-specific sheets
        if (sheetNames.some(name => name.includes('solution'))) {
            return 'solution';
        }

        // Default to product
        return 'product';
    }

    /**
     * Parse the entire workbook
     */
    async parse(): Promise<ParseResult> {
        try {
            // Parse entity sheet (Product Info or Solution Info)
            const entityResult = this.parseEntitySheet();
            if (!entityResult) {
                return {
                    success: false,
                    errors: this.errors,
                    warnings: this.warnings,
                };
            }

            // Parse all related sheets
            const tasks = this.parseSheet('Tasks', TASK_COLUMNS, TaskRowSchema);
            const licenses = this.parseSheet('Licenses', LICENSE_COLUMNS, LicenseRowSchema);
            const outcomes = this.parseSheet('Outcomes', OUTCOME_COLUMNS, OutcomeRowSchema);
            const releases = this.parseSheet('Releases', RELEASE_COLUMNS, ReleaseRowSchema);
            const tags = this.parseSheet('Tags', TAG_COLUMNS, TagRowSchema);
            const customAttributes = this.parseSheet('Custom Attributes', CUSTOM_ATTRIBUTE_COLUMNS, CustomAttributeRowSchema);
            const telemetryAttributes = this.parseSheet('Telemetry', TELEMETRY_ATTRIBUTE_COLUMNS, TelemetryAttributeRowSchema);

            // Build parsed workbook
            const data: ParsedWorkbook = {
                entityType: this.entityType,
                entity: entityResult,
                tasks: tasks.rows as Array<{ row: number; data: ValidatedTaskRow }>,
                licenses: licenses.rows as Array<{ row: number; data: ValidatedLicenseRow }>,
                outcomes: outcomes.rows as Array<{ row: number; data: ValidatedOutcomeRow }>,
                releases: releases.rows as Array<{ row: number; data: ValidatedReleaseRow }>,
                tags: tags.rows as Array<{ row: number; data: ValidatedTagRow }>,
                customAttributes: customAttributes.rows as Array<{ row: number; data: ValidatedCustomAttributeRow }>,
                telemetryAttributes: telemetryAttributes.rows as Array<{ row: number; data: ValidatedTelemetryAttributeRow }>,
            };

            return {
                success: this.errors.length === 0,
                data,
                errors: this.errors,
                warnings: this.warnings,
            };
        } catch (error) {
            this.addError('Workbook', 0, 'N/A', 'parse', null,
                `Failed to parse workbook: ${error instanceof Error ? error.message : String(error)}`,
                'PARSE_ERROR'
            );
            return {
                success: false,
                errors: this.errors,
                warnings: this.warnings,
            };
        }
    }

    /**
     * Parse the entity sheet (Product Info or Solution Info)
     */
    private parseEntitySheet(): ValidatedProductRow | ValidatedSolutionRow | null {
        const sheetName = this.entityType === 'product' ? 'Product Info' : 'Solution Info';
        const columns = this.entityType === 'product' ? PRODUCT_INFO_COLUMNS : SOLUTION_INFO_COLUMNS;
        const schema = this.entityType === 'product' ? ProductRowSchema : SolutionRowSchema;

        const worksheet = findWorksheet(this.workbook, sheetName);
        if (!worksheet) {
            // Try alternative names
            const altNames = this.entityType === 'product'
                ? ['Product', 'ProductInfo', 'Info']
                : ['Solution', 'SolutionInfo', 'Info'];

            let found = false;
            for (const name of altNames) {
                const ws = findWorksheet(this.workbook, name);
                if (ws) {
                    return this.parseEntityFromWorksheet(ws, columns, schema, name);
                }
            }

            if (!found) {
                this.addError(sheetName, 0, 'N/A', 'sheet', null,
                    `Required sheet "${sheetName}" not found. Available sheets: ${getWorksheetNames(this.workbook).join(', ')}`,
                    'MISSING_SHEET'
                );
                return null;
            }
        }

        return this.parseEntityFromWorksheet(worksheet!, columns, schema, sheetName);
    }

    /**
     * Parse entity data from a worksheet
     */
    private parseEntityFromWorksheet(
        worksheet: ExcelJS.Worksheet,
        columns: typeof PRODUCT_INFO_COLUMNS,
        schema: typeof ProductRowSchema | typeof SolutionRowSchema,
        sheetName: string
    ): ValidatedProductRow | ValidatedSolutionRow | null {
        const rows = parseWorksheetRows(worksheet, columns);

        if (rows.length === 0) {
            this.addError(sheetName, 0, 'N/A', 'data', null,
                `No data found in ${sheetName} sheet`,
                'NO_DATA'
            );
            return null;
        }

        // Use the first row as entity data
        const rawData = rows[0].data;
        const rowNumber = rows[0].rowNumber;

        // Validate with Zod
        const result = schema.safeParse(rawData);
        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = issue.path.join('.');
                this.addError(sheetName, rowNumber, field, field,
                    (rawData as Record<string, unknown>)[field] ?? null,
                    issue.message,
                    'VALIDATION_ERROR'
                );
            }
            return null;
        }

        return result.data as ValidatedProductRow | ValidatedSolutionRow;
    }

    /**
     * Parse a generic sheet
     */
    private parseSheet<T>(
        sheetName: string,
        columns: readonly { key: string; header: string; width: number; required?: boolean; type?: string; enum?: readonly string[]; arraySeparator?: string }[],
        schema: z.ZodSchema<T>
    ): SheetParseResult<T> {
        const result: SheetParseResult<T> = {
            rows: [],
            errors: [],
            warnings: [],
        };

        const worksheet = findWorksheet(this.workbook, sheetName);
        if (!worksheet) {
            // Optional sheets don't generate errors
            this.addWarning(sheetName, 0, undefined,
                `Sheet "${sheetName}" not found, skipping`,
                'MISSING_OPTIONAL_SHEET'
            );
            return result;
        }

        const rows = parseWorksheetRows(worksheet, columns as any[]);

        for (const { rowNumber, data: rawData } of rows) {
            // Validate with Zod
            const validationResult = schema.safeParse(rawData);

            if (validationResult.success) {
                result.rows.push({
                    row: rowNumber,
                    data: validationResult.data,
                });
            } else {
                // Add validation errors
                for (const issue of validationResult.error.issues) {
                    const field = issue.path.join('.');
                    this.addError(sheetName, rowNumber, field, field,
                        (rawData as Record<string, unknown>)[field] ?? null,
                        issue.message,
                        'VALIDATION_ERROR'
                    );
                }
            }
        }

        return result;
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
        const valueStr = value !== undefined && value !== null ? ` (Value: "${value}")` : '';
        this.errors.push({
            sheet,
            row,
            column: column || field,
            field,
            value,
            message: `${message} for column "${column || field}"${valueStr}`,
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

    /**
     * Get the detected entity type
     */
    getEntityType(): EntityType {
        return this.entityType;
    }

    /**
     * Get available worksheet names
     */
    getWorksheetNames(): string[] {
        return getWorksheetNames(this.workbook);
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Parse a workbook from base64-encoded content
 */
export async function parseWorkbookFromBase64(
    base64Content: string,
    entityType?: EntityType
): Promise<ParseResult> {
    const buffer = Buffer.from(base64Content, 'base64');
    const parser = await WorkbookParser.fromBuffer(buffer, entityType);
    return parser.parse();
}

/**
 * Parse a workbook from a Buffer
 */
export async function parseWorkbookFromBuffer(
    buffer: Buffer,
    entityType?: EntityType
): Promise<ParseResult> {
    const parser = await WorkbookParser.fromBuffer(buffer, entityType);
    return parser.parse();
}
