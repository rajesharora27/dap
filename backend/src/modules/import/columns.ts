/**
 * Excel Import/Export V2 - Column Definitions
 * 
 * Single source of truth for Excel column structure.
 * Used by BOTH import parsers and export generators to ensure round-trip fidelity.
 */

import { ColumnDefinition, SheetDefinition } from './types';

// ============================================================================
// Product/Solution Info Sheet
// ============================================================================

export const PRODUCT_INFO_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Product Name', width: 40, required: true, type: 'string' },
];

export const SOLUTION_INFO_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Solution Name', width: 40, required: true, type: 'string' },
];

// ============================================================================
// Tasks Sheet
// ============================================================================

export const TASK_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Task Name', width: 40, required: true, type: 'string' },
    { key: 'description', header: 'Description', width: 60, type: 'string' },
    { key: 'weight', header: 'Weight', width: 10, type: 'number' },
    { key: 'sequenceNumber', header: 'Sequence', width: 10, type: 'number' },
    { key: 'estMinutes', header: 'Est. Minutes', width: 15, type: 'number' },
    { key: 'licenseLevel', header: 'License Level', width: 15, type: 'string', enum: ['Essential', 'Advantage', 'Signature'] },
    { key: 'notes', header: 'Notes', width: 60, type: 'string' },
    { key: 'howToDoc', header: 'How To Doc', width: 50, type: 'array', arraySeparator: '\n' },
    { key: 'howToVideo', header: 'How To Video', width: 50, type: 'array', arraySeparator: '\n' },
    { key: 'outcomes', header: 'Outcomes', width: 30, type: 'array', arraySeparator: ',' },
    { key: 'releases', header: 'Releases', width: 30, type: 'array', arraySeparator: ',' },
    { key: 'tags', header: 'Tags', width: 30, type: 'array', arraySeparator: ',' },
];

// ============================================================================
// Licenses Sheet
// ============================================================================

export const LICENSE_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'License Name', width: 30, required: true, type: 'string' },
    { key: 'level', header: 'Level', width: 10, required: true, type: 'number' },
    { key: 'description', header: 'Description', width: 60, type: 'string' },
];

// ============================================================================
// Outcomes Sheet
// ============================================================================

export const OUTCOME_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Outcome Name', width: 40, required: true, type: 'string' },
    { key: 'description', header: 'Description', width: 60, type: 'string' },
];

// ============================================================================
// Releases Sheet
// ============================================================================

export const RELEASE_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Release Name', width: 30, required: true, type: 'string' },
    { key: 'level', header: 'Level', width: 10, required: true, type: 'number' },
    { key: 'description', header: 'Description', width: 60, type: 'string' },
];

// ============================================================================
// Tags Sheet
// ============================================================================

export const TAG_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Tag Name', width: 30, required: true, type: 'string' },
    { key: 'color', header: 'Color', width: 15, type: 'string' },
    { key: 'description', header: 'Description', width: 60, type: 'string' },
];

// ============================================================================
// Custom Attributes Sheet
// ============================================================================

export const CUSTOM_ATTRIBUTE_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'key', header: 'Attribute Key', width: 30, required: true, type: 'string' },
    { key: 'value', header: 'Attribute Value', width: 50, required: true, type: 'string' },
    { key: 'displayOrder', header: 'Display Order', width: 15, type: 'number' },
];

// ============================================================================
// Resources Sheet
// ============================================================================

export const RESOURCE_COLUMNS: ColumnDefinition[] = [
    { key: 'label', header: 'Resource Name', width: 40, required: true, type: 'string' },
    { key: 'url', header: 'URL', width: 60, required: true, type: 'string' },
];

// ============================================================================
// Product References Sheet (for Solutions)
// ============================================================================

export const PRODUCT_REF_COLUMNS: ColumnDefinition[] = [
    { key: 'id', header: 'ID', width: 40, type: 'string', hidden: true },
    { key: 'name', header: 'Product Name', width: 40, required: true, type: 'string' },
    { key: 'order', header: 'Order', width: 10, type: 'number' },
    { key: 'description', header: 'Description', width: 60, type: 'string' },
];

