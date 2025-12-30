/**
 * Async Handler Utilities
 * 
 * Provides utilities for consistent async error handling across resolvers
 * and services.
 * 
 * @module shared/errors/asyncHandler
 */

import { AppError, ErrorCodes } from './AppError';

/**
 * Wrap an async function with consistent error handling.
 * 
 * This wrapper ensures that:
 * 1. AppErrors are passed through unchanged
 * 2. Regular Errors are wrapped in AppError with INTERNAL_ERROR code
 * 3. Unknown errors are converted to AppError
 * 
 * @param fn - Async function to wrap
 * @returns Wrapped function with error handling
 * 
 * @example
 * ```typescript
 * const safeGetProduct = asyncHandler(async (id: string) => {
 *   const product = await prisma.product.findUnique({ where: { id } });
 *   if (!product) throw notFoundError('Product', id);
 *   return product;
 * });
 * 
 * // Now errors are consistently formatted
 * const product = await safeGetProduct(productId);
 * ```
 */
export function asyncHandler<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await fn(...args);
    } catch (error) {
      // AppErrors pass through unchanged
      if (AppError.isAppError(error)) {
        throw error;
      }

      // Log unexpected errors
      console.error('[asyncHandler] Unexpected error:', error);

      // Wrap other errors
      throw AppError.from(error, ErrorCodes.INTERNAL_ERROR);
    }
  };
}

/**
 * Wrap a GraphQL resolver with consistent error handling.
 * 
 * Similar to asyncHandler but includes context logging.
 * 
 * @param resolverName - Name of the resolver for logging
 * @param fn - Resolver function to wrap
 * @returns Wrapped resolver function
 * 
 * @example
 * ```typescript
 * const resolvers = {
 *   Query: {
 *     product: resolverHandler('product', async (_, { id }, context) => {
 *       const product = await ProductService.getById(id);
 *       if (!product) throw notFoundError('Product', id);
 *       return product;
 *     }),
 *   },
 * };
 * ```
 */
export function resolverHandler<TParent, TArgs, TContext, TResult>(
  resolverName: string,
  fn: (parent: TParent, args: TArgs, context: TContext, info: unknown) => Promise<TResult>
): (parent: TParent, args: TArgs, context: TContext, info: unknown) => Promise<TResult> {
  return async (parent, args, context, info): Promise<TResult> => {
    try {
      return await fn(parent, args, context, info);
    } catch (error) {
      // AppErrors pass through with logging
      if (AppError.isAppError(error)) {
        console.warn(`[${resolverName}] AppError:`, error.code, error.message);
        throw error;
      }

      // Log and wrap unexpected errors
      console.error(`[${resolverName}] Unexpected error:`, error);
      throw AppError.from(error, ErrorCodes.INTERNAL_ERROR);
    }
  };
}

/**
 * Execute an operation and return a result object instead of throwing.
 * 
 * Useful for operations where you want to handle errors gracefully
 * without try-catch.
 * 
 * @param fn - Async function to execute
 * @returns Result object with success flag, data, or error
 * 
 * @example
 * ```typescript
 * const result = await safeExecute(async () => {
 *   return await ProductService.getById(id);
 * });
 * 
 * if (result.success) {
 *   console.log('Product:', result.data);
 * } else {
 *   console.log('Error:', result.error.message);
 * }
 * ```
 */
export async function safeExecute<T>(
  fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: AppError.isAppError(error)
        ? error
        : AppError.from(error, ErrorCodes.INTERNAL_ERROR),
    };
  }
}

/**
 * Retry an async operation with exponential backoff.
 * 
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the function
 * @throws AppError if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => externalApi.fetchData(),
 *   { maxAttempts: 3, delayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    retryOn?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryOn = () => true,
  } = options;

  let lastError: unknown;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry AppErrors unless specifically configured
      if (AppError.isAppError(error) && !retryOn(error)) {
        throw error;
      }

      if (attempt < maxAttempts && retryOn(error)) {
        console.warn(`[withRetry] Attempt ${attempt} failed, retrying in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }
  }

  throw AppError.from(lastError, ErrorCodes.INTERNAL_ERROR);
}

