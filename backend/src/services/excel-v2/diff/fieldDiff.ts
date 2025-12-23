/**
 * Excel Import/Export V2 - Field Diff Utilities
 * 
 * Generate field-level diffs for update previews.
 */

import { FieldDiff } from '../types';

// ============================================================================
// Diff Generation
// ============================================================================

/**
 * Compare two values and determine if they are equal
 */
export function isEqual(a: unknown, b: unknown): boolean {
    // Handle null/undefined
    if (a === null || a === undefined) {
        return b === null || b === undefined;
    }
    if (b === null || b === undefined) {
        return false;
    }

    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((val, index) => isEqual(val, b[index]));
    }

    // Handle objects
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a as object);
        const keysB = Object.keys(b as object);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key =>
            isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        );
    }

    // Primitive comparison
    return a === b;
}

/**
 * Format a value for display
 */
export function formatForDisplay(value: unknown): string {
    if (value === null || value === undefined) {
        return '(empty)';
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return '(none)';
        if (value.length <= 3) {
            return value.join(', ');
        }
        return `${value.slice(0, 3).join(', ')} (+${value.length - 3} more)`;
    }

    if (typeof value === 'string') {
        if (value.length === 0) return '(empty)';
        if (value.length > 50) {
            return `"${value.substring(0, 47)}..."`;
        }
        return `"${value}"`;
    }

    if (typeof value === 'number') {
        return String(value);
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return String(value);
}

/**
 * Generate diffs for all changed fields between existing and incoming data
 */
export function generateFieldDiffs(
    existing: Record<string, unknown>,
    incoming: Record<string, unknown>,
    fieldsToCompare: string[]
): FieldDiff[] {
    const diffs: FieldDiff[] = [];

    for (const field of fieldsToCompare) {
        const oldValue = existing[field];
        const newValue = incoming[field];

        if (!isEqual(oldValue, newValue)) {
            diffs.push({
                field,
                oldValue,
                newValue,
                displayOld: formatForDisplay(oldValue),
                displayNew: formatForDisplay(newValue),
            });
        }
    }

    return diffs;
}

// ============================================================================
// Entity-Specific Fields
// ============================================================================

export const PRODUCT_DIFF_FIELDS = [
    'name',
    'description',
];

export const SOLUTION_DIFF_FIELDS = [
    'name',
    'description',
    'linkedProducts',
];

export const TASK_DIFF_FIELDS = [
    'name',
    'description',
    'weight',
    'sequenceNumber',
    'estMinutes',
    'licenseLevel',
    'notes',
    'howToDoc',
    'howToVideo',
    'outcomes',
    'releases',
    'tags',
];

export const LICENSE_DIFF_FIELDS = [
    'name',
    'level',
    'description',
];

export const OUTCOME_DIFF_FIELDS = [
    'name',
    'description',
];

export const RELEASE_DIFF_FIELDS = [
    'name',
    'level',
    'description',
];

export const TAG_DIFF_FIELDS = [
    'name',
    'color',
    'description',
];

export const CUSTOM_ATTRIBUTE_DIFF_FIELDS = [
    'key',
    'value',
    'displayOrder',
];

export const TELEMETRY_ATTRIBUTE_DIFF_FIELDS = [
    'taskName',
    'attributeName',
    'attributeType',
    'expectedValue',
    'operator',
    'apiEndpoint',
];

// ============================================================================
// Array Diff Utilities
// ============================================================================

export interface ArrayDiff<T> {
    added: T[];
    removed: T[];
    unchanged: T[];
}

/**
 * Compare two arrays and return added, removed, and unchanged items
 */
export function diffArrays<T>(existing: T[], incoming: T[]): ArrayDiff<T> {
    const existingSet = new Set(existing);
    const incomingSet = new Set(incoming);

    return {
        added: incoming.filter(item => !existingSet.has(item)),
        removed: existing.filter(item => !incomingSet.has(item)),
        unchanged: existing.filter(item => incomingSet.has(item)),
    };
}

/**
 * Format an array diff for display
 */
export function formatArrayDiff<T>(diff: ArrayDiff<T>): string {
    const parts: string[] = [];

    if (diff.added.length > 0) {
        parts.push(`+${diff.added.length} added`);
    }
    if (diff.removed.length > 0) {
        parts.push(`-${diff.removed.length} removed`);
    }
    if (parts.length === 0) {
        return 'No changes';
    }

    return parts.join(', ');
}
