/**
 * Permission Management Module
 * 
 * Provides Role-Based Access Control (RBAC) functionality for the DAP application.
 * Implements a hybrid permission model combining:
 * - System roles (ADMIN, SME, CSS, USER, VIEWER)
 * - Resource-level permissions (per Product/Solution/Customer)
 * - Bidirectional permission inheritance (Products ↔ Solutions)
 * 
 * @module shared/auth/permissions
 * 
 * @example
 * ```typescript
 * import { checkUserPermission, requirePermission, getUserAccessibleResources } from '@shared/auth/permissions';
 * 
 * // Check if user can edit a product
 * const canEdit = await checkUserPermission(
 *   userId, 
 *   ResourceType.PRODUCT, 
 *   productId, 
 *   PermissionLevel.WRITE, 
 *   prisma
 * );
 * 
 * // Require permission in resolver (throws if denied)
 * await requirePermission(context, ResourceType.PRODUCT, productId, PermissionLevel.WRITE);
 * ```
 */

import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';

/**
 * Permission hierarchy mapping.
 * Higher numbers indicate more permissions.
 * ADMIN (3) includes WRITE (2) which includes READ (1).
 * 
 * @internal
 */
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  READ: 1,
  WRITE: 2,
  ADMIN: 3
};

/**
 * User role with optional role relation.
 * Used for type-safe role extraction.
 * 
 * @internal
 */
interface UserRoleWithRole {
  role?: { name: string } | null;
}

/**
 * GraphQL context with user information.
 * 
 * @interface
 */
interface GraphQLContext {
  /** Authenticated user information */
  user?: {
    /** User's unique identifier */
    userId: string;
    /** User's email address */
    email?: string;
  } | null;
  /** Prisma client instance */
  prisma: PrismaClient;
}

/**
 * Check if a user has the required permission level for a specific resource.
 * 
 * This is the core permission checking function that implements the full
 * RBAC logic including:
 * 1. Admin bypass (admins have full access)
 * 2. System role checks (SME, CSS, VIEWER)
 * 3. Direct user permissions
 * 4. Role-based permissions
 * 5. Bidirectional Product ↔ Solution inheritance
 * 
 * @param userId - The unique identifier of the user to check
 * @param resourceType - The type of resource (PRODUCT, SOLUTION, CUSTOMER, SYSTEM)
 * @param resourceId - Specific resource ID, or null to check type-level access
 * @param requiredLevel - Minimum permission level required (READ, WRITE, ADMIN)
 * @param prisma - Prisma client instance for database queries
 * @returns Promise resolving to true if user has sufficient permission
 * 
 * @example
 * ```typescript
 * // Check if user can view a product
 * const canView = await checkUserPermission(
 *   'user123',
 *   ResourceType.PRODUCT,
 *   'prod456',
 *   PermissionLevel.READ,
 *   prisma
 * );
 * 
 * // Check if user can create any solution (type-level check)
 * const canCreateSolutions = await checkUserPermission(
 *   'user123',
 *   ResourceType.SOLUTION,
 *   null,  // null for type-level check
 *   PermissionLevel.WRITE,
 *   prisma
 * );
 * ```
 */
