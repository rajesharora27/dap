/**
 * Application Error Module
 * 
 * Provides structured error handling with error codes for consistent
 * error responses across the application.
 * 
 * @module shared/errors/AppError
 */

/**
 * Error codes for the application.
 * Use these codes for consistent error identification across frontend and backend.
 */
export const ErrorCodes = {
  // ============================================
  // Authentication Errors (1xxx)
  // ============================================
  /** Authentication is required but not provided */
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  /** Provided credentials are invalid */
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  /** JWT token is invalid or malformed */
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  /** JWT token has expired */
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  /** User session has expired or been invalidated */
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  /** User account is inactive/disabled */
  AUTH_USER_INACTIVE: 'AUTH_USER_INACTIVE',
  /** Password change is required */
  AUTH_PASSWORD_CHANGE_REQUIRED: 'AUTH_PASSWORD_CHANGE_REQUIRED',

  // ============================================
  // Authorization Errors (2xxx)
  // ============================================
  /** User does not have permission for this action */
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  /** User does not have the required role */
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  /** Resource is locked by another user */
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // ============================================
  // Validation Errors (3xxx)
  // ============================================
  /** Input validation failed */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Required field is missing */
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  /** Field value is invalid */
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  /** Input format is incorrect */
  INVALID_FORMAT: 'INVALID_FORMAT',

  // ============================================
  // Resource Errors (4xxx)
  // ============================================
  /** Requested resource was not found */
  NOT_FOUND: 'NOT_FOUND',
  /** Resource already exists (duplicate) */
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  /** Resource has been deleted */
  RESOURCE_DELETED: 'RESOURCE_DELETED',
  /** Resource cannot be modified in current state */
  RESOURCE_IMMUTABLE: 'RESOURCE_IMMUTABLE',

  // ============================================
  // Domain-Specific Errors (5xxx)
  // ============================================
  // Product
  /** Product not found */
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  /** Product name already exists */
  PRODUCT_NAME_EXISTS: 'PRODUCT_NAME_EXISTS',
  /** Product has assigned customers */
  PRODUCT_HAS_CUSTOMERS: 'PRODUCT_HAS_CUSTOMERS',

  // Solution
  /** Solution not found */
  SOLUTION_NOT_FOUND: 'SOLUTION_NOT_FOUND',
  /** Solution name already exists */
  SOLUTION_NAME_EXISTS: 'SOLUTION_NAME_EXISTS',
  /** Product already in solution */
  SOLUTION_PRODUCT_EXISTS: 'SOLUTION_PRODUCT_EXISTS',
  /** Solution has assigned customers */
  SOLUTION_HAS_CUSTOMERS: 'SOLUTION_HAS_CUSTOMERS',

  // Customer
  /** Customer not found */
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  /** Product already assigned to customer */
  CUSTOMER_PRODUCT_EXISTS: 'CUSTOMER_PRODUCT_EXISTS',
  /** Solution already assigned to customer */
  CUSTOMER_SOLUTION_EXISTS: 'CUSTOMER_SOLUTION_EXISTS',
  /** Adoption plan not found */
  ADOPTION_PLAN_NOT_FOUND: 'ADOPTION_PLAN_NOT_FOUND',

  // Task
  /** Task not found */
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  /** Task is queued for deletion */
  TASK_QUEUED_FOR_DELETION: 'TASK_QUEUED_FOR_DELETION',

  // Telemetry
  /** Telemetry attribute not found */
  TELEMETRY_ATTR_NOT_FOUND: 'TELEMETRY_ATTR_NOT_FOUND',
  /** Invalid telemetry value */
  TELEMETRY_INVALID_VALUE: 'TELEMETRY_INVALID_VALUE',

  // ============================================
  // System Errors (9xxx)
  // ============================================
  /** Unexpected internal error */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** Database operation failed */
  DATABASE_ERROR: 'DATABASE_ERROR',
  /** External service error */
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  /** Operation timed out */
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  /** Rate limit exceeded */
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/** Type for error codes */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * HTTP status codes mapping for common error types
 */
export const ErrorStatusCodes: Record<string, number> = {
  // Auth errors -> 401
  [ErrorCodes.AUTH_REQUIRED]: 401,
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.AUTH_INVALID_TOKEN]: 401,
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 401,
  [ErrorCodes.AUTH_USER_INACTIVE]: 401,

  // Permission errors -> 403
  [ErrorCodes.PERMISSION_DENIED]: 403,
  [ErrorCodes.ROLE_REQUIRED]: 403,
  [ErrorCodes.RESOURCE_LOCKED]: 423,

  // Validation errors -> 400
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.REQUIRED_FIELD_MISSING]: 400,
  [ErrorCodes.INVALID_FIELD_VALUE]: 400,
  [ErrorCodes.INVALID_FORMAT]: 400,

  // Not found -> 404
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.PRODUCT_NOT_FOUND]: 404,
  [ErrorCodes.SOLUTION_NOT_FOUND]: 404,
  [ErrorCodes.CUSTOMER_NOT_FOUND]: 404,
  [ErrorCodes.TASK_NOT_FOUND]: 404,
  [ErrorCodes.ADOPTION_PLAN_NOT_FOUND]: 404,
  [ErrorCodes.TELEMETRY_ATTR_NOT_FOUND]: 404,

  // Conflict -> 409
  [ErrorCodes.ALREADY_EXISTS]: 409,
  [ErrorCodes.PRODUCT_NAME_EXISTS]: 409,
  [ErrorCodes.SOLUTION_NAME_EXISTS]: 409,
  [ErrorCodes.SOLUTION_PRODUCT_EXISTS]: 409,
  [ErrorCodes.CUSTOMER_PRODUCT_EXISTS]: 409,
  [ErrorCodes.CUSTOMER_SOLUTION_EXISTS]: 409,

  // Server errors -> 500
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCodes.TIMEOUT_ERROR]: 504,
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
};

