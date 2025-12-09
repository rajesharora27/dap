/**
 * AI Agent GraphQL Resolvers
 * 
 * Resolvers for AI-powered natural language queries.
 * All AI queries use ADMIN role for RBAC to provide full read access.
 * Read-only is enforced by the QueryExecutor (only allows findMany, findFirst, etc.)
 * 
 * @module schema/resolvers/ai
 * @version 1.3.0
 * @created 2025-12-05
 * @updated 2025-12-09 - Simplified to always use ADMIN role for full read access
 */

import { getAIAgentService } from '../../services/ai';
import { Context } from '../../context';

/**
 * AI Query Resolvers
 */
export const AIQueryResolvers = {
  /**
   * Check if the AI Agent is available
   * AI Agent is available for any authenticated user
   * 
   * @returns Object with available status and message
   */
  isAIAgentAvailable: async (_: any, __: any, ctx: Context) => {
    try {
      if (!ctx.user) {
        return {
          available: false,
          message: 'AI Agent requires authentication. Please log in to use the AI Assistant.',
        };
      }

      return {
        available: true,
        message: 'AI Agent is available with full database read access.',
      };
    } catch (error: any) {
      console.error('[AI Agent] Error checking availability:', error.message);
      return {
        available: false,
        message: 'AI Agent availability check failed. Please try again later.',
      };
    }
  },

  /**
   * Ask the AI agent a natural language question
   * 
   * All users get full read access via ADMIN role.
   * Read-only is enforced by the QueryExecutor (only allows read operations).
   * 
   * @param _ - Parent (unused)
   * @param args - Query arguments
   * @param ctx - GraphQL context with user info
   * @returns AI query response
   */
  askAI: async (
    _: any,
    { question, conversationId }: { question: string; conversationId?: string },
    ctx: Context
  ) => {
    // Require authentication
    if (!ctx.user) {
      return {
        answer: 'AI Agent requires authentication. Please log in to use the AI Assistant.',
        data: null,
        error: 'AUTH_REQUIRED',
        metadata: {
          queryType: 'error',
          executionTime: 0,
          fromCache: false,
        },
      };
    }

    const userId = ctx.user.userId;
    const userRole = ctx.user.role || 'USER';

    // Log the request
    console.log(`[AI Agent] Query from ${userRole} user ${userId}: "${question.substring(0, 50)}..."`);

    // Get the AI Agent service with prisma client for data context
    const aiService = getAIAgentService(undefined, ctx.prisma);

    // Process the question with ADMIN role for full read access
    // Read-only is enforced by QueryExecutor (only allows findMany, count, etc.)
    const response = await aiService.processQuestion({
      question,
      userId: userId,
      userRole: 'ADMIN',  // Always ADMIN for full read access - read-only enforced by QueryExecutor
      conversationId,
    });

    // Log the result
    if (response.error) {
      console.log(`[AI Agent] Error: ${response.error}`);
    } else {
      console.log(`[AI Agent] Success: ${response.metadata?.executionTime}ms, rows: ${response.metadata?.rowCount || 0}`);
    }

    return response;
  },

  /**
   * Get the AI agent's data context status
   */
  aiDataContextStatus: async (_: any, __: any, ctx: Context) => {
    if (!ctx.user) {
      return {
        initialized: false,
        lastRefreshed: null,
        hasDataContext: false,
      };
    }

    const aiService = getAIAgentService(undefined, ctx.prisma);
    return aiService.getDataContextStatus();
  },
};

/**
 * AI Mutation Resolvers
 */
export const AIMutationResolvers = {
  /**
   * Refresh the AI agent's data context from the database
   * This updates the entity names, statistics, and other metadata
   * used by the LLM for query generation.
   */
  refreshAIDataContext: async (_: any, __: any, ctx: Context) => {
    // Only admins can refresh the data context
    if (ctx.user?.role !== 'ADMIN') {
      return {
        success: false,
        lastRefreshed: null,
        statistics: null,
        error: 'Only administrators can refresh the AI data context'
      };
    }

    console.log(`[AI Agent] Data context refresh requested by ${ctx.user?.userId || 'unknown'}`);

    // Get the AI Agent service with prisma client
    const aiService = getAIAgentService(undefined, ctx.prisma);

    // Refresh the data context
    const refreshResult = await aiService.refreshDataContext();

    console.log(`[AI Agent] Data context refresh result: ${refreshResult.success ? 'SUCCESS' : 'FAILED'}`);

    return refreshResult;
  },
};
