export interface License {
    id?: string;
    name: string;
    description?: string;
    level: number;
    isActive: boolean;
    productId?: string;
    solutionId?: string;
    customAttrs?: Record<string, any>;
    isNew?: boolean;
    delete?: boolean;
}

export interface ProductLicense extends License {
    productId: string;
}

export interface SolutionLicense extends License {
    solutionId: string;
}
