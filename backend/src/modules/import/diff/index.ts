/**
 * Excel Import/Export V2 - Diff Utilities
 */

export const TELEMETRY_ATTRIBUTE_DIFF_FIELDS = [
    'attributeType', 'expectedValue', 'operator', 'isRequired'
];

export const PRODUCT_REF_DIFF_FIELDS = [
    'name', 'order', 'description'
];

export const RESOURCE_DIFF_FIELDS = [
    'label', 'url'
];

export * from './fieldDiff';
