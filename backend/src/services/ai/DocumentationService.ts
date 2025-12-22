/**
 * Documentation Service
 * 
 * Provides RAG (Retrieval-Augmented Generation) capabilities for the system documentation.
 * Scans, indexes, and searches markdown documentation to answer user questions about "How-to", 
 * "Setup", "Architecture", etc.
 * 
 * @module services/ai/DocumentationService
 * @version 1.0.0
 * @created 2025-12-22
 */

import * as fs from 'fs';
import * as path from 'path';
import { DocumentationDoc, DocumentationSearchResult, RAGContext } from './doc-types';

/**
 * Documentation Service Class
 */
export class DocumentationService {
    private docsMap: Map<string, DocumentationDoc> = new Map();
    private initialized: boolean = false;
    private readonly DOCS_ROOT = path.resolve(__dirname, '../../../../docs');

    constructor() {
        // Lazy initialization in methods
    }

    /**
     * Initialize the service by indexing documentation
     */
    public initialize(): void {
        if (this.initialized) return;

        console.log(`[DocumentationService] Indexing docs from: ${this.DOCS_ROOT}`);
        try {
            this.scanDirectory(this.DOCS_ROOT);
            console.log(`[DocumentationService] Indexed ${this.docsMap.size} documents.`);
            this.initialized = true;
        } catch (error) {
            console.error('[DocumentationService] Failed to index documentation:', error);
        }
    }

    /**
     * Recursive directory scan
     */
    private scanDirectory(dir: string): void {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                this.scanDirectory(fullPath);
            } else if (file.endsWith('.md')) {
                this.indexFile(fullPath);
            }
        }
    }

    /**
     * Index a single file
     */
    private indexFile(filePath: string): void {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const relativePath = path.relative(this.DOCS_ROOT, filePath);

            // Heuristic for title: First # heading or filename
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md').replace(/_/g, ' ');

            // Simple categorization based on path
            let category = 'General';
            if (relativePath.includes('development/')) category = 'Development';
            if (relativePath.includes('deployment/')) category = 'Deployment';
            if (relativePath.includes('guides/')) category = 'Guides';
            if (relativePath.includes('releases/')) category = 'Releases';

            this.docsMap.set(relativePath, {
                id: relativePath,
                title,
                category,
                content
            });
        } catch (e) {
            console.warn(`[DocumentationService] Error reading file ${filePath}:`, e);
        }
    }

    /**
     * Search documentation using keyword matching/ranking
     */
    public search(query: string, maxResults: number = 3): DocumentationSearchResult {
        if (!this.initialized) this.initialize();

        const normalizedQuery = query.toLowerCase();
        const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

        const results: DocumentationDoc[] = [];

        // Simple TF/IDF-ish ranking (without IDF)
        for (const doc of this.docsMap.values()) {
            let score = 0;
            const lowerContent = doc.content.toLowerCase();
            const lowerTitle = doc.title.toLowerCase();

            // Title matches are worth more
            if (lowerTitle.includes(normalizedQuery)) score += 50;
            queryTerms.forEach(term => {
                if (lowerTitle.includes(term)) score += 10;
            });

            // Content matches
            if (lowerContent.includes(normalizedQuery)) score += 20;
            queryTerms.forEach(term => {
                // Count occurrences (capped)
                const matches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
                score += Math.min(matches, 5);
            });

            if (score > 0) {
                results.push({ ...doc, matchScore: score });
            }
        }

        // Sort by score and slice
        const sortedDetails = results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, maxResults);

        return {
            query,
            results: sortedDetails,
            totalFound: sortedDetails.length
        };
    }

    /**
     * Retrieve RAG context for LLM
     */
    public getRAGContext(query: string): RAGContext {
        const searchResult = this.search(query);

        if (searchResult.totalFound === 0) {
            return { contextString: "No relevant documentation found.", sourceDocuments: [] };
        }

        let contextString = "Relevant Documentation:\n\n";
        const sourceDocuments: string[] = [];

        searchResult.results.forEach(doc => {
            sourceDocuments.push(doc.title);
            contextString += `--- Document: ${doc.title} (Location: ${doc.id}) ---\n`;
            // Truncate content to avoid token limits (rough heuristic: first 2000 chars)
            contextString += doc.content.substring(0, 2000);
            if (doc.content.length > 2000) contextString += "\n...[truncated]...";
            contextString += "\n\n";
        });

        return { contextString, sourceDocuments };
    }
}

// Singleton
let instance: DocumentationService | null = null;
export function getDocumentationService(): DocumentationService {
    if (!instance) {
        instance = new DocumentationService();
    }
    return instance;
}
