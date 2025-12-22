/**
 * RBAC Filter for AI Agent
 * 
 * Applies role-based access control filters to AI-generated queries.
 * Ensures users only see data they are authorized to access.
 * 
 * @module services/ai/RBACFilter
 * @version 1.0.0
 * @created 2025-12-06
 */

import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/graphql/context';
import { getUserAccessibleResources, checkUserPermission } from '../../shared/auth/permissions';
import { QueryConfig } from './QueryExecutor';

/**
 * User context for RBAC filtering
 */
export interface RBACUserContext {
    /** User ID */
    userId: string;
    /** User's primary role */
    role: string;
    /** Whether user is admin */
    isAdmin?: boolean;
    /** All user roles (including assigned roles) */
    roles?: string[];
}

/**
 * Result of applying RBAC filters
 */
export interface RBACFilterResult {
    /** Whether the user has access to execute this query */
    allowed: boolean;
    /** Modified query config with RBAC filters applied */
    filteredConfig?: QueryConfig;
    /** IDs of accessible resources (null = all) */
    accessibleIds?: string[] | null;
    /** Reason if access is denied */
    deniedReason?: string;
    /** Resource type that was checked */
    resourceType?: ResourceType;
}

/**
 * Model to ResourceType mapping
 */
const MODEL_TO_RESOURCE_TYPE: Record<string, ResourceType> = {
    product: ResourceType.PRODUCT,
    solution: ResourceType.SOLUTION,
    customer: ResourceType.CUSTOMER,
    task: ResourceType.PRODUCT, // Tasks belong to products, so use product permissions
    telemetryattribute: ResourceType.PRODUCT,
    customerproduct: ResourceType.CUSTOMER,
    customersolution: ResourceType.CUSTOMER,
    adoptionplan: ResourceType.CUSTOMER,
    customertask: ResourceType.CUSTOMER,
    customertelemetryattribute: ResourceType.CUSTOMER,
    license: ResourceType.PRODUCT,
    outcome: ResourceType.PRODUCT,
    release: ResourceType.PRODUCT,
};

/**
 * Models that require joining to parent for filtering
 */
const CHILD_MODEL_PARENT_FIELD: Record<string, { parentModel: string; parentField: string }> = {
    task: { parentModel: 'product', parentField: 'productId' },
    telemetryattribute: { parentModel: 'task', parentField: 'taskId' },
    license: { parentModel: 'product', parentField: 'productId' },
    outcome: { parentModel: 'product', parentField: 'productId' },
    release: { parentModel: 'product', parentField: 'productId' },
    adoptionplan: { parentModel: 'customerproduct', parentField: 'customerProductId' },
    customertask: { parentModel: 'adoptionplan', parentField: 'adoptionPlanId' },
};

/**
 * RBAC Filter
 * 
 * Filters AI queries based on user permissions.
 * 
 * @example
 * ```typescript
 * const filter = new RBACFilter();
 * const result = await filter.applyFilter(queryConfig, { userId: 'user-1', role: 'SME' });
 * if (result.allowed) {
 *   // Execute result.filteredConfig
 * }
 * ```
 */
export class RBACFilter {
    private prisma: PrismaClient;

    constructor(prisma?: PrismaClient) {
        this.prisma = (prisma as PrismaClient) || (defaultPrisma as PrismaClient);
    }

    /**
     * Apply RBAC filters to a query configuration
     * @param config - The query configuration
     * @param userContext - The user context
     * @returns The filter result with allowed status and modified config
     */
    async applyFilter(
        config: QueryConfig,
        userContext: RBACUserContext
    ): Promise<RBACFilterResult> {
        const { userId, role, isAdmin, roles } = userContext;

        // Admin users have full access
        if (isAdmin || role === 'ADMIN' || roles?.includes('ADMIN')) {
            return {
                allowed: true,
                filteredConfig: config,
                accessibleIds: null, // null = all
                resourceType: this.getResourceType(config.model) || undefined,
            };
        }

        // Determine the resource type for this model
        const resourceType = this.getResourceType(config.model);
        if (!resourceType) {
            // For models without explicit resource types (like aggregate), allow if user has any role
            if (config.model === 'aggregate') {
                return this.handleAggregateQuery(config, userContext);
            }
            return {
                allowed: false,
                deniedReason: `Unknown model type: ${config.model}`,
            };
        }

        // Get accessible resource IDs based on user permissions
        const accessibleIds = await getUserAccessibleResources(
            userId,
            resourceType,
            PermissionLevel.READ,
            this.prisma
        );

        // If user has access to all resources of this type
        if (accessibleIds === null) {
            return {
                allowed: true,
                filteredConfig: config,
                accessibleIds: null,
                resourceType,
            };
        }

        // If user has no access
        if (accessibleIds.length === 0) {
            return {
                allowed: false,
                deniedReason: `No ${resourceType.toLowerCase()} access`,
                resourceType,
            };
        }

        // Apply the filter to the query config
        const filteredConfig = this.addIdFilter(config, resourceType, accessibleIds);

        return {
            allowed: true,
            filteredConfig,
            accessibleIds,
            resourceType,
        };
    }

    /**
     * Check if a user can access a specific resource
     * @param userId - The user ID
     * @param resourceType - The resource type
     * @param resourceId - The specific resource ID (optional)
     * @returns Whether user has access
     */
    async canAccess(
        userId: string,
        resourceType: ResourceType,
        resourceId?: string
    ): Promise<boolean> {
        return checkUserPermission(
            userId,
            resourceType,
            resourceId || null,
            PermissionLevel.READ,
            this.prisma
        );
    }

