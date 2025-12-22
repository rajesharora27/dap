/**
 * Product Types
 */

export interface Product {
    id: string;
    name: string;
    description?: string;
    statusPercent?: number;
    customAttrs?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductInput {
    name: string;
    description?: string;
    customAttrs?: Record<string, any>;
}

export interface ProductTag {
    id: string;
    productId: string;
    name: string;
    color: string;
    description?: string;
    displayOrder?: number;
}

export interface ProductTagInput {
    productId: string;
    name: string;
    color: string;
    description?: string;
    displayOrder?: number;
}
