/**
 * AI Agent GraphQL Resolvers
 * 
 * Resolvers for AI-powered natural language queries.
 * 
 * @module schema/resolvers/ai
 * @version 1.1.0
 * @created 2025-12-05
 * @updated 2025-12-08 - Added data context refresh
 */

import { getAIAgentService } from '../../services/ai';
import { Context } from '../../context';

/**
 * AI Query Resolvers
 */
export const AIQueryResolvers = {
  /**
   * Ask the AI agent a natural language question
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
    // Get user info from context
    const userId = ctx.user?.userId || 'anonymous';
    const userRole = ctx.user?.role || 'USER';

    // Log the request (for debugging)
    console.log(`[AI Agent] Query from ${userRole} user ${userId}: "${question.substring(0, 50)}..."`);

    // Get the AI Agent service with prisma client for data context
    const aiService = getAIAgentService(undefined, ctx.prisma);

    // Process the question
    const response = await aiService.processQuestion({
      question,
      userId,
      userRole,
      conversationId,
    });

    // Log the result (for debugging)
    if (response.error) {
      console.log(`[AI Agent] Error: ${response.error}`);
    } else {
      console.log(`[AI Agent] Success: ${response.metadata?.executionTime}ms`);
    }

    return response;
  },
  
  /**
   * Get the AI agent's data context status
   */
  aiDataContextStatus: async (_: any, __: any, ctx: Context) => {
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
    const result = await aiService.refreshDataContext();
    
    console.log(`[AI Agent] Data context refresh result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
  },
};


