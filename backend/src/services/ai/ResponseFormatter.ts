/**
 * Response Formatter for AI Agent
 * 
 * Formats query results into human-readable responses with
 * markdown formatting, summary statistics, and follow-up suggestions.
 * 
 * @module services/ai/ResponseFormatter
 * @version 1.0.0
 * @created 2025-12-06
 */

import { AIQueryResponse, AIQueryMetadata, QueryTemplate, TemplateMatch } from './types';
import { QueryExecutionResult } from './QueryExecutor';

/**
 * Options for formatting responses
 */
export interface FormatOptions {
    /** Maximum items to show in preview */
    maxPreviewItems?: number;
    /** Include raw data in response */
    includeRawData?: boolean;
    /** Include query config in response */
    includeQuery?: boolean;
    /** Format style: 'detailed' | 'compact' | 'table' */
    style?: 'detailed' | 'compact' | 'table';
}

/**
 * Default format options
 */
const DEFAULT_OPTIONS: Required<FormatOptions> = {
    maxPreviewItems: 5,
    includeRawData: true,
    includeQuery: true,
    style: 'detailed',
};

/**
 * Category-specific formatting configuration
 */
const CATEGORY_CONFIG: Record<string, {
    emoji: string;
    singular: string;
    plural: string;
    keyFields: string[];
}> = {
    products: {
        emoji: '📦',
        singular: 'product',
        plural: 'products',
        keyFields: ['name', 'description', 'tasks'],
    },
    solutions: {
        emoji: '🧩',
        singular: 'solution',
        plural: 'solutions',
        keyFields: ['name', 'description', 'products'],
    },
    customers: {
        emoji: '👥',
        singular: 'customer',
        plural: 'customers',
        keyFields: ['name', 'description', 'adoptionPlan'],
    },
    tasks: {
        emoji: '✅',
        singular: 'task',
        plural: 'tasks',
        keyFields: ['name', 'description', 'weight', 'telemetryAttributes'],
    },
    telemetry: {
        emoji: '📊',
        singular: 'telemetry attribute',
        plural: 'telemetry attributes',
        keyFields: ['name', 'successCriteria'],
    },
    analytics: {
        emoji: '📈',
        singular: 'metric',
        plural: 'metrics',
        keyFields: ['count', 'total', 'average'],
    },
};

/**
 * Response Formatter
 * 
 * Formats AI query results into human-readable markdown responses.
 * 
 * @example
 * ```typescript
 * const formatter = new ResponseFormatter();
 * const response = formatter.formatSuccess(match, result, startTime);
 * console.log(response.answer); // Markdown formatted answer
 * ```
 */
export class ResponseFormatter {
    private options: Required<FormatOptions>;

