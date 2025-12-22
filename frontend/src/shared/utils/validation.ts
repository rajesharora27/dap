/**
 * Shared Validation Utilities
 */

export const ValidationUtils = {
    validateProduct: (data: any): string[] => {
        const errors: string[] = [];
        if (!data.name || !data.name.trim()) {
            errors.push('Product name is required');
        }
        return errors;
    },

    validateCustomAttribute: (data: any): string[] => {
        const errors: string[] = [];
        if (!data.key || !data.key.trim()) {
            errors.push('Key is required');
        }
        if (data.value === undefined || data.value === null || data.value === '') {
            errors.push('Value is required');
        }
        // Validate JSON for object/array types
        if (data.type === 'object' || data.type === 'array') {
            try {
                JSON.parse(data.value);
            } catch {
                errors.push('Invalid JSON format');
            }
        }
        return errors;
    },

    validateLicense: (data: any): string[] => {
        const errors: string[] = [];
        if (!data.name || !data.name.trim()) {
            errors.push('License name is required');
        }
        if (data.level === undefined || data.level === null || data.level < 1) {
            errors.push('License level must be at least 1');
        }
        return errors;
    },

    validateOutcome: (data: any): string[] => {
        const errors: string[] = [];
        if (!data.name || !data.name.trim()) {
            errors.push('Outcome name is required');
        }
        return errors;
    },

    validateRelease: (data: any): string[] => {
        const errors: string[] = [];
        if (!data.name || !data.name.trim()) {
            errors.push('Release name is required');
        }
        if (data.level === undefined || data.level === null || data.level < 1) {
            errors.push('Release level must be at least 1');
        }
        return errors;
    }
};
