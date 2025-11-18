import { gql } from '@apollo/client';

// Shared GraphQL Mutations
const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_OUTCOME = gql`
  mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
    updateOutcome(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_OUTCOME = gql`
  mutation DeleteOutcome($id: ID!) {
    deleteOutcome(id: $id)
  }
`;

// Utility function for consistent error handling
export const handleError = (error: any): ErrorDetails => {
  const message = error?.message || 'An unexpected error occurred';
  const code = error?.extensions?.code || 'UNKNOWN_ERROR';
  return { message, code };
};

export interface ErrorDetails {
  message: string;
  code: string;
}

// Validation utilities
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

// Handler exports for backward compatibility
export const LicenseHandlers = {
  DELETE_LICENSE: gql`
    mutation DeleteLicense($id: ID!) {
      deleteLicense(id: $id)
    }
  `
};

export const ReleaseHandlers = {
  DELETE_RELEASE
};

export const OutcomeHandlers = {
  CREATE_OUTCOME,
  UPDATE_OUTCOME,
  DELETE_OUTCOME
};

export const ProductHandlers = {
  // Add product-specific handlers here if needed
};