export async function checkUserPermission(
  userId: string,
  resourceType: ResourceType,
  resourceId: string | null,
  requiredLevel: PermissionLevel,
  prisma: PrismaClient
): Promise<boolean> {
  // 1. Check if user is admin (bypass all checks)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, isActive: true, role: true }
  });

  if (!user) {
    return false;
  }

  if (!user.isActive) {
    return false;
  }

  if (user.isAdmin || user.role === 'ADMIN') {
    return true;
  }

  // Fetch user roles to check for named roles acting as system roles
  const userRolesForSystemCheck = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  const roleNames = userRolesForSystemCheck.map((ur: UserRoleWithRole) => ur.role?.name).filter(Boolean) as string[];
  const effectiveRoles = [user.role, ...roleNames];

  const isSME = effectiveRoles.includes('SME');
  const isCSS = effectiveRoles.includes('CSS');
  const isViewer = effectiveRoles.includes('VIEWER');

  // Check System Roles
  // VIEWER role: Read-only access to everything
  if (isViewer) {
    if (requiredLevel === PermissionLevel.READ) {
      return true; // VIEWER can read all resources
    }
    // VIEWER cannot write or admin anything
  }

  if (isSME) {
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return true;
    }
  }

  if (isCSS) {
    if (resourceType === ResourceType.CUSTOMER) {
      return true;
    }
    if ((resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) && requiredLevel === PermissionLevel.READ) {
      return true;
    }
  }

  // Track the highest permission level found from ANY source
  let highestPermissionLevel: PermissionLevel | null = null;

  const updateHighestPermission = (level: PermissionLevel): void => {
    if (!highestPermissionLevel || PERMISSION_HIERARCHY[level] > PERMISSION_HIERARCHY[highestPermissionLevel]) {
      highestPermissionLevel = level;
    }
  };

  // 2. Check direct user permissions
  const directPermission = await prisma.permission.findFirst({
    where: {
      userId,
      resourceType,
      OR: [
        { resourceId: null },           // System-wide permission
        { resourceId: resourceId || undefined }  // Specific resource permission
      ]
    },
    orderBy: {
      permissionLevel: 'desc'  // Get highest permission level
    }
  });

  if (directPermission) {
    updateHighestPermission(directPermission.permissionLevel);
  }

  // 3. Check role-based permissions for this resource type
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            where: {
              resourceType,
              OR: [
                { resourceId: null },           // All resources of this type
                { resourceId: resourceId || undefined }  // Specific resource
              ]
            }
          }
        }
      }
    }
  });

  // Collect highest permission from role-based permissions
  for (const userRole of userRoles) {
    if (userRole.role?.permissions) {
      for (const rolePerm of userRole.role.permissions) {
        updateHighestPermission(rolePerm.permissionLevel);
      }
    }
  }

  // 4. BIDIRECTIONAL PERMISSION FLOW: Check cross-resource permissions
  //    Products ↔ Solutions relationship

  // If checking for PRODUCT access
  if (resourceType === ResourceType.PRODUCT) {
    // First check if user has "all solutions" permission → grants "all products" permission
    const allSolutionsPermission = await prisma.permission.findFirst({
      where: {
        userId,
        resourceType: ResourceType.SOLUTION,
        resourceId: null, // All solutions
      }
    });

    if (allSolutionsPermission) {
      updateHighestPermission(allSolutionsPermission.permissionLevel);
    }

    // Check role-based "all solutions" permission → grants "all products"
    const allUserRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    for (const userRole of allUserRoles) {
      if (userRole.role?.permissions) {
        for (const rolePerm of userRole.role.permissions) {
          if (rolePerm.resourceType === ResourceType.SOLUTION &&
            rolePerm.resourceId === null) {
            updateHighestPermission(rolePerm.permissionLevel);
          }
        }
      }
    }

    // If checking specific product, also check if user has access via specific solutions
    if (resourceId) {
      // Find solutions containing this product
      const solutionProducts = await prisma.solutionProduct.findMany({
        where: { productId: resourceId },
        select: { solutionId: true }
      });

      for (const sp of solutionProducts) {
        // Check direct permission on solution
        const solutionPermission = await prisma.permission.findFirst({
          where: {
            userId,
            resourceType: ResourceType.SOLUTION,
            resourceId: sp.solutionId // Specific solution
          },
          orderBy: { permissionLevel: 'desc' }
        });

        if (solutionPermission) {
          updateHighestPermission(solutionPermission.permissionLevel);
        }

        // Check role-based permission on solution
        for (const userRole of allUserRoles) {
          if (userRole.role?.permissions) {
            for (const rolePerm of userRole.role.permissions) {
              if (rolePerm.resourceType === ResourceType.SOLUTION &&
                rolePerm.resourceId === sp.solutionId) {
                updateHighestPermission(rolePerm.permissionLevel);
              }
            }
          }
        }
      }
    }
  }

  // If checking for SOLUTION access
  if (resourceType === ResourceType.SOLUTION) {
    // Check if user has "all products" permission → grants "all solutions" permission
    const allProductsPermission = await prisma.permission.findFirst({
      where: {
        userId,
        resourceType: ResourceType.PRODUCT,
        resourceId: null, // All products
      }
    });

    if (allProductsPermission) {
      updateHighestPermission(allProductsPermission.permissionLevel);
    }

    // Check role-based "all products" permission → grants "all solutions"
    const allUserRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    for (const userRole of allUserRoles) {
      if (userRole.role?.permissions) {
        for (const rolePerm of userRole.role.permissions) {
          if (rolePerm.resourceType === ResourceType.PRODUCT &&
            rolePerm.resourceId === null) {
            updateHighestPermission(rolePerm.permissionLevel);
          }
        }
      }
    }

    // If checking specific solution, check if user has access to ALL products in the solution
    if (resourceId) {
      const solutionProducts = await prisma.solutionProduct.findMany({
        where: { solutionId: resourceId },
        select: { productId: true }
      });

      // If solution has no products, deny access
      if (solutionProducts.length === 0) {
        return false;
      }

      // Check if user has access to ALL products in the solution
      let hasAccessToAllProducts = true;

      for (const sp of solutionProducts) {
        // Check if user has permission for this product
        const productPermission = await prisma.permission.findFirst({
          where: {
            userId,
            resourceType: ResourceType.PRODUCT,
            OR: [
              { resourceId: null }, // All products
              { resourceId: sp.productId } // Specific product
            ]
          }
        });

        let hasProductAccess = false;

        if (productPermission && hasPermissionLevel(productPermission.permissionLevel, requiredLevel)) {
          hasProductAccess = true;
        }

        // Check role-based permission for this product
        if (!hasProductAccess) {
          for (const userRole of userRoles) {
            if (userRole.role?.permissions) {
              for (const rolePerm of userRole.role.permissions) {
                if (rolePerm.resourceType === ResourceType.PRODUCT &&
                  (rolePerm.resourceId === null || rolePerm.resourceId === sp.productId) &&
                  hasPermissionLevel(rolePerm.permissionLevel, requiredLevel)) {
                  hasProductAccess = true;
                  break;
                }
              }
              if (hasProductAccess) break;
            }
          }
        }

        if (!hasProductAccess) {
          hasAccessToAllProducts = false;
          break;
        }
      }

      if (hasAccessToAllProducts && solutionProducts.length > 0) {
        // User has access to all products in this solution
        // Find the LOWEST permission level among the products (most restrictive)
        let lowestProductPermission: PermissionLevel = PermissionLevel.ADMIN;

        for (const sp of solutionProducts) {
          const productPermission = await prisma.permission.findFirst({
            where: {
              userId,
              resourceType: ResourceType.PRODUCT,
              OR: [
                { resourceId: null },
                { resourceId: sp.productId }
              ]
            },
            orderBy: { permissionLevel: 'desc' }
          });

          if (productPermission) {
            if (PERMISSION_HIERARCHY[productPermission.permissionLevel] < PERMISSION_HIERARCHY[lowestProductPermission]) {
              lowestProductPermission = productPermission.permissionLevel;
            }
          }

          // Also check role-based permissions
          for (const userRole of allUserRoles) {
            if (userRole.role?.permissions) {
              for (const rolePerm of userRole.role.permissions) {
                if (rolePerm.resourceType === ResourceType.PRODUCT &&
                  (rolePerm.resourceId === null || rolePerm.resourceId === sp.productId)) {
                  if (PERMISSION_HIERARCHY[rolePerm.permissionLevel] < PERMISSION_HIERARCHY[lowestProductPermission]) {
                    lowestProductPermission = rolePerm.permissionLevel;
                  }
                }
              }
            }
          }
        }

        updateHighestPermission(lowestProductPermission);
      }
    }
  }

  // Final check: return true if highest permission level meets required level
  if (highestPermissionLevel && hasPermissionLevel(highestPermissionLevel, requiredLevel)) {
    return true;
  }

  return false;
}

