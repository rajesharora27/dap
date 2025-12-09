/**
 * Data Context Manager
 * 
 * Fetches and caches actual database data to provide rich context to the AI Agent LLM.
 * This includes entity names, counts, relationships, and sample data that helps the LLM
 * understand the current state of the database.
 * 
 * @module services/ai/DataContextManager
 * @version 1.1.0
 * @created 2025-12-08
 * @updated 2025-12-09 - Use shared Prisma client to prevent connection leaks
 */

import { PrismaClient } from '@prisma/client';
import { prisma as sharedPrisma } from '../../context';

/**
 * Structure for caching product data
 */
interface ProductData {
  id: string;
  name: string;
  taskCount: number;
  tasksWithTelemetry: number;
  tasksWithoutTelemetry: number;
  licenseNames: string[];
  outcomeNames: string[];
  releaseNames: string[];
}

/**
 * Structure for caching solution data
 */
interface SolutionData {
  id: string;
  name: string;
  productNames: string[];
  taskCount: number;
}

/**
 * Structure for caching customer data
 */
interface CustomerData {
  id: string;
  name: string;
  productAdoptionPlans: string[];
  solutionAdoptionPlans: string[];
}

/**
 * Full data context structure
 */
export interface DataContext {
  lastRefreshed: Date;
  products: ProductData[];
  solutions: SolutionData[];
  customers: CustomerData[];
  statistics: {
    totalProducts: number;
    totalSolutions: number;
    totalCustomers: number;
    totalTasks: number;
    totalTasksWithTelemetry: number;
    totalTasksWithoutTelemetry: number;
    totalAdoptionPlans: number;
  };
  entityNameMap: {
    products: Map<string, string>; // name -> id
    solutions: Map<string, string>;
    customers: Map<string, string>;
  };
}

/**
 * Data Context Manager
 * 
 * Responsible for fetching and caching actual database data
 * to provide rich context for LLM query generation.
 */
export class DataContextManager {
  private prisma: PrismaClient;
  private context: DataContext | null = null;
  private contextPrompt: string | null = null;
  private refreshPromise: Promise<DataContext> | null = null;
  
  // Cache TTL in milliseconds (default: 1 hour)
  private cacheTTL: number;
  
  constructor(prisma: PrismaClient, cacheTTLMs: number = 3600000) {
    this.prisma = prisma;
    this.cacheTTL = cacheTTLMs;
  }
  
  /**
   * Get the data context, refreshing if needed
   */
  async getContext(): Promise<DataContext> {
    if (this.context && !this.isExpired()) {
      return this.context;
    }
    
    return this.refresh();
  }
  
  /**
   * Get the context as a prompt string for the LLM
   */
  async getContextPrompt(): Promise<string> {
    if (this.contextPrompt && !this.isExpired()) {
      return this.contextPrompt;
    }
    
    await this.getContext();
    return this.contextPrompt!;
  }
  
