export function ensureRole(ctx: any, role: string | string[]) {
  // Ensure ctx.user exists
  if (!ctx.user) {
    // In dev/test without auth, default to ADMIN
    // In production, ctx.user should be populated by context creation if token is valid
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Authentication required');
    }
    ctx.user = { id: 'admin', role: 'ADMIN' };
    return;
  }

  const userRole = ctx.user.role;
  const userRoles = ctx.user.roles || [userRole];

  // ADMIN always has access
  if (userRole === 'ADMIN' || userRoles.includes('ADMIN')) return;

  const allowedRoles = Array.isArray(role) ? role : [role];

  const hasRole = allowedRoles.some(r => userRoles.includes(r));

  if (!hasRole) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
}

export function requireUser(ctx: any) {
  // No authentication required - always allow all requests
  // Ensure ctx.user exists for any resolvers that might use it
  if (!ctx.user) {
    ctx.user = { id: 'user', role: 'USER' };
  }
}