/**
 * Check if an actual permission level meets or exceeds the required level.
 * 
 * @param actual - The permission level the user has
 * @param required - The permission level required for the action
 * @returns True if actual >= required in the permission hierarchy
 * 
 * @internal
 */
function hasPermissionLevel(
  actual: PermissionLevel,
  required: PermissionLevel
): boolean {
  return PERMISSION_HIERARCHY[actual] >= PERMISSION_HIERARCHY[required];
}

/**
 * Get all resource IDs that a user has access to for a given resource type.
 * 
 * This function is useful for filtering queries to only return resources
 * the user can see, without checking each resource individually.
 * 
 * @param userId - The unique identifier of the user
 * @param resourceType - The type of resource to check
 * @param minPermissionLevel - Minimum permission level required
 * @param prisma - Prisma client instance
 * @returns Promise resolving to:
 *   - `null` if user has access to ALL resources of this type
 *   - `string[]` array of accessible resource IDs if limited access
 *   - `[]` empty array if no access
 * 
 * @example
 * ```typescript
 * const accessibleProductIds = await getUserAccessibleResources(
 *   userId,
 *   ResourceType.PRODUCT,
 *   PermissionLevel.READ,
 *   prisma
 * );
 * 
 * if (accessibleProductIds === null) {
 *   // User can access all products
 *   return prisma.product.findMany();
 * } else if (accessibleProductIds.length === 0) {
 *   // User has no access
 *   return [];
 * } else {
 *   // User has limited access
 *   return prisma.product.findMany({
 *     where: { id: { in: accessibleProductIds } }
 *   });
 * }
 * ```
 */
