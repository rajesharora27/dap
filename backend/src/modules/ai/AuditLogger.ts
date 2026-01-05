/**
 * AI Agent Audit Logger
 * 
 * Logs all AI queries for compliance, debugging, and analytics.
 * Supports multiple output destinations and structured logging.
 * 
 * SECURITY: All log output is sanitized to prevent accidental secret leakage.
 * 
 * @module services/ai/AuditLogger
 * @version 1.1.0
 * @created 2025-12-08
 * @updated 2025-01-05 - Added log sanitization for defense-in-depth
 */

import * as fs from 'fs';
import * as path from 'path';
import { sanitizeLog, sanitizeObject } from '../../shared/utils/logSanitizer';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  /** Unique request ID */
  requestId: string;
  /** Timestamp of the request */
  timestamp: string;
  /** User who made the request */
  userId: string;
  /** User's role */
  userRole: string;
  /** The question asked */
  question: string;
  /** Template matched (if any) */
  templateUsed: string | null;
  /** Whether LLM was used */
  llmUsed: boolean;
  /** LLM provider used (if any) */
  llmProvider: string | null;
  /** Whether the response was cached */
  cached: boolean;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Number of rows returned */
  rowCount: number;
  /** Whether an error occurred */
  hasError: boolean;
  /** Error message (if any) */
  errorMessage: string | null;
  /** Whether access was denied */
  accessDenied: boolean;
  /** IP address (if available) */
  ipAddress: string | null;
  /** User agent (if available) */
  userAgent: string | null;
  /** Conversation ID (if provided) */
  conversationId: string | null;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  /** Whether logging is enabled */
  enabled: boolean;
  /** Log to console */
  logToConsole: boolean;
  /** Log to file */
  logToFile: boolean;
  /** File path for log output */
  filePath: string;
  /** Include query results in logs (may contain sensitive data) */
  includeResults: boolean;
  /** Log level: 'debug' | 'info' | 'warn' | 'error' */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Maximum log file size before rotation (bytes) */
  maxFileSizeBytes: number;
  /** Number of rotated files to keep */
  maxFiles: number;
}

const DEFAULT_CONFIG: AuditLoggerConfig = {
  enabled: true,
  logToConsole: process.env.NODE_ENV === 'development',
  logToFile: process.env.NODE_ENV === 'production',
  filePath: './logs/ai-audit.log',
  includeResults: false,
  logLevel: 'info',
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
};

/**
 * Log levels for filtering
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * AI Audit Logger
 * 
 * Provides comprehensive logging for AI Agent queries including:
 * - Request/response logging
 * - Performance metrics
 * - Error tracking
 * - Access control events
 * - Usage analytics
 * 
 * @example
 * ```typescript
 * const logger = new AuditLogger();
 * 
 * logger.logQuery({
 *   requestId: 'req-123',
 *   timestamp: new Date().toISOString(),
 *   userId: 'user-1',
 *   userRole: 'ADMIN',
 *   question: 'Show all products',
 *   templateUsed: 'list_products',
 *   llmUsed: false,
 *   llmProvider: null,
 *   cached: false,
 *   executionTimeMs: 150,
 *   rowCount: 25,
 *   hasError: false,
 *   errorMessage: null,
 *   accessDenied: false,
 *   ipAddress: '127.0.0.1',
 *   userAgent: 'Mozilla/5.0',
 *   conversationId: null
 * });
 * ```
 */
export class AuditLogger {
  private config: AuditLoggerConfig;
  private logBuffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private currentFileSize: number = 0;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Start flush interval for buffered file logging
    if (this.config.logToFile) {
      this.ensureLogDirectory();
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  /**
   * Log an AI query
   */
  logQuery(entry: AuditLogEntry): void {
    if (!this.config.enabled) {
      return;
    }

    // Always add to buffer for getRecentEntries() and getStats()
    this.logBuffer.push(entry);
    
    // Limit buffer size to prevent memory issues
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }

    // Console logging
    if (this.config.logToConsole) {
      this.logToConsole(entry, 'info');
    }
  }

