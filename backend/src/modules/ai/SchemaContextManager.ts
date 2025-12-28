/**
 * Schema Context Manager
 * 
 * Builds comprehensive database schema context for the AI Agent LLM.
 * This context helps the LLM understand the data model and generate
 * accurate queries.
 * 
 * @module services/ai/SchemaContextManager
 * @version 2.0.0
 * @created 2025-12-05
 * @updated 2025-12-22 (Dynamic DMMF Integration)
 */

import { TableSchema, ColumnSchema, RelationshipSchema, SchemaContext } from './types';
import { Prisma } from '@prisma/client';

/**
 * Manual metadata to enrich the dynamic schema with descriptions and business context.
 * This augments the raw Prisma schema with human-friendly implementation details.
 */
const MANUAL_METADATA: Record<string, {
  description?: string;
  columns?: Record<string, { description?: string; sampleValues?: string[] }>;
  relationships?: Record<string, string>;
}> = {
  Product: {
    description: 'Software products that customers can adopt. Each product has tasks, licenses, outcomes, and releases.',
    columns: {
      name: { description: 'Unique product name', sampleValues: ['Cisco Duo', 'Secure Firewall', 'SD-WAN', 'ISE'] },
      customAttrs: { description: 'Custom attributes as JSON' },
      deletedAt: { description: 'Soft delete timestamp' }
    },
    relationships: {
      customers: 'Product assignments/adoption plans - customers using this product'
    }
  },
  Solution: {
    description: 'Bundles of products. Solutions can have their own tasks and aggregate product progress.',
    columns: {
      name: { sampleValues: ['Hybrid Private Access', 'SASE Bundle'] }
    },
    relationships: {
      customers: 'Solution assignments/adoption plans - customers using this solution'
    }
  },
  Customer: {
    description: 'Organizations using products/solutions. Customers have adoption plans that track their progress.'
  },
  Task: {
    description: 'Implementation steps for products/solutions. Tasks have weight, estimated time, and telemetry attributes.',
    columns: {
      productId: { description: 'Parent product (mutually exclusive with solutionId)' },
      solutionId: { description: 'Parent solution (mutually exclusive with productId)' },
      name: { sampleValues: ['Configure SSO', 'Enable Logging', 'Deploy Agents'] },
      estMinutes: { description: 'Estimated minutes to complete', sampleValues: ['30', '60', '120'] },
      weight: { description: 'Weightage percentage (0-100, supports decimals)', sampleValues: ['10', '25.5', '50'] },
      sequenceNumber: { description: 'Execution order' },
      licenseLevel: { description: 'Required license level' },
      howToDoc: { description: 'Links to documentation' },
      howToVideo: { description: 'Links to videos' },
      softDeleteQueued: { description: 'Marked for deletion' }
    }
  },
  TelemetryAttribute: {
    description: 'Metrics tracked for tasks. Can auto-update task status when success criteria are met.',
    columns: {
      name: { description: 'Attribute name (e.g., "users_synced")' },
      dataType: { description: 'BOOLEAN, NUMBER, STRING, TIMESTAMP, or JSON' },
      isRequired: { description: 'Required for task completion' },
      successCriteria: { description: 'Criteria definition with AND/OR logic' },
      order: { description: 'Display order' }
    }
  },
  License: {
    description: 'License levels for products/solutions. Hierarchical: higher levels include lower level features.',
    columns: {
      level: { description: 'Hierarchical level (higher includes lower)' }
    }
  },
  Outcome: {
    description: 'Business outcomes/goals that tasks contribute to.'
  },
  Release: {
    description: 'Version releases for products/solutions. Tasks can be assigned to specific releases.',
    columns: {
      level: { description: 'Version level (1.0, 1.1, 2.0)' }
    }
  },
  CustomerProduct: {
    description: 'Represents a Product Assignment (also called Product Adoption Plan). When a product is assigned to a customer, this creates an adoption plan to track their progress. Terms "product assignment" and "product adoption plan" are interchangeable.',
    columns: {
      name: { description: 'Assignment/adoption plan name (e.g., "Production", "Phase 1")' },
      selectedOutcomes: { description: 'Selected outcome IDs' },
      selectedReleases: { description: 'Selected release IDs' }
    }
  },
  AdoptionPlan: {
    description: 'Tracks customer progress on a product. Contains snapshot of tasks at creation time.',
    columns: {
      productName: { description: 'Snapshot of product name' },
      progressPercentage: { description: 'Weighted completion percentage' }
    }
  },
  CustomerTask: {
    description: 'Customer-specific copy of a task with status tracking. Status can be updated manually or via telemetry.',
    columns: {
      originalTaskId: { description: 'Reference to product task' },
      status: { description: 'Current status', sampleValues: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
      statusUpdatedBy: { description: 'User ID or "telemetry"' },
      statusUpdateSource: { description: 'How status was updated' }
    }
  },
  ProductTag: {
    description: 'Tags for categorizing products and their tasks. Tasks link to these tags via TaskTag.',
    columns: {
      name: { description: 'Tag name' }
    }
  },
  TaskTag: {
    description: 'Link table connecting Tasks to ProductTags.'
  },
  SolutionTag: {
    description: 'Tags for categorizing solutions.'
  },
  CustomerProductTag: {
    description: 'Customer-specific copy of a ProductTag.'
  },
  CustomerTaskTag: {
    description: 'Link table connecting CustomerTasks to CustomerProductTags.'
  }
};

/**
 * Schema Context Manager
 * 
 * Responsible for building and managing the database schema context
 * dynamically from the Prisma DMMF definitions.
 */
export class SchemaContextManager {
  private context: SchemaContext | null = null;
  private contextPrompt: string | null = null;

  /**
   * Get the full schema context
   */
  getFullContext(): SchemaContext {
    if (!this.context) {
      this.context = this.buildContext();
    }
    return this.context;
  }

  /**
   * Get the schema context as a prompt string for the LLM
   */
  getContextPrompt(): string {
    if (!this.contextPrompt) {
      this.contextPrompt = this.buildContextPrompt();
    }
    return this.contextPrompt;
  }

  /**
   * Get a subset of context relevant to a specific question
   */
  getRelevantContext(question: string): SchemaContext {
    return this.getFullContext();
  }

  /**
   * Clear cached context (for testing or when schema changes)
   */
  clearCache(): void {
    this.context = null;
    this.contextPrompt = null;
  }

  /**
   * Build the schema context from Prisma schema knowledge
   */
  private buildContext(): SchemaContext {
    return {
      tables: this.buildTables(),
      enums: this.buildEnums(),
      businessRules: this.buildBusinessRules(),
    };
  }

  /**
   * Build table definitions dynamically from Prisma DMMF
   */
  private buildTables(): TableSchema[] {
    // Force DMMF check to be safe
    const dmmf = Prisma.dmmf;
    if (!dmmf || !dmmf.datamodel) {
      console.error('Prisma DMMF not available, falling back to empty tables');
      return [];
    }

    return dmmf.datamodel.models.map(model => {
      // Get manual metadata overlay
      const meta = MANUAL_METADATA[model.name] || {};

      // Build columns (excluding relation fields)
      const columns: ColumnSchema[] = model.fields
        .filter(f => f.kind !== 'object')
        .map(f => ({
          name: f.name,
          type: f.type.toString(),
          nullable: !f.isRequired,
          isPrimaryKey: f.isId,
          description: meta.columns?.[f.name]?.description,
          sampleValues: meta.columns?.[f.name]?.sampleValues
        }));

      // Build relationships (relation fields only)
      const relationships: RelationshipSchema[] = model.fields
        .filter(f => f.kind === 'object')
        .map(f => ({
          name: f.name,
          relatedTable: f.type,
          type: f.isList ? 'oneToMany' : 'manyToOne', // Simple heuristic; refined by extra checks if needed
          foreignKey: (f as any).relationFromFields?.[0], // DMMF provides this
          description: meta.relationships?.[f.name]
        }));

      return {
        name: model.name,
        description: meta.description || '',
        columns,
        relationships
      };
    });
  }

  /**
   * Build enum definitions dynamically from Prisma DMMF
   */
  private buildEnums(): Record<string, string[]> {
    const enums: Record<string, string[]> = {};

    if (Prisma.dmmf && Prisma.dmmf.datamodel) {
      Prisma.dmmf.datamodel.enums.forEach(e => {
        enums[e.name] = e.values.map(v => v.name);
      });
    }

    return enums;
  }

  /**
   * Build business rules that help the LLM understand the domain
   */
  private buildBusinessRules(): string[] {
    return [
      // Progress Calculation
      'Adoption progress is calculated by weighted sum of completed tasks, NOT simple task count.',
      'A task with weight=30 contributes more to progress than one with weight=10.',
      'Progress percentage = (sum of completed task weights) / (total weight) * 100.',

      // Status Rules
      'CustomerTaskStatus DONE and COMPLETED are equivalent - both mean task is finished.',
      'NOT_APPLICABLE means the task does not apply to this specific customer.',
      'NO_LONGER_USING means the feature was implemented but telemetry shows discontinued use.',

      // Update Sources
      'StatusUpdateSource MANUAL means a user updated the status via the GUI.',
      'StatusUpdateSource TELEMETRY means the status was auto-updated based on telemetry criteria.',
      'Manual updates take precedence over telemetry updates.',

      // License Hierarchy
      'License levels are hierarchical: SIGNATURE includes ADVANTAGE includes ESSENTIAL.',
      'A customer with SIGNATURE license has access to all tasks across all levels.',

      // Soft Delete
      'Soft-deleted records have deletedAt set to a timestamp instead of being removed.',
      'Always filter by deletedAt IS NULL when querying active records.',

      // Customer Adoption
      'CustomerTask is a SNAPSHOT of the original Task - it can diverge from the source.',
      'AdoptionPlan contains customer-specific task copies that track their progress.',
      'Use lastSyncedAt to check when the adoption plan was last synced with product changes.',

      // Telemetry
      'TelemetryAttribute defines WHAT to track; TelemetryValue stores ACTUAL values.',
      'successCriteria in TelemetryAttribute can use AND/OR logic for complex conditions.',
      'When all required telemetry criteria are met, task status can auto-update to COMPLETED.',

      // Relationships
      'A Task belongs to EITHER a Product OR a Solution, never both.',
      'A Solution can contain multiple Products via SolutionProduct join table.',
      'When a product is assigned to a customer, a CustomerProduct record is created along with an AdoptionPlan containing CustomerTask copies.',
      'CustomerProduct represents a "Product Assignment" or "Product Adoption Plan" - these terms are interchangeable.',
      'CustomerSolution represents a "Solution Assignment" or "Solution Adoption Plan" - these terms are interchangeable.',
      '"Assign a product" and "create a product adoption plan" mean the same thing.',
      '"Assign a solution" and "create a solution adoption plan" mean the same thing.',
      'To query assignments/adoption plans for a product, query the "customers" relation: product.customers.some.adoptionPlan...',

      // Querying Customer Tasks
      'IMPORTANT: To find individual task records for a customer, query CustomerTask directly with nested filters.',
      'CustomerTask connects to Customer via: CustomerTask → adoptionPlan → customerProduct → customer',
      'Example filter for CustomerTask by customer name: { adoptionPlan: { customerProduct: { customer: { name: { contains: "ACME" } } } } }',
      'To also filter by product name, add: { adoptionPlan: { customerProduct: { product: { name: { contains: "ProductName" } } } } }',
      'Query CustomerTask when you want individual task rows as results (e.g., "show me tasks that are done for ACME").',
      'Query Customer when you want customer records with nested task data.',

      // Tagging Logic
      'Tags are implemented as associative entities (many-to-many).',
      'To filter Tasks by Tag, go through taskTags relation: { taskTags: { some: { tag: { name: { contains: "TagName", mode: "insensitive" } } } } }',
      'The same logic applies to ProductTag and SolutionTag filtering.',
      'CustomerTaskTag and CustomerProductTag work similarly for customer-specific instances.',
    ];
  }

  /**
   * Build the LLM prompt from schema context
   */
  private buildContextPrompt(): string {
    const context = this.getFullContext();

    let prompt = `## Database Schema\n\n`;

    // Add tables
    prompt += `### Tables\n\n`;
    for (const table of context.tables) {
      prompt += `**${table.name}**: ${table.description}\n`;
      prompt += `- Key columns: ${table.columns.filter(c => c.isPrimaryKey || c.description || c.sampleValues).map(c => {
        let desc = c.name;
        if (c.description) desc += ` (${c.description})`;
        if (c.sampleValues) desc += ` [Examples: ${c.sampleValues.join(', ')}]`;
        return desc;
      }).join(', ')}\n`;
      prompt += `- Relationships: ${table.relationships.map(r => {
        let rel = `${r.name} → ${r.relatedTable}`;
        if (r.description) rel += ` (${r.description})`;
        return rel;
      }).join(', ')}\n\n`;
    }

    // Add enums
    prompt += `### Enums\n\n`;
    for (const [name, values] of Object.entries(context.enums)) {
      prompt += `- **${name}**: ${values.join(', ')}\n`;
    }
    prompt += `\n`;

    // Add business rules
    prompt += `### Business Rules\n\n`;
    for (const rule of context.businessRules) {
      prompt += `- ${rule}\n`;
    }

    // Add System Config
    prompt += `\n### System Configuration\n\n`;
    prompt += `- Max query rows: 1000 (The system automatically truncates results beyond this)\n`;
    prompt += `- Query timeout: 30s\n`;
    prompt += `- Environment: ${process.env.NODE_ENV || 'development'}\n`;

    return prompt;
  }
}

// Export singleton instance
let instance: SchemaContextManager | null = null;

/**
 * Get the singleton Schema Context Manager instance
 */
export function getSchemaContextManager(): SchemaContextManager {
  if (!instance) {
    instance = new SchemaContextManager();
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetSchemaContextManager(): void {
  instance = null;
}
