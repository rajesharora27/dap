/**
 * Solution Types
 */

import { Product } from '../products/types';

export interface Solution {
    id: string;
    name: string;
    description?: string;
    customAttrs?: Record<string, any>;
    products?: Product[];
    createdAt?: string;
    updatedAt?: string;
}

export interface SolutionInput {
    name: string;
    description?: string;
    customAttrs?: Record<string, any>;
}

export interface SolutionTag {
    id: string;
    solutionId: string;
    name: string;
    color: string;
    description?: string;
    displayOrder?: number;
}

export interface SolutionTagInput {
    solutionId: string;
    name: string;
    color: string;
    description?: string;
    displayOrder?: number;
}

export interface ProductOrderInput {
    productId: string;
    order: number;
}
