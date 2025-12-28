/**
 * Documentation Object
 */
export interface DocumentationDoc {
    id: string;
    title: string;
    category: string;
    content: string;
    matchScore?: number;
}

/**
 * Result of a documentation search
 */
export interface DocumentationSearchResult {
    query: string;
    results: DocumentationDoc[];
    totalFound: number;
}

/**
 * RAG Result containing formatted context for LLM
 */
export interface RAGContext {
    contextString: string;
    sourceDocuments: string[]; // List of titles
}
