"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureRole = ensureRole;
exports.requireUser = requireUser;
function ensureRole(ctx, role) {
    // No authentication required - always allow all requests
    // Ensure ctx.user exists for any resolvers that might use it
    if (!ctx.user) {
        ctx.user = { id: 'admin', role: 'ADMIN' };
    }
}
function requireUser(ctx) {
    // No authentication required - always allow all requests
    // Ensure ctx.user exists for any resolvers that might use it
    if (!ctx.user) {
        ctx.user = { id: 'user', role: 'USER' };
    }
}
