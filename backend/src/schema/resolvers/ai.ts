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
 * Falls back to 'admin' if aiuser doesn't exist.
 */
const AI_USER_USERNAME = 'aiuser';
const ADMIN_USER_USERNAME = 'admin';

/**
 * Cache for AI user lookup to avoid repeated database queries
 */
let aiUserCache: { user: any; source: 'aiuser' | 'admin'; timestamp: number } | null = null;
const AI_USER_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get the user for AI Agent queries with caching
 * Priority: aiuser > admin
 */
async function getAIUser(prisma: any): Promise<{ user: any; source: 'aiuser' | 'admin' } | null> {
  const now = Date.now();
  
  // Return cached user if valid
  if (aiUserCache && (now - aiUserCache.timestamp) < AI_USER_CACHE_TTL) {
    return aiUserCache.user ? { user: aiUserCache.user, source: aiUserCache.source } : null;
  }
  
  // First try to find aiuser
  let user = await prisma.user.findUnique({
    where: { username: AI_USER_USERNAME },
    select: {
      id: true,
      username: true,
      role: true,
      isAdmin: true,
    },
  });
  
  let source: 'aiuser' | 'admin' = 'aiuser';
  
  // If aiuser doesn't exist, fall back to admin
  if (!user) {
    user = await prisma.user.findUnique({
      where: { username: ADMIN_USER_USERNAME },
      select: {
        id: true,
        username: true,
        role: true,
        isAdmin: true,
      },
    });
    source = 'admin';
  }
  
  // Update cache
  aiUserCache = { user, source, timestamp: now };
  
  return user ? { user, source } : null;
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
      const result = await getAIUser(ctx.prisma);
      
      if (!result) {
        return {
          available: false,
          message: 'AI Agent is not available. Neither "aiuser" nor "admin" account exists. Please contact your administrator.',
        };
      }
      
      const usingFallback = result.source === 'admin';
      return {
        available: true,
        message: usingFallback 
          ? 'AI Agent is available (using admin account as fallback). Consider creating a dedicated "aiuser" account.'
          : 'AI Agent is available and ready to use.',
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
    // Get the AI user (aiuser or fallback to admin)
    const result = await getAIUser(ctx.prisma);
    
    if (!result) {
      console.error('[AI Agent] Error: Neither aiuser nor admin exists in database');
      return {
        answer: 'AI Agent is unavailable. Neither "aiuser" nor "admin" account exists in the database. Please contact your administrator.',
        data: null,
        error: 'AI_USER_NOT_FOUND',
        metadata: {
          queryType: 'error',
          executionTime: 0,
          fromCache: false,
        },
      };
    }

    const { user: aiUser, source } = result;

    // Use aiuser (or admin fallback) for query execution (RBAC context)
    // The requesting user's info is logged, but aiuser's permissions are used for data access
    const requestingUserId = ctx.user?.userId || 'anonymous';
    const requestingUserRole = ctx.user?.role || 'USER';

    // Log the request (for debugging)
    console.log(`[AI Agent] Query from ${requestingUserRole} user ${requestingUserId}: "${question.substring(0, 50)}..."`);
    console.log(`[AI Agent] Executing query as ${source} (id: ${aiUser.id}, role: ${aiUser.role}, isAdmin: ${aiUser.isAdmin})`);

    // Get the AI Agent service with prisma client for data context
    const aiService = getAIAgentService(undefined, ctx.prisma);

    // Process the question using aiuser's (or admin's) credentials for RBAC
    const response = await aiService.processQuestion({
      question,
      userId: aiUser.id,
      userRole: aiUser.isAdmin ? 'ADMIN' : (aiUser.role || 'USER'),
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
    // Check if AI user exists (aiuser or admin)
    const result = await getAIUser(ctx.prisma);
    
    if (!result) {
      return {
        lastRefreshedAt: null,
        isRefreshing: false,
        productCount: 0,
        solutionCount: 0,
        customerCount: 0,
        tasksWithoutTelemetryCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        error: 'AI Agent is unavailable - neither aiuser nor admin exists',
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
    
    // Check if AI user exists (aiuser or admin)
    const result = await getAIUser(ctx.prisma);
    if (!result) {
      return {
        success: false,
        lastRefreshed: null,
        statistics: null,
        error: 'AI Agent is unavailable - neither aiuser nor admin account exists'
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


