/**
 * Schema Context Manager
 * 
 * Builds comprehensive database schema context for the AI Agent LLM.
 * This context helps the LLM understand the data model and generate
 * accurate queries.
 * 
 * @module services/ai/SchemaContextManager
 * @version 1.0.0
 * @created 2025-12-05
 */

import { TableSchema, ColumnSchema, RelationshipSchema, SchemaContext } from './types';

/**
 * Schema Context Manager
 * 
 * Responsible for building and managing the database schema context
 * that is provided to the LLM for query generation.
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
   * (For now, returns full context - can be optimized later)
   */
  getRelevantContext(question: string): SchemaContext {
    // TODO: Implement smart context selection based on question
    // For now, return full context
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
   * Build table definitions
   */
  private buildTables(): TableSchema[] {
    return [
      // Core Entities
      {
        name: 'Product',
        description: 'Software products that customers can adopt. Each product has tasks, licenses, outcomes, and releases.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false, description: 'Unique product name', sampleValues: ['Cisco Duo', 'Secure Firewall', 'SD-WAN', 'ISE'] },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'customAttrs', type: 'Json', nullable: true, isPrimaryKey: false, description: 'Custom attributes as JSON' },
          { name: 'createdAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
          { name: 'updatedAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
          { name: 'deletedAt', type: 'DateTime', nullable: true, isPrimaryKey: false, description: 'Soft delete timestamp' },
        ],
        relationships: [
          { name: 'tasks', relatedTable: 'Task', type: 'oneToMany' },
          { name: 'licenses', relatedTable: 'License', type: 'oneToMany' },
          { name: 'outcomes', relatedTable: 'Outcome', type: 'oneToMany' },
          { name: 'releases', relatedTable: 'Release', type: 'oneToMany' },
          { name: 'solutions', relatedTable: 'Solution', type: 'manyToMany' },
          { name: 'customers', relatedTable: 'CustomerProduct', type: 'oneToMany', description: 'Assignments of this product to customers' },
        ],
      },
      {
        name: 'Solution',
        description: 'Bundles of products. Solutions can have their own tasks and aggregate product progress.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false, sampleValues: ['Hybrid Private Access', 'SASE Bundle'] },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'customAttrs', type: 'Json', nullable: true, isPrimaryKey: false },
          { name: 'createdAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
          { name: 'updatedAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
          { name: 'deletedAt', type: 'DateTime', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'products', relatedTable: 'Product', type: 'manyToMany' },
          { name: 'tasks', relatedTable: 'Task', type: 'oneToMany' },
          { name: 'licenses', relatedTable: 'License', type: 'oneToMany' },
          { name: 'outcomes', relatedTable: 'Outcome', type: 'oneToMany' },
          { name: 'releases', relatedTable: 'Release', type: 'oneToMany' },
          { name: 'customers', relatedTable: 'CustomerSolution', type: 'oneToMany', description: 'Assignments of this solution to customers' },
        ],
      },
      {
        name: 'Customer',
        description: 'Organizations using products/solutions. Customers have adoption plans that track their progress.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'createdAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
          { name: 'updatedAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
          { name: 'deletedAt', type: 'DateTime', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'products', relatedTable: 'CustomerProduct', type: 'oneToMany' },
          { name: 'solutions', relatedTable: 'CustomerSolution', type: 'oneToMany' },
        ],
      },
      {
        name: 'Task',
        description: 'Implementation steps for products/solutions. Tasks have weight, estimated time, and telemetry attributes.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'productId', type: 'String', nullable: true, isPrimaryKey: false, description: 'Parent product (mutually exclusive with solutionId)' },
          { name: 'solutionId', type: 'String', nullable: true, isPrimaryKey: false, description: 'Parent solution (mutually exclusive with productId)' },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false, sampleValues: ['Configure SSO', 'Enable Logging', 'Deploy Agents'] },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'estMinutes', type: 'Int', nullable: false, isPrimaryKey: false, description: 'Estimated minutes to complete', sampleValues: ['30', '60', '120'] },
          { name: 'weight', type: 'Decimal', nullable: false, isPrimaryKey: false, description: 'Weightage percentage (0-100, supports decimals)', sampleValues: ['10', '25.5', '50'] },
          { name: 'sequenceNumber', type: 'Int', nullable: false, isPrimaryKey: false, description: 'Execution order' },
          { name: 'licenseLevel', type: 'LicenseLevel', nullable: false, isPrimaryKey: false, description: 'Required license level' },
          { name: 'howToDoc', type: 'String[]', nullable: false, isPrimaryKey: false, description: 'Links to documentation' },
          { name: 'howToVideo', type: 'String[]', nullable: false, isPrimaryKey: false, description: 'Links to videos' },
          { name: 'notes', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'softDeleteQueued', type: 'Boolean', nullable: false, isPrimaryKey: false, description: 'Marked for deletion' },
          { name: 'deletedAt', type: 'DateTime', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'product', relatedTable: 'Product', type: 'manyToOne', foreignKey: 'productId' },
          { name: 'solution', relatedTable: 'Solution', type: 'manyToOne', foreignKey: 'solutionId' },
          { name: 'telemetryAttributes', relatedTable: 'TelemetryAttribute', type: 'oneToMany' },
          { name: 'outcomes', relatedTable: 'Outcome', type: 'manyToMany' },
          { name: 'releases', relatedTable: 'Release', type: 'manyToMany' },
        ],
      },
      {
        name: 'TelemetryAttribute',
        description: 'Metrics tracked for tasks. Can auto-update task status when success criteria are met.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'taskId', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false, description: 'Attribute name (e.g., "users_synced")' },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'dataType', type: 'TelemetryDataType', nullable: false, isPrimaryKey: false, description: 'BOOLEAN, NUMBER, STRING, TIMESTAMP, or JSON' },
          { name: 'isRequired', type: 'Boolean', nullable: false, isPrimaryKey: false, description: 'Required for task completion' },
          { name: 'successCriteria', type: 'Json', nullable: false, isPrimaryKey: false, description: 'Criteria definition with AND/OR logic' },
          { name: 'order', type: 'Int', nullable: false, isPrimaryKey: false, description: 'Display order' },
          { name: 'isActive', type: 'Boolean', nullable: false, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'task', relatedTable: 'Task', type: 'manyToOne', foreignKey: 'taskId' },
          { name: 'values', relatedTable: 'TelemetryValue', type: 'oneToMany' },
        ],
      },
      {
        name: 'License',
        description: 'License levels for products/solutions. Hierarchical: higher levels include lower level features.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'level', type: 'Int', nullable: false, isPrimaryKey: false, description: 'Hierarchical level (higher includes lower)' },
          { name: 'isActive', type: 'Boolean', nullable: false, isPrimaryKey: false },
          { name: 'productId', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'solutionId', type: 'String', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'product', relatedTable: 'Product', type: 'manyToOne', foreignKey: 'productId' },
          { name: 'solution', relatedTable: 'Solution', type: 'manyToOne', foreignKey: 'solutionId' },
        ],
      },
      {
        name: 'Outcome',
        description: 'Business outcomes/goals that tasks contribute to.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'productId', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'solutionId', type: 'String', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'product', relatedTable: 'Product', type: 'manyToOne', foreignKey: 'productId' },
          { name: 'solution', relatedTable: 'Solution', type: 'manyToOne', foreignKey: 'solutionId' },
          { name: 'tasks', relatedTable: 'Task', type: 'manyToMany' },
        ],
      },
      {
        name: 'Release',
        description: 'Version releases for products/solutions. Tasks can be assigned to specific releases.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'level', type: 'Float', nullable: false, isPrimaryKey: false, description: 'Version level (1.0, 1.1, 2.0)' },
          { name: 'isActive', type: 'Boolean', nullable: false, isPrimaryKey: false },
          { name: 'productId', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'solutionId', type: 'String', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'product', relatedTable: 'Product', type: 'manyToOne', foreignKey: 'productId' },
          { name: 'solution', relatedTable: 'Solution', type: 'manyToOne', foreignKey: 'solutionId' },
          { name: 'tasks', relatedTable: 'Task', type: 'manyToMany' },
        ],
      },
      // Customer Adoption Tracking
      {
        name: 'CustomerProduct',
        description: 'Assignment of a product to a customer. Creates an adoption plan.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'customerId', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'productId', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false, description: 'Assignment name (e.g., "Production")' },
          { name: 'licenseLevel', type: 'LicenseLevel', nullable: false, isPrimaryKey: false },
          { name: 'selectedOutcomes', type: 'Json', nullable: true, isPrimaryKey: false, description: 'Selected outcome IDs' },
          { name: 'selectedReleases', type: 'Json', nullable: true, isPrimaryKey: false, description: 'Selected release IDs' },
          { name: 'purchasedAt', type: 'DateTime', nullable: false, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'customer', relatedTable: 'Customer', type: 'manyToOne', foreignKey: 'customerId' },
          { name: 'product', relatedTable: 'Product', type: 'manyToOne', foreignKey: 'productId' },
          { name: 'adoptionPlan', relatedTable: 'AdoptionPlan', type: 'oneToOne' },
        ],
      },
      {
        name: 'AdoptionPlan',
        description: 'Tracks customer progress on a product. Contains snapshot of tasks at creation time.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'customerProductId', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'productId', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'productName', type: 'String', nullable: false, isPrimaryKey: false, description: 'Snapshot of product name' },
          { name: 'licenseLevel', type: 'LicenseLevel', nullable: false, isPrimaryKey: false },
          { name: 'totalTasks', type: 'Int', nullable: false, isPrimaryKey: false },
          { name: 'completedTasks', type: 'Int', nullable: false, isPrimaryKey: false },
          { name: 'totalWeight', type: 'Decimal', nullable: false, isPrimaryKey: false },
          { name: 'completedWeight', type: 'Decimal', nullable: false, isPrimaryKey: false },
          { name: 'progressPercentage', type: 'Decimal', nullable: false, isPrimaryKey: false, description: 'Weighted completion percentage' },
          { name: 'lastSyncedAt', type: 'DateTime', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'customerProduct', relatedTable: 'CustomerProduct', type: 'oneToOne', foreignKey: 'customerProductId' },
          { name: 'tasks', relatedTable: 'CustomerTask', type: 'oneToMany' },
        ],
      },
      {
        name: 'CustomerTask',
        description: 'Customer-specific copy of a task with status tracking. Status can be updated manually or via telemetry.',
        columns: [
          { name: 'id', type: 'String', nullable: false, isPrimaryKey: true },
          { name: 'adoptionPlanId', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'originalTaskId', type: 'String', nullable: false, isPrimaryKey: false, description: 'Reference to product task' },
          { name: 'name', type: 'String', nullable: false, isPrimaryKey: false },
          { name: 'description', type: 'String', nullable: true, isPrimaryKey: false },
          { name: 'estMinutes', type: 'Int', nullable: false, isPrimaryKey: false },
          { name: 'weight', type: 'Decimal', nullable: false, isPrimaryKey: false },
          { name: 'sequenceNumber', type: 'Int', nullable: false, isPrimaryKey: false },
          { name: 'licenseLevel', type: 'LicenseLevel', nullable: false, isPrimaryKey: false },
          { name: 'status', type: 'CustomerTaskStatus', nullable: false, isPrimaryKey: false, description: 'Current status', sampleValues: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] },
          { name: 'statusUpdatedAt', type: 'DateTime', nullable: true, isPrimaryKey: false },
          { name: 'statusUpdatedBy', type: 'String', nullable: true, isPrimaryKey: false, description: 'User ID or "telemetry"' },
          { name: 'statusUpdateSource', type: 'StatusUpdateSource', nullable: true, isPrimaryKey: false, description: 'How status was updated' },
          { name: 'isComplete', type: 'Boolean', nullable: false, isPrimaryKey: false },
          { name: 'completedAt', type: 'DateTime', nullable: true, isPrimaryKey: false },
        ],
        relationships: [
          { name: 'adoptionPlan', relatedTable: 'AdoptionPlan', type: 'manyToOne', foreignKey: 'adoptionPlanId' },
          { name: 'telemetryAttributes', relatedTable: 'CustomerTelemetryAttribute', type: 'oneToMany' },
        ],
      },
    ];
  }

  /**
   * Build enum definitions
   */
  private buildEnums(): Record<string, string[]> {
    return {
      SystemRole: ['ADMIN', 'USER', 'SME', 'CSS', 'VIEWER'],
      LicenseLevel: ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'],
      TelemetryDataType: ['BOOLEAN', 'NUMBER', 'STRING', 'TIMESTAMP', 'JSON'],
      CustomerTaskStatus: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DONE', 'NOT_APPLICABLE', 'NO_LONGER_USING'],
      StatusUpdateSource: ['MANUAL', 'TELEMETRY', 'IMPORT', 'SYSTEM'],
    };
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
      'CustomerProduct creates an AdoptionPlan with CustomerTask copies.',
      'To query adoption plans for a product, query the "customers" relation (which are CustomerProduct records): product.customers.some.adoptionPlan...',
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