  /**
   * Force refresh the data context
   */
  async refresh(): Promise<DataContext> {
    // If already refreshing, wait for that to complete
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.refreshPromise = this.fetchDataContext();
    
    try {
      this.context = await this.refreshPromise;
      this.contextPrompt = this.buildContextPrompt(this.context);
      return this.context;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  /**
   * Check if the cache has expired
   */
  private isExpired(): boolean {
    if (!this.context) return true;
    return Date.now() - this.context.lastRefreshed.getTime() > this.cacheTTL;
  }
  
  /**
   * Get last refresh timestamp
   */
  getLastRefreshed(): Date | null {
    return this.context?.lastRefreshed || null;
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.context = null;
    this.contextPrompt = null;
  }
  
  /**
   * Fetch all data context from the database
   */
  private async fetchDataContext(): Promise<DataContext> {
    console.log('[DataContextManager] Refreshing data context...');
    const startTime = Date.now();
    
    // Fetch products with related data
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        licenses: { select: { name: true } },
        outcomes: { select: { name: true } },
        releases: { select: { name: true } },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            _count: {
              select: { telemetryAttributes: true }
            }
          }
        }
      }
    });
    
    // Fetch solutions with related data
    const solutions = await this.prisma.solution.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        products: {
          select: {
            product: { select: { name: true } }
          }
        },
        tasks: {
          where: { deletedAt: null },
          select: { id: true }
        }
      }
    });
    
    // Fetch customers with adoption plans
    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        products: {
          select: {
            name: true,
            product: { select: { name: true } }
          }
        },
        solutions: {
          select: {
            name: true,
            solution: { select: { name: true } }
          }
        }
      }
    });
    
    // Count adoption plans
    const adoptionPlanCount = await this.prisma.adoptionPlan.count();
    
    // Build processed product data
    const productData: ProductData[] = products.map(p => {
      const tasksWithTelemetry = p.tasks.filter(t => t._count.telemetryAttributes > 0).length;
      return {
        id: p.id,
        name: p.name,
        taskCount: p.tasks.length,
        tasksWithTelemetry,
        tasksWithoutTelemetry: p.tasks.length - tasksWithTelemetry,
        licenseNames: p.licenses.map(l => l.name),
        outcomeNames: p.outcomes.map(o => o.name),
        releaseNames: p.releases.map(r => r.name)
      };
    });
    
    // Build processed solution data
    const solutionData: SolutionData[] = solutions.map(s => ({
      id: s.id,
      name: s.name,
      productNames: s.products.map(sp => sp.product.name),
      taskCount: s.tasks.length
    }));
    
    // Build processed customer data
    const customerData: CustomerData[] = customers.map(c => ({
      id: c.id,
      name: c.name,
      productAdoptionPlans: c.products.map(cp => `${cp.name} (${cp.product.name})`),
      solutionAdoptionPlans: c.solutions.map(cs => `${cs.name} (${cs.solution.name})`)
    }));
    
    // Build name -> id maps for entity resolution
    const entityNameMap = {
      products: new Map<string, string>(productData.map(p => [p.name.toLowerCase(), p.id])),
      solutions: new Map<string, string>(solutionData.map(s => [s.name.toLowerCase(), s.id])),
      customers: new Map<string, string>(customerData.map(c => [c.name.toLowerCase(), c.id]))
    };
    
    // Calculate statistics
    const totalTasksWithTelemetry = productData.reduce((sum, p) => sum + p.tasksWithTelemetry, 0);
    const totalTasks = productData.reduce((sum, p) => sum + p.taskCount, 0) + 
                       solutionData.reduce((sum, s) => sum + s.taskCount, 0);
    
    const context: DataContext = {
      lastRefreshed: new Date(),
      products: productData,
      solutions: solutionData,
      customers: customerData,
      statistics: {
        totalProducts: productData.length,
        totalSolutions: solutionData.length,
        totalCustomers: customerData.length,
        totalTasks,
        totalTasksWithTelemetry,
        totalTasksWithoutTelemetry: totalTasks - totalTasksWithTelemetry,
        totalAdoptionPlans: adoptionPlanCount
      },
      entityNameMap
    };
    
    console.log(`[DataContextManager] Data context refreshed in ${Date.now() - startTime}ms`);
    console.log(`[DataContextManager] Stats: ${context.statistics.totalProducts} products, ${context.statistics.totalSolutions} solutions, ${context.statistics.totalCustomers} customers, ${context.statistics.totalTasks} tasks`);
    
    return context;
  }
  
  /**
   * Build the LLM prompt from data context
   */
  private buildContextPrompt(context: DataContext): string {
    let prompt = `\n## Current Database State (as of ${context.lastRefreshed.toISOString()})\n\n`;
    
    // Statistics
    prompt += `### Summary Statistics\n`;
    prompt += `- Total Products: ${context.statistics.totalProducts}\n`;
    prompt += `- Total Solutions: ${context.statistics.totalSolutions}\n`;
    prompt += `- Total Customers: ${context.statistics.totalCustomers}\n`;
    prompt += `- Total Tasks: ${context.statistics.totalTasks}\n`;
    prompt += `- Tasks WITH Telemetry: ${context.statistics.totalTasksWithTelemetry}\n`;
    prompt += `- Tasks WITHOUT Telemetry: ${context.statistics.totalTasksWithoutTelemetry}\n`;
    prompt += `- Total Adoption Plans: ${context.statistics.totalAdoptionPlans}\n\n`;
    
    // Products
    prompt += `### Products (${context.products.length})\n`;
    for (const product of context.products) {
      prompt += `- **${product.name}**: ${product.taskCount} tasks (${product.tasksWithTelemetry} with telemetry, ${product.tasksWithoutTelemetry} without)\n`;
      if (product.licenseNames.length > 0) {
        prompt += `  - Licenses: ${product.licenseNames.join(', ')}\n`;
      }
      if (product.outcomeNames.length > 0) {
        prompt += `  - Outcomes: ${product.outcomeNames.join(', ')}\n`;
      }
    }
    prompt += `\n`;
    
    // Solutions
    prompt += `### Solutions (${context.solutions.length})\n`;
    for (const solution of context.solutions) {
      prompt += `- **${solution.name}**: ${solution.taskCount} tasks, Products: ${solution.productNames.join(', ') || 'None'}\n`;
    }
    prompt += `\n`;
    
    // Customers
    prompt += `### Customers (${context.customers.length})\n`;
    for (const customer of context.customers) {
      const adoptionPlans = [...customer.productAdoptionPlans, ...customer.solutionAdoptionPlans];
      prompt += `- **${customer.name}**: ${adoptionPlans.length > 0 ? `Assignments/Adoption Plans: ${adoptionPlans.join(', ')}` : 'No assignments/adoption plans'}\n`;
    }
    prompt += `\n`;
    
    // Important terminology note
    prompt += `### Terminology Note\n`;
    prompt += `- "Product Assignment" and "Product Adoption Plan" are interchangeable terms\n`;
    prompt += `- "Solution Assignment" and "Solution Adoption Plan" are interchangeable terms\n`;
    prompt += `- When users ask about "assignments" or "adoption plans", treat them as the same concept\n`;
    prompt += `\n`;
    
    // Entity name aliases for matching
    prompt += `### Entity Name Recognition\n`;
    prompt += `When users mention entity names, match them case-insensitively. Examples:\n`;
    
    // Show a few product name variations
    const sampleProducts = context.products.slice(0, 5);
    for (const p of sampleProducts) {
      prompt += `- "${p.name}" or "${p.name.toLowerCase()}" → Product ID: ${p.id}\n`;
    }
    
    // Important query hints
    prompt += `\n### Important Query Patterns\n`;
    prompt += `### Important Prisma Query Patterns\n`;
    prompt += `- To find tasks WITH telemetry: { telemetryAttributes: { some: {} } }\n`;
    prompt += `- To find tasks WITHOUT telemetry: { NOT: { telemetryAttributes: { some: {} } } }\n`;
    prompt += `- IMPORTANT: Do NOT use { telemetryAttributes: { none: {} } } - it doesn't work correctly!\n`;
    prompt += `- To filter by product name: { product: { name: { contains: "ProductName", mode: "insensitive" } } }\n`;
    prompt += `- To filter by solution name: { solution: { name: { contains: "SolutionName", mode: "insensitive" } } }\n`;
    prompt += `- For partial name matching, use "contains" instead of "equals"\n`;
    
    return prompt;
  }
  
  /**
   * Resolve an entity name to its ID
   */
  async resolveEntityId(entityType: 'product' | 'solution' | 'customer', name: string): Promise<string | null> {
    const context = await this.getContext();
    const normalizedName = name.toLowerCase();
    
    switch (entityType) {
      case 'product':
        return context.entityNameMap.products.get(normalizedName) || null;
      case 'solution':
        return context.entityNameMap.solutions.get(normalizedName) || null;
      case 'customer':
        return context.entityNameMap.customers.get(normalizedName) || null;
      default:
        return null;
    }
  }
  
  /**
   * Find best matching entity name using fuzzy matching
   */
  async findBestMatch(entityType: 'product' | 'solution' | 'customer', searchTerm: string): Promise<{ name: string; id: string } | null> {
    const context = await this.getContext();
    const normalizedSearch = searchTerm.toLowerCase();
    
    let entities: Array<{ name: string; id: string }>;
    
    switch (entityType) {
      case 'product':
        entities = context.products.map(p => ({ name: p.name, id: p.id }));
        break;
      case 'solution':
        entities = context.solutions.map(s => ({ name: s.name, id: s.id }));
        break;
      case 'customer':
        entities = context.customers.map(c => ({ name: c.name, id: c.id }));
        break;
      default:
        return null;
    }
    
    // Try exact match first
    const exactMatch = entities.find(e => e.name.toLowerCase() === normalizedSearch);
    if (exactMatch) return exactMatch;
    
    // Try contains match
    const containsMatch = entities.find(e => e.name.toLowerCase().includes(normalizedSearch));
    if (containsMatch) return containsMatch;
    
    // Try reverse contains (search term contains entity name)
    const reverseMatch = entities.find(e => normalizedSearch.includes(e.name.toLowerCase()));
    if (reverseMatch) return reverseMatch;
    
    return null;
  }
}

// Export singleton instance
let instance: DataContextManager | null = null;

/**
 * Get the singleton Data Context Manager instance
 * Always uses the shared Prisma client to prevent connection pool exhaustion
 * 
 * @param prisma - Optional Prisma client (ignored, always uses shared instance)
 */
export function getDataContextManager(prisma?: PrismaClient): DataContextManager {
  if (!instance) {
    // Always use the shared Prisma client to prevent connection leaks
    // The prisma parameter is kept for backward compatibility but ignored
    instance = new DataContextManager(sharedPrisma as PrismaClient);
    console.log('[DataContextManager] Initialized with shared Prisma client');
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetDataContextManager(): void {
  instance = null;
}

