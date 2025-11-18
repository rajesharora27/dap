# Authentication & Authorization Implementation Guide

## Quick Start Guide

This guide provides step-by-step instructions for implementing the authentication and authorization system.

## Phase 1: Database Setup

### Step 1: Create Migration File

Create `backend/migrations/003_add_auth_tables.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table (predefined: ADMIN, SME, CS)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('admin_role', 'ADMIN', 'Full system access'),
  ('sme_role', 'SME', 'Subject Matter Expert - Product/Solution access'),
  ('cs_role', 'CS', 'Customer Success - Customer access');

-- User-Role junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('product', 'solution', 'customer', 'system')),
  resource_id TEXT,  -- NULL for system-wide permissions
  permission_level TEXT NOT NULL CHECK(permission_level IN ('view', 'edit', 'manage')),
  granted_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- Create default admin user (password: Admin@123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, is_admin, is_active)
VALUES (
  'admin_user_default',
  'admin',
  'admin@dynamicadoptionplans.com',
  '$2b$10$rXK9H8h3qZYKjXf9yKz6aO7KZv6zY8wU5xQyVxJzYnXm9Kp3qZYKj',  -- Password: Admin@123
  'System Administrator',
  TRUE,
  TRUE
);

-- Assign admin role to default admin user
INSERT OR IGNORE INTO user_roles (user_id, role_id)
VALUES ('admin_user_default', 'admin_role');

-- Grant system-wide admin permission
INSERT OR IGNORE INTO permissions (user_id, resource_type, permission_level, granted_by)
VALUES ('admin_user_default', 'system', 'manage', 'admin_user_default');
```

### Step 2: Run Migration

```bash
cd backend
npm run migrate  # or however you run migrations
```

## Phase 2: Backend Implementation

### Step 1: Install Dependencies

```bash
cd backend
npm install bcrypt jsonwebtoken @types/bcrypt @types/jsonwebtoken
```

### Step 2: Create Auth Service

