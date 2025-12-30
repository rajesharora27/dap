/**
 * Unit tests for AppError and error handling utilities
 */

import {
  AppError,
  ErrorCodes,
  ErrorStatusCodes,
  notFoundError,
  validationError,
  authError,
  permissionError,
  duplicateError,
} from '../../../shared/errors/AppError';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an error with code and message', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND, 'Resource not found');

      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('AppError');
      expect(error.timestamp).toBeDefined();
    });

    it('should use default status code from ErrorStatusCodes', () => {
      const authError = new AppError(ErrorCodes.AUTH_REQUIRED, 'Login required');
      expect(authError.statusCode).toBe(401);

      const permError = new AppError(ErrorCodes.PERMISSION_DENIED, 'Access denied');
      expect(permError.statusCode).toBe(403);

      const validationErr = new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid input');
      expect(validationErr.statusCode).toBe(400);
    });

    it('should allow custom status code override', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND, 'Custom status', 410);
      expect(error.statusCode).toBe(410);
    });

    it('should include details when provided', () => {
      const error = new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        400,
        { fields: { name: 'Name is required' } }
      );

      expect(error.details).toEqual({ fields: { name: 'Name is required' } });
    });

    it('should capture stack trace', () => {
      const error = new AppError(ErrorCodes.INTERNAL_ERROR, 'Something went wrong');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError.test.ts');
    });
  });

  describe('toJSON', () => {
    it('should convert error to JSON format', () => {
      const error = new AppError(
        ErrorCodes.PRODUCT_NOT_FOUND,
        'Product xyz not found',
        404,
        { productId: 'xyz' }
      );

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product xyz not found',
          statusCode: 404,
          details: { productId: 'xyz' },
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('toGraphQL', () => {
    it('should convert error to GraphQL format', () => {
      const error = new AppError(ErrorCodes.PERMISSION_DENIED, 'Access denied');

      const gqlError = error.toGraphQL();

      expect(gqlError).toEqual({
        message: 'Access denied',
        extensions: {
          code: 'PERMISSION_DENIED',
          statusCode: 403,
          details: undefined,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND, 'Not found');
      expect(AppError.isAppError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(AppError.isAppError(error)).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(AppError.isAppError('string')).toBe(false);
      expect(AppError.isAppError(null)).toBe(false);
      expect(AppError.isAppError(undefined)).toBe(false);
      expect(AppError.isAppError({})).toBe(false);
    });
  });

  describe('from', () => {
    it('should return same error if already AppError', () => {
      const original = new AppError(ErrorCodes.NOT_FOUND, 'Not found');
      const wrapped = AppError.from(original);
      expect(wrapped).toBe(original);
    });

    it('should wrap regular Error with default code', () => {
      const original = new Error('Something failed');
      const wrapped = AppError.from(original);

      expect(wrapped.code).toBe('INTERNAL_ERROR');
      expect(wrapped.message).toBe('Something failed');
    });

    it('should wrap regular Error with custom code', () => {
      const original = new Error('Database failed');
      const wrapped = AppError.from(original, ErrorCodes.DATABASE_ERROR);

      expect(wrapped.code).toBe('DATABASE_ERROR');
      expect(wrapped.message).toBe('Database failed');
    });

    it('should wrap string error', () => {
      const wrapped = AppError.from('String error message');
      expect(wrapped.code).toBe('INTERNAL_ERROR');
      expect(wrapped.message).toBe('String error message');
    });
  });
});

describe('Error Factory Functions', () => {
  describe('notFoundError', () => {
    it('should create NOT_FOUND error with resource type and id', () => {
      const error = notFoundError('Product', 'abc123');

      expect(error.code).toBe('PRODUCT_NOT_FOUND');
      expect(error.message).toBe('Product not found: abc123');
      expect(error.statusCode).toBe(404);
    });

    it('should use specific codes for known resource types', () => {
      expect(notFoundError('Product', '1').code).toBe('PRODUCT_NOT_FOUND');
      expect(notFoundError('Solution', '1').code).toBe('SOLUTION_NOT_FOUND');
      expect(notFoundError('Customer', '1').code).toBe('CUSTOMER_NOT_FOUND');
      expect(notFoundError('Task', '1').code).toBe('TASK_NOT_FOUND');
      expect(notFoundError('AdoptionPlan', '1').code).toBe('ADOPTION_PLAN_NOT_FOUND');
    });

    it('should use generic NOT_FOUND for unknown resource types', () => {
      const error = notFoundError('Widget', 'xyz');
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('validationError', () => {
    it('should create VALIDATION_ERROR with message', () => {
      const error = validationError('Invalid input');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    it('should include field details when provided', () => {
      const error = validationError('Validation failed', {
        name: 'Name is required',
        email: 'Invalid email format',
      });

      expect(error.details).toEqual({
        fields: {
          name: 'Name is required',
          email: 'Invalid email format',
        },
      });
    });
  });

  describe('authError', () => {
    it('should create auth error with default code and message', () => {
      const error = authError();

      expect(error.code).toBe('AUTH_REQUIRED');
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should allow custom code and message', () => {
      const error = authError(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Your session has expired');

      expect(error.code).toBe('AUTH_TOKEN_EXPIRED');
      expect(error.message).toBe('Your session has expired');
    });
  });

  describe('permissionError', () => {
    it('should create permission denied error', () => {
      const error = permissionError('Product', 'edit');

      expect(error.code).toBe('PERMISSION_DENIED');
      expect(error.message).toBe('You do not have permission to edit this product');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('duplicateError', () => {
    it('should create duplicate error for known resource types', () => {
      const error = duplicateError('Product', 'name', 'Cisco Duo');

      expect(error.code).toBe('PRODUCT_NAME_EXISTS');
      expect(error.message).toBe('Product with name "Cisco Duo" already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should use generic ALREADY_EXISTS for unknown types', () => {
      const error = duplicateError('Widget', 'code', 'ABC');
      expect(error.code).toBe('ALREADY_EXISTS');
    });
  });
});

describe('ErrorCodes', () => {
  it('should have all expected authentication codes', () => {
    expect(ErrorCodes.AUTH_REQUIRED).toBe('AUTH_REQUIRED');
    expect(ErrorCodes.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
    expect(ErrorCodes.AUTH_INVALID_TOKEN).toBe('AUTH_INVALID_TOKEN');
    expect(ErrorCodes.AUTH_TOKEN_EXPIRED).toBe('AUTH_TOKEN_EXPIRED');
  });

  it('should have all expected authorization codes', () => {
    expect(ErrorCodes.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    expect(ErrorCodes.ROLE_REQUIRED).toBe('ROLE_REQUIRED');
  });

  it('should have all expected resource codes', () => {
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
    expect(ErrorCodes.PRODUCT_NOT_FOUND).toBe('PRODUCT_NOT_FOUND');
    expect(ErrorCodes.SOLUTION_NOT_FOUND).toBe('SOLUTION_NOT_FOUND');
    expect(ErrorCodes.CUSTOMER_NOT_FOUND).toBe('CUSTOMER_NOT_FOUND');
  });
});

describe('ErrorStatusCodes', () => {
  it('should map auth errors to 401', () => {
    expect(ErrorStatusCodes[ErrorCodes.AUTH_REQUIRED]).toBe(401);
    expect(ErrorStatusCodes[ErrorCodes.AUTH_INVALID_TOKEN]).toBe(401);
  });

  it('should map permission errors to 403', () => {
    expect(ErrorStatusCodes[ErrorCodes.PERMISSION_DENIED]).toBe(403);
  });

  it('should map not found errors to 404', () => {
    expect(ErrorStatusCodes[ErrorCodes.NOT_FOUND]).toBe(404);
    expect(ErrorStatusCodes[ErrorCodes.PRODUCT_NOT_FOUND]).toBe(404);
  });

  it('should map conflict errors to 409', () => {
    expect(ErrorStatusCodes[ErrorCodes.ALREADY_EXISTS]).toBe(409);
  });

  it('should map internal errors to 500', () => {
    expect(ErrorStatusCodes[ErrorCodes.INTERNAL_ERROR]).toBe(500);
    expect(ErrorStatusCodes[ErrorCodes.DATABASE_ERROR]).toBe(500);
  });
});

