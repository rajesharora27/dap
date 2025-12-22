/**
 * Customer Module Types
 * 
 * TypeScript interfaces and types for the Customer domain.
 */

// ===== Input Types =====

export interface CustomerCreateInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

export interface CustomerUpdateInput {
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

// ===== Service Response Types =====

export interface Customer {
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CustomerWithRelations extends Customer {
  // Add relations as needed
}




// ===== Operation Result Types =====

export interface CustomerDeleteResult {
  success: boolean;
  deletedCount?: number;
  message?: string;
}