    constructor(options: FormatOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Format a successful query result
     */
    formatSuccess(
        match: TemplateMatch,
        result: QueryExecutionResult,
        executionTimeMs: number,
        queryConfig?: any
    ): AIQueryResponse {
        const template = match.template;
        const confidence = Math.round(match.confidence * 100);
        const config = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.products;

        let answer = this.formatHeader(template, result, confidence);
        answer += this.formatBody(result, config, template.category);
        answer += this.formatFooter(result);

        // Strictly sanitize raw data to remove ALL IDs
        const cleanData = this.options.includeRawData ? this.sanitizeData(result.data, template.category) : undefined;

        return {
            answer,
            data: cleanData,
            query: this.options.includeQuery && queryConfig ? JSON.stringify(queryConfig, null, 2) : undefined,
            suggestions: this.generateSuggestions(template, result),
            metadata: {
                executionTime: executionTimeMs,
                rowCount: result.rowCount,
                truncated: result.truncated,
                cached: false,
                templateUsed: template.id,
            },
        };
    }

    /**
     * Recursively remove IDs from data object
     */
    private sanitizeData(data: any, category: string = 'general'): any {
        if (!data) return data;

        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item, category));
        }

        if (typeof data === 'object') {
            const clean: any = {};

            // Inject _type for frontend navigation if we have an ID and a valid category
            if (data.id && category && category !== 'general') {
                clean._type = category;
            } else if (data.id) {
                // Try to infer type if category is general
                const inferred = this.inferLinkCategory(category, data);
                if (inferred && inferred !== 'general') {
                    clean._type = inferred;
                }
            }

            for (const [key, value] of Object.entries(data)) {
                // Remove foreign key ID fields and other unwanted system fields
                // BUT keep the primary 'id' field for navigation purposes
                const lowerKey = key.toLowerCase();
                if (
                    // Remove foreign keys (productId, solutionId, etc.) but keep 'id'
                    (lowerKey.endsWith('id') && lowerKey !== 'id') ||
                    lowerKey === 'completedat' ||
                    lowerKey === 'completedreason' ||
                    lowerKey === 'softdeletequeued' ||
                    lowerKey === 'rawtelemetrymapping' ||
                    lowerKey === 'deletedat'
                ) {
                    continue;
                }
                // Recursively sanitize, but reset category for nested objects to prevent mislabeling
                clean[key] = this.sanitizeData(value, 'general');
            }
            return clean;
        }

        return data;
    }

    /**
     * Format a failed query result
     */
    formatError(
        template: QueryTemplate,
        error: string,
        executionTimeMs: number
    ): AIQueryResponse {
        const answer = `❌ **Query Failed**\n\n` +
            `**Template:** ${template.description}\n` +
            `**Error:** ${error}\n\n` +
            `Please try a different question or contact support if the issue persists.`;

        return {
            answer,
            error,
            suggestions: this.getErrorSuggestions(template.category),
            metadata: {
                executionTime: executionTimeMs,
                rowCount: 0,
                truncated: false,
                cached: false,
                templateUsed: template.id,
            },
        };
    }

    /**
     * Format access denied response
     */
    formatAccessDenied(
        template: QueryTemplate,
        userRole: string,
        roleRestrictions: string,
        executionTimeMs: number
    ): AIQueryResponse {
        const answer = `🔒 **Access Denied**\n\n` +
            `You do not have permission to access this data.\n\n` +
            `Your role (**${userRole}**): ${roleRestrictions}`;

        return {
            answer,
            suggestions: this.getAccessDeniedSuggestions(template.category, userRole),
            metadata: {
                executionTime: executionTimeMs,
                rowCount: 0,
                truncated: false,
                cached: false,
                templateUsed: template.id,
            },
        };
    }

    /**
     * Format no template match response
     */
    formatNoMatch(
        question: string,
        suggestions: string[],
        executionTimeMs: number
    ): AIQueryResponse {
        let answer = `🔍 I couldn't find an exact match for your question:\n`;
        answer += `> "${question}"\n\n`;
        answer += `**Current Capabilities:**\n`;
        answer += `I can answer questions about:\n`;
        answer += `• 📦 Products and their telemetry\n`;
        answer += `• 👥 Customers and adoption progress\n`;
        answer += `• ✅ Tasks and their attributes\n`;
        answer += `• 📈 Counts and summaries\n\n`;
        answer += `Try one of the suggestions below, or rephrase your question.`;

        return {
            answer,
            suggestions,
            metadata: {
                executionTime: executionTimeMs,
                rowCount: 0,
                truncated: false,
                cached: false,
            },
        };
    }

    /**
     * Format the response header
     */
    private formatHeader(
        template: QueryTemplate,
        result: QueryExecutionResult,
        confidence: number
    ): string {
        const config = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.products;

        let header = `✅ **${template.description}**\n\n`;
        header += `**Query executed in ${result.executionTimeMs}ms** (${confidence}% match)\n\n`;

        return header;
    }

    /**
     * Format the response body based on data type
     */
    private formatBody(
        result: QueryExecutionResult,
        config: typeof CATEGORY_CONFIG[string],
        category: string
    ): string {
        const { data } = result;

        // Handle object result (e.g., aggregate counts)
        if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
            return this.formatObjectResult(data);
        }

        // Handle array result
        if (Array.isArray(data)) {
            return this.formatArrayResult(data, result, config, category);
        }

        // Handle count/number result
        if (typeof data === 'number') {
            return `**Count:** ${data.toLocaleString()}\n`;
        }

        // Handle null/empty
        if (data === null || data === undefined) {
            return `📭 **No results found.**\n`;
        }

        // Handle single object
        return `**Result:**\n${this.formatDataItem(data, category)}\n`;
    }

    /**
     * Format an object result (key-value pairs)
     */
    private formatObjectResult(data: Record<string, any>): string {
        let result = `**Results:**\n`;

        for (const [key, value] of Object.entries(data)) {
            const formattedKey = this.formatEntityName(key);
            const formattedValue = typeof value === 'number'
                ? value.toLocaleString()
                : String(value);
            result += `- ${formattedKey}: **${formattedValue}**\n`;
        }

        return result;
    }

    /**
     * Format an array result
     */
    private formatArrayResult(
        data: any[],
        result: QueryExecutionResult,
        config: typeof CATEGORY_CONFIG[string],
        category: string
    ): string {
        if (data.length === 0) {
            return `📭 **No ${config.plural} found.**\n\n` +
                `No ${config.plural} match your criteria.\n`;
        }

        let output = `${config.emoji} **Found ${result.rowCount.toLocaleString()} ${result.rowCount === 1 ? config.singular : config.plural}**`;

        if (result.truncated) {
            output += ` (showing first ${data.length})`;
        }
        output += `\n\n`;

        // Format preview items
        const previewCount = Math.min(data.length, this.options.maxPreviewItems);

        if (this.options.style === 'table' && data.length > 0) {
            output += this.formatAsTable(data.slice(0, previewCount), config.keyFields, category);
        } else {
            for (let i = 0; i < previewCount; i++) {
                output += this.formatDataItem(data[i], category);
            }
        }

        if (data.length > previewCount) {
            output += `\n_...and ${data.length - previewCount} more. See the **full table below** for complete data._\n`;
        }

        return output;
    }

    /**
     * Format data as a markdown table
     */
    private formatAsTable(data: any[], keyFields: string[], category: string = 'general'): string {
        if (data.length === 0) return '';

        // Determine columns from first item or keyFields
        const firstItem = data[0];

        // Define columns to explicitly exclude
        const excludedColumns = new Set([
            'id', 'customattrs', 'createdat', 'updatedat', 'deletedat',
            'productid', 'solutionid', 'customerid', 'taskid', 'outcomeid', 'releaseid',
            'adoptionplanid', 'originaltaskid', 'customersolutionid',
            'completedat', 'completedreason', 'softdeletequeued', 'rawtelemetrymapping'
        ]);

        // Get all potential columns
        let columns = Object.keys(firstItem).filter(key =>
            !excludedColumns.has(key.toLowerCase()) &&
            !key.toLowerCase().endsWith('id') // Catch-all for other FKs
        );

        // Priority columns to always show first (in order)
        const priority = [
            'name', 'title', 'description',
            'weight', 'estminutes',
            'status', 'level',
            'howtodoc', 'howtovideo',
            'product', '_count'
        ];

        // Always sort by priority
        columns = columns.sort((a, b) => {
            const aIdx = priority.indexOf(a.toLowerCase());
            const bIdx = priority.indexOf(b.toLowerCase());
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return 0;
        });

        // Limit to 8 columns max
        if (columns.length > 8) {
            columns = columns.slice(0, 8);
        }

        // Deduplicate name/title if both present (prefer name)
        if (columns.includes('name') && columns.includes('title')) {
            columns = columns.filter(c => c !== 'title');
        }

        // Header row
        let table = '| ' + columns.map(c => this.formatEntityName(c)).join(' | ') + ' |\n';
        table += '| ' + columns.map(() => '---').join(' | ') + ' |\n';

        // Data rows
        for (const item of data) {
            const row = columns.map(col => {
                const value = item[col];

                // Handle Name/Title column -> Link
                // Check if this column is the designated "Name" column for linking
                const isNameCol = col.toLowerCase() === 'name' || (col.toLowerCase() === 'title' && !columns.includes('name'));

                if (isNameCol && item.id) {
                    const { type, id } = this.getLinkTarget(category, item);
                    if (type && id) {
                        // Use span with data attribute instead of anchor to prevent browser navigation
                        return `<span class="nav-link" data-navigate="${type}:${id}" style="color:#1976d2;cursor:pointer;font-weight:500;">${value}</span>`;
                    }
                }

                // Handle HowTo links
                if (col.toLowerCase() === 'howtodoc' || col.toLowerCase() === 'howtovideo') {
                    if (Array.isArray(value) && value.length > 0) {
                        return value.map((url, idx) => `[Link ${idx + 1}](${url})`).join(', ');
                    }
                    return '';
                }

                if (value === null || value === undefined) return '-';

                // Simple object handling
                if (typeof value === 'object') {
                    if (Array.isArray(value)) return `${value.length} items`;
                    if (value && typeof value === 'object' && '_count' in value) return `Count: ${(value as any)._count}`;
                    return '[Object]';
                }

                const str = String(value);
                // Truncate long text
                return str.length > 50 ? str.substring(0, 47) + '...' : str.replace(/\n/g, ' ');
            });
            table += '| ' + row.join(' | ') + ' |\n';
        }

        return table + '\n';
    }

    /**
     * Format a single data item for display
     */
    formatDataItem(item: any, category: string): string {
        if (!item || typeof item !== 'object') {
            return `- ${JSON.stringify(item)}\n`;
        }

        // Get name/identifier
        const name = item.name || item.title || item.id || 'Unknown';
        const description = item.description
            ? ` - ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}`
            : '';

        // Determine link 
        const { type, id } = this.getLinkTarget(category, item);
        const nameLink = (id && type) ? `<span class="nav-link" data-navigate="${type}:${id}" style="color:#1976d2;cursor:pointer;font-weight:500;">${name}</span>` : `**${name}**`;

        let result = `• ${nameLink}${description}\n`;

        // Add additional key fields based on category
        const config = CATEGORY_CONFIG[category];
        if (config && config.keyFields) {
            for (const field of config.keyFields) {
                if (field === 'name' || field === 'description') continue;

                const value = item[field];
                if (value === undefined || value === null) continue;

                const formattedKey = this.formatEntityName(field);

                // Handle special cases
                if (field === 'adoptionPlan' && typeof value === 'object') {
                    if (value.progressPercentage !== undefined) {
                        const percent = value.progressPercentage;
                        const blocks = Math.round(percent / 10);
                        const bar = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
                        result += `  - Progress: ${percent}% ${bar}\n`;
                    }
                    continue;
                }

                if (field === 'tasks' && Array.isArray(value)) {
                    if (value.length > 0) {
                        result += `  - Tasks: ${value.map((t: any) => t.name).slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}\n`;
                    }
                    continue;
                }

                if (typeof value === 'object') {
                    // Skip complex objects unless handled above
                    continue;
                }

                result += `  - ${formattedKey}: ${value}\n`;
            }
        }

        // Add count information (legacy support or if not covered by keyFields)
        if (item._count && typeof item._count === 'object') {
            const countInfo = Object.entries(item._count)
                .filter(([_, v]) => typeof v === 'number' && v > 0)
                .map(([k, v]) => `${v} ${k}`)
                .join(', ');
            if (countInfo) {
                result += `  _${countInfo}_\n`;
            }
        }

        return result;
    }

    /**
     * Create a visual progress bar
     */
    private createProgressBar(percentage: number): string {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    }

    /**
     * Format the response footer
     */
    private formatFooter(result: QueryExecutionResult): string {
        if (!result.truncated) return '';

        return `\n\n⚠️ _Results truncated. Showing first ${result.data?.length || 0} of ${result.rowCount.toLocaleString()} total._\n`;
    }

    /**
     * Format entity names (camelCase to Title Case)
     */
    formatEntityName(name: string): string {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .trim();
    }

    /**
     * Generate follow-up suggestions based on the query result
     */
    generateSuggestions(template: QueryTemplate, result: QueryExecutionResult): string[] {
        const suggestions: string[] = [];
        const category = template.category;

        // Add category-related suggestions
        const categorySuggestions = this.getCategorySuggestions(category);
        suggestions.push(...categorySuggestions.slice(0, 2));

        // Add result-specific suggestions
        if (result.rowCount > 10) {
            suggestions.push(`Show me the top 5 ${category} by name`);
        }

        if (result.rowCount === 0) {
            suggestions.push(`Show me all ${category}`);
        }

        // Add cross-category suggestions
        const crossSuggestions = this.getCrossCategorySuggestions(category);
        suggestions.push(...crossSuggestions.slice(0, 2));

        return suggestions.slice(0, 4);
    }

    /**
     * Get suggestions for a specific category
     */
    private getCategorySuggestions(category: string): string[] {
        const suggestions: Record<string, string[]> = {
            products: [
                'Show products without telemetry',
                'List products with their tasks',
                'How many products do we have?',
            ],
            solutions: [
                'Show all solutions',
                'List solutions with their products',
                'How many solutions are there?',
            ],
            customers: [
                'Show customers with low adoption',
                'List customers with their adoption progress',
                'How many customers do we have?',
            ],
            tasks: [
                'Find tasks without descriptions',
                'Show tasks without telemetry',
                'List high-weight tasks',
            ],
            telemetry: [
                'Show telemetry attributes',
                'Find tasks with missing telemetry',
            ],
            analytics: [
                'Give me a summary of the data',
                'How many products, solutions, and customers?',
            ],
        };

        return suggestions[category] || suggestions.products;
    }

    /**
     * Get cross-category suggestions
     */
    private getCrossCategorySuggestions(currentCategory: string): string[] {
        const allSuggestions = [
            'Give me a summary of the data',
            'Show customers with low adoption',
            'Find products without telemetry',
            'List all solutions',
        ];

        // Return suggestions from other categories
        return allSuggestions.filter(s => {
            const categoryInSuggestion = s.toLowerCase().includes(currentCategory);
            return !categoryInSuggestion;
        }).slice(0, 2);
    }

    /**
     * Get suggestions for error responses
     */
    private getErrorSuggestions(category: string): string[] {
        return [
            `Try again: Show me all ${category}`,
            'Give me a summary of the data',
            'What can you help me with?',
        ];
    }

    /**
     * Get suggestions for access denied responses
     */
    private getAccessDeniedSuggestions(category: string, userRole: string): string[] {
        const suggestions: string[] = ['What can I access with my role?'];

        if (userRole === 'CSS' || userRole === 'CS') {
            suggestions.push('Show me my customers');
            suggestions.push('List customers with low adoption');
        } else if (userRole === 'SME') {
            suggestions.push('Show me all products');
            suggestions.push('List solutions');
        } else {
            suggestions.push('Show me available data');
        }

        return suggestions;
    }

    /**
     * Format statistics summary
     */
    formatSummary(stats: Record<string, number>): string {
        let summary = `📈 **Data Summary**\n\n`;

        for (const [key, value] of Object.entries(stats)) {
            const icon = this.getIconForCategory(key);
            const formattedKey = this.formatEntityName(key);
            summary += `${icon} ${formattedKey}: **${value.toLocaleString()}**\n`;
        }

        return summary;
    }

    /**
     * Get emoji icon for category
     */
    private getIconForCategory(category: string): string {
        const icons: Record<string, string> = {
            products: '📦',
            solutions: '🧩',
            customers: '👥',
            tasks: '✅',
            telemetry: '📊',
            users: '👤',
        };
        return icons[category.toLowerCase()] || '📋';
    }

    /**
     * Get the target link type and ID for an item
     */
    private getLinkTarget(contextCategory: string, item: any): { type: string | null, id: string | null } {
        const id = item.id;
        if (!id) return { type: null, id: null };

        // FIRST: Check context category - this is the most reliable indicator
        if (contextCategory === 'tasks') {
            return { type: 'tasks', id };
        }
        if (contextCategory === 'products') {
            return { type: 'products', id };
        }
        if (contextCategory === 'customers') {
            return { type: 'customers', id };
        }

        // Tasks -> Link directly to task (by item properties)
        if (item.estMinutes !== undefined || item.sequenceNumber !== undefined || item.weight !== undefined) {
            return { type: 'tasks', id };
        }

        // Products
        if (contextCategory === 'products' || item.statusPercent !== undefined) {
            return { type: 'products', id };
        }

        // Solutions
        if (contextCategory === 'solutions' || item.solution) {
            return { type: 'solutions', id };
        }

        // Customers
        if (contextCategory === 'customers' || (item.adoptionPlan && !item.adoptionPlanId)) {
            return { type: 'customers', id };
        }

        // Default: infer from category if possible
        const inferred = this.inferLinkCategory(contextCategory, item);
        return { type: inferred, id };
    }

    /**
     * Infer link category from item and context
     */
    private inferLinkCategory(contextCategory: string, item: any): string | null {
        if (contextCategory === 'products' || item.product) return 'products';
        if (contextCategory === 'solutions' || item.solution) return 'solutions';
        if (contextCategory === 'customers' || item.adoptionPlan) return 'customers';
        if (contextCategory === 'tasks' || item.estMinutes !== undefined) return 'tasks';
        return contextCategory;
    }
}

// Singleton instance
let instance: ResponseFormatter | null = null;

/**
 * Get the singleton ResponseFormatter instance
 */
export function getResponseFormatter(options?: FormatOptions): ResponseFormatter {
    if (!instance) {
        instance = new ResponseFormatter(options);
    }
    return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetResponseFormatter(): void {
    instance = null;
}
