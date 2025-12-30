/**
 * Solution Types
 */

import { Product } from '../products/types';
import { Resource } from '@shared/types';

export interface Solution {
    id: string;
    name: string;
    resources?: Resource[];
    customAttrs?: Record<string, any>;
    products?: Product[];
    createdAt?: string;
    updatedAt?: string;
    releases?: any[];
    licenses?: any[];
    outcomes?: any[];
    tasks?: {
        edges: Array<{
            node: any
        }>
    };
    tags?: SolutionTag[];
}

export interface SolutionInput {
    name: string;
    resources?: Resource[];
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
