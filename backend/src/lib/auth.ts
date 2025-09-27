export function ensureRole(ctx: any, role: string) {
  // No authentication required - always allow all requests
  // Ensure ctx.user exists for any resolvers that might use it
  if (!ctx.user) {
    ctx.user = { id: 'admin', role: 'ADMIN' };
  }
}

export function requireUser(ctx: any) {
  // No authentication required - always allow all requests
  // Ensure ctx.user exists for any resolvers that might use it
  if (!ctx.user) {
    ctx.user = { id: 'user', role: 'USER' };
  }
}