Create `backend/src/services/authService.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  isActive: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface Permission {
  resourceType: 'product' | 'solution' | 'customer' | 'system';
  resourceId: string | null;
  permissionLevel: 'view' | 'edit' | 'manage';
}

export class AuthService {
  
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
  generateToken(user: User, permissions: Permission[]): string {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      permissions: this.formatPermissionsForToken(permissions),
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Generate refresh token
  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
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
      if (perm.resourceType === 'system') {
        formatted.system = true;
      } else if (perm.resourceId) {
        formatted[`${perm.resourceType}s`].push({
          id: perm.resourceId,
          level: perm.permissionLevel
        });
      }
    });

    return formatted;
  }

  // Login
  async login(username: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = db.prepare(`
      SELECT id, username, email, password_hash, full_name, is_admin, is_active
      FROM users
      WHERE username = ? OR email = ?
    `).get(username, username) as any;

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Get permissions
    const permissions = await this.getUserPermissions(user.id);

    // Generate tokens
    const userData: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      isAdmin: Boolean(user.is_admin),
      isActive: Boolean(user.is_active)
    };

    const token = this.generateToken(userData, permissions);
    const refreshToken = this.generateRefreshToken(user.id);

    // Log login
    this.logAudit(user.id, 'login', null, null, 'User logged in');

    return {
      user: userData,
      tokens: { token, refreshToken }
    };
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const permissions = db.prepare(`
      SELECT resource_type, resource_id, permission_level
      FROM permissions
      WHERE user_id = ?
    `).all(userId) as any[];

    return permissions.map(p => ({
      resourceType: p.resource_type,
      resourceId: p.resource_id,
      permissionLevel: p.permission_level
    }));
  }

  // Check if user has permission
  async hasPermission(
    userId: string,
    resourceType: 'product' | 'solution' | 'customer' | 'system',
    resourceId: string | null,
    action: 'view' | 'edit' | 'manage'
  ): Promise<boolean> {
    // Check if admin
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as any;
    if (user?.is_admin) return true;

    // For products, check solution inheritance
    if (resourceType === 'product' && resourceId) {
      // Check direct permission
      const directPerm = db.prepare(`
        SELECT permission_level FROM permissions
        WHERE user_id = ? AND resource_type = 'product' AND resource_id = ?
      `).get(userId, resourceId) as any;

      if (directPerm && this.hasRequiredLevel(directPerm.permission_level, action)) {
        return true;
      }

      // Check via solution permission
      const solutionPerms = db.prepare(`
        SELECT p.permission_level
        FROM permissions p
        JOIN solution_products sp ON sp.solution_id = p.resource_id
        WHERE p.user_id = ? AND p.resource_type = 'solution' AND sp.product_id = ?
      `).all(userId, resourceId) as any[];

      for (const perm of solutionPerms) {
        if (this.hasRequiredLevel(perm.permission_level, action)) {
          return true;
        }
      }

      return false;
    }

    // Check direct permission
    const query = resourceId
      ? `SELECT permission_level FROM permissions WHERE user_id = ? AND resource_type = ? AND resource_id = ?`
      : `SELECT permission_level FROM permissions WHERE user_id = ? AND resource_type = ? AND resource_id IS NULL`;

    const params = resourceId ? [userId, resourceType, resourceId] : [userId, resourceType];
    const permission = db.prepare(query).get(...params) as any;

    if (!permission) return false;

    return this.hasRequiredLevel(permission.permission_level, action);
  }

  // Check permission level
  private hasRequiredLevel(userLevel: string, requiredAction: string): boolean {
    const levels = { view: 1, edit: 2, manage: 3 };
    return levels[userLevel] >= levels[requiredAction];
  }

  // Grant permission
  async grantPermission(
    grantedBy: string,
    userId: string,
    resourceType: 'product' | 'solution' | 'customer' | 'system',
    resourceId: string | null,
    permissionLevel: 'view' | 'edit' | 'manage'
  ): Promise<void> {
    // Check if granter is admin
    const granter = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(grantedBy) as any;
    if (!granter?.is_admin) {
      throw new Error('Only admins can grant permissions');
    }

    // Insert or update permission
    db.prepare(`
      INSERT INTO permissions (user_id, resource_type, resource_id, permission_level, granted_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, resource_type, resource_id) 
      DO UPDATE SET permission_level = ?, granted_by = ?, updated_at = CURRENT_TIMESTAMP
    `).run(userId, resourceType, resourceId, permissionLevel, grantedBy, permissionLevel, grantedBy);

    // Log audit
    this.logAudit(
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
    resourceType: string,
    resourceId: string | null
  ): Promise<void> {
    // Check if revoker is admin
    const revoker = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(revokedBy) as any;
    if (!revoker?.is_admin) {
      throw new Error('Only admins can revoke permissions');
    }

    const query = resourceId
      ? `DELETE FROM permissions WHERE user_id = ? AND resource_type = ? AND resource_id = ?`
      : `DELETE FROM permissions WHERE user_id = ? AND resource_type = ? AND resource_id IS NULL`;

    const params = resourceId ? [userId, resourceType, resourceId] : [userId, resourceType];
    db.prepare(query).run(...params);

    // Log audit
    this.logAudit(
      revokedBy,
      'revoke_permission',
      resourceType,
      resourceId,
      `Revoked permission from user ${userId}`
    );
  }

  // Get accessible resources for user
  async getAccessibleProducts(userId: string): Promise<string[]> {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as any;
    if (user?.is_admin) {
      // Admin sees all products
      const products = db.prepare('SELECT id FROM products').all() as any[];
      return products.map(p => p.id);
    }

    // Get directly accessible products
    const directProducts = db.prepare(`
      SELECT resource_id FROM permissions
      WHERE user_id = ? AND resource_type = 'product'
    `).all(userId) as any[];

    // Get products via solution access
    const solutionProducts = db.prepare(`
      SELECT DISTINCT sp.product_id
      FROM permissions p
      JOIN solution_products sp ON sp.solution_id = p.resource_id
      WHERE p.user_id = ? AND p.resource_type = 'solution'
    `).all(userId) as any[];

    const productIds = new Set([
      ...directProducts.map(p => p.resource_id),
      ...solutionProducts.map(p => p.product_id)
    ]);

    return Array.from(productIds).filter(Boolean);
  }

  // Audit logging
  private logAudit(
    userId: string,
    action: string,
    resourceType: string | null,
    resourceId: string | null,
    details: string,
    ipAddress?: string
  ): void {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, resourceType, resourceId, details, ipAddress);
  }

  // Create user (admin only)
  async createUser(
    createdBy: string,
    userData: {
      username: string;
      email: string;
      password: string;
      fullName: string;
      isAdmin?: boolean;
    }
  ): Promise<User> {
    // Check if creator is admin
    const creator = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(createdBy) as any;
    if (!creator?.is_admin) {
      throw new Error('Only admins can create users');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Insert user
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, is_admin)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      userData.username,
      userData.email,
      passwordHash,
      userData.fullName,
      userData.isAdmin || false
    );

    const userId = result.lastInsertRowid.toString();

    // Log audit
    this.logAudit(createdBy, 'create_user', 'user', userId, `Created user ${userData.username}`);

    return {
      id: userId,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      isAdmin: userData.isAdmin || false,
      isActive: true
    };
  }
}

export const authService = new AuthService();
```

