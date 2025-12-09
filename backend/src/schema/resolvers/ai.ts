/**
 * AI Agent GraphQL Resolvers
 * 
 * Resolvers for AI-powered natural language queries.
 * 
 * @module schema/resolvers/ai
 * @version 1.2.0
 * @created 2025-12-05
 * @updated 2025-12-09 - Added aiuser requirement for query execution
 */

import { getAIAgentService } from '../../services/ai';
import { Context } from '../../context';

/**
 * AI User username - dedicated user for AI Agent queries
 * Falls back to logged-in user if aiuser doesn't exist.
 */
const AI_USER_USERNAME = 'aiuser';

/**
 * Cache for AI user lookup to avoid repeated database queries
 */
let aiUserCache: { user: any; timestamp: number } | null = null;
const AI_USER_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get the dedicated AI user (aiuser) with caching
 * Returns null if aiuser doesn't exist (caller should fall back to logged-in user)
 */
async function getAIUser(prisma: any): Promise<{ user: any } | null> {
  const now = Date.now();

  // Return cached user if valid
  if (aiUserCache && (now - aiUserCache.timestamp) < AI_USER_CACHE_TTL) {
    return aiUserCache.user ? { user: aiUserCache.user } : null;
  }

  // Try to find aiuser
  const user = await prisma.user.findUnique({
    where: { username: AI_USER_USERNAME },
    select: {
      id: true,
      username: true,
      role: true,
      isAdmin: true,
    },
  });

  // Update cache
  aiUserCache = { user, timestamp: now };

  return user ? { user } : null;
}

/**
 * Clear the AI user cache (useful after user creation/deletion)
 */
export function clearAIUserCache(): void {
  aiUserCache = null;
}

/**
 * AI Query Resolvers
 */
export const AIQueryResolvers = {
  /**
   * Check if the AI Agent is available (aiuser or admin exists)
   * 
   * @returns Object with available status and message
   */
  isAIAgentAvailable: async (_: any, __: any, ctx: Context) => {
    try {
      // AI Agent is available if either aiuser exists OR user is logged in
      const aiUserResult = await getAIUser(ctx.prisma);
      const loggedInUser = ctx.user;

      if (aiUserResult) {
        return {
          available: true,
          message: 'AI Agent is available with full database access (using dedicated aiuser account).',
        };
      }

      if (loggedInUser) {
        return {
          available: true,
          message: 'AI Agent is available. Note: Results may be limited based on your permissions. For full access, ask an admin to create an "aiuser" account.',
        };
      }

      return {
        available: false,
        message: 'AI Agent requires authentication. Please log in to use the AI Assistant.',
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
   * Priority: aiuser (full access) > logged-in user (with their permissions)
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
    // Try to get the dedicated aiuser first
    const aiUserResult = await getAIUser(ctx.prisma);
    const loggedInUser = ctx.user;

    // Determine which user context to use for the query
    let queryUserId: string;
    let queryUserRole: string;
    let usingAIUser: boolean;

    if (aiUserResult) {
      // aiuser exists - use it with ADMIN role for full read access
      queryUserId = aiUserResult.user.id;
      queryUserRole = 'ADMIN';  // aiuser always gets full read access
      usingAIUser = true;
      console.log(`[AI Agent] Using aiuser (id: ${queryUserId}) with full read access`);
    } else if (loggedInUser) {
      // Fall back to logged-in user with their actual permissions
      queryUserId = loggedInUser.userId;
      queryUserRole = loggedInUser.role || 'USER';
      usingAIUser = false;
      console.log(`[AI Agent] No aiuser found, using logged-in user (id: ${queryUserId}, role: ${queryUserRole})`);
    } else {
      // No user available
      console.error('[AI Agent] Error: No aiuser and no logged-in user');
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

    // Log the request
    const requestingUserId = loggedInUser?.userId || 'anonymous';
    const requestingUserRole = loggedInUser?.role || 'GUEST';
    console.log(`[AI Agent] Query from ${requestingUserRole} user ${requestingUserId}: "${question.substring(0, 50)}..."`);
    console.log(`[AI Agent] Executing with: userId=${queryUserId}, role=${queryUserRole}, usingAIUser=${usingAIUser}`);

    // Get the AI Agent service with prisma client for data context
    const aiService = getAIAgentService(undefined, ctx.prisma);

    // Process the question
    const response = await aiService.processQuestion({
      question,
      userId: queryUserId,
      userRole: queryUserRole,
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
    // AI Agent works if either aiuser exists OR user is logged in
    const aiUserResult = await getAIUser(ctx.prisma);
    const loggedInUser = ctx.user;

    if (!aiUserResult && !loggedInUser) {
      return {
        lastRefreshedAt: null,
        isRefreshing: false,
        productCount: 0,
        solutionCount: 0,
        customerCount: 0,
        tasksWithoutTelemetryCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        error: 'AI Agent requires authentication',
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


