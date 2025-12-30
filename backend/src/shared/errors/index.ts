/**
 * Error Handling Module
 * 
 * Provides structured error handling utilities for the DAP application.
 * 
 * @module shared/errors
 * 
 * @example
 * ```typescript
 * import { AppError, ErrorCodes, notFoundError, asyncHandler } from '@shared/errors';
 * 
 * // Throwing structured errors
 * throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid input');
 * throw notFoundError('Product', productId);
 * 
 * // Wrapping async functions
 * const safeHandler = asyncHandler(async () => { ... });
 * ```
 */

export {
  AppError,
  ErrorCodes,
  ErrorStatusCodes,
  type ErrorCode,
  notFoundError,
  validationError,
  authError,
  permissionError,
  duplicateError,
} from './AppError';

export {
  asyncHandler,
  resolverHandler,
  safeExecute,
  withRetry,
} from './asyncHandler';