### Step 3: Create GraphQL Resolvers

Create `backend/src/graphql/auth.resolvers.ts`:

```typescript
import { authService } from '../services/authService';

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },

    hasPermission: async (
      _: any,
      { resourceType, resourceId, action }: any,
      context: any
    ) => {
      if (!context.user) {
        return false;
      }
      return authService.hasPermission(
        context.user.id,
        resourceType,
        resourceId,
        action
      );
    },

    userPermissions: async (_: any, { userId }: any, context: any) => {
      if (!context.user?.isAdmin && context.user?.id !== userId) {
        throw new Error('Unauthorized');
      }
      return authService.getUserPermissions(userId);
    }
  },

  Mutation: {
    login: async (_: any, { username, password }: any) => {
      const result = await authService.login(username, password);
      return {
        token: result.tokens.token,
        refreshToken: result.tokens.refreshToken,
        user: result.user
      };
    },

    grantPermission: async (
      _: any,
      { input }: any,
      context: any
    ) => {
      if (!context.user?.isAdmin) {
        throw new Error('Only admins can grant permissions');
      }

      await authService.grantPermission(
        context.user.id,
        input.userId,
        input.resourceType,
        input.resourceId,
        input.permissionLevel
      );

      return { success: true };
    },

    revokePermission: async (
      _: any,
      { userId, resourceType, resourceId }: any,
      context: any
    ) => {
      if (!context.user?.isAdmin) {
        throw new Error('Only admins can revoke permissions');
      }

      await authService.revokePermission(
        context.user.id,
        userId,
        resourceType,
        resourceId
      );

      return { success: true };
    },

    createUser: async (_: any, { input }: any, context: any) => {
      if (!context.user?.isAdmin) {
        throw new Error('Only admins can create users');
      }

      return authService.createUser(context.user.id, input);
    }
  }
};
```

### Step 4: Add GraphQL Schema

Create `backend/src/graphql/auth.schema.graphql`:

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  fullName: String
  isAdmin: Boolean!
  isActive: Boolean!
}

type AuthPayload {
  token: String!
  refreshToken: String!
  user: User!
}

type Permission {
  id: ID!
  userId: ID!
  resourceType: String!
  resourceId: ID
  permissionLevel: String!
}

input GrantPermissionInput {
  userId: ID!
  resourceType: String!
  resourceId: ID
  permissionLevel: String!
}

input CreateUserInput {
  username: String!
  email: String!
  password: String!
  fullName: String!
  isAdmin: Boolean
}

type Query {
  me: User
  hasPermission(resourceType: String!, resourceId: ID, action: String!): Boolean!
  userPermissions(userId: ID!): [Permission!]!
}

