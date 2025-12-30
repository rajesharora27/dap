# Auth Module

## Responsibility

Handles authentication and session management. This module provides JWT-based authentication, password management, session tracking, and integrates with the RBAC permission system in `shared/auth`. It manages user login/logout, password changes, and session lifecycle.

## Public API

Exports from `index.ts`:

```typescript
// Services
export { AuthService } from './auth.service';
export { SessionService } from './session.service';

// Middleware
export { authMiddleware, optionalAuthMiddleware } from './auth.middleware';

// Resolvers
export { AuthQueryResolvers } from './auth.resolver';
export { AuthMutationResolvers } from './auth.resolver';
```

## Dependencies

| Module | Purpose |
|--------|---------|
| `shared/auth` | Permission helpers, user lookup |
| `shared/database` | Prisma client access |
| `shared/utils` | Audit logging |

**External Dependencies:**
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation/validation

## Database Tables

- `User` - User accounts with credentials
- `Session` - Active user sessions
- `LockedEntity` - Entity locks tied to sessions

## GraphQL Operations

### Queries
| Query | Description | Auth |
|-------|-------------|------|
| `me` | Get current authenticated user | Required |
| `users` | List all users | ADMIN |
| `user(id)` | Get user by ID | ADMIN |

### Mutations
| Mutation | Description | Auth |
|----------|-------------|------|
| `login` | Authenticate and get JWT | Public |
| `logout` | Invalidate current session | Required |
| `changePassword` | Change own password | Required |
| `createUser` | Create new user | ADMIN |
| `updateUser` | Update user details | ADMIN |
| `deleteUser` | Delete user | ADMIN |
| `resetUserPassword` | Reset user's password | ADMIN |

## Authentication Flow

```
1. User submits email/password
2. AuthService validates credentials (bcrypt)
3. JWT token generated (24h expiry)
4. Session created in database
5. Token returned to client
6. Client stores token in localStorage
7. Token sent in Authorization header
8. authMiddleware validates token on each request
9. Session validated and user attached to context
```

## Business Rules

1. Passwords are hashed with bcrypt (cost factor 10)
2. JWT tokens expire in 24 hours
3. Sessions are tracked in database for invalidation
4. First login requires password change (`mustChangePassword`)
5. Inactive users (`isActive: false`) cannot authenticate
6. Entity locks are released when session expires
7. Default admin: `admin` / `DAP123` (must change on first login)

## Security Considerations

1. **Password Storage**: bcrypt with salt
2. **Token Security**: JWT with secret from environment
3. **Session Tracking**: Database-backed for revocation
4. **Rate Limiting**: Not implemented (TODO)
5. **Refresh Tokens**: Not implemented (TODO)

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Wrong email or password |
| `AUTH_USER_INACTIVE` | User account is disabled |
| `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_TOKEN_INVALID` | JWT token is malformed |
| `AUTH_SESSION_EXPIRED` | Session no longer valid |

## Testing

```bash
# Run auth-specific tests
npm test -- --grep "auth"

# Run auth service tests
npm test -- backend/src/__tests__/services/auth.test.ts
```

## Related Documentation

- [CONTEXT.md](../../../../docs/CONTEXT.md) - RBAC section
- [shared/auth/permissions.ts](../../shared/auth/permissions.ts) - Permission logic

