/**
 * Release Module Types
 * 
 * TypeScript interfaces and types for the Release domain.
 */

// ===== Input Types =====

export interface ReleaseCreateInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

export interface ReleaseUpdateInput {
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

// ===== Service Response Types =====

export interface Release {
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ReleaseWithRelations extends Release {
  // Add relations as needed
}




// ===== Operation Result Types =====

export interface ReleaseDeleteResult {
  success: boolean;
  deletedCount?: number;
  message?: string;
}
