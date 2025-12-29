/**
 * Product Module Types
 * 
 * TypeScript interfaces and types for the Product domain.
 */

import { z } from 'zod';
import { Resource } from '../common/common.types';

// ===== Input Types =====

export interface ProductCreateInput {
    name: string;
    resources?: Resource[];
    customAttrs?: Record<string, any>;
    licenseIds?: string[];
}

export interface ProductUpdateInput {
    name?: string;
    resources?: Resource[];
    customAttrs?: Record<string, any>;
    licenseIds?: string[];
}

export interface ProductFilters {
    search?: string;
    hasLicenses?: boolean;
    hasTasks?: boolean;
}

// ===== Service Response Types =====

export interface Product {
    id: string;
    name: string;
    resources?: Resource[] | null;
    customAttrs?: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface ProductWithRelations extends Product {
    tasks?: any[];
    licenses?: any[];
    outcomes?: any[];
    releases?: any[];
    solutions?: any[];
    tags?: any[];
}

// ===== Connection Types (Relay) =====

export interface ProductEdge {
    cursor: string;
    node: Product;
}

export interface ProductConnection {
    edges: ProductEdge[];
    pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string;
        endCursor?: string;
    };
    totalCount: number;
}

// ===== Operation Result Types =====

export interface ProductDeleteResult {
    success: boolean;
    deletedCount?: number;
    message?: string;
}
