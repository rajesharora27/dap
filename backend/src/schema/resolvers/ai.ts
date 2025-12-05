/**
 * AI Agent GraphQL Resolvers
 * 
 * Resolvers for AI-powered natural language queries.
 * 
 * @module schema/resolvers/ai
 * @version 1.0.0
 * @created 2025-12-05
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

    // Get the AI Agent service
    const aiService = getAIAgentService();

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
};

/**
 * AI Mutation Resolvers (for future use)
 */
export const AIMutationResolvers = {
  // Future: startAIConversation, clearAIConversations, etc.
};


