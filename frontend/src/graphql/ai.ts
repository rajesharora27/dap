/**
 * AI Assistant GraphQL Definitions
 * 
 * GraphQL queries and mutations for the AI Assistant feature.
 * 
 * @version 1.0.0
 * @created 2025-12-06
 */

import { gql } from '@apollo/client';

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
