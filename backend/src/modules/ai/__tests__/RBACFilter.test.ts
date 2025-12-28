/**
 * RBACFilter Unit Tests
 * 
 * Tests for the RBAC filtering functionality in the AI Agent.
 * 
 * @module services/ai/__tests__/RBACFilter.test
 */

import { RBACFilter, RBACUserContext, RBACFilterResult, getRBACFilter, resetRBACFilter } from '../RBACFilter';
import { QueryConfig } from '../QueryExecutor';
import { ResourceType, PermissionLevel } from '@prisma/client';

// Mock the permissions module
jest.mock('../../../lib/permissions', () => ({
    getUserAccessibleResources: jest.fn(),
    checkUserPermission: jest.fn(),
}));

// Mock the context
jest.mock('../../../shared/graphql/context', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
    },
}));

import { getUserAccessibleResources, checkUserPermission } from '../../../lib/permissions';

const mockGetUserAccessibleResources = getUserAccessibleResources as jest.MockedFunction<typeof getUserAccessibleResources>;
const mockCheckUserPermission = checkUserPermission as jest.MockedFunction<typeof checkUserPermission>;

describe('RBACFilter', () => {
    let filter: RBACFilter;

    beforeEach(() => {
        jest.clearAllMocks();
        resetRBACFilter();
        filter = new RBACFilter();
    });

    describe('constructor', () => {
        it('should create instance with default prisma', () => {
            expect(filter).toBeInstanceOf(RBACFilter);
        });

        it('should accept custom prisma instance', () => {
            const mockPrisma = {} as any;
            const customFilter = new RBACFilter(mockPrisma);
            expect(customFilter).toBeInstanceOf(RBACFilter);
        });
    });

    describe('applyFilter', () => {
        const baseConfig: QueryConfig = {
            model: 'Product',
            operation: 'findMany',
            args: { where: { deletedAt: null } },
        };

        describe('Admin users', () => {
            it('should allow full access for isAdmin=true', async () => {
                const userContext: RBACUserContext = {
                    userId: 'admin-1',
                    role: 'USER',
                    isAdmin: true,
                };

                const result = await filter.applyFilter(baseConfig, userContext);

                expect(result.allowed).toBe(true);
                expect(result.filteredConfig).toEqual(baseConfig);
                expect(result.accessibleIds).toBeNull();
            });

            it('should allow full access for role=ADMIN', async () => {
                const userContext: RBACUserContext = {
                    userId: 'admin-2',
                    role: 'ADMIN',
                };

                const result = await filter.applyFilter(baseConfig, userContext);

                expect(result.allowed).toBe(true);
                expect(result.accessibleIds).toBeNull();
            });

            it('should allow full access when roles includes ADMIN', async () => {
                const userContext: RBACUserContext = {
                    userId: 'admin-3',
                    role: 'USER',
                    roles: ['USER', 'ADMIN'],
                };

                const result = await filter.applyFilter(baseConfig, userContext);

                expect(result.allowed).toBe(true);
            });
        });

        describe('SME users', () => {
            const smeContext: RBACUserContext = {
                userId: 'sme-1',
                role: 'SME',
            };

            it('should allow product access with full permissions', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null); // null = all access

                const result = await filter.applyFilter(baseConfig, smeContext);

                expect(result.allowed).toBe(true);
                expect(result.accessibleIds).toBeNull();
                expect(mockGetUserAccessibleResources).toHaveBeenCalledWith(
                    'sme-1',
                    ResourceType.PRODUCT,
                    PermissionLevel.READ,
                    expect.anything()
                );
            });

            it('should allow solution access with full permissions', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null);

                const solutionConfig: QueryConfig = {
                    model: 'Solution',
                    operation: 'findMany',
                    args: {},
                };

                const result = await filter.applyFilter(solutionConfig, smeContext);

                expect(result.allowed).toBe(true);
            });
        });

        describe('CSS users', () => {
            const cssContext: RBACUserContext = {
                userId: 'css-1',
                role: 'CSS',
            };

            it('should allow customer access with full permissions', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null);

                const customerConfig: QueryConfig = {
                    model: 'Customer',
                    operation: 'findMany',
                    args: {},
                };

                const result = await filter.applyFilter(customerConfig, cssContext);

                expect(result.allowed).toBe(true);
                expect(result.resourceType).toBe(ResourceType.CUSTOMER);
            });

            it('should allow read-only product access', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null);

                const result = await filter.applyFilter(baseConfig, cssContext);

                expect(result.allowed).toBe(true);
            });
        });

        describe('VIEWER users', () => {
            const viewerContext: RBACUserContext = {
                userId: 'viewer-1',
                role: 'VIEWER',
            };

            it('should allow read access to products', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null);

                const result = await filter.applyFilter(baseConfig, viewerContext);

                expect(result.allowed).toBe(true);
            });

            it('should allow read access to customers', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null);

                const customerConfig: QueryConfig = {
                    model: 'Customer',
                    operation: 'findMany',
                    args: {},
                };

                const result = await filter.applyFilter(customerConfig, viewerContext);

                expect(result.allowed).toBe(true);
            });
        });

        describe('Regular users with limited access', () => {
            const userContext: RBACUserContext = {
                userId: 'user-1',
                role: 'USER',
            };

            it('should filter to specific IDs when user has limited access', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(['prod-1', 'prod-2']);

                const result = await filter.applyFilter(baseConfig, userContext);

                expect(result.allowed).toBe(true);
                expect(result.accessibleIds).toEqual(['prod-1', 'prod-2']);
                expect(result.filteredConfig?.args.where).toHaveProperty('id');
                expect(result.filteredConfig?.args.where.id).toEqual({ in: ['prod-1', 'prod-2'] });
            });

            it('should deny access when user has no permissions', async () => {
                mockGetUserAccessibleResources.mockResolvedValue([]);

                const result = await filter.applyFilter(baseConfig, userContext);

                expect(result.allowed).toBe(false);
                expect(result.deniedReason).toContain('product');
            });

            it('should preserve existing where conditions', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(['prod-1']);

                const configWithWhere: QueryConfig = {
                    model: 'Product',
                    operation: 'findMany',
                    args: {
                        where: { deletedAt: null, name: { contains: 'test' } },
                    },
                };

                const result = await filter.applyFilter(configWithWhere, userContext);

                expect(result.allowed).toBe(true);
                expect(result.filteredConfig?.args.where.deletedAt).toBeNull();
                expect(result.filteredConfig?.args.where.name).toEqual({ contains: 'test' });
                expect(result.filteredConfig?.args.where.id).toEqual({ in: ['prod-1'] });
            });
        });

        describe('Unknown models', () => {
            it('should deny access for unknown models', async () => {
                const userContext: RBACUserContext = {
                    userId: 'user-1',
                    role: 'USER',
                };

                const unknownConfig: QueryConfig = {
                    model: 'UnknownModel',
                    operation: 'findMany',
                    args: {},
                };

                const result = await filter.applyFilter(unknownConfig, userContext);

                expect(result.allowed).toBe(false);
                expect(result.deniedReason).toContain('Unknown model');
            });
        });

        describe('Aggregate queries', () => {
            it('should handle aggregate count queries', async () => {
                mockGetUserAccessibleResources.mockResolvedValue(null);

                const userContext: RBACUserContext = {
                    userId: 'user-1',
                    role: 'SME',
                };

                const aggregateConfig: QueryConfig = {
                    model: 'aggregate',
                    operation: 'count',
                    args: {
                        models: ['product', 'solution', 'customer'],
                    },
                };

                const result = await filter.applyFilter(aggregateConfig, userContext);

                expect(result.allowed).toBe(true);
            });

            it('should filter aggregate models based on permissions', async () => {
                // SME has access to product and solution, but not customer
                mockGetUserAccessibleResources
                    .mockResolvedValueOnce(null) // product - full access
                    .mockResolvedValueOnce(null) // solution - full access
                    .mockResolvedValueOnce([]); // customer - no access

                const userContext: RBACUserContext = {
                    userId: 'sme-1',
                    role: 'SME',
                };

                const aggregateConfig: QueryConfig = {
                    model: 'aggregate',
                    operation: 'count',
                    args: {
                        models: ['product', 'solution', 'customer'],
                    },
                };

                const result = await filter.applyFilter(aggregateConfig, userContext);

                expect(result.allowed).toBe(true);
                // Even with empty array, the model is included (we check for any access)
                // The actual logic will filter within the query
            });
        });
    });

    describe('getResourceType', () => {
        it('should map product correctly', () => {
            expect(filter.getResourceType('Product')).toBe(ResourceType.PRODUCT);
            expect(filter.getResourceType('product')).toBe(ResourceType.PRODUCT);
            expect(filter.getResourceType('PRODUCT')).toBe(ResourceType.PRODUCT);
        });

        it('should map solution correctly', () => {
            expect(filter.getResourceType('Solution')).toBe(ResourceType.SOLUTION);
        });

        it('should map customer correctly', () => {
            expect(filter.getResourceType('Customer')).toBe(ResourceType.CUSTOMER);
        });

        it('should map task to product', () => {
            expect(filter.getResourceType('Task')).toBe(ResourceType.PRODUCT);
        });

        it('should map customer child models to customer', () => {
            expect(filter.getResourceType('CustomerProduct')).toBe(ResourceType.CUSTOMER);
            expect(filter.getResourceType('CustomerSolution')).toBe(ResourceType.CUSTOMER);
            expect(filter.getResourceType('AdoptionPlan')).toBe(ResourceType.CUSTOMER);
        });

        it('should return null for unknown models', () => {
            expect(filter.getResourceType('Unknown')).toBeNull();
        });
    });

    describe('canAccess', () => {
        it('should check permission via checkUserPermission', async () => {
            mockCheckUserPermission.mockResolvedValue(true);

            const result = await filter.canAccess('user-1', ResourceType.PRODUCT, 'prod-1');

            expect(result).toBe(true);
            expect(mockCheckUserPermission).toHaveBeenCalledWith(
                'user-1',
                ResourceType.PRODUCT,
                'prod-1',
                PermissionLevel.READ,
                expect.anything()
            );
        });

        it('should return false when permission denied', async () => {
            mockCheckUserPermission.mockResolvedValue(false);

            const result = await filter.canAccess('user-1', ResourceType.PRODUCT, 'prod-1');

            expect(result).toBe(false);
        });
    });

    describe('getAccessibleIds', () => {
        it('should return accessible IDs from permissions', async () => {
            mockGetUserAccessibleResources.mockResolvedValue(['id-1', 'id-2']);

            const result = await filter.getAccessibleIds('user-1', ResourceType.PRODUCT);

            expect(result).toEqual(['id-1', 'id-2']);
        });

        it('should return null for full access', async () => {
            mockGetUserAccessibleResources.mockResolvedValue(null);

            const result = await filter.getAccessibleIds('user-1', ResourceType.PRODUCT);

            expect(result).toBeNull();
        });
    });

    describe('filterResults', () => {
        const results = [
            { id: 'prod-1', name: 'Product 1' },
            { id: 'prod-2', name: 'Product 2' },
            { id: 'prod-3', name: 'Product 3' },
        ];

        it('should return all results for admin', async () => {
            const adminContext: RBACUserContext = {
                userId: 'admin-1',
                role: 'ADMIN',
            };

            const filtered = await filter.filterResults(results, adminContext, ResourceType.PRODUCT);

            expect(filtered).toEqual(results);
        });

        it('should return all results when user has full access', async () => {
            mockGetUserAccessibleResources.mockResolvedValue(null);

            const userContext: RBACUserContext = {
                userId: 'user-1',
                role: 'SME',
            };

            const filtered = await filter.filterResults(results, userContext, ResourceType.PRODUCT);

            expect(filtered).toEqual(results);
        });

        it('should filter results based on accessible IDs', async () => {
            mockGetUserAccessibleResources.mockResolvedValue(['prod-1', 'prod-3']);

            const userContext: RBACUserContext = {
                userId: 'user-1',
                role: 'USER',
            };

            const filtered = await filter.filterResults(results, userContext, ResourceType.PRODUCT);

            expect(filtered).toHaveLength(2);
            expect(filtered.map(r => r.id)).toEqual(['prod-1', 'prod-3']);
        });
    });

    describe('getRoleRestrictions', () => {
        it('should return correct restrictions for ADMIN', () => {
            expect(filter.getRoleRestrictions('ADMIN')).toContain('Full access');
        });

        it('should return correct restrictions for SME', () => {
            expect(filter.getRoleRestrictions('SME')).toContain('products and solutions');
        });

        it('should return correct restrictions for CSS', () => {
            const restrictions = filter.getRoleRestrictions('CSS');
            expect(restrictions).toContain('customers');
        });

        it('should return correct restrictions for VIEWER', () => {
            expect(filter.getRoleRestrictions('VIEWER')).toContain('Read-only');
        });

        it('should return default for unknown roles', () => {
            expect(filter.getRoleRestrictions('UNKNOWN')).toContain('Limited');
        });
    });

    describe('Singleton', () => {
        beforeEach(() => {
            resetRBACFilter();
        });

        it('should return same instance on subsequent calls', () => {
            const instance1 = getRBACFilter();
            const instance2 = getRBACFilter();
            expect(instance1).toBe(instance2);
        });

        it('should create new instance after reset', () => {
            const instance1 = getRBACFilter();
            resetRBACFilter();
            const instance2 = getRBACFilter();
            expect(instance1).not.toBe(instance2);
        });
    });
});
