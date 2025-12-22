export interface Release {
    id?: string;
    name: string;
    level: number;
    description?: string;
    productId?: string;
    solutionId?: string;
    isActive?: boolean;
    customAttrs?: Record<string, any>;
    isNew?: boolean;
    delete?: boolean;
}
