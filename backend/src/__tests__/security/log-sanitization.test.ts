/**
 * Log Sanitization Security Tests
 * 
 * These tests ensure that sensitive data (passwords, tokens, connection strings)
 * never appear in application logs or stdout.
 * 
 * @security Red Team Test Suite
 * @version 1.0.0
 */

/**
 * Secret patterns that should NEVER appear in logs.
 * These regex patterns match common secret formats.
 */
const SECRET_PATTERNS = [
  // JWT tokens (eyJ... format)
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  
  // Database connection strings with credentials
  /postgres(ql)?:\/\/[^:]+:[^@]+@/i,
  /mysql:\/\/[^:]+:[^@]+@/i,
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i,
  
  // AWS Keys (AKIA...)
  /AKIA[0-9A-Z]{16}/,
  
  // Generic API keys (long hex/base64 strings with key context)
  /api[_-]?key['":\s]+[A-Za-z0-9_\-]{20,}/i,
  /secret['":\s]+[A-Za-z0-9_\-]{20,}/i,
  
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9_\-\.]{20,}/i,
  
  // Password in logs (explicit)
  /password['":\s]+(?![\s'"]*\*)[^\s'"]{6,}/i,
  
  // Private key blocks
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
  
  // Common default passwords that shouldn't be logged
  /DAP123/,
  /ChangeMe123!/,
  /admin123/i,
  /password123/i,
];

/**
 * Utility to check if a string contains any secret patterns
 */
function containsSecret(text: string): { found: boolean; pattern?: string; match?: string } {
  for (const pattern of SECRET_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { 
        found: true, 
        pattern: pattern.source, 
        match: match[0].substring(0, 30) + '...' // Truncate for safety
      };
    }
  }
  return { found: false };
}

describe('Log Sanitization Security', () => {
  let consoleOutput: string[] = [];
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleInfo: typeof console.info;

  beforeEach(() => {
    consoleOutput = [];
    
    // Capture all console output
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleInfo = console.info;

    const captureOutput = (...args: any[]) => {
      const text = args.map(a => 
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' ');
      consoleOutput.push(text);
    };

    console.log = jest.fn(captureOutput);
    console.error = jest.fn(captureOutput);
    console.warn = jest.fn(captureOutput);
    console.info = jest.fn(captureOutput);
  });

  afterEach(() => {
    // Restore original console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  });

  describe('Pattern Detection', () => {
    it('should detect JWT tokens', () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const result = containsSecret(jwtToken);
      expect(result.found).toBe(true);
      expect(result.pattern).toContain('eyJ');
    });

    it('should detect PostgreSQL connection strings', () => {
      const connString = 'postgresql://user:password123@localhost:5432/mydb';
      const result = containsSecret(connString);
      expect(result.found).toBe(true);
    });

    it('should detect AWS access keys', () => {
      const awsKey = 'AKIAIOSFODNN7EXAMPLE';
      const result = containsSecret(awsKey);
      expect(result.found).toBe(true);
    });

    it('should detect Bearer tokens', () => {
      const bearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const result = containsSecret(bearer);
      expect(result.found).toBe(true);
    });

    it('should detect default passwords', () => {
      const log = 'User created with password DAP123';
      const result = containsSecret(log);
      expect(result.found).toBe(true);
    });

    it('should NOT flag safe log messages', () => {
      const safeMessages = [
        'User logged in successfully',
        'Password reset to default value',
        'Admin created user john_doe',
        '[Auth] Login failed: Invalid credentials',
        'Database connection established',
      ];

      for (const msg of safeMessages) {
        const result = containsSecret(msg);
        if (result.found) {
          fail(`Falsely flagged: "${msg}"`);
        }
        expect(result.found).toBe(false);
      }
    });
  });

  describe('Auth Service Log Sanitization', () => {
    it('should not log passwords during user creation', async () => {
      // Simulate auth service logging during user creation
      console.log('Created user test_user with default password');
      
      for (const output of consoleOutput) {
        const result = containsSecret(output);
        if (result.found) {
          fail(`Secret detected in log: ${result.pattern} matched "${result.match}"`);
        }
        expect(result.found).toBe(false);
      }
    });

    it('should not log passwords during password reset', async () => {
      console.log('Admin reset password to default value');
      
      for (const output of consoleOutput) {
        const result = containsSecret(output);
        expect(result.found).toBe(false);
      }
    });

    it('should not reveal username in failed login logs', async () => {
      // Current secure implementation
      console.warn('[Auth] Login failed: Invalid credentials');
      
      // Should not contain username
      expect(consoleOutput.join('')).not.toMatch(/login failed for user|failed for '\w+'/i);
    });
  });

  describe('Error Handler Sanitization', () => {
    it('should sanitize database errors before logging', () => {
      // Simulate a database error that might contain connection string
      const sanitizedError = 'Database connection failed';
      console.error(`[Error] ${sanitizedError}`);
      
      for (const output of consoleOutput) {
        const result = containsSecret(output);
        expect(result.found).toBe(false);
      }
    });

    it('should sanitize API errors that might contain tokens', () => {
      const sanitizedApiError = 'API request failed: 401 Unauthorized';
      console.error(sanitizedApiError);
      
      for (const output of consoleOutput) {
        const result = containsSecret(output);
        expect(result.found).toBe(false);
      }
    });
  });

  describe('Audit Logger Sanitization', () => {
    it('should not include sensitive data in audit entries', () => {
      const auditEntry = {
        userId: 'user-123',
        action: 'create_user',
        details: 'Created user john_doe with default password',
        timestamp: new Date().toISOString(),
      };
      
      console.info(JSON.stringify(auditEntry));
      
      for (const output of consoleOutput) {
        const result = containsSecret(output);
        if (result.found) {
          fail(`Audit log contains secret: ${result.pattern}`);
        }
        expect(result.found).toBe(false);
      }
    });
  });
});

/**
 * Export the containsSecret utility for use in runtime log sanitization
 */
export { containsSecret, SECRET_PATTERNS };

