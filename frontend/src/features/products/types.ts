import { License } from '@features/product-licenses';
import { Resource } from '@shared/types';
import { Outcome } from '@features/product-outcomes';
import { Release } from '@features/product-releases';
/**
 * Product Types
 */

export interface Product {
    id: string;
    name: string;
    resources?: Resource[];
    statusPercent?: number;
    customAttrs?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
    licenses?: License[];
    outcomes?: Outcome[];
    releases?: Release[];
    tags?: ProductTag[];
    tasks?: {
        edges: Array<{
            node: {
                id: string;
                name: string;
                howToDoc?: string[];
                howToVideo?: string[];
                telemetryAttributes?: Array<{ id: string }>;
                outcomes?: Array<{ id: string; name: string }>;
            }
        }>
    };
}

export interface ProductInput {
    name: string;
    resources?: Resource[];
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
