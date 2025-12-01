import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';

/**
 * Permission hierarchy levels
 * READ < WRITE < ADMIN
 */
const PERMISSION_HIERARCHY: { [key in PermissionLevel]: number } = {
  READ: 1,
  WRITE: 2,
  ADMIN: 3
};

/**
 * Check if user has required permission level for a specific resource
 * 
 * @param userId - The user ID to check permissions for
 * @param resourceType - Type of resource (PRODUCT, SOLUTION, CUSTOMER)
 * @param resourceId - Specific resource ID (or null to check general access)
 * @param requiredLevel - Minimum permission level required (READ, WRITE, ADMIN)
 * @param prisma - Prisma client instance
 * @returns Promise<boolean> - true if user has permission, false otherwise
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

  if (user.isAdmin) {
    return true;
  }

  // Fetch user roles to check for named roles acting as system roles
  const userRolesForSystemCheck = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  const roleNames = userRolesForSystemCheck.map((ur: any) => ur.role?.name).filter(Boolean) as string[];
  const effectiveRoles = [user.role, ...roleNames];

  const isSME = effectiveRoles.includes('SME');
  const isCS = effectiveRoles.includes('CS') || effectiveRoles.includes('CSS');

  // Check System Roles
  if (isSME) {
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return true;
    }
  }

  if (isCS) {
    if (resourceType === ResourceType.CUSTOMER) {
      return true;
    }
    if ((resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) && requiredLevel === PermissionLevel.READ) {
      return true;
    }
  }

  // Track the highest permission level found from ANY source
  let highestPermissionLevel: PermissionLevel | null = null;

  const updateHighestPermission = (level: PermissionLevel) => {
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
    // We need to fetch ALL user roles (not just filtered by resourceType)
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
 * Check if actual permission level meets or exceeds required level
 */
function hasPermissionLevel(
  actual: PermissionLevel,
  required: PermissionLevel
): boolean {
  return PERMISSION_HIERARCHY[actual] >= PERMISSION_HIERARCHY[required];
}

/**
 * Get all resources of a type that user has access to
 * Returns null if user has access to all resources of this type
 * Returns array of resource IDs if user has access to specific resources only
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

  if (user.isAdmin) {
    return null; // Admin has access to all resources
  }

  // Fetch user roles to check for named roles acting as system roles
  const userRolesList = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });
  const roleNames = userRolesList.map((ur: any) => ur.role?.name).filter(Boolean) as string[];
  const effectiveRoles = [user.role, ...roleNames];

  const isSME = effectiveRoles.includes('SME');
  const isCS = effectiveRoles.includes('CS') || effectiveRoles.includes('CSS');

  // Check System Roles
  if (isSME) {
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return null; // SME has access to all Products and Solutions
    }
  }

  if (isCS) {
    if (resourceType === ResourceType.CUSTOMER) {
      return null; // CS has access to all Customers
    }
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return null; // CS has access to all Products and Solutions (Read-only checked elsewhere)
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
    // Get solution permissions directly (without recursion)
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
 * Middleware to require permission for a resolver
 * Throws error if user doesn't have required permission
 */
export async function requirePermission(
  context: any,
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
 * Filter a list of resources to only include those the user has access to
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
 * Check if user can perform an action on a resource
 * Helper function that combines authentication and permission checking
 */
export async function canUserAccessResource(
  context: any,
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
 * Get user's permission level for a specific resource
 * Returns the highest permission level the user has
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
  const roleNames = userRolesForSystemCheck.map((ur: any) => ur.role?.name).filter(Boolean) as string[];
  const effectiveRoles = [user.role, ...roleNames];

  const isSME = effectiveRoles.includes('SME');
  const isCS = effectiveRoles.includes('CS') || effectiveRoles.includes('CSS');

  // Check System Roles
  if (isSME) {
    if (resourceType === ResourceType.PRODUCT || resourceType === ResourceType.SOLUTION) {
      return PermissionLevel.ADMIN;
    }
  }

  if (isCS) {
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

