export interface CustomAttribute {
    key: string;
    value: any;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface ErrorDetails {
    message: string;
    graphQLErrors?: any[];
    networkError?: any;
}

export interface OperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: ErrorDetails;
}