// ============================================================================
// Telemetry Attributes Sheet
// ============================================================================

export const TELEMETRY_ATTRIBUTE_COLUMNS: ColumnDefinition[] = [
    { key: 'taskName', header: 'Task Name', width: 40, required: true, type: 'string' },
    { key: 'attributeName', header: 'Attribute Name', width: 30, required: true, type: 'string' },
    { key: 'attributeType', header: 'Type', width: 15, required: true, type: 'string' },
    { key: 'expectedValue', header: 'Expected Value', width: 30, type: 'string' },
    { key: 'operator', header: 'Operator', width: 15, type: 'string', enum: ['equals', 'contains', 'gt', 'gte', 'lt', 'lte'] },
    { key: 'isRequired', header: 'Required', width: 10, type: 'boolean' },
];

// ============================================================================
// Sheet Definitions (complete workbook structure)
// ============================================================================

export const PRODUCT_WORKBOOK_SHEETS: SheetDefinition[] = [
    { name: 'Product Info', columns: PRODUCT_INFO_COLUMNS },
    { name: 'Tasks', columns: TASK_COLUMNS },
    { name: 'Licenses', columns: LICENSE_COLUMNS },
    { name: 'Outcomes', columns: OUTCOME_COLUMNS },
    { name: 'Releases', columns: RELEASE_COLUMNS },
    { name: 'Tags', columns: TAG_COLUMNS },
    { name: 'Custom Attributes', columns: CUSTOM_ATTRIBUTE_COLUMNS },
    { name: 'Resources', columns: RESOURCE_COLUMNS },
    { name: 'Telemetry', columns: TELEMETRY_ATTRIBUTE_COLUMNS },
    { name: 'Instructions', columns: [] },
];

export const SOLUTION_WORKBOOK_SHEETS: SheetDefinition[] = [
    { name: 'Solution Info', columns: SOLUTION_INFO_COLUMNS },
    { name: 'Products', columns: PRODUCT_REF_COLUMNS },
    { name: 'Tasks', columns: TASK_COLUMNS },
    { name: 'Licenses', columns: LICENSE_COLUMNS },
    { name: 'Outcomes', columns: OUTCOME_COLUMNS },
    { name: 'Releases', columns: RELEASE_COLUMNS },
    { name: 'Tags', columns: TAG_COLUMNS },
    { name: 'Custom Attributes', columns: CUSTOM_ATTRIBUTE_COLUMNS },
    { name: 'Resources', columns: RESOURCE_COLUMNS },
    { name: 'Telemetry', columns: TELEMETRY_ATTRIBUTE_COLUMNS },
    { name: 'Instructions', columns: [] },
];

// ============================================================================
// Utility: Get column index by key
// ============================================================================

export function getColumnIndex(columns: ColumnDefinition[], key: string): number {
    return columns.findIndex(c => c.key === key);
}

// ============================================================================
// Utility: Get column header by key
// ============================================================================

export function getColumnHeader(columns: ColumnDefinition[], key: string): string | undefined {
    return columns.find(c => c.key === key)?.header;
}

// ============================================================================
// Utility: Build header-to-key mapping (for import parsing)
// ============================================================================

export function buildHeaderToKeyMap(columns: ColumnDefinition[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const col of columns) {
        // Map both exact header and lowercase for case-insensitive matching
        map.set(col.header, col.key);
        map.set(col.header.toLowerCase(), col.key);
    }
    return map;
}

// ============================================================================
// Utility: Find sheet by name (case-insensitive)
// ============================================================================

export function findSheetDefinition(
    sheets: SheetDefinition[],
    name: string
): SheetDefinition | undefined {
    const lowerName = name.toLowerCase();
    return sheets.find(s => s.name.toLowerCase() === lowerName);
}
