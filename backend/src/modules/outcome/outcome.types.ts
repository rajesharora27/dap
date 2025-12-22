/**
 * Outcome Module Types
 * 
 * TypeScript interfaces and types for the Outcome domain.
 */

// ===== Input Types =====

export interface OutcomeCreateInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

export interface OutcomeUpdateInput {
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

// ===== Service Response Types =====

export interface Outcome {
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface OutcomeWithRelations extends Outcome {
  // Add relations as needed
}




// ===== Operation Result Types =====

export interface OutcomeDeleteResult {
  success: boolean;
  deletedCount?: number;
  message?: string;
}
