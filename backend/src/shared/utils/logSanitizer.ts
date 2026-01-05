/**
 * Log Sanitizer Utility
 * 
 * Provides defense-in-depth by automatically redacting sensitive data
 * from log messages before they reach stdout/files.
 * 
 * @security Critical security utility
 * @version 1.0.0
 */

/**
 * Patterns that identify sensitive data to be redacted.
 * Order matters: more specific patterns should come first.
 */
const REDACTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // JWT tokens (must come before generic base64 patterns)
  { 
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 
    replacement: '[JWT_REDACTED]' 
  },
  
  // Database connection strings with credentials
  { 
    pattern: /(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/([^:]+):([^@]+)@/gi, 
    replacement: '$1://$2:[PASSWORD_REDACTED]@' 
  },
  
  // Bearer tokens in headers
  { 
    pattern: /(Bearer\s+)[A-Za-z0-9_\-\.]{20,}/gi, 
    replacement: '$1[TOKEN_REDACTED]' 
  },
  
  // Authorization headers
  { 
    pattern: /(authorization['":\s]+)[A-Za-z0-9_\-\.]{20,}/gi, 
    replacement: '$1[AUTH_REDACTED]' 
  },
  
  // API keys (common formats)
  { 
    pattern: /(api[_-]?key['":\s]+)[A-Za-z0-9_\-]{16,}/gi, 
    replacement: '$1[API_KEY_REDACTED]' 
  },
  
  // Secret keys
  { 
    pattern: /(secret['":\s]+)[A-Za-z0-9_\-]{16,}/gi, 
    replacement: '$1[SECRET_REDACTED]' 
  },
  
  // AWS Access Keys
  { 
    pattern: /AKIA[0-9A-Z]{16}/g, 
    replacement: '[AWS_KEY_REDACTED]' 
  },
  
  // Private key blocks
  { 
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g, 
    replacement: '[PRIVATE_KEY_REDACTED]' 
  },
  
  // Explicit password patterns in JSON or logs
  { 
    pattern: /("?password"?\s*[:=]\s*"?)([^"'\s]{6,})("?)/gi, 
    replacement: '$1[PASSWORD_REDACTED]$3' 
  },
  
  // Known default passwords (case insensitive)
  { 
    pattern: /\b(DAP123|ChangeMe123!|admin123|password123)\b/gi, 
    replacement: '[DEFAULT_PASSWORD_REDACTED]' 
  },
  
  // Credit card numbers (basic pattern)
  { 
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 
    replacement: '[CARD_REDACTED]' 
  },
  
  // SSN patterns
  { 
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g, 
    replacement: '[SSN_REDACTED]' 
  },
];

/**
 * Environment variable names that should never be logged with their values
 */
const SENSITIVE_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'API_KEY',
  'SECRET_KEY',
  'APP_SECRET',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'CISCO_AI_CLIENT_SECRET',
  'CISCO_AI_API_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'GITHUB_TOKEN',
  'DEFAULT_USER_PASSWORD',
];

/**
 * Sanitize a log message by redacting sensitive data
 * 
 * @param message - The message to sanitize (string or object)
 * @returns Sanitized message safe for logging
 * 
 * @example
 * ```typescript
 * sanitizeLog('Connection: postgresql://user:secret123@localhost/db')
 * // Returns: 'Connection: postgresql://user:[PASSWORD_REDACTED]@localhost/db'
 * ```
 */
export function sanitizeLog(message: unknown): string {
  let text: string;
  
  if (typeof message === 'string') {
    text = message;
  } else if (message === null || message === undefined) {
    return String(message);
  } else if (message instanceof Error) {
    text = `${message.name}: ${message.message}${message.stack ? '\n' + message.stack : ''}`;
  } else {
    try {
      text = JSON.stringify(message, null, 2);
    } catch {
      text = String(message);
    }
  }
  
  // Apply all redaction patterns
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  
  return text;
}

/**
 * Sanitize an object by redacting sensitive fields
 * 
 * @param obj - Object to sanitize
 * @param sensitiveFields - Additional field names to redact
 * @returns New object with sensitive fields redacted
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: string[] = []
): T {
  const defaultSensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'authorization',
    'connectionString',
    'connection_string',
    'privateKey',
    'private_key',
  ];
  
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (allSensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, sensitiveFields);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Sanitize environment variables for logging
 * Returns a safe representation with sensitive values redacted
 */
export function sanitizeEnvForLogging(): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) {
      sanitized[key] = '(not set)';
    } else if (SENSITIVE_ENV_VARS.some(s => key.toUpperCase().includes(s))) {
      sanitized[key] = `[REDACTED:${value.length}chars]`;
    } else {
      sanitized[key] = sanitizeLog(value);
    }
  }
  
  return sanitized;
}

/**
 * Create a safe logger wrapper that auto-sanitizes all output
 */
export function createSafeLogger(prefix: string = '') {
  const format = (level: string, ...args: unknown[]) => {
    const sanitizedArgs = args.map(arg => sanitizeLog(arg));
    return `[${prefix}] [${level.toUpperCase()}] ${sanitizedArgs.join(' ')}`;
  };
  
  return {
    debug: (...args: unknown[]) => console.debug(format('debug', ...args)),
    info: (...args: unknown[]) => console.info(format('info', ...args)),
    warn: (...args: unknown[]) => console.warn(format('warn', ...args)),
    error: (...args: unknown[]) => console.error(format('error', ...args)),
  };
}

/**
 * Check if a string contains any potentially sensitive data
 * Useful for validation before logging
 */
export function containsSensitiveData(text: string): boolean {
  for (const { pattern } of REDACTION_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

export default {
  sanitizeLog,
  sanitizeObject,
  sanitizeEnvForLogging,
  createSafeLogger,
  containsSensitiveData,
  SENSITIVE_ENV_VARS,
};

