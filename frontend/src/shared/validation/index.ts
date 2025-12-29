/**
 * Shared Validation Utilities
 */

export const validateProduct = (data: any): string[] => {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) {
        errors.push('Product name is required');
    }
    return errors;
};

export const validateCustomAttribute = (data: any): string[] => {
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
};

export const validateLicense = (data: any): string[] => {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) {
        errors.push('License name is required');
    }
    if (data.level === undefined || data.level === null || data.level < 1) {
        errors.push('License level must be at least 1');
    }
    return errors;
};

export const validateOutcome = (data: any): string[] => {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) {
        errors.push('Outcome name is required');
    }
    return errors;
};

export const validateRelease = (data: any): string[] => {
    const errors: string[] = [];
    if (!data.name || !data.name.trim()) {
        errors.push('Release name is required');
    }
    if (data.level === undefined || data.level === null || data.level < 1) {
        errors.push('Release level must be at least 1');
    }
    return errors;
};

export const validateName = (value: string, label = 'Name'): string[] => {
  const errors: string[] = [];
  if (!value || !value.trim()) {
    errors.push(`${label} is required`);
  }
  return errors;
};

export const validateSequenceNumber = (value: number, label = 'Sequence number'): string[] => {
  const errors: string[] = [];
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    errors.push(`${label} is required`);
  } else if (Number(value) < 1) {
    errors.push(`${label} must be at least 1`);
  }
  return errors;
};

export const validateWeight = (value: number, label = 'Weight'): string[] => {
  const errors: string[] = [];
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    errors.push(`${label} is required`);
  } else if (Number(value) < 0) {
    errors.push(`${label} cannot be negative`);
  }
  return errors;
};

// Legacy support
export const ValidationUtils = {
    validateProduct,
    validateCustomAttribute,
    validateLicense,
    validateOutcome,
  validateRelease,
  validateName,
  validateSequenceNumber,
  validateWeight
};
