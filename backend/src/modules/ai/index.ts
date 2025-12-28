/**
 * AI Agent Service
 * 
 * Exports for the AI Agent module.
 * 
 * @module services/ai
 * @version 1.1.0
 * @created 2025-12-05
 * @updated 2025-12-08 - Added Phase 4 components (Cache, Audit, Error Handling)
 */

// Main service
export {
  AIAgentService,
  getAIAgentService,
  resetAIAgentService,
} from './AIAgentService';

// Schema Context Manager
export {
  SchemaContextManager,
  getSchemaContextManager,
  resetSchemaContextManager,
} from './SchemaContextManager';

// Data Context Manager (Phase 5 - RAG)
export {
  DataContextManager,
  getDataContextManager,
  resetDataContextManager,
} from './DataContextManager';

export type {
  DataContext,
} from './DataContextManager';

// Query Templates
export {
  QueryTemplates,
  getQueryTemplates,
  resetQueryTemplates,
} from './QueryTemplates';

// Query Executor
export {
  QueryExecutor,
  getQueryExecutor,
  resetQueryExecutor,
} from './QueryExecutor';

export type {
  QueryConfig,
  QueryExecutionResult,
  QueryExecutorOptions,
} from './QueryExecutor';

// RBAC Filter (read-only access control)
export {
  RBACFilter,
  getRBACFilter,
  resetRBACFilter,
} from './RBACFilter';

export type {
  RBACUserContext,
  RBACFilterResult,
} from './RBACFilter';

// Response Formatter
export {
  ResponseFormatter,
  getResponseFormatter,
  resetResponseFormatter,
} from './ResponseFormatter';

export type {
  FormatOptions,
} from './ResponseFormatter';

// Cache Manager (Phase 4.1)
export {
  CacheManager,
  getCacheManager,
  resetCacheManager,
} from './CacheManager';

export type {
  CacheStats,
  CacheConfig,
} from './CacheManager';

// Audit Logger (Phase 4.2)
export {
  AuditLogger,
  getAuditLogger,
  resetAuditLogger,
  generateRequestId,
} from './AuditLogger';

export type {
  AuditLogEntry,
  AuditLoggerConfig,
} from './AuditLogger';

// Error Handler (Phase 4.3)
export {
  ErrorHandler,
  getErrorHandler,
  resetErrorHandler,
  AIErrorType,
  ErrorSeverity,
} from './ErrorHandler';

export type {
  AIError,
  FallbackResult,
  ErrorHandlerConfig,
} from './ErrorHandler';

// Types
export type {
  AIAgentConfig,
  AIQueryRequest,
  AIQueryResponse,
  AIQueryMetadata,
  QueryIntent,
  QueryFilter,
  QueryTemplate,
  ParameterDefinition,
  TemplateMatch,
  LLMProvider,
  TableSchema,
  ColumnSchema,
  RelationshipSchema,
  SchemaContext,
} from './types';

// LLM Providers
export {
  createLLMProvider,
  getDefaultProvider,
  getAvailableProviders,
  getProviderInfo,
  loadLLMConfig,
  clearConfigCache,
  resolveModelAlias,
  getProviderApiKey,
} from './providers';

export type {
  ILLMProvider,
  LLMProviderConfig,
  LLMCompletionResponse,
  LLMCompletionOptions,
  ProviderType,
  LLMConfig,
  CreateProviderConfig,
} from './providers';


// Resolvers
export * from './ai.resolver';
