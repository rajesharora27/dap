export interface Tag {
    id: string;
    name: string;
    color: string;
    description?: string;
    displayOrder?: number;
    productId?: string;
    solutionId?: string;
}

export interface ProductTag extends Tag {
    productId: string;
}

export interface SolutionTag extends Tag {
    solutionId: string;
}
