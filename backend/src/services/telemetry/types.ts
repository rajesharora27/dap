/**
 * Telemetry System Types
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the telemetry system for type safety and documentation.
 */

/**
 * Telemetry data types supported by the system
 */
export enum TelemetryDataType {
  BOOLEAN = 'boolean',
  NUMBER = 'number', 
  STRING = 'string',
  TIMESTAMP = 'timestamp'
}

/**
 * Success criteria types for telemetry evaluation
 */
export enum SuccessCriteriaType {
  BOOLEAN_FLAG = 'boolean_flag',
  NUMBER_THRESHOLD = 'number_threshold', 
  STRING_MATCH = 'string_match',
  TIMESTAMP_COMPARISON = 'timestamp_comparison',
  COMPOSITE_AND = 'composite_and',
  COMPOSITE_OR = 'composite_or'
}

/**
 * Number comparison operators
 */
export enum NumberOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than', 
  EQUALS = 'equals',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal'
}

/**
 * String matching modes
 */
export enum StringMatchMode {
  EXACT = 'exact',
  CONTAINS = 'contains',
  REGEX = 'regex'
}

/**
 * Timestamp comparison modes
 */
export enum TimestampMode {
  BEFORE = 'before',
  AFTER = 'after',
  WITHIN_DAYS = 'within_days'
}

/**
 * Base interface for all success criteria
 */
export interface BaseSuccessCriteria {
  type: SuccessCriteriaType;
  description?: string;
}

/**
 * Boolean flag success criteria
 */
export interface BooleanFlagCriteria extends BaseSuccessCriteria {
  type: SuccessCriteriaType.BOOLEAN_FLAG;
  expectedValue: boolean;
}

/**
 * Number threshold success criteria
 */
export interface NumberThresholdCriteria extends BaseSuccessCriteria {
  type: SuccessCriteriaType.NUMBER_THRESHOLD;
  operator: NumberOperator;
  threshold: number;
}

/**
 * String match success criteria
 */
export interface StringMatchCriteria extends BaseSuccessCriteria {
  type: SuccessCriteriaType.STRING_MATCH;
  mode: StringMatchMode;
  pattern: string;
  caseSensitive?: boolean;
}

/**
 * Timestamp comparison success criteria
 */
export interface TimestampComparisonCriteria extends BaseSuccessCriteria {
  type: SuccessCriteriaType.TIMESTAMP_COMPARISON;
  mode: TimestampMode;
  referenceTime?: string; // ISO string or relative like "now"
  withinDays?: number; // for within_days mode
}

/**
 * Composite AND success criteria
 */
export interface CompositeAndCriteria extends BaseSuccessCriteria {
  type: SuccessCriteriaType.COMPOSITE_AND;
  criteria: SuccessCriteria[];
}

/**
 * Composite OR success criteria
 */
export interface CompositeOrCriteria extends BaseSuccessCriteria {
  type: SuccessCriteriaType.COMPOSITE_OR;
  criteria: SuccessCriteria[];
}

/**
 * Union type for all success criteria
 */
export type SuccessCriteria = 
  | BooleanFlagCriteria
  | NumberThresholdCriteria
  | StringMatchCriteria
  | TimestampComparisonCriteria
  | CompositeAndCriteria
  | CompositeOrCriteria;

/**
 * Telemetry attribute interface
 */
export interface TelemetryAttribute {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  dataType: TelemetryDataType;
  successCriteria?: SuccessCriteria;
  order: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Telemetry value interface
 */
export interface TelemetryValue {
  id: string;
  attributeId: string;
  value: string;
  notes?: string;
  batchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Evaluation result interface
 */
export interface EvaluationResult {
  success: boolean;
  details?: string;
  error?: string;
}

/**
 * Batch telemetry input interface
 */
export interface BatchTelemetryInput {
  batchId: string;
  values: Array<{
    attributeId: string;
    value: string;
    notes?: string;
  }>;
}

/**
 * Telemetry completion summary interface
 */
export interface TelemetryCompletionSummary {
  totalAttributes: number;
  successfulAttributes: number;
  completionPercentage: number;
  isComplete: boolean;
  failedAttributes: Array<{
    id: string;
    name: string;
    reason: string;
  }>;
}