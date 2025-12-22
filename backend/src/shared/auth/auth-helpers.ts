import { envConfig } from '../../config/env';

export function ensureAuth(ctx: any) {
  if (!ctx.user && envConfig.auth.bypassEnabled) {
    ctx.user = { ...envConfig.auth.defaultDevUser };
  }

  if (envConfig.auth.required && !ctx.user) {
    throw new Error('Authentication required');
  }

  if (ctx.user && !ctx.user.userId && ctx.user.id) {
    ctx.user.userId = ctx.user.id;
  }

  if (ctx.user && !ctx.user.roles) {
    ctx.user.roles = ctx.user.role ? [ctx.user.role] : [];
  }
}

export function ensureRole(ctx: any, role: string | string[]) {
  ensureAuth(ctx);

  if (!ctx.user) return; // ensureAuth handles errors when required

  const allowedRoles = Array.isArray(role) ? role : [role];
  const userRoles = ctx.user.roles || [ctx.user.role];

  if (ctx.user.isAdmin || userRoles.includes('ADMIN')) {
    return;
  }

  const hasRole = allowedRoles.some(r => userRoles.includes(r));

  if (!hasRole) {
    // Always log the violation for debugging
    if (envConfig.rbac.warnOnViolation) {
      console.warn(`⚠️  RBAC VIOLATION: User ${ctx.user.username} (roles: ${userRoles.join(', ')}) attempted action requiring: ${allowedRoles.join(' or ')}`);
    }
    // Always throw error - RBAC must be enforced even in dev mode
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
}

export function requireUser(ctx: any) {
  ensureAuth(ctx);
}