type Mutation {
  login(username: String!, password: String!): AuthPayload!
  grantPermission(input: GrantPermissionInput!): Permission!
  revokePermission(userId: ID!, resourceType: String!, resourceId: ID): Boolean!
  createUser(input: CreateUserInput!): User!
}
```

## Phase 3: Frontend Implementation

### Step 1: Create Auth Context

Create `frontend/src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { gql, useApolloClient } from '@apollo/client';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  permissions: {
    products: Array<{ id: string; level: string }>;
    solutions: Array<{ id: string; level: string }>;
    customers: Array<{ id: string; level: string }>;
    system: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (resource: string, resourceId: string, action: string) => boolean;
  canViewProduct: (productId: string) => boolean;
  canEditProduct: (productId: string) => boolean;
  canManageProduct: (productId: string) => boolean;
  canViewSolution: (solutionId: string) => boolean;
  canEditSolution: (solutionId: string) => boolean;
  canManageSolution: (solutionId: string) => boolean;
  canViewCustomer: (customerId: string) => boolean;
  canEditCustomer: (customerId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      refreshToken
      user {
        id
        username
        email
        fullName
        isAdmin
      }
    }
  }
`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const client = useApolloClient();

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      // Decode and set user from token
      try {
        const decoded = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({
          id: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          fullName: decoded.fullName || '',
          isAdmin: decoded.isAdmin,
          permissions: decoded.permissions
        });
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { username, password }
    });

    const { token: newToken, user: newUser } = data.login;
    
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('refreshToken', data.login.refreshToken);
    setToken(newToken);
    
    // Decode permissions from token
    const decoded = JSON.parse(atob(newToken.split('.')[1]));
    setUser({
      ...newUser,
      permissions: decoded.permissions
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    client.clearStore();
  };

  const hasPermission = (
    resource: string,
    resourceId: string,
    action: string
  ): boolean => {
    if (!user) return false;
    if (user.isAdmin) return true;

    const resourceKey = `${resource}s` as 'products' | 'solutions' | 'customers';
    const resourcePerms = user.permissions[resourceKey];
    
    const perm = resourcePerms.find(p => p.id === resourceId);
    if (!perm) return false;

    const levels = { view: 1, edit: 2, manage: 3 };
    return levels[perm.level] >= levels[action];
  };

  const canViewProduct = (productId: string) => hasPermission('product', productId, 'view');
  const canEditProduct = (productId: string) => hasPermission('product', productId, 'edit');
  const canManageProduct = (productId: string) => hasPermission('product', productId, 'manage');
  
  const canViewSolution = (solutionId: string) => hasPermission('solution', solutionId, 'view');
  const canEditSolution = (solutionId: string) => hasPermission('solution', solutionId, 'edit');
  const canManageSolution = (solutionId: string) => hasPermission('solution', solutionId, 'manage');
  
  const canViewCustomer = (customerId: string) => hasPermission('customer', customerId, 'view');
  const canEditCustomer = (customerId: string) => hasPermission('customer', customerId, 'edit');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        hasPermission,
        canViewProduct,
        canEditProduct,
        canManageProduct,
        canViewSolution,
        canEditSolution,
        canManageSolution,
        canViewCustomer,
        canEditCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 2: Create Login Page

Create `frontend/src/pages/Login.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" gutterBottom align="center">
          Dynamic Adoption Plans
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Sign in to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Username or Email"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
          >
            Sign In
          </Button>
        </form>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Default admin: admin / Admin@123
        </Typography>
      </Paper>
    </Box>
  );
}
```

### Step 3: Update App to Use Auth

Update `frontend/src/App.tsx` (main entry point):

```typescript
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { App as MainApp } from './pages/App';  // Your existing App component

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
```

## Testing

### Test Admin Login
```
Username: admin
Password: Admin@123
```

### Test Permission Checking
```graphql
query CheckPermission {
  hasPermission(
    resourceType: "product"
    resourceId: "product-123"
    action: "edit"
  )
}
```

### Test Grant Permission
```graphql
mutation GrantPermission {
  grantPermission(input: {
    userId: "user-456"
    resourceType: "product"
    resourceId: "product-123"
    permissionLevel: "edit"
  }) {
    success
  }
}
```

## Next Steps

1. Add password reset functionality
2. Implement token refresh mechanism
3. Add user management UI (admin only)
4. Add permission management UI (admin only)
5. Add audit log viewer (admin only)
6. Implement session timeout
7. Add 2FA (optional)
8. Add SSO integration (optional)



