/**
 * License Module Types
 * 
 * TypeScript interfaces and types for the License domain.
 */

// ===== Input Types =====

export interface LicenseCreateInput {
  name: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

export interface LicenseUpdateInput {
  name?: string;
  description?: string;
  customAttrs?: Record<string, any>;
}

// ===== Service Response Types =====

export interface License {
  id: string;
  name: string;
  description?: string | null;
  customAttrs?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface LicenseWithRelations extends License {
  // Add relations as needed
}




// ===== Operation Result Types =====

export interface LicenseDeleteResult {
  success: boolean;
  deletedCount?: number;
  message?: string;
}