export async function getUserAccessibleResources(
  userId: string,
  resourceType: ResourceType,
  minPermissionLevel: PermissionLevel,
  prisma: PrismaClient
): Promise<string[] | null> {
  // Special handling for fallback/test users (e.g., "admin" created by requireUser)
  if (userId === 'admin') {
    return null; // Fallback admin has access to all resources
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, isActive: true, role: true }
  });

  if (!user || !user.isActive) {
    return [];
  }

  if (user.isAdmin || user.role === 'ADMIN') {
    return null; // Admin has access to all resources
  }

  // Fetch user roles to check for named roles acting as system roles
  const userRolesList = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  const roleNames = userRolesList.map((ur: UserRoleWithRole) => ur.role?.name).filter(Boolean) as string[];
  const effectiveRoles = [user.role, ...roleNames];

  const isSME = effectiveRoles.includes('SME');
  const isCSS = effectiveRoles.includes('CSS');
  const isViewer = effectiveRoles.includes('VIEWER');

  // Check System Roles
  // VIEWER role: Read-only access to everything
  if (isViewer && minPermissionLevel === PermissionLevel.READ) {
    return null; // VIEWER has read access to ALL resources
  }

  if (isSME) {
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return null; // SME has access to all Products and Solutions
    }
  }

  if (isCSS) {
    if (resourceType === ResourceType.CUSTOMER) {
      return null; // CS has access to all Customers
    }
    if ((resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) && minPermissionLevel === PermissionLevel.READ) {
      return null; // CSS has Read-only access to all Products and Solutions
    }
  }

  const accessibleResourceIds = new Set<string>();
  let hasAllAccess = false;

  // 1. Check direct permissions
  const directPermissions = await prisma.permission.findMany({
    where: {
      userId,
      resourceType
    }
  });

  for (const perm of directPermissions) {
    if (hasPermissionLevel(perm.permissionLevel, minPermissionLevel)) {
      if (perm.resourceId === null) {
        hasAllAccess = true;
        break;
      } else {
        accessibleResourceIds.add(perm.resourceId);
      }
    }
  }

  if (hasAllAccess) {
    return null; // Has access to all resources
  }

  // 2. Check role-based permissions
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            where: { resourceType }
          }
        }
      }
    }
  });

  for (const userRole of userRoles) {
    if (userRole.role?.permissions) {
      for (const rolePerm of userRole.role.permissions) {
        if (hasPermissionLevel(rolePerm.permissionLevel, minPermissionLevel)) {
          if (rolePerm.resourceId === null) {
            return null; // Has access to all resources
          } else {
            accessibleResourceIds.add(rolePerm.resourceId);
          }
        }
      }
    }
  }

  // 3. BIDIRECTIONAL PERMISSION FLOW: Check cross-resource permissions

  // If checking for PRODUCTS
  if (resourceType === ResourceType.PRODUCT) {
    // Products are accessible via solution permissions
    const solutionPermissions = await prisma.permission.findMany({
      where: {
        userId,
        resourceType: ResourceType.SOLUTION
      }
    });

    const solutionAccessibleIds = new Set<string>();
    let hasAllSolutionsAccess = false;

    for (const perm of solutionPermissions) {
      if (hasPermissionLevel(perm.permissionLevel, minPermissionLevel)) {
        if (perm.resourceId === null) {
          hasAllSolutionsAccess = true;
          break;
        } else {
          solutionAccessibleIds.add(perm.resourceId);
        }
      }
    }

    // Check role-based solution permissions
    if (!hasAllSolutionsAccess) {
      const solutionRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                where: { resourceType: ResourceType.SOLUTION }
              }
            }
          }
        }
      });

      for (const userRole of solutionRoles) {
        if (userRole.role?.permissions) {
          for (const rolePerm of userRole.role.permissions) {
            if (hasPermissionLevel(rolePerm.permissionLevel, minPermissionLevel)) {
              if (rolePerm.resourceId === null) {
                hasAllSolutionsAccess = true;
                break;
              } else {
                solutionAccessibleIds.add(rolePerm.resourceId);
              }
            }
          }
          if (hasAllSolutionsAccess) break;
        }
      }
    }

    if (hasAllSolutionsAccess) {
      // User has access to ALL solutions → has access to ALL products
      return null;
    }

    if (solutionAccessibleIds.size > 0) {
      // Get all products from accessible solutions
      const solutionProducts = await prisma.solutionProduct.findMany({
        where: {
          solutionId: { in: Array.from(solutionAccessibleIds) }
        },
        select: { productId: true }
      });

      for (const sp of solutionProducts) {
        accessibleResourceIds.add(sp.productId);
      }
    }
  }

  // If checking for SOLUTIONS
  if (resourceType === ResourceType.SOLUTION) {
    // Check if user has "all products" permission → grants "all solutions"
    const allProductsPermissions = await prisma.permission.findMany({
      where: {
        userId,
        resourceType: ResourceType.PRODUCT,
        resourceId: null // All products
      }
    });

    for (const perm of allProductsPermissions) {
      if (hasPermissionLevel(perm.permissionLevel, minPermissionLevel)) {
        return null; // Has access to all products → all solutions
      }
    }

    // Check role-based "all products" permission
    const productRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                resourceType: ResourceType.PRODUCT,
                resourceId: null // All products
              }
            }
          }
        }
      }
    });

    for (const userRole of productRoles) {
      if (userRole.role?.permissions) {
        for (const rolePerm of userRole.role.permissions) {
          if (hasPermissionLevel(rolePerm.permissionLevel, minPermissionLevel)) {
            return null; // Has access to all products → all solutions
          }
        }
      }
    }

    // Get all products user has access to (directly, no recursion)
    const productPermissions = await prisma.permission.findMany({
      where: {
        userId,
        resourceType: ResourceType.PRODUCT
      }
    });

    const productAccessibleIds = new Set<string>();
    let hasAllProductsAccess = false;

    for (const perm of productPermissions) {
      if (hasPermissionLevel(perm.permissionLevel, minPermissionLevel)) {
        if (perm.resourceId === null) {
          hasAllProductsAccess = true;
          break;
        } else {
          productAccessibleIds.add(perm.resourceId);
        }
      }
    }

    // Check role-based product permissions
    if (!hasAllProductsAccess) {
      const productRoles2 = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                where: { resourceType: ResourceType.PRODUCT }
              }
            }
          }
        }
      });

      for (const userRole of productRoles2) {
        if (userRole.role?.permissions) {
          for (const rolePerm of userRole.role.permissions) {
            if (hasPermissionLevel(rolePerm.permissionLevel, minPermissionLevel)) {
              if (rolePerm.resourceId === null) {
                hasAllProductsAccess = true;
                break;
              } else {
                productAccessibleIds.add(rolePerm.resourceId);
              }
            }
          }
          if (hasAllProductsAccess) break;
        }
      }
    }

    if (hasAllProductsAccess) {
      // User has access to ALL products → has access to ALL solutions
      return null;
    }

    if (productAccessibleIds.size > 0) {
      // Find solutions where user has access to ALL products in the solution
      const allSolutions = await prisma.solution.findMany({
        where: { deletedAt: null },
        select: { id: true }
      });

      for (const solution of allSolutions) {
        const solutionProducts = await prisma.solutionProduct.findMany({
          where: { solutionId: solution.id },
          select: { productId: true }
        });

        // Check if user has access to ALL products in this solution
        const allProductsAccessible = solutionProducts.every(sp =>
          productAccessibleIds.has(sp.productId)
        );

        if (solutionProducts.length > 0 && allProductsAccessible) {
          accessibleResourceIds.add(solution.id);
        }
      }
    }
  }

  return Array.from(accessibleResourceIds);
}

