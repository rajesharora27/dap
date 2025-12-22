/**
 * Solution Module Types
 * 
 * TypeScript interfaces and types for the Solution domain.
 */

// ===== Input Types =====

export interface SolutionCreateInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

export interface SolutionUpdateInput {
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

// ===== Service Response Types =====

export interface Solution {
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface SolutionWithRelations extends Solution {
  // Add relations as needed
}

// ===== Connection Types (Relay) =====

export interface SolutionEdge {
  cursor: string;
  node: Solution;
}

export interface SolutionConnection {
  edges: SolutionEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}


// ===== Operation Result Types =====

export interface SolutionDeleteResult {
  success: boolean;
  deletedCount?: number;
  message?: string;
}
