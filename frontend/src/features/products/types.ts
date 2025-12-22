import { License } from '@features/product-licenses';
import { Outcome } from '@features/product-outcomes';
import { Release } from '@features/product-releases';
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
    licenses?: License[];
    outcomes?: Outcome[];
    releases?: Release[];
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
