// Shared type definitions for consistent data structures

export interface License {
    id?: string;
    name: string;
    description: string;
    level: number; // Always number, 1-5
    isActive: boolean;
    productId?: string;
    // Tracking flags for product dialog
    isNew?: boolean;
    delete?: boolean;
}

export interface Outcome {
    id?: string;
    name: string;
    description: string;
    productId?: string;
    solutionId?: string;
    // Tracking flags for product dialog
    isNew?: boolean;
    delete?: boolean;
}

export interface CustomAttribute {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface Release {
    id?: string;
    name: string;
    level: number; // Decimal number representing version (e.g., 1.0, 1.1, 2.0)
    description?: string; // Optional description of the release
    productId?: string;
    solutionId?: string;
    // Tracking flags for product dialog
    isNew?: boolean;
    delete?: boolean;
}

export interface Product {
    id?: string;
    name: string;
    description: string;
    statusPercent?: number;
    customAttrs?: Record<string, any>;
    licenses?: License[];
    outcomes?: Outcome[];
    releases?: Release[];
    requiredLicenseLevel?: number;
}

// Error handling types
export interface ErrorDetails {
    message: string;
    graphQLErrors?: any[];
    networkError?: any;
}

// Operation result types
export interface OperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: ErrorDetails;
}

// Handler options
export interface HandlerOptions {
    refetchProducts?: () => Promise<any>;
    refetchLicenses?: () => Promise<any>;
    refetchOutcomes?: () => Promise<any>;
    showAlert?: boolean;
}