/**
 * Require permission for a GraphQL resolver operation.
 * 
 * This is a convenience function that throws an error if the user
 * doesn't have the required permission. Use this in resolvers to
 * enforce access control.
 * 
 * @param context - GraphQL context containing user and prisma
 * @param resourceType - The type of resource being accessed
 * @param resourceId - Specific resource ID, or null for type-level check
 * @param requiredLevel - Minimum permission level required
 * @throws Error if user is not authenticated or doesn't have permission
 * 
 * @example
 * ```typescript
 * const resolvers = {
 *   Mutation: {
 *     updateProduct: async (_, { id, input }, context) => {
 *       // This will throw if user can't edit this product
 *       await requirePermission(context, ResourceType.PRODUCT, id, PermissionLevel.WRITE);
 *       
 *       // User has permission, proceed with update
 *       return prisma.product.update({ where: { id }, data: input });
 *     }
 *   }
 * };
 * ```
 */
export async function requirePermission(
  context: GraphQLContext,
  resourceType: ResourceType,
  resourceId: string | null,
  requiredLevel: PermissionLevel
): Promise<void> {
  if (!context.user) {
    throw new Error('Authentication required');
  }

  const hasPermission = await checkUserPermission(
    context.user.userId,
    resourceType,
    resourceId,
    requiredLevel,
    context.prisma
  );

  if (!hasPermission) {
    throw new Error(`You do not have ${requiredLevel} permission for this ${resourceType.toLowerCase()}`);
  }
}