    /**
     * Get the resource type for a model name
     */
    getResourceType(modelName: string): ResourceType | null {
        const normalized = modelName.toLowerCase().replace(/[^a-z]/g, '');
        return MODEL_TO_RESOURCE_TYPE[normalized] || null;
    }

    /**
     * Get accessible IDs for a user and resource type
     */
    async getAccessibleIds(
        userId: string,
        resourceType: ResourceType
    ): Promise<string[] | null> {
        return getUserAccessibleResources(
            userId,
            resourceType,
            PermissionLevel.READ,
            this.prisma
        );
    }

    /**
     * Handle aggregate query (multi-model counts)
     * Filter the models list to only include accessible ones
     */
    private async handleAggregateQuery(
        config: QueryConfig,
        userContext: RBACUserContext
    ): Promise<RBACFilterResult> {
        const { userId, role, roles } = userContext;
        const { models } = config.args || {};

        if (!models || !Array.isArray(models)) {
            return { allowed: true, filteredConfig: config };
        }

        // Determine which models the user can access based on role
        const allowedModels: string[] = [];

        for (const model of models) {
            const resourceType = this.getResourceType(model);
            if (!resourceType) {
                // Unknown models are excluded
                continue;
            }

            // Check if user has READ access to this resource type
            const accessibleIds = await getUserAccessibleResources(
                userId,
                resourceType,
                PermissionLevel.READ,
                this.prisma
            );

            // null means all access, array means specific access
            if (accessibleIds !== null || accessibleIds === null) {
                allowedModels.push(model);
            }
        }

        if (allowedModels.length === 0) {
            return {
                allowed: false,
                deniedReason: 'No access to any of the requested entities',
            };
        }

        // Return modified config with only allowed models
        return {
            allowed: true,
            filteredConfig: {
                ...config,
                args: {
                    ...config.args,
                    models: allowedModels,
                },
            },
        };
    }

    /**
     * Add ID filter to query configuration
     */
    private addIdFilter(
        config: QueryConfig,
        resourceType: ResourceType,
        accessibleIds: string[]
    ): QueryConfig {
        const modelLower = config.model.toLowerCase();

        // Clone the config
        const newConfig: QueryConfig = {
            ...config,
            args: { ...config.args },
        };

        // Ensure where clause exists
        if (!newConfig.args.where) {
            newConfig.args.where = {};
        }

        // Determine the ID field to filter on
        const idField = this.getIdFieldForModel(modelLower, resourceType);

        // Apply the filter
        if (idField === 'id') {
            // Direct model - filter by its own ID
            newConfig.args.where = {
                ...newConfig.args.where,
                id: { in: accessibleIds },
            };
        } else {
            // Child model - filter by parent ID
            newConfig.args.where = {
                ...newConfig.args.where,
                [idField]: { in: accessibleIds },
            };
        }

        return newConfig;
    }

    /**
     * Get the ID field to filter on for a model
     */
    private getIdFieldForModel(modelName: string, resourceType: ResourceType): string {
        // Check if this is a child model
        const childInfo = CHILD_MODEL_PARENT_FIELD[modelName];
        if (childInfo) {
            return childInfo.parentField;
        }

        // Map from resource type to ID field
        switch (resourceType) {
            case ResourceType.PRODUCT:
                // For models that have productId
                if (['task', 'license', 'outcome', 'release'].includes(modelName)) {
                    return 'productId';
                }
                return 'id';

            case ResourceType.SOLUTION:
                return 'id';

            case ResourceType.CUSTOMER:
                // For customer child models
                if (['customerproduct', 'customersolution'].includes(modelName)) {
                    return 'customerId';
                }
                if (['adoptionplan'].includes(modelName)) {
                    return 'customerProductId';
                }
                return 'id';

            default:
                return 'id';
        }
    }

    /**
     * Filter results post-query based on user permissions
     * Use this when query-time filtering isn't possible
     */
    async filterResults<T extends { id?: string; productId?: string; customerId?: string }>(
        results: T[],
        userContext: RBACUserContext,
        resourceType: ResourceType
    ): Promise<T[]> {
        const { userId, role, isAdmin, roles } = userContext;

        // Admin sees all
        if (isAdmin || role === 'ADMIN' || roles?.includes('ADMIN')) {
            return results;
        }

        const accessibleIds = await this.getAccessibleIds(userId, resourceType);

        // null means all access
        if (accessibleIds === null) {
            return results;
        }

        // Filter results
        return results.filter(item => {
            // Try different ID fields
            const id = item.id || item.productId || item.customerId;
            return id && accessibleIds.includes(id);
        });
    }

    /**
     * Get role-based query restrictions as a human-readable message
     */
    getRoleRestrictions(role: string): string {
        switch (role) {
            case 'ADMIN':
                return 'Full access to all data';
            case 'SME':
                return 'Access to all products and solutions';
            case 'CSS':
            case 'CS':
                return 'Access to all customers, read-only access to products and solutions';
            case 'VIEWER':
                return 'Read-only access to all data';
            case 'USER':
                return 'Access based on specific permissions';
            default:
                return 'Limited access based on permissions';
        }
    }
}

// Singleton instance
let instance: RBACFilter | null = null;

/**
 * Get the singleton RBACFilter instance
 */
export function getRBACFilter(prisma?: PrismaClient): RBACFilter {
    if (!instance) {
        instance = new RBACFilter(prisma);
    }
    return instance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetRBACFilter(): void {
    instance = null;
}
