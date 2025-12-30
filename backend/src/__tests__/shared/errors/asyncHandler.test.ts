/**
 * Unit tests for asyncHandler utilities
 */

import { AppError, ErrorCodes } from '../../../shared/errors/AppError';
import {
  asyncHandler,
  resolverHandler,
  safeExecute,
  withRetry,
} from '../../../shared/errors/asyncHandler';

describe('asyncHandler', () => {
  it('should pass through successful results', async () => {
    const fn = async (x: number) => x * 2;
    const wrapped = asyncHandler(fn);

    const result = await wrapped(5);
    expect(result).toBe(10);
  });

  it('should pass through AppErrors unchanged', async () => {
    const originalError = new AppError(ErrorCodes.NOT_FOUND, 'Not found');
    const fn = async () => {
      throw originalError;
    };
    const wrapped = asyncHandler(fn);

    await expect(wrapped()).rejects.toBe(originalError);
  });

  it('should wrap regular errors in AppError', async () => {
    const fn = async () => {
      throw new Error('Something went wrong');
    };
    const wrapped = asyncHandler(fn);

    await expect(wrapped()).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    });
  });

  it('should handle functions with multiple arguments', async () => {
    const fn = async (a: number, b: string, c: boolean) => ({ a, b, c });
    const wrapped = asyncHandler(fn);

    const result = await wrapped(1, 'test', true);
    expect(result).toEqual({ a: 1, b: 'test', c: true });
  });
});

describe('resolverHandler', () => {
  const mockContext = { user: { userId: 'user1' } };
  const mockInfo = {};

  it('should pass through successful resolver results', async () => {
    const resolver = async (_: unknown, args: { id: string }) => ({
      id: args.id,
      name: 'Test',
    });
    const wrapped = resolverHandler('testResolver', resolver);

    const result = await wrapped({}, { id: '123' }, mockContext, mockInfo);
    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('should pass through AppErrors with logging', async () => {
    const originalError = new AppError(ErrorCodes.PERMISSION_DENIED, 'Access denied');
    const resolver = async () => {
      throw originalError;
    };
    const wrapped = resolverHandler('testResolver', resolver);

    await expect(wrapped({}, {}, mockContext, mockInfo)).rejects.toBe(originalError);
  });

  it('should wrap unexpected errors', async () => {
    const resolver = async () => {
      throw new TypeError('Unexpected type');
    };
    const wrapped = resolverHandler('testResolver', resolver);

    await expect(wrapped({}, {}, mockContext, mockInfo)).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
    });
  });
});

describe('safeExecute', () => {
  it('should return success result for successful execution', async () => {
    const result = await safeExecute(async () => 'success');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success');
    }
  });

  it('should return error result for failed execution', async () => {
    const result = await safeExecute(async () => {
      throw new Error('Failed');
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INTERNAL_ERROR');
      expect(result.error.message).toBe('Failed');
    }
  });

  it('should preserve AppError in error result', async () => {
    const appError = new AppError(ErrorCodes.NOT_FOUND, 'Not found');
    const result = await safeExecute(async () => {
      throw appError;
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(appError);
    }
  });

  it('should work with complex return types', async () => {
    interface User {
      id: string;
      name: string;
    }

    const result = await safeExecute<User>(async () => ({
      id: '1',
      name: 'Test User',
    }));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('1');
      expect(result.data.name).toBe('Test User');
    }
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt if no error', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      return 'success';
    };

    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(attempts).toBe(1);
  });

  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await withRetry(fn, { maxAttempts: 3, delayMs: 10 });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max attempts exceeded', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('Persistent failure');
    };

    await expect(
      withRetry(fn, { maxAttempts: 3, delayMs: 10 })
    ).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Persistent failure',
    });

    expect(attempts).toBe(3);
  });

  it('should not retry AppErrors by default', async () => {
    let attempts = 0;
    const appError = new AppError(ErrorCodes.NOT_FOUND, 'Not found');
    const fn = async () => {
      attempts++;
      throw appError;
    };

    await expect(
      withRetry(fn, { maxAttempts: 3, delayMs: 10 })
    ).rejects.toBe(appError);

    expect(attempts).toBe(1);
  });

  it('should use custom retryOn function', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('Retryable error');
    };

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        delayMs: 10,
        retryOn: (error) => error instanceof Error && error.message.includes('Retryable'),
      })
    ).rejects.toMatchObject({
      message: 'Retryable error',
    });

    expect(attempts).toBe(3);
  });

  it('should use default options', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('First attempt fails');
      }
      return 'success';
    };

    // Default is 3 attempts, 1000ms delay - use shorter for test
    const result = await withRetry(fn, { delayMs: 10 });

    expect(result).toBe('success');
    expect(attempts).toBe(2);
  });
});