/**
 * Filter a list of resources to only include those the user can access.
 * 
 * This is a convenience function for filtering query results. It's more
 * efficient than checking each resource individually when you have the
 * full list already.
 * 
 * @typeParam T - Resource type with an `id` property
 * @param userId - The unique identifier of the user
 * @param resourceType - The type of resources being filtered
 * @param resources - Array of resources to filter
 * @param minPermissionLevel - Minimum permission level required
 * @param prisma - Prisma client instance
 * @returns Promise resolving to filtered array of accessible resources
 * 
 * @example
 * ```typescript
 * const allProducts = await prisma.product.findMany();
 * const accessibleProducts = await filterAccessibleResources(
 *   userId,
 *   ResourceType.PRODUCT,
 *   allProducts,
 *   PermissionLevel.READ,
 *   prisma
 * );
 * ```
 */
export async function filterAccessibleResources<T extends { id: string }>(
  userId: string,
  resourceType: ResourceType,
  resources: T[],
  minPermissionLevel: PermissionLevel,
  prisma: PrismaClient
): Promise<T[]> {
  const accessibleIds = await getUserAccessibleResources(
    userId,
    resourceType,
    minPermissionLevel,
    prisma
  );

  // null means access to all
  if (accessibleIds === null) {
    return resources;
  }

  // Empty array means no access
  if (accessibleIds.length === 0) {
    return [];
  }

  // Filter to only accessible resources
  return resources.filter(r => accessibleIds.includes(r.id));
}

