/**
 * AI Agent Types
 * 
 * TypeScript interfaces for the AI Agent service.
 * 
 * @module services/ai/types
 * @version 1.0.0
 * @created 2025-12-05
 */

/**
 * Configuration for the AI Agent service
 */
export interface AIAgentConfig {
  /** LLM provider to use */
  provider: 'openai' | 'anthropic' | 'mock';
  /** Model name (e.g., 'gpt-4o', 'claude-3-sonnet') */
  model: string;
  /** Maximum tokens in response */
  maxTokens: number;
  /** Temperature for response generation (0-1) */
  temperature: number;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum rows to return from queries */
  maxRows: number;
}

/**
 * Request to process a natural language question
 */
export interface AIQueryRequest {
  /** The natural language question */
  question: string;
  /** ID of the user making the request */
  userId: string;
  /** Role of the user (for RBAC filtering) */
  userRole: string;
  /** Optional conversation ID for context */
  conversationId?: string;
}

/**
 * Response from processing a question
 */
export interface AIQueryResponse {
  /** Natural language answer to the question */
  answer: string;
  /** Raw data results (if applicable) */
  data?: any[];
  /** The generated query (for transparency) */
  query?: string;
  /** Suggested follow-up questions */
  suggestions?: string[];
  /** Error message if query failed */
  error?: string;
  /** Query execution metadata */
  metadata?: AIQueryMetadata;
}

/**
 * Metadata about query execution
 */
export interface AIQueryMetadata {
  /** Time to execute query in milliseconds */
  executionTime: number;
  /** Number of rows returned */
  rowCount: number;
  /** Whether results were truncated due to limits */
  truncated: boolean;
  /** Whether response was served from cache */
  cached: boolean;
  /** Which template was used (if any) */
  templateUsed?: string;
}

/**
 * Intent extracted from a natural language question
 */
export interface QueryIntent {
  /** Type of query (list, count, find, compare, etc.) */
  type: 'list' | 'count' | 'find' | 'compare' | 'aggregate' | 'unknown';
  /** Primary entity being queried */
  entity: 'product' | 'solution' | 'customer' | 'task' | 'telemetry' | 'adoption' | 'unknown';
  /** Extracted filters/conditions */
  filters: QueryFilter[];
  /** Extracted parameters */
  parameters: Record<string, any>;
  /** Confidence score (0-1) */
  confidence: number;
  /** Original question */
  originalQuestion: string;
}

/**
 * A filter condition extracted from a question
 */
export interface QueryFilter {
  /** Field to filter on */
  field: string;
  /** Comparison operator */
  operator: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'in' | 'isNull' | 'isNotNull';
  /** Value to compare against */
  value: any;
}

/**
 * A pre-defined query template
 */
export interface QueryTemplate {
  /** Unique template ID */
  id: string;
  /** Human-readable description */
  description: string;
  /** Regex patterns that match this template */
  patterns: RegExp[];
  /** Category for organization */
  category: 'products' | 'solutions' | 'customers' | 'tasks' | 'telemetry' | 'analytics';
  /** Function to build the Prisma query */
  buildQuery: (params: Record<string, any>) => any;
  /** Parameter definitions */
  parameters: ParameterDefinition[];
  /** Example questions that use this template */
  examples: string[];
}

/**
 * Definition of a template parameter
 */
export interface ParameterDefinition {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'date';
  /** Regex to extract value from question */
  extractPattern?: RegExp;
  /** Default value if not extracted */
  defaultValue?: any;
  /** Whether parameter is required */
  required: boolean;
}

/**
 * Result of template matching
 */
export interface TemplateMatch {
  /** Matched template */
  template: QueryTemplate;
  /** Extracted parameters */
  params: Record<string, any>;
  /** Match confidence (0-1) */
  confidence: number;
}

/**
 * LLM Provider interface
 */
export interface LLMProvider {
  /** Provider name */
  name: string;

  /**
   * Complete a prompt with the LLM
   * @param prompt - The prompt to complete
   * @param systemPrompt - Optional system prompt
   * @returns The completion text
   */
  complete(prompt: string, systemPrompt?: string): Promise<string>;

  /**
   * Check if the provider is configured and ready
   * @returns Whether the provider is ready
   */
  isReady(): boolean;
}

/**
 * Schema information for a database table
 */
export interface TableSchema {
  /** Table name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Column definitions */
  columns: ColumnSchema[];
  /** Relationships to other tables */
  relationships: RelationshipSchema[];
}

/**
 * Schema information for a column
 */
export interface ColumnSchema {
  /** Column name */
  name: string;
  /** Data type */
  type: string;
  /** Whether column is nullable */
  nullable: boolean;
  /** Whether column is primary key */
  isPrimaryKey: boolean;
  /** Description */
  description?: string;
  /** Sample values for context */
  sampleValues?: string[];
}

/**
 * Schema information for a relationship
 */
export interface RelationshipSchema {
  /** Relationship name */
  name: string;
  /** Related table */
  relatedTable: string;
  /** Relationship type */
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  /** Foreign key field */
  foreignKey?: string;
  /** Description of the relationship */
  description?: string;
}

/**
 * Full schema context for the LLM
 */
export interface SchemaContext {
  /** All table schemas */
  tables: TableSchema[];
  /** Enum values */
  enums: Record<string, string[]>;
  /** Business rules and notes */
  businessRules: string[];
}


