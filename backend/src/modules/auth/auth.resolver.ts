import { createAuthService } from './auth.service';
import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';

// Helper to fetch full user details for UserExtended
const getExtendedUser = async (context: any, userId: string) => {
  const user = await context.prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) return null;

  const authService = createAuthService(context.prisma);
  const permissions = await authService.getUserPermissions(user.id);

  const userRoles = await context.prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: {
        select: { name: true }
      }
    }
  });

  const roles = userRoles
    .filter((ur: any) => ur.role)
    .map((ur: any) => ur.role.name);

  return {
    ...user,
    role: user.role,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    permissions,
    roles
  };
};

export const AuthQueryResolvers = {
  me: async (_: any, __: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }
    const extendedUser = await getExtendedUser(context, context.user.userId);
    if (!extendedUser) {
      throw new Error('User not found');
    }
    return extendedUser;
  },

  users: async (_: any, __: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    return authService.getAllUsers(context.user.userId);
  },

  roles: async (_: any, __: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can view all roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can view roles');
    }

    const roles = await context.prisma.role.findMany({
      include: {
        permissions: true,
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Fetch resource names for all permissions
    const rolePermissionsWithNames = await Promise.all(
      roles.map(async (role: any) => {
        const permissionsWithNames = await Promise.all(
          role.permissions.map(async (p: any) => {
            let resourceName = null;

            // Fetch resource name if resourceId is specified
            if (p.resourceId) {
              try {
                if (p.resourceType === 'PRODUCT') {
                  const product = await context.prisma.product.findUnique({
                    where: { id: p.resourceId },
                    select: { name: true }
                  });
                  resourceName = product?.name || null;
                } else if (p.resourceType === 'SOLUTION') {
                  const solution = await context.prisma.solution.findUnique({
                    where: { id: p.resourceId },
                    select: { name: true }
                  });
                  resourceName = solution?.name || null;
                } else if (p.resourceType === 'CUSTOMER') {
                  const customer = await context.prisma.customer.findUnique({
                    where: { id: p.resourceId },
                    select: { name: true }
                  });
                  resourceName = customer?.name || null;
                }
              } catch (err) {
                console.error(`Error fetching resource name for ${p.resourceType}:${p.resourceId}`, err);
              }
            }

            return {
              id: p.id,
              resourceType: p.resourceType,
              resourceId: p.resourceId,
              resourceName,
              permissionLevel: p.permissionLevel
            };
          })
        );

        return {
          id: role.id,
          name: role.name,
          description: role.description,
          userCount: role.userRoles.length,
          users: role.userRoles.map((ur: any) => ur.user),
          permissions: permissionsWithNames
        };
      })
    );

    return rolePermissionsWithNames;
  },

  role: async (_: any, { id }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can view roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can view role details');
    }

    const role = await context.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        userRoles: true
      }
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role.userRoles.length,
      permissions: role.permissions.map((p: any) => ({
        id: p.id,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
        permissionLevel: p.permissionLevel
      }))
    };
  },

  userRoles: async (_: any, { userId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const userRoles = await context.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    return userRoles
      .filter((ur: any) => ur.role) // Only return roles that exist in the Role table
      .map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map((p: any) => ({
          id: p.id,
          resourceType: p.resourceType,
          resourceId: p.resourceId,
          permissionLevel: p.permissionLevel
        }))
      }));
  },

  availableResources: async (_: any, { resourceType }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can view available resources
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can view available resources');
    }

    const resources: any[] = [];

    // Fetch products
    if (!resourceType || resourceType === 'PRODUCT') {
      const products = await context.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true }
      });
      resources.push(...products.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: 'PRODUCT'
      })));
    }

    // Fetch solutions
    if (!resourceType || resourceType === 'SOLUTION') {
      const solutions = await context.prisma.solution.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true }
      });
      resources.push(...solutions.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'SOLUTION'
      })));
    }

    // Fetch customers
    if (!resourceType || resourceType === 'CUSTOMER') {
      const customers = await context.prisma.customer.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true }
      });
      resources.push(...customers.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: 'CUSTOMER'
      })));
    }

    return resources;
  },

  user: async (_: any, { id }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Check if requester is admin or requesting own info
    if (!context.user.isAdmin && context.user.userId !== id) {
      throw new Error('Not authorized');
    }

    const user = await context.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const authService = createAuthService(context.prisma);
    const permissions = await authService.getUserPermissions(id);

    const userRoles = await context.prisma.userRole.findMany({
      where: { userId: id }
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword
      },
      permissions: permissions.map((p: any) => ({
        userId: id,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
        permissionLevel: p.permissionLevel
      })),
      roles: userRoles.map((r: any) => r.roleName)
    };
  },

  myPermissions: async (_: any, __: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    return authService.getUserPermissions(context.user.userId);
  },

  auditLogs: async (_: any, { limit = 100, offset = 0 }: any, context: any) => {
    if (!context.user || !context.user.isAdmin) {
      throw new Error('Admin access required');
    }

    const logs = await context.prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });

    return logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.stringify(log.details) : null
    }));
  }
};