  /**
   * Log an error
   * SECURITY: Error messages are sanitized to prevent secret leakage
   */
  logError(
    requestId: string,
    userId: string,
    userRole: string,
    question: string,
    error: Error | string,
    context?: Partial<AuditLogEntry>
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // SECURITY: Sanitize error message to prevent accidental secret leakage
    const rawErrorMessage = error instanceof Error ? error.message : String(error);
    const sanitizedErrorMessage = sanitizeLog(rawErrorMessage);

    const entry: AuditLogEntry = {
      requestId,
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      question,
      templateUsed: context?.templateUsed ?? null,
      llmUsed: context?.llmUsed ?? false,
      llmProvider: context?.llmProvider ?? null,
      cached: false,
      executionTimeMs: context?.executionTimeMs ?? 0,
      rowCount: 0,
      hasError: true,
      errorMessage: sanitizedErrorMessage,
      accessDenied: false,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
      conversationId: context?.conversationId ?? null,
    };

    // Always add to buffer for getRecentEntries() and getStats()
    this.logBuffer.push(entry);
    
    // Limit buffer size
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }

    if (this.config.logToConsole) {
      this.logToConsole(entry, 'error');
    }
  }

  /**
   * Log an access denied event
   */
  logAccessDenied(
    requestId: string,
    userId: string,
    userRole: string,
    question: string,
    reason: string,
    context?: Partial<AuditLogEntry>
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const entry: AuditLogEntry = {
      requestId,
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      question,
      templateUsed: context?.templateUsed ?? null,
      llmUsed: false,
      llmProvider: null,
      cached: false,
      executionTimeMs: context?.executionTimeMs ?? 0,
      rowCount: 0,
      hasError: false,
      errorMessage: null,
      accessDenied: true,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
      conversationId: context?.conversationId ?? null,
    };

    // Always add to buffer for getRecentEntries() and getStats()
    this.logBuffer.push(entry);
    
    // Limit buffer size
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }

    if (this.config.logToConsole) {
      this.logToConsole(entry, 'warn');
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    const logLine = this.formatLogLine('debug', message, data);

    if (this.config.logToConsole) {
      console.debug(logLine);
    }

    if (this.config.logToFile) {
      this.appendToFile(logLine);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('info')) {
      return;
    }

    const logLine = this.formatLogLine('info', message, data);

    if (this.config.logToConsole) {
      console.info(logLine);
    }

    if (this.config.logToFile) {
      this.appendToFile(logLine);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, any>): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    const logLine = this.formatLogLine('warn', message, data);

    if (this.config.logToConsole) {
      console.warn(logLine);
    }

    if (this.config.logToFile) {
      this.appendToFile(logLine);
    }
  }

  /**
   * Log an error message
   * SECURITY: Error content is sanitized to prevent secret leakage
   */
  error(message: string, error?: Error | Record<string, any>): void {
    if (!this.shouldLog('error')) {
      return;
    }

    // SECURITY: Sanitize error data to prevent accidental secret leakage
    const data = error instanceof Error
      ? { error: sanitizeLog(error.message), stack: sanitizeLog(error.stack || '') }
      : error ? sanitizeObject(error) : undefined;

    const logLine = this.formatLogLine('error', sanitizeLog(message), data);

    if (this.config.logToConsole) {
      console.error(logLine);
    }

    if (this.config.logToFile) {
      this.appendToFile(logLine);
    }
  }

  /**
   * Check if should log at given level
   */
  private shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    if (!this.config.enabled) {
      return false;
    }

    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.logLevel];
  }

  /**
   * Format an audit entry for console output
   */
  private logToConsole(entry: AuditLogEntry, level: 'info' | 'warn' | 'error'): void {
    const emoji = entry.hasError ? '❌' : entry.accessDenied ? '🚫' : entry.cached ? '📦' : '✅';
    const llmInfo = entry.llmUsed ? ` [LLM: ${entry.llmProvider}]` : '';
    const templateInfo = entry.templateUsed ? ` [Template: ${entry.templateUsed}]` : '';

    const message = `[AI Audit] ${emoji} ${entry.userId}/${entry.userRole}${llmInfo}${templateInfo} - "${entry.question.substring(0, 50)}..." (${entry.executionTimeMs}ms, ${entry.rowCount} rows)`;

    if (level === 'error') {
      console.error(message, entry.errorMessage);
    } else if (level === 'warn') {
      console.warn(message);
    } else {
      console.info(message);
    }
  }

  /**
   * Format a log line
   */
  private formatLogLine(
    level: string,
    message: string,
    data?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [AI Agent] ${message}${dataStr}`;
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    const dir = path.dirname(this.config.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Append a line to the log file
   */
  private appendToFile(line: string): void {
    try {
      fs.appendFileSync(this.config.filePath, line + '\n');
      this.currentFileSize += line.length + 1;

      // Check if rotation needed
      if (this.currentFileSize >= this.config.maxFileSizeBytes) {
        this.rotateLogFile();
      }
    } catch (error) {
      console.error('[AI Audit] Failed to write to log file:', error);
    }
  }

  /**
   * Flush buffered entries to file
   */
  flush(): void {
    if (this.logBuffer.length === 0) {
      return;
    }

    try {
      const lines = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.appendFileSync(this.config.filePath, lines);
      this.currentFileSize += lines.length;
      this.logBuffer = [];

      // Check if rotation needed
      if (this.currentFileSize >= this.config.maxFileSizeBytes) {
        this.rotateLogFile();
      }
    } catch (error) {
      console.error('[AI Audit] Failed to flush log buffer:', error);
    }
  }

  /**
   * Rotate log files
   */
  private rotateLogFile(): void {
    try {
      // Remove oldest file if at max
      const oldestFile = `${this.config.filePath}.${this.config.maxFiles}`;
      if (fs.existsSync(oldestFile)) {
        fs.unlinkSync(oldestFile);
      }

      // Rotate existing files
      for (let i = this.config.maxFiles - 1; i >= 1; i--) {
        const from = `${this.config.filePath}.${i}`;
        const to = `${this.config.filePath}.${i + 1}`;
        if (fs.existsSync(from)) {
          fs.renameSync(from, to);
        }
      }

      // Rotate current file
      if (fs.existsSync(this.config.filePath)) {
        fs.renameSync(this.config.filePath, `${this.config.filePath}.1`);
      }

      this.currentFileSize = 0;
    } catch (error) {
      console.error('[AI Audit] Failed to rotate log file:', error);
    }
  }

  /**
   * Get recent log entries (from buffer)
   */
  getRecentEntries(count: number = 100): AuditLogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Get statistics about logged queries
   */
  getStats(): {
    totalLogged: number;
    bufferedEntries: number;
    errors: number;
    accessDenied: number;
    cachedResponses: number;
    avgExecutionTime: number;
    llmUsage: number;
  } {
    let errors = 0;
    let accessDenied = 0;
    let cached = 0;
    let totalTime = 0;
    let llmUsage = 0;

    for (const entry of this.logBuffer) {
      if (entry.hasError) errors++;
      if (entry.accessDenied) accessDenied++;
      if (entry.cached) cached++;
      if (entry.llmUsed) llmUsage++;
      totalTime += entry.executionTimeMs;
    }

    return {
      totalLogged: this.logBuffer.length,
      bufferedEntries: this.logBuffer.length,
      errors,
      accessDenied,
      cachedResponses: cached,
      avgExecutionTime: this.logBuffer.length > 0 ? totalTime / this.logBuffer.length : 0,
      llmUsage,
    };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AuditLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AuditLoggerConfig {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    this.flush();
  }
}

// Singleton instance
let instance: AuditLogger | null = null;

/**
 * Get the singleton AuditLogger instance
 */
export function getAuditLogger(config?: Partial<AuditLoggerConfig>): AuditLogger {
  if (!instance) {
    instance = new AuditLogger(config);
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetAuditLogger(): void {
  if (instance) {
    instance.destroy();
  }
  instance = null;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

