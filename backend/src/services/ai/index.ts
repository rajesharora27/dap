/**
 * AI Agent Service
 * 
 * Exports for the AI Agent module.
 * 
 * @module services/ai
 * @version 1.0.0
 * @created 2025-12-05
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