export const AuthMutationResolvers = {
  signup: async (_: any, { email, username, password, role, name }: any, context: any) => {
    const authService = createAuthService(context.prisma);
    return authService.signup(email, username, password, role, name);
  },

  login: async (_: any, { email, username, password }: any, context: any) => {
    const authService = createAuthService(context.prisma);
    // AuthService.login accepts "username" but treats it as username OR email
    const result = await authService.login(email || username, password);
    return result.tokens.token;
  },

  simpleLogin: async (_: any, { username, password }: any, context: any) => {
    const authService = createAuthService(context.prisma);
    const result = await authService.login(username, password);
    return result.tokens.token;
  },

  loginExtended: async (_: any, { username, password }: any, context: any) => {
    const authService = createAuthService(context.prisma);
    const result = await authService.login(username, password);
    const extendedUser = await getExtendedUser(context, result.user.id);
    return {
      token: result.tokens.token,
      refreshToken: result.tokens.refreshToken,
      user: extendedUser!
    };
  },

  logout: async (_: any, __: any, context: any) => {
    if (!context.user) {
      return false;
    }

    // Log logout
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'logout',
        details: { message: 'User logged out' }
      }
    });

    return true;
  },

  refreshToken: async (_: any, { refreshToken }: any, context: any) => {
    try {
      const authService = createAuthService(context.prisma);
      const decoded = authService.verifyToken(refreshToken);

      if (!decoded.sessionId) {
        throw new Error('Invalid token: missing session ID');
      }

      // Verify session exists and is active
      const session = await context.prisma.session.findUnique({
        where: { id: decoded.sessionId }
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired or invalid');
      }

      const user = await context.prisma.user.findUnique({
        where: {
          id: decoded.userId,
          isActive: true
        }
      });

      if (!user) {
        throw new Error('User not found or inactive');
      }

      const permissions = await authService.getUserPermissions(user.id);

      // Get user roles
      const userRoles = await context.prisma.userRole.findMany({
        where: { userId: user.id },
        include: {
          role: {
            select: { name: true }
          }
        }
      });
      const roles = userRoles
        .filter((ur: any) => ur.role)
        .map((ur: any) => ur.role.name);

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword
      };

      return {
        token: authService.generateToken(userData, permissions, session.id, roles),
        refreshToken: authService.generateRefreshToken(user.id, session.id)
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  },

  createUser: async (_: any, { input }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    const tempUser = await authService.createUser(context.user.userId, input);
    const extendedUser = await getExtendedUser(context, tempUser.id);
    return extendedUser!;
  },

  updateUser: async (_: any, { userId, input }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    await authService.updateUser(context.user.userId, userId, input);
    const extendedUser = await getExtendedUser(context, userId);
    return extendedUser!;
  },

  deleteUser: async (_: any, { userId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    await authService.deleteUser(context.user.userId, userId);
    return true;
  },

  changePassword: async (_: any, { input }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const { userId, oldPassword, newPassword } = input;
    const authService = createAuthService(context.prisma);

    await authService.changePassword(
      userId,
      oldPassword,
      newPassword,
      context.user.userId
    );

    return true;
  },

  resetPasswordToDefault: async (_: any, { userId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    await authService.resetPasswordToDefault(context.user.userId, userId);
    return true;
  },

  grantPermission: async (_: any, { input }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const { userId, resourceType, resourceId, permissionLevel } = input;
    const authService = createAuthService(context.prisma);

    await authService.grantPermission(
      context.user.userId,
      userId,
      resourceType as ResourceType,
      resourceId,
      permissionLevel as PermissionLevel
    );

    return true;
  },

  revokePermission: async (_: any, { userId, resourceType, resourceId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    await authService.revokePermission(
      context.user.userId,
      userId,
      resourceType as ResourceType,
      resourceId
    );

    return true;
  },

  activateUser: async (_: any, { userId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    await authService.activateUser(context.user.userId, userId);
    return true;
  },

  deactivateUser: async (_: any, { userId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const authService = createAuthService(context.prisma);
    await authService.deactivateUser(context.user.userId, userId);
    return true;
  },

  updateRolePermissions: async (_: any, { roleId, roleName, permissions }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can update role permissions
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can update role permissions');
    }

    // Find role by ID or name
    let role: any;
    if (roleId) {
      role = await context.prisma.role.findUnique({
        where: { id: roleId }
      });
    } else if (roleName) {
      role = await context.prisma.role.findUnique({
        where: { name: roleName }
      });
    } else {
      throw new Error('Must provide either roleId or roleName');
    }

    if (!role) {
      throw new Error(`Role not found: ${roleName || roleId}`);
    }

    // Update permissions in a transaction
    const result = await context.prisma.$transaction(async (tx: any) => {
      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Create new permissions
      if (permissions && permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p: any) => ({
            roleId: role.id,
            resourceType: p.resourceType,
            resourceId: p.resourceId || null,
            permissionLevel: p.permissionLevel
          }))
        });
      }

      // Fetch the role with updated permissions
      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: true,
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  fullName: true
                }
              }
            }
          }
        }
      });
    });

    // Log audit entry
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'update_role_permissions',
        details: {
          roleId: result.id,
          roleName: result.name,
          permissionsCount: permissions.length
        }
      }
    });

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      userCount: result.userRoles.length,
      users: result.userRoles.map((ur: any) => ({
        id: ur.user.id,
        username: ur.user.username,
        email: ur.user.email,
        fullName: ur.user.fullName
      })),
      permissions: result.permissions.map((p: any) => ({
        id: p.id,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
        resourceName: p.resourceId === 'ALL' ? 'All Resources' : p.resourceId,
        permissionLevel: p.permissionLevel
      }))
    };
  },

  createRole: async (_: any, { input }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can create roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can create roles');
    }

    // Check if role already exists
    const existing = await context.prisma.role.findUnique({
      where: { name: input.name }
    });
    if (existing) {
      throw new Error('Role already exists');
    }

    // Create role and permissions in a transaction
    const result = await context.prisma.$transaction(async (tx: any) => {
      // Create the role
      const role = await tx.role.create({
        data: {
          name: input.name,
          description: input.description || null
        }
      });

      // Create permissions if provided
      if (input.permissions && input.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissions.map((p: any) => ({
            roleId: role.id,
            resourceType: p.resourceType,
            resourceId: p.resourceId || null,
            permissionLevel: p.permissionLevel
          }))
        });
      }

      // Fetch the role with permissions
      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: true,
          userRoles: true
        }
      });
    });

    // Log audit entry
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'create_role',
        details: { roleId: result.id, roleName: input.name }
      }
    });

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      userCount: 0,
      permissions: result.permissions.map((p: any) => ({
        id: p.id,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
        permissionLevel: p.permissionLevel
      }))
    };
  },

  updateRole: async (_: any, { roleId, input }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can update roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can update roles');
    }

    // Check if role exists
    const existingRole = await context.prisma.role.findUnique({
      where: { id: roleId }
    });
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // If name is being changed, check for duplicates
    if (input.name && input.name !== existingRole.name) {
      const duplicate = await context.prisma.role.findUnique({
        where: { name: input.name }
      });
      if (duplicate) {
        throw new Error('A role with this name already exists');
      }
    }

    // Update role and permissions in a transaction
    const result = await context.prisma.$transaction(async (tx: any) => {
      // Update the role
      const role = await tx.role.update({
        where: { id: roleId },
        data: {
          name: input.name || existingRole.name,
          description: input.description !== undefined ? input.description : existingRole.description
        }
      });

      // Replace permissions if provided
      if (input.permissions) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId }
        });

        // Create new permissions
        if (input.permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: input.permissions.map((p: any) => ({
              roleId,
              resourceType: p.resourceType,
              resourceId: p.resourceId || null,
              permissionLevel: p.permissionLevel
            }))
          });
        }
      }

      // Fetch the role with permissions
      return tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: true,
          userRoles: true
        }
      });
    });

    // Log audit entry
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'update_role',
        details: { roleId, roleName: result.name }
      }
    });

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      userCount: result.userRoles.length,
      permissions: result.permissions.map((p: any) => ({
        id: p.id,
        resourceType: p.resourceType,
        resourceId: p.resourceId,
        permissionLevel: p.permissionLevel
      }))
    };
  },

  deleteRole: async (_: any, { roleId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can delete roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can delete roles');
    }

    // Check if role exists
    const role = await context.prisma.role.findUnique({
      where: { id: roleId },
      include: { userRoles: true }
    });
    if (!role) {
      throw new Error('Role not found');
    }

    // Delete the role (cascades to permissions and user roles)
    await context.prisma.role.delete({
      where: { id: roleId }
    });

    // Log audit entry
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'delete_role',
        details: {
          roleId,
          roleName: role.name,
          affectedUsers: role.userRoles.length
        }
      }
    });

    return true;
  },

  assignRoleToUser: async (_: any, { userId, roleId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can assign roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can assign roles');
    }

    // Check if user exists
    const user = await context.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists
    const role = await context.prisma.role.findUnique({
      where: { id: roleId }
    });
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user already has this role
    const existing = await context.prisma.userRole.findFirst({
      where: {
        userId,
        roleId
      }
    });

    if (existing) {
      throw new Error('User already has this role');
    }

    // Assign role to user
    await context.prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    });

    // Log audit entry
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'assign_role',
        details: {
          targetUserId: userId,
          roleId,
          roleName: role.name
        }
      }
    });

    return true;
  },

  removeRoleFromUser: async (_: any, { userId, roleId }: any, context: any) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Only admins can remove roles
    const requester = await context.prisma.user.findUnique({
      where: { id: context.user.userId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can remove roles');
    }

    // Check if user exists
    const user = await context.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists
    const role = await context.prisma.role.findUnique({
      where: { id: roleId }
    });
    if (!role) {
      throw new Error('Role not found');
    }

    // Remove role from user
    await context.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId
      }
    });

    // Log audit entry
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'remove_role',
        details: {
          targetUserId: userId,
          roleId,
          roleName: role.name
        }
      }
    });

    return true;
  }
};





