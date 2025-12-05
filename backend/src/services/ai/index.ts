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