/**
 * Check if a user can access a specific resource.
 * 
 * This is a convenience wrapper around checkUserPermission that extracts
 * the userId from the GraphQL context.
 * 
 * @param context - GraphQL context containing user and prisma
 * @param resourceType - The type of resource being accessed
 * @param resourceId - The specific resource ID to check
 * @param requiredLevel - Minimum permission level required
 * @returns Promise resolving to true if user can access the resource
 * 
 * @example
 * ```typescript
 * const canEdit = await canUserAccessResource(
 *   context,
 *   ResourceType.PRODUCT,
 *   productId,
 *   PermissionLevel.WRITE
 * );
 * 
 * if (canEdit) {
 *   // Show edit button
 * }
 * ```
 */
export async function canUserAccessResource(
  context: GraphQLContext,
  resourceType: ResourceType,
  resourceId: string,
  requiredLevel: PermissionLevel
): Promise<boolean> {
  if (!context.user) {
    return false;
  }

  return await checkUserPermission(
    context.user.userId,
    resourceType,
    resourceId,
    requiredLevel,
    context.prisma
  );
}

/**
 * Get the highest permission level a user has for a specific resource.
 * 
 * This is useful for UI purposes - e.g., showing different options
 * based on what the user can do with a resource.
 * 
 * @param userId - The unique identifier of the user
 * @param resourceType - The type of resource
 * @param resourceId - Specific resource ID, or null for type-level check
 * @param prisma - Prisma client instance
 * @returns Promise resolving to the highest permission level, or null if no access
 * 
 * @example
 * ```typescript
 * const level = await getUserPermissionLevel(
 *   userId,
 *   ResourceType.PRODUCT,
 *   productId,
 *   prisma
 * );
 * 
 * if (level === PermissionLevel.ADMIN) {
 *   // Can delete
 * } else if (level === PermissionLevel.WRITE) {
 *   // Can edit but not delete
 * } else if (level === PermissionLevel.READ) {
 *   // Can only view
 * } else {
 *   // No access
 * }
 * ```
 */
export async function getUserPermissionLevel(
  userId: string,
  resourceType: ResourceType,
  resourceId: string | null,
  prisma: PrismaClient
): Promise<PermissionLevel | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, isActive: true, role: true }
  });

  if (!user || !user.isActive) {
    return null;
  }

  if (user.isAdmin) {
    return PermissionLevel.ADMIN;
  }

  // Fetch user roles to check for named roles acting as system roles
  const userRolesForSystemCheck = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  const roleNames = userRolesForSystemCheck.map((ur: UserRoleWithRole) => ur.role?.name).filter(Boolean) as string[];
  const effectiveRoles = [user.role, ...roleNames];

  const isSME = effectiveRoles.includes('SME');
  const isCSS = effectiveRoles.includes('CSS');

  // Check System Roles
  if (isSME) {
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return PermissionLevel.ADMIN;
    }
  }

  if (isCSS) {
    if (resourceType === ResourceType.CUSTOMER) {
      return PermissionLevel.ADMIN;
    }
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return PermissionLevel.READ;
    }
  }

  let highestLevel: PermissionLevel | null = null;

  // Check direct permissions
  const directPermissions = await prisma.permission.findMany({
    where: {
      userId,
      resourceType,
      OR: [
        { resourceId: null },
        { resourceId: resourceId || undefined }
      ]
    }
  });

  for (const perm of directPermissions) {
    if (!highestLevel || PERMISSION_HIERARCHY[perm.permissionLevel] > PERMISSION_HIERARCHY[highestLevel]) {
      highestLevel = perm.permissionLevel;
    }
  }

  // Check role permissions
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            where: {
              resourceType,
              OR: [
                { resourceId: null },
                { resourceId: resourceId || undefined }
              ]
            }
          }
        }
      }
    }
  });

  for (const userRole of userRoles) {
    if (userRole.role?.permissions) {
      for (const rolePerm of userRole.role.permissions) {
        if (!highestLevel || PERMISSION_HIERARCHY[rolePerm.permissionLevel] > PERMISSION_HIERARCHY[highestLevel]) {
          highestLevel = rolePerm.permissionLevel;
        }
      }
    }
  }

  return highestLevel;
}