/**
 * Custom application error class with structured error information.
 * 
 * Use this class to throw consistent, typed errors throughout the application.
 * The error includes a code that can be used by the frontend for i18n and
 * specific error handling.
 * 
 * @example
 * ```typescript
 * // Throwing a not found error
 * throw new AppError(
 *   ErrorCodes.PRODUCT_NOT_FOUND,
 *   `Product with ID ${id} not found`
 * );
 * 
 * // Throwing a validation error with details
 * throw new AppError(
 *   ErrorCodes.VALIDATION_ERROR,
 *   'Invalid input',
 *   400,
 *   { fields: { name: 'Name is required', weight: 'Must be positive' } }
 * );
 * ```
 */
export class AppError extends Error {
  /** Error code for programmatic handling */
  public readonly code: ErrorCode;
  
  /** HTTP status code */
  public readonly statusCode: number;
  
  /** Additional error details */
  public readonly details?: Record<string, unknown>;
  
  /** Timestamp when error occurred */
  public readonly timestamp: string;

  /**
   * Create a new AppError instance.
   * 
   * @param code - Error code from ErrorCodes enum
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code (defaults based on error code)
   * @param details - Additional structured error details
   */
  constructor(
    code: ErrorCode,
    message: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode ?? ErrorStatusCodes[code] ?? 500;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses.
   * 
   * @returns Structured error object
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Create error for GraphQL response.
   * 
   * @returns GraphQL-compatible error object
   */
  toGraphQL(): { message: string; extensions: Record<string, unknown> } {
    return {
      message: this.message,
      extensions: {
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }

  /**
   * Check if an error is an AppError instance.
   * 
   * @param error - Error to check
   * @returns True if error is an AppError
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  /**
   * Create an AppError from an unknown error.
   * Useful for wrapping caught errors.
   * 
   * @param error - Unknown error to wrap
   * @param defaultCode - Default error code if not an AppError
   * @returns AppError instance
   */
  static from(error: unknown, defaultCode: ErrorCode = ErrorCodes.INTERNAL_ERROR): AppError {
    if (AppError.isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(defaultCode, error.message);
    }

    return new AppError(defaultCode, String(error));
  }
}

// ============================================
// Convenience Factory Functions
// ============================================

/**
 * Create a "not found" error for a resource.
 * 
 * @param resourceType - Type of resource (e.g., 'Product', 'Customer')
 * @param identifier - Resource identifier (ID or name)
 * @returns AppError with NOT_FOUND code
 */
export function notFoundError(resourceType: string, identifier: string): AppError {
  const codeMap: Record<string, ErrorCode> = {
    Product: ErrorCodes.PRODUCT_NOT_FOUND,
    Solution: ErrorCodes.SOLUTION_NOT_FOUND,
    Customer: ErrorCodes.CUSTOMER_NOT_FOUND,
    Task: ErrorCodes.TASK_NOT_FOUND,
    AdoptionPlan: ErrorCodes.ADOPTION_PLAN_NOT_FOUND,
  };

  return new AppError(
    codeMap[resourceType] ?? ErrorCodes.NOT_FOUND,
    `${resourceType} not found: ${identifier}`
  );
}

/**
 * Create a validation error with field details.
 * 
 * @param message - Error message
 * @param fields - Object mapping field names to error messages
 * @returns AppError with VALIDATION_ERROR code
 */
export function validationError(
  message: string,
  fields?: Record<string, string>
): AppError {
  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    message,
    400,
    fields ? { fields } : undefined
  );
}

/**
 * Create an authentication error.
 * 
 * @param code - Specific auth error code
 * @param message - Error message
 * @returns AppError with auth code
 */
export function authError(
  code: ErrorCode = ErrorCodes.AUTH_REQUIRED,
  message = 'Authentication required'
): AppError {
  return new AppError(code, message);
}

/**
 * Create a permission denied error.
 * 
 * @param resourceType - Type of resource
 * @param action - Action that was denied
 * @returns AppError with PERMISSION_DENIED code
 */
export function permissionError(resourceType: string, action: string): AppError {
  return new AppError(
    ErrorCodes.PERMISSION_DENIED,
    `You do not have permission to ${action} this ${resourceType.toLowerCase()}`
  );
}

/**
 * Create a duplicate/already exists error.
 * 
 * @param resourceType - Type of resource
 * @param field - Field that is duplicate
 * @param value - Duplicate value
 * @returns AppError with ALREADY_EXISTS code
 */
export function duplicateError(
  resourceType: string,
  field: string,
  value: string
): AppError {
  const codeMap: Record<string, ErrorCode> = {
    Product: ErrorCodes.PRODUCT_NAME_EXISTS,
    Solution: ErrorCodes.SOLUTION_NAME_EXISTS,
  };

  return new AppError(
    codeMap[resourceType] ?? ErrorCodes.ALREADY_EXISTS,
    `${resourceType} with ${field} "${value}" already exists`
  );
}

