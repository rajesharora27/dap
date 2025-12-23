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

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    if (typeof value === 'string') {
        if (value.length === 0) return '(empty)';

        // Try to format JSON strings nicely
        if (value.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(value);
                return JSON.stringify(parsed); // Normalized JSON string
            } catch {
                // Not valid JSON, continue
            }
        }

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
 * Compare two values and determine if they are equal
 */
export function isEqual(a: unknown, b: unknown): boolean {
    // Treat null, undefined, and empty string as equivalent for comparison
    const isNoValue = (val: unknown) => val === null || val === undefined || (typeof val === 'string' && val.trim() === '');

    if (isNoValue(a)) {
        return isNoValue(b);
    }
    if (isNoValue(b)) {
        return false;
    }

    // Try parsing JSON strings for deep comparison
    let parsedA = a;
    let parsedB = b;

    if (typeof a === 'string' && a.trim().startsWith('{')) {
        try { parsedA = JSON.parse(a); } catch { }
    }
    if (typeof b === 'string' && b.trim().startsWith('{')) {
        try { parsedB = JSON.parse(b); } catch { }
    }

    // Deep equality for objects (after potential parsing)
    if (typeof parsedA === 'object' && parsedA !== null && typeof parsedB === 'object' && parsedB !== null) {
        // Arrays
        if (Array.isArray(parsedA) && Array.isArray(parsedB)) {
            if (parsedA.length !== parsedB.length) return false;

            // Check if arrays are simple primitives (strings/numbers) -> order insensitive
            const isPrimitiveArray = parsedA.every(i => typeof i !== 'object') && parsedB.every(i => typeof i !== 'object');
            if (isPrimitiveArray) {
                const sortFn = (x: any, y: any) => String(x).localeCompare(String(y));
                const sortedA = [...parsedA].sort(sortFn);
                const sortedB = [...parsedB].sort(sortFn);
                return JSON.stringify(sortedA) === JSON.stringify(sortedB);
            }

            // Complex arrays -> deep compare elements in order
            return parsedA.every((val, idx) => isEqual(val, (parsedB as any[])[idx]));
        }

        // Plain Objects (SuccessCriteria, etc.)
        const keysA = Object.keys(parsedA as object).sort();
        const keysB = Object.keys(parsedB as object).sort();

        // Keys must match exactly (not just count)
        if (keysA.length !== keysB.length) return false;
        if (!keysA.every((k, i) => k === keysB[i])) return false;

        return keysA.every(key => {
            if (key === 'operator') {
                // Relaxed comparison for operators
                const opA = String((parsedA as any)[key]).toLowerCase();
                const opB = String((parsedB as any)[key]).toLowerCase();
                return opA === opB;
            }
            return isEqual((parsedA as any)[key], (parsedB as any)[key]);
        });
    }

    // Primitive comparison
    const norm = (val: unknown) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean') return val.toString(); // "true" vs true
        if (typeof val === 'number') return val.toString();  // 123 vs "123"
        return String(val).trim();
    };

    return norm(parsedA) === norm(parsedB);
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

        // Special case: operator field should be case-insensitive
        if (field === 'operator') {
            const oldOp = String(oldValue ?? '').toLowerCase().trim();
            const newOp = String(newValue ?? '').toLowerCase().trim();
            if (oldOp !== newOp) {
                diffs.push({
                    field,
                    oldValue,
                    newValue,
                    displayOld: formatForDisplay(oldValue),
                    displayNew: formatForDisplay(newValue),
                });
            }
            continue;
        }

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
    'isRequired',
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
