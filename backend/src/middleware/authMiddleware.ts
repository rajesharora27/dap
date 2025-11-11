import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    isAdmin: boolean;
    mustChangePassword: boolean;
    permissions: any;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token, but we don't throw - just continue without user
    next();
  }
};

// Middleware to require authentication
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to require admin
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check specific permission
export const requirePermission = (
  resourceType: 'product' | 'solution' | 'customer',
  permissionLevel: 'view' | 'edit' | 'manage'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceId = req.params.id || req.body.id;

    try {
      const hasPermission = await authService.hasPermission(
        req.user.userId,
        resourceType,
        resourceId,
        permissionLevel
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

