import { Product } from '@features/products';

export interface Customer {
    id: string;
    name: string;
    description?: string;
    products?: CustomerProduct[];
    solutions?: CustomerSolution[];
}

export interface CustomerProduct {
    id: string;
    name: string;
    product: Product;
    customerSolutionId?: string;
    licenseLevel: string;
    adoptionPlan?: AdoptionPlan;
    selectedOutcomes: any[];
    selectedReleases: any[];
}

export interface CustomerSolution {
    id: string;
    name: string;
    solution: any;
    licenseLevel: string;
    adoptionPlan?: AdoptionPlan;
}

export interface AdoptionPlan {
    id: string;
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
    needsSync?: boolean;
    lastSyncedAt?: string;
}
