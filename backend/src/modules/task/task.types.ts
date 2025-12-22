/**
 * Task Module Types
 * 
 * TypeScript interfaces and types for the Task domain.
 */

// ===== Input Types =====

export interface TaskCreateInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

export interface TaskUpdateInput {
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

// ===== Service Response Types =====

export interface Task {
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface TaskWithRelations extends Task {
  // Add relations as needed
}

// ===== Connection Types (Relay) =====

export interface TaskEdge {
  cursor: string;
  node: Task;
}

export interface TaskConnection {
  edges: TaskEdge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  totalCount: number;
}


// ===== Operation Result Types =====

export interface TaskDeleteResult {
  success: boolean;
  deletedCount?: number;
  message?: string;
}
