/**
 * Excel Import/Export V2 - Parsing Utilities
 * 
 * Common utilities for parsing Excel cells into typed values.
 */

import ExcelJS from 'exceljs';
import { ColumnDefinition } from '../types';

// ============================================================================
// Cell Value Extraction
// ============================================================================

/**
 * Extract a string value from an Excel cell
 */
export function getCellString(cell: ExcelJS.Cell | undefined): string | null {
    if (!cell || cell.value === null || cell.value === undefined) {
        return null;
    }

    // Handle rich text
    if (typeof cell.value === 'object' && 'richText' in cell.value) {
        return (cell.value.richText as Array<{ text: string }>)
            .map(rt => rt.text)
            .join('')
            .trim();
    }

    // Handle formula results
    if (typeof cell.value === 'object' && 'result' in cell.value) {
        return String(cell.value.result ?? '').trim();
    }

    // Handle hyperlinks
    if (typeof cell.value === 'object' && 'text' in cell.value) {
        return String(cell.value.text ?? '').trim();
    }

    return String(cell.value).trim();
}

/**
 * Extract a number value from an Excel cell
 */
export function getCellNumber(cell: ExcelJS.Cell | undefined): number | null {
    if (!cell || cell.value === null || cell.value === undefined) {
        return null;
    }

    // Handle formula results
    let value: unknown = cell.value;
    if (typeof value === 'object' && value !== null && 'result' in value) {
        value = (value as { result: unknown }).result;
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const cleaned = value.trim().replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }

    return null;
}

/**
 * Parse an array from a cell value (comma or newline separated)
 */
export function getCellArray(
    cell: ExcelJS.Cell | undefined,
    separator: string = ','
): string[] {
    const value = getCellString(cell);
    if (!value) {
        return [];
    }

    // Support both newlines and the specified separator
    const splitRegex = separator === '\n'
        ? /[\n\r]+/
        : new RegExp(`[${separator}\\n\\r]+`);

    return value
        .split(splitRegex)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/**
 * Parse a boolean from a cell value
 */
export function getCellBoolean(cell: ExcelJS.Cell | undefined): boolean | null {
    const value = getCellString(cell);
    if (!value) {
        return null;
    }

    const lower = value.toLowerCase();
    if (['true', 'yes', '1', 'y'].includes(lower)) {
        return true;
    }
    if (['false', 'no', '0', 'n'].includes(lower)) {
        return false;
    }
    return null;
}

// ============================================================================
// Header Mapping
// ============================================================================

export interface HeaderMap {
    columnIndexByKey: Map<string, number>;
    keyByColumnIndex: Map<number, string>;
}

/**
 * Build a mapping from column headers to column indices
 */
export function buildHeaderMap(
    worksheet: ExcelJS.Worksheet,
    columns: ColumnDefinition[],
    headerRow: number = 1
): HeaderMap {
    const columnIndexByKey = new Map<string, number>();
    const keyByColumnIndex = new Map<number, string>();

    // Build case-insensitive header lookup
    const headerToKey = new Map<string, string>();
    for (const col of columns) {
        headerToKey.set(col.header.toLowerCase(), col.key);
        // Also map key itself for direct matches
        headerToKey.set(col.key.toLowerCase(), col.key);
    }

    // Read header row
    const row = worksheet.getRow(headerRow);
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const headerValue = getCellString(cell)?.toLowerCase();
        if (headerValue) {
            const key = headerToKey.get(headerValue);
            if (key) {
                columnIndexByKey.set(key, colNumber);
                keyByColumnIndex.set(colNumber, key);
            }
        }
    });

    return { columnIndexByKey, keyByColumnIndex };
}

/**
 * Get a cell value by column key using the header map
 */
export function getCellByKey(
    row: ExcelJS.Row,
    headerMap: HeaderMap,
    key: string
): ExcelJS.Cell | undefined {
    const colIndex = headerMap.columnIndexByKey.get(key);
    if (colIndex === undefined) {
        return undefined;
    }
    return row.getCell(colIndex);
}

// ============================================================================
// Row Parsing
// ============================================================================

export interface ParsedRow<T> {
    rowNumber: number;
    data: T;
    rawData: Record<string, unknown>;
}

/**
 * Parse a single row into a typed object based on column definitions
 */
export function parseRow(
    row: ExcelJS.Row,
    headerMap: HeaderMap,
    columns: ColumnDefinition[]
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const col of columns) {
        const cell = getCellByKey(row, headerMap, col.key);

        switch (col.type) {
            case 'number':
                result[col.key] = getCellNumber(cell);
                break;
            case 'boolean':
                result[col.key] = getCellBoolean(cell);
                break;
            case 'array':
                result[col.key] = getCellArray(cell, col.arraySeparator);
                break;
            case 'string':
            default:
                result[col.key] = getCellString(cell);
                break;
        }
    }

    return result;
}

/**
 * Check if a row is empty (all cells are empty)
 */
export function isRowEmpty(row: ExcelJS.Row): boolean {
    let hasValue = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
        const value = getCellString(cell);
        if (value && value.length > 0) {
            hasValue = true;
        }
    });
    return !hasValue;
}

// ============================================================================
// Sheet Utilities
// ============================================================================

/**
 * Find a worksheet by name (case-insensitive)
 */
export function findWorksheet(
    workbook: ExcelJS.Workbook,
    name: string
): ExcelJS.Worksheet | undefined {
    const lowerName = name.toLowerCase();

    for (const worksheet of workbook.worksheets) {
        if (worksheet.name.toLowerCase() === lowerName) {
            return worksheet;
        }
    }

    // Also try partial matches for common variations
    const variations = [
        lowerName,
        lowerName.replace(/\s+/g, ''),  // Remove spaces
        lowerName.replace(/\s+/g, '_'), // Spaces to underscores
    ];

    for (const worksheet of workbook.worksheets) {
        const worksheetNameLower = worksheet.name.toLowerCase();
        for (const variation of variations) {
            if (worksheetNameLower.includes(variation) || variation.includes(worksheetNameLower)) {
                return worksheet;
            }
        }
    }

    return undefined;
}

/**
 * Get all worksheet names from a workbook
 */
export function getWorksheetNames(workbook: ExcelJS.Workbook): string[] {
    return workbook.worksheets.map(ws => ws.name);
}

/**
 * Parse all data rows from a worksheet (skipping header row)
 */
export function parseWorksheetRows<T>(
    worksheet: ExcelJS.Worksheet,
    columns: ColumnDefinition[],
    headerRow: number = 1
): ParsedRow<T>[] {
    const headerMap = buildHeaderMap(worksheet, columns, headerRow);
    const rows: ParsedRow<T>[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        // Skip header row
        if (rowNumber <= headerRow) {
            return;
        }

        // Skip empty rows
        if (isRowEmpty(row)) {
            return;
        }

        const rawData = parseRow(row, headerMap, columns);
        rows.push({
            rowNumber,
            data: rawData as T,
            rawData,
        });
    });

    return rows;
}
