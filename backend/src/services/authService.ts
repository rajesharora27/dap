import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, ResourceType, PermissionLevel } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '8h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const DEFAULT_PASSWORD = 'DAP123';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface Permission {
  resourceType: ResourceType;
  resourceId: string | null;
  permissionLevel: PermissionLevel;
}

export class AuthService {
  constructor(private prisma: PrismaClient) { }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  // Generate JWT token
  generateToken(user: User, permissions: Permission[], sessionId: string): string {
    const payload = {
      userId: user.id,
      sessionId,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      mustChangePassword: user.mustChangePassword,
      permissions: this.formatPermissionsForToken(permissions),
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Generate refresh token
  // Generate refresh token
  generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  }

  // Verify token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Format permissions for token
  private formatPermissionsForToken(permissions: Permission[]) {
    const formatted: any = {
      products: [],
      solutions: [],
      customers: [],
      system: false
    };

    permissions.forEach(perm => {
      if (perm.resourceType === 'SYSTEM') {
        formatted.system = true;
      } else if (perm.resourceId) {
        const key = `${perm.resourceType.toLowerCase()}s`;
        formatted[key].push({
          id: perm.resourceId,
          level: perm.permissionLevel.toLowerCase()
        });
      }
    });

    return formatted;
  }

  // Login
  async login(username: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        isActive: true
      }
    });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      // Log failed attempt
      await this.logAudit(user.id, 'login_failed', null, null, 'Invalid password attempt');
      throw new Error('Invalid username or password');
    }

    // Get permissions
    const permissions = await this.getUserPermissions(user.id);

    // Generate tokens
    // Generate tokens
    const userData: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword
    };

    // Create session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    const token = this.generateToken(userData, permissions, session.id);
    const refreshToken = this.generateRefreshToken(user.id, session.id);

    // Log successful login
    await this.logAudit(user.id, 'login', null, null, 'User logged in successfully');

    return {
      user: userData,
      tokens: { token, refreshToken }
    };
  }

  // Change password
  async changePassword(
    userId: string,
    oldPassword: string | null,
    newPassword: string,
    changedBy: string
  ): Promise<void> {
    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If user is changing their own password (not admin reset), verify old password
    if (userId === changedBy && oldPassword) {
      const isValid = await this.verifyPassword(oldPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
    }

    // Check if changedBy has permission (either self or admin)
    if (userId !== changedBy) {
      const changer = await this.prisma.user.findUnique({
        where: { id: changedBy }
      });
      if (!changer?.isAdmin) {
        throw new Error('Only admins can change other users passwords');
      }
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password and clear must_change_password flag
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newPasswordHash,
        mustChangePassword: false,
        updatedAt: new Date()
      }
    });

    // Log password change
    await this.logAudit(
      changedBy,
      'change_password',
      'user',
      userId,
      userId === changedBy ? 'User changed own password' : 'Admin changed user password'
    );
  }

  // Reset password to default (admin only)
  async resetPasswordToDefault(adminId: string, userId: string): Promise<void> {
    // Check if admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!admin?.isAdmin) {
      throw new Error('Only admins can reset passwords');
    }

    // Hash default password
    const defaultPasswordHash = await this.hashPassword(DEFAULT_PASSWORD);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: defaultPasswordHash,
        mustChangePassword: false, // Password change no longer required
        updatedAt: new Date()
      }
    });

    // Log password reset
    await this.logAudit(
      adminId,
      'reset_password',
      'user',
      userId,
      `Admin reset password to default (${DEFAULT_PASSWORD})`
    );
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { userId }
    });

    return permissions.map(p => ({
      resourceType: p.resourceType,
      resourceId: p.resourceId,
      permissionLevel: p.permissionLevel
    }));
  }

  // Check if user has permission
  async hasPermission(
    userId: string,
    resourceType: ResourceType,
    resourceId: string | null,
    action: PermissionLevel
  ): Promise<boolean> {
    // Check if admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (user?.isAdmin) return true;

    // For products, check solution inheritance
    if (resourceType === 'PRODUCT' && resourceId) {
      // Check direct permission
      const directPerm = await this.prisma.permission.findFirst({
        where: {
          userId,
          resourceType: 'PRODUCT',
          resourceId
        }
      });

      if (directPerm && this.hasRequiredLevel(directPerm.permissionLevel, action)) {
        return true;
      }

      // Check via solution permission
      const solutionPerms = await this.prisma.permission.findMany({
        where: {
          userId,
          resourceType: 'SOLUTION'
        },
        include: {
          user: {
            include: {
              permissions: {
                where: {
                  resourceType: 'SOLUTION'
                }
              }
            }
          }
        }
      });

      // Check if product is in any solution the user has access to
      for (const perm of solutionPerms) {
        if (perm.resourceId) {
          const solutionProduct = await this.prisma.solutionProduct.findFirst({
            where: {
              solutionId: perm.resourceId,
              productId: resourceId
            }
          });

          if (solutionProduct && this.hasRequiredLevel(perm.permissionLevel, action)) {
            return true;
          }
        }
      }

      return false;
    }

    // Check direct permission
    const permission = await this.prisma.permission.findFirst({
      where: {
        userId,
        resourceType,
        resourceId
      }
    });

    if (!permission) return false;

    return this.hasRequiredLevel(permission.permissionLevel, action);
  }

  // Check permission level
  private hasRequiredLevel(userLevel: PermissionLevel, requiredAction: PermissionLevel): boolean {
    const levels: Record<string, number> = { READ: 1, WRITE: 2, ADMIN: 3 };
    return levels[userLevel] >= levels[requiredAction];
  }

  // Grant permission
  async grantPermission(
    grantedBy: string,
    userId: string,
    resourceType: ResourceType,
    resourceId: string | null,
    permissionLevel: PermissionLevel
  ): Promise<void> {
    // Check if granter is admin
    const granter = await this.prisma.user.findUnique({
      where: { id: grantedBy }
    });
    if (!granter?.isAdmin) {
      throw new Error('Only admins can grant permissions');
    }

    // Upsert permission
    await this.prisma.permission.upsert({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId: resourceId as string
        }
      },
      update: {
        permissionLevel,
        grantedBy,
        updatedAt: new Date()
      },
      create: {
        userId,
        resourceType,
        resourceId,
        permissionLevel,
        grantedBy
      }
    });

    // Log audit
    await this.logAudit(
      grantedBy,
      'grant_permission',
      resourceType,
      resourceId,
      `Granted ${permissionLevel} permission to user ${userId}`
    );
  }

  // Revoke permission
  async revokePermission(
    revokedBy: string,
    userId: string,
    resourceType: ResourceType,
    resourceId: string | null
  ): Promise<void> {
    // Check if revoker is admin
    const revoker = await this.prisma.user.findUnique({
      where: { id: revokedBy }
    });
    if (!revoker?.isAdmin) {
      throw new Error('Only admins can revoke permissions');
    }

    await this.prisma.permission.deleteMany({
      where: {
        userId,
        resourceType,
        resourceId
      }
    });

    // Log audit
    await this.logAudit(
      revokedBy,
      'revoke_permission',
      resourceType,
      resourceId,
      `Revoked permission from user ${userId}`
    );
  }

  // Get accessible resources for user
  async getAccessibleProducts(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.isAdmin) {
      // Admin sees all products
      const products = await this.prisma.product.findMany({
        where: { deletedAt: null },
        select: { id: true }
      });
      return products.map(p => p.id);
    }

    // Get directly accessible products
    const directProducts = await this.prisma.permission.findMany({
      where: {
        userId,
        resourceType: 'PRODUCT'
      },
      select: { resourceId: true }
    });

    // Get products via solution access
    const solutionPerms = await this.prisma.permission.findMany({
      where: {
        userId,
        resourceType: 'SOLUTION'
      },
      select: { resourceId: true }
    });

    const solutionProductIds: string[] = [];
    for (const perm of solutionPerms) {
      if (perm.resourceId) {
        const solutionProducts = await this.prisma.solutionProduct.findMany({
          where: { solutionId: perm.resourceId },
          select: { productId: true }
        });
        solutionProductIds.push(...solutionProducts.map(sp => sp.productId));
      }
    }

    const productIds = new Set([
      ...directProducts.map(p => p.resourceId).filter(Boolean) as string[],
      ...solutionProductIds
    ]);

    return Array.from(productIds);
  }

  // Audit logging
  private async logAudit(
    userId: string,
    action: string,
    resourceType: string | null,
    resourceId: string | null,
    details: string,
    ipAddress?: string
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details: { message: details },
        ipAddress
      }
    });
  }

  // Create user (admin only)
  async createUser(
    createdBy: string,
    userData: {
      username: string;
      email: string;
      fullName: string;
      isAdmin?: boolean;
    }
  ): Promise<User> {
    // Check if creator is admin
    const creator = await this.prisma.user.findUnique({
      where: { id: createdBy }
    });
    if (!creator?.isAdmin) {
      throw new Error('Only admins can create users');
    }

    // Check if username or email already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          { email: userData.email }
        ]
      }
    });

    if (existing) {
      throw new Error('Username or email already exists');
    }

    // Hash default password
    const passwordHash = await this.hashPassword(DEFAULT_PASSWORD);

    // Create user with default password
    const user = await this.prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: passwordHash,
        fullName: userData.fullName,
        isAdmin: userData.isAdmin || false,
        mustChangePassword: false // Password change not required
      }
    });

    // Log audit
    await this.logAudit(
      createdBy,
      'create_user',
      'user',
      user.id,
      `Created user ${userData.username} with default password (${DEFAULT_PASSWORD})`
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword
    };
  }

  // Update user (admin only)
  async updateUser(
    updatedBy: string,
    userId: string,
    userData: {
      email?: string;
      fullName?: string;
      isAdmin?: boolean;
    }
  ): Promise<User> {
    // Check if updater is admin
    const updater = await this.prisma.user.findUnique({
      where: { id: updatedBy }
    });
    if (!updater?.isAdmin) {
      throw new Error('Only admins can update users');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // If email is being changed, check if it already exists
    if (userData.email && userData.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: userData.email }
      });
      if (existing) {
        throw new Error('Email already exists');
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: userData.email,
        fullName: userData.fullName !== undefined ? userData.fullName : undefined,
        isAdmin: userData.isAdmin !== undefined ? userData.isAdmin : undefined,
        updatedAt: new Date()
      }
    });

    // Log audit
    await this.logAudit(
      updatedBy,
      'update_user',
      'user',
      userId,
      `Updated user ${user.username}`
    );

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      isAdmin: updatedUser.isAdmin,
      isActive: updatedUser.isActive,
      mustChangePassword: updatedUser.mustChangePassword
    };
  }

  // Delete user (admin only)
  async deleteUser(deletedBy: string, userId: string): Promise<void> {
    // Check if deleter is admin
    const deleter = await this.prisma.user.findUnique({
      where: { id: deletedBy }
    });
    if (!deleter?.isAdmin) {
      throw new Error('Only admins can delete users');
    }

    // Cannot delete yourself
    if (deletedBy === userId) {
      throw new Error('Cannot delete your own account');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Delete related records first (permissions, roles, sessions, audit logs)
    await this.prisma.$transaction([
      this.prisma.permission.deleteMany({ where: { userId } }),
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      // Don't delete audit logs - keep for historical record
      // Delete the user
      this.prisma.user.delete({ where: { id: userId } })
    ]);

    // Log audit
    await this.logAudit(
      deletedBy,
      'delete_user',
      'user',
      userId,
      `Deleted user ${user.username}`
    );
  }

  // Get all users (admin only)
  async getAllUsers(requesterId: string): Promise<User[]> {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId }
    });
    if (!requester?.isAdmin) {
      throw new Error('Only admins can view all users');
    }

    const users = await this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { username: 'asc' }
    });

    return users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      isAdmin: u.isAdmin,
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      roles: u.userRoles
        .filter((ur: any) => ur.role) // Only include roles that exist
        .map((ur: any) => ur.role.name)
    }));
  }

  // Deactivate user (admin only)
  async deactivateUser(adminId: string, userId: string): Promise<void> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!admin?.isAdmin) {
      throw new Error('Only admins can deactivate users');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    await this.logAudit(adminId, 'deactivate_user', 'user', userId, 'User deactivated');
  }

  // Activate user (admin only)
  async activateUser(adminId: string, userId: string): Promise<void> {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!admin?.isAdmin) {
      throw new Error('Only admins can activate users');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        updatedAt: new Date()
      }
    });

    await this.logAudit(adminId, 'activate_user', 'user', userId, 'User activated');
  }
}

export const createAuthService = (prisma: PrismaClient) => new AuthService(prisma);
