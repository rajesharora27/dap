/**
 * AI Assistant GraphQL Definitions
 * 
 * GraphQL queries and mutations for the AI Assistant feature.
 * 
 * @version 1.1.0
 * @created 2025-12-06
 * @updated 2025-12-09 - Added AI Agent availability check
 */

import { gql } from '@apollo/client';

/**
 * Query to check if the AI Agent is available (requires aiuser account)
 */
export const IS_AI_AGENT_AVAILABLE = gql`
  query IsAIAgentAvailable {
    isAIAgentAvailable {
      available
      message
    }
  }
`;

/**
 * Response type for AI Agent availability check
 */
export interface AIAgentAvailability {
  available: boolean;
  message: string;
}

/**
 * GraphQL response wrapper for availability check
 */
export interface IsAIAgentAvailableResponse {
  isAIAgentAvailable: AIAgentAvailability;
}

/**
 * Query to ask the AI Assistant a question
 */
export const ASK_AI_QUERY = gql`
  query AskAI($question: String!, $conversationId: String) {
    askAI(question: $question, conversationId: $conversationId) {
      answer
      data
      query
      suggestions
      error
      metadata {
        executionTime
        rowCount
        truncated
        cached
        templateUsed
        providerUsed
      }
    }
  }
`;

/**
 * Response type from the AI query
 */
export interface AIQueryResponse {
  answer: string;
  data?: unknown;
  query?: string;
  suggestions?: string[];
  error?: string;
  metadata?: AIQueryMetadata;
}

/**
 * Metadata about the AI query execution
 */
export interface AIQueryMetadata {
  executionTime?: number;
  rowCount?: number;
  truncated?: boolean;
  cached?: boolean;
  templateUsed?: string;
  /** Which AI provider was used (template, openai, gemini, anthropic, cisco, mock, none) */
  providerUsed?: string;
}

/**
 * GraphQL response wrapper
 */
export interface AskAIResponse {
  askAI: AIQueryResponse;
}

/**
 * Variables for the AI query
 */
export interface AskAIVariables {
  question: string;
  conversationId?: string | null;
}
