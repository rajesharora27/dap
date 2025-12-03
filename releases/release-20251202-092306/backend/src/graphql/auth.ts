import { gql } from 'graphql-tag';
import { createAuthService } from '../services/authService';
import { ResourceType, PermissionLevel } from '@prisma/client';

export const authTypeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    fullName: String
    isAdmin: Boolean!
    isActive: Boolean!
    mustChangePassword: Boolean!
  }

  type AuthTokens {
    token: String!
    refreshToken: String!
  }

  type LoginResponse {
    user: User!
    tokens: AuthTokens!
  }

  type Permission {
    id: ID!
    userId: ID!
    resourceType: String!
    resourceId: ID
    permissionLevel: String!
    grantedBy: ID
    createdAt: String!
  }

  type UserWithPermissions {
    user: User!
    permissions: [Permission!]!
    roles: [String!]!
  }

  input CreateUserInput {
    username: String!
    email: String!
    fullName: String!
    isAdmin: Boolean
  }

  input UpdateUserInput {
    email: String
    fullName: String
    isAdmin: Boolean
  }

  type RolePermission {
    id: ID!
    resourceType: String!
    resourceId: String
    resourceName: String
    permissionLevel: String!
  }

  type RoleWithPermissions {
    id: ID!
    name: String!
    description: String
    userCount: Int
    users: [UserBasic!]
    permissions: [RolePermission!]!
  }

  type UserBasic {
    id: ID!
    username: String!
    fullName: String
    email: String!
  }

  input ResourcePermissionInput {
    resourceType: String!
    resourceId: String
    permissionLevel: String!
  }

  input CreateRoleInput {
    name: String!
    description: String
    permissions: [ResourcePermissionInput!]
  }

  input UpdateRoleInput {
    name: String
    description: String
    permissions: [ResourcePermissionInput!]
  }

  input GrantPermissionInput {
    userId: ID!
    resourceType: String!
    resourceId: ID
    permissionLevel: String!
  }

  input ChangePasswordInput {
    userId: ID!
    oldPassword: String
    newPassword: String!
  }

  type AuditLog {
    id: ID!
    userId: ID
    action: String!
    resourceType: String
    resourceId: ID
    details: String
    ipAddress: String
    createdAt: String!
  }

  type AvailableResource {
    id: ID!
    name: String!
    type: String!
  }

  extend type Query {
    me: User
    users: [User!]!
    user(id: ID!): UserWithPermissions
    myPermissions: [Permission!]!
    auditLogs(limit: Int, offset: Int): [AuditLogEntry!]!
    roles: [RoleWithPermissions!]!
    role(id: ID!): RoleWithPermissions
    userRoles(userId: ID!): [RoleWithPermissions!]!
    availableResources(resourceType: String): [AvailableResource!]!
  }

  extend type Mutation {
    login(username: String!, password: String!): LoginResponse!
    logout: Boolean!
    refreshToken(refreshToken: String!): AuthTokens!
    
    createUser(input: CreateUserInput!): User!
    updateUser(userId: ID!, input: UpdateUserInput!): User!
    deleteUser(userId: ID!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    resetPasswordToDefault(userId: ID!): Boolean!
    
    createRole(input: CreateRoleInput!): RoleWithPermissions!
    updateRole(roleId: ID!, input: UpdateRoleInput!): RoleWithPermissions!
    deleteRole(roleId: ID!): Boolean!
    assignRoleToUser(userId: ID!, roleId: ID!): Boolean!
    removeRoleFromUser(userId: ID!, roleId: ID!): Boolean!
    
    grantPermission(input: GrantPermissionInput!): Boolean!
    revokePermission(userId: ID!, resourceType: String!, resourceId: ID): Boolean!
    
    activateUser(userId: ID!): Boolean!
    deactivateUser(userId: ID!): Boolean!
  }
`;

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const user = await context.prisma.user.findUnique({
        where: { id: context.user.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword
      };
    },

    users: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const authService = createAuthService(context.prisma);
      return authService.getAllUsers(context.user.userId);
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
          userRoles: true
        }
      });

      return roles.map((role: any) => ({
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
      }));
    },

    role: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Only admins can view role details
      const requester = await context.prisma.user.findUnique({
        where: { id: context.user.userId }
      });
      if (!requester?.isAdmin) {
        throw new Error('Only admins can view roles');
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
        .filter((ur: any) => ur.role) // Only include roles with FK relationships
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
        throw new Error('Only admins can view resources');
      }

      const resources: any[] = [];

      if (!resourceType || resourceType === 'PRODUCT') {
        const products = await context.prisma.product.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true }
        });
        resources.push(...products.map((p: any) => ({ ...p, type: 'PRODUCT' })));
      }

      if (!resourceType || resourceType === 'SOLUTION') {
        const solutions = await context.prisma.solution.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true }
        });
        resources.push(...solutions.map((s: any) => ({ ...s, type: 'SOLUTION' })));
      }

      if (!resourceType || resourceType === 'CUSTOMER') {
        const customers = await context.prisma.customer.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true }
        });
        resources.push(...customers.map((c: any) => ({ ...c, type: 'CUSTOMER' })));
      }

      return resources;
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
  },

  Mutation: {
    login: async (_: any, { username, password }: any, context: any) => {
      const authService = createAuthService(context.prisma);
      return authService.login(username, password);
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
          token: authService.generateToken(userData, permissions),
          refreshToken: authService.generateRefreshToken(user.id)
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
      return authService.createUser(context.user.userId, input);
    },

    updateUser: async (_: any, { userId, input }: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const authService = createAuthService(context.prisma);
      return authService.updateUser(context.user.userId, userId, input);
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
      throw new Error('Role with this name already exists');
    }

    // Create role with permissions in a transaction
    const role = await context.prisma.$transaction(async (tx: any) => {
      // Create the role
      const newRole = await tx.role.create({
        data: {
          name: input.name,
          description: input.description || null
        }
      });

      // Create permissions if provided
      if (input.permissions && input.permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissions.map((p: any) => ({
            roleId: newRole.id,
            resourceType: p.resourceType,
            resourceId: p.resourceId || null,
            permissionLevel: p.permissionLevel
          }))
        });
      }

      // Fetch the complete role with permissions
      return await tx.role.findUnique({
        where: { id: newRole.id },
        include: {
          permissions: true,
          userRoles: true
        }
      });
    });

    // Log the action
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'create_role',
        resourceType: 'Role',
        resourceId: role.id,
        details: JSON.stringify({ name: input.name, permissionsCount: input.permissions?.length || 0 })
      }
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: 0,
      permissions: role.permissions.map((p: any) => ({
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
      where: { id: roleId },
      include: { permissions: true }
    });
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // If changing name, check for conflicts
    if (input.name && input.name !== existingRole.name) {
      const nameConflict = await context.prisma.role.findUnique({
        where: { name: input.name }
      });
      if (nameConflict) {
        throw new Error('Role with this name already exists');
      }
    }

    // Update role and permissions in a transaction
    const role = await context.prisma.$transaction(async (tx: any) => {
      // Update basic role info
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name: input.name || existingRole.name,
          description: input.description !== undefined ? input.description : existingRole.description
        }
      });

      // If permissions are provided, replace all existing permissions
      if (input.permissions !== undefined) {
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

      // Fetch the complete updated role
      return await tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: true,
          userRoles: true
        }
      });
    });

    // Log the action
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'update_role',
        resourceType: 'Role',
        resourceId: roleId,
        details: JSON.stringify({ name: input.name, permissionsCount: input.permissions?.length })
      }
    });

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

    // Log before deletion
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'delete_role',
        resourceType: 'Role',
        resourceId: roleId,
        details: JSON.stringify({ 
          name: role.name, 
          usersAffected: role.userRoles.length 
        })
      }
    });

    // Delete the role (cascade will handle permissions and user assignments)
    await context.prisma.role.delete({
      where: { id: roleId }
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

    // Verify user exists
    const user = await context.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify role exists
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

    // Log the action
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'assign_role',
        resourceType: 'UserRole',
        details: JSON.stringify({ 
          targetUser: user.username,
          roleName: role.name 
        })
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

    // Verify user exists
    const user = await context.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify role exists and user has it
    const userRole = await context.prisma.userRole.findFirst({
      where: {
        userId,
        roleId
      },
      include: {
        role: true
      }
    });

    if (!userRole) {
      throw new Error('User does not have this role');
    }

    // Log before removal
    await context.prisma.auditLog.create({
      data: {
        userId: context.user.userId,
        action: 'remove_role',
        resourceType: 'UserRole',
        details: JSON.stringify({ 
          targetUser: user.username,
          roleName: userRole.role?.name 
        })
      }
    });

    // Remove role from user
    await context.prisma.userRole.delete({
      where: { id: userRole.id }
    });

    return true;
  }
  }
};
