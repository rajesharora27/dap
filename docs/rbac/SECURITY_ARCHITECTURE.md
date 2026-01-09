# DAP Security Architecture

**Version:** 3.0.0  
**Last Updated:** December 30, 2025  
**Security Contact:** See [SECURITY.md](../SECURITY.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization (RBAC)](#authorization-rbac)
4. [Session Management](#session-management)
5. [Password Security](#password-security)
6. [Security Headers](#security-headers)
7. [Rate Limiting](#rate-limiting)
8. [Data Protection](#data-protection)
9. [Audit Logging](#audit-logging)
10. [Security Checklist](#security-checklist)

---

## Overview

DAP implements a defense-in-depth security model with multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  HTTPS │ Security Headers │ CSRF Protection │ Rate Limiting │
├─────────────────────────────────────────────────────────────┤
│              JWT Authentication + Refresh Tokens             │
├─────────────────────────────────────────────────────────────┤
│         RBAC (5 Roles) │ Resource Permissions                │
├─────────────────────────────────────────────────────────────┤
│      Input Validation │ SQL Injection Prevention (Prisma)   │
├─────────────────────────────────────────────────────────────┤
│              Password Hashing (bcrypt) │ Audit Logs          │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────┘
```

### Security Features Summary

| Feature | Implementation | Status |
|---------|---------------|--------|
| Authentication | JWT + Refresh Tokens | ✅ Implemented |
| Authorization | RBAC with 5 roles | ✅ Implemented |
| Password Hashing | bcrypt (10 rounds) | ✅ Implemented |
| Session Management | Server-side with expiry | ✅ Implemented |
| Rate Limiting | Per-endpoint limits | ✅ Implemented |
| Input Validation | Zod schemas | ✅ Implemented |
| SQL Injection | Prisma ORM | ✅ Protected |
| XSS Prevention | React escaping | ✅ Protected |
| Security Headers | Helmet middleware | ✅ Implemented |
| Audit Logging | All sensitive actions | ✅ Implemented |

---

## Authentication

### JWT Token Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Server  │         │ Database │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ 1. Login Request   │                    │
     │ (email, password)  │                    │
     │───────────────────>│                    │
     │                    │ 2. Verify password │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │                    │ 3. Create Session  │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │ 4. Return Tokens   │                    │
     │ (access + refresh) │                    │
     │<───────────────────│                    │
     │                    │                    │
     │ 5. API Request     │                    │
     │ (Bearer token)     │                    │
     │───────────────────>│                    │
     │                    │ 6. Verify JWT      │
     │                    │ 7. Check Session   │
     │                    │───────────────────>│
     │ 8. Response        │<───────────────────│
     │<───────────────────│                    │
```

### Token Configuration

```typescript
// Access Token
const JWT_EXPIRES_IN = '8h';      // 8 hours
const JWT_SECRET = process.env.JWT_SECRET;

// Refresh Token
const REFRESH_TOKEN_EXPIRES_IN = '7d';  // 7 days
```

### Token Payload

```typescript
interface JWTPayload {
  userId: string;
  sessionId: string;
  username: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  mustChangePassword: boolean;
  permissions: {
    products: string[];
    solutions: string[];
    customers: string[];
    system: string[];
  };
}
```

### GraphQL Mutations

```graphql
# Login
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    user { id email name isAdmin }
    token
    refreshToken
  }
}

# Refresh Token
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
    refreshToken
  }
}

# Logout
mutation Logout {
  logout
}
```

---

## Authorization (RBAC)

### Role Hierarchy

```
ADMIN ─────────────────────────────────────────────┐
  │                                                 │
  ├── Full system access                           │
  ├── User management                              │
  ├── Role management                              │
  ├── Backup/restore                               │
  └── All CRUD operations                          │
                                                   │
SME (Subject Matter Expert) ───────────────────────┤
  │                                                 │
  ├── Product CRUD                                 │
  ├── Solution CRUD                                │
  ├── Task management                              │
  └── Read customers                               │
                                                   │
CSS (Customer Success) ────────────────────────────┤
  │                                                 │
  ├── Customer CRUD                                │
  ├── Adoption plan management                     │
  ├── Read products/solutions                      │
  └── Update task status                           │
                                                   │
USER ──────────────────────────────────────────────┤
  │                                                 │
  ├── Read all resources                           │
  ├── Limited write access                         │
  └── Personal diary                               │
                                                   │
VIEWER ────────────────────────────────────────────┘
  │
  └── Read-only access
```

### Permission Levels

```typescript
enum PermissionLevel {
  READ   = 'READ',    // View only
  WRITE  = 'WRITE',   // Create, update, delete
  ADMIN  = 'ADMIN',   // Full control + manage permissions
}

enum ResourceType {
  PRODUCT   = 'PRODUCT',
  SOLUTION  = 'SOLUTION',
  CUSTOMER  = 'CUSTOMER',
  SYSTEM    = 'SYSTEM',
}
```

### Permission Check Flow

```typescript
// In resolvers
const checkPermission = async (
  context: Context,
  resourceType: ResourceType,
  resourceId: string | null,
  requiredLevel: PermissionLevel
) => {
  const { user } = context;
  
  // Admins have full access
  if (user.isAdmin) return true;
  
  // Check role-based permissions
  const hasRolePermission = await checkRolePermission(user, resourceType, requiredLevel);
  if (hasRolePermission) return true;
  
  // Check resource-specific permissions
  const hasResourcePermission = await checkResourcePermission(
    user.id, resourceType, resourceId, requiredLevel
  );
  
  if (!hasResourcePermission) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Insufficient permissions');
  }
  
  return true;
};
```

---

## Session Management

### Session Model

```prisma
model Session {
  id             String         @id @default(cuid())
  userId         String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  expiresAt      DateTime
  lockedEntities LockedEntity[]
  user           User           @relation(...)
  
  @@index([expiresAt])  // Fast cleanup queries
}
```

### Session Lifecycle

1. **Creation**: On successful login
2. **Validation**: On each authenticated request
3. **Refresh**: When access token expires (using refresh token)
4. **Expiration**: After 7 days of inactivity
5. **Termination**: On logout or password change

### Session Cleanup

```typescript
// Automatic cleanup every hour
setInterval(async () => {
  await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
}, 60 * 60 * 1000);
```

### Entity Locking

Sessions can lock entities to prevent concurrent editing:

```prisma
model LockedEntity {
  id         String   @id @default(cuid())
  entityType String   // "Product", "Task", etc.
  entityId   String
  sessionId  String
  expiresAt  DateTime // Lock expires after 30 minutes
  
  @@index([entityType, entityId])
}
```

---

## Password Security

### Hashing Configuration

```typescript
// bcrypt configuration
const SALT_ROUNDS = 10;  // 2^10 iterations

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum Length | 8 characters |
| Complexity | Recommended: uppercase, lowercase, number, special |
| Default Password | `DAP123` (must change on first login) |
| History | Last 5 passwords tracked |
| Expiry | Optional, configurable |

### Password Validation

```typescript
const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,  // Recommended but not required
};

function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Minimum ${PASSWORD_RULES.minLength} characters required`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required');
  }
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('At least one number required');
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Security Headers

### Helmet Configuration

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Required for React
      styleSrc: ["'self'", "'unsafe-inline'"],   // Required for MUI
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,  // Required for some CDN resources
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer |
| `Content-Security-Policy` | (see above) | XSS/injection prevention |

---

## Rate Limiting

### Configuration

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 1000,  // 15 seconds
  max: 100,             // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limit (stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts',
});

// File upload rate limit
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 uploads
});
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/graphql` | 100 requests | 15 seconds |
| Login mutation | 5 attempts | 15 minutes |
| File upload | 10 requests | 1 minute |
| Health check | Unlimited | - |

---

## Data Protection

### Sensitive Data Handling

| Data Type | Storage | Transmission |
|-----------|---------|--------------|
| Passwords | bcrypt hashed | Never transmitted |
| JWT Tokens | Client-side | HTTPS only |
| Session IDs | Database | HTTP-only cookies |
| PII | Encrypted at rest | HTTPS only |

### Backup Security

- Passwords **excluded** from backups
- Existing passwords **preserved** on restore
- Backup files should be encrypted in transit
- Access restricted to admin role

### Database Security

```typescript
// Prisma prevents SQL injection
const product = await prisma.product.findUnique({
  where: { id: userInput }  // Safely parameterized
});

// Never use raw queries with user input
// BAD: prisma.$queryRaw`SELECT * FROM products WHERE id = ${userInput}`
// GOOD: Use parameterized queries
```

---

## Audit Logging

### Logged Events

| Event | Logged Data |
|-------|-------------|
| Login | User ID, IP, success/failure |
| Logout | User ID, session duration |
| Password Change | User ID, timestamp |
| CRUD Operations | Entity type, ID, action, user |
| Permission Changes | Target user, permissions, grantor |
| Admin Actions | All actions with full context |

### Audit Log Model

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String?
  action       String   // "LOGIN", "CREATE", "UPDATE", "DELETE"
  entity       String?  // "Product", "Task", etc.
  entityId     String?
  details      Json?    // Additional context
  ipAddress    String?
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}
```

### Example Log Entry

```json
{
  "id": "clxyz123",
  "userId": "user-456",
  "action": "UPDATE",
  "entity": "Product",
  "entityId": "prod-789",
  "details": {
    "before": { "name": "Old Name" },
    "after": { "name": "New Name" },
    "fields": ["name"]
  },
  "ipAddress": "192.168.1.1",
  "createdAt": "2025-12-30T10:00:00Z"
}
```

---

## Security Checklist

### Development

- [ ] Never commit secrets to repository
- [ ] Use environment variables for sensitive config
- [ ] Validate all user inputs
- [ ] Use parameterized queries (Prisma)
- [ ] Implement proper error handling (no stack traces to client)
- [ ] Keep dependencies updated

### Deployment

- [ ] Use HTTPS in production
- [ ] Set strong JWT_SECRET
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

### Operations

- [ ] Rotate secrets periodically
- [ ] Monitor failed login attempts
- [ ] Review audit logs regularly
- [ ] Backup encryption keys separately
- [ ] Incident response plan ready

---

*For vulnerability reporting, see [SECURITY.md](../SECURITY.md)*  
*For API security, see [API_REFERENCE.md](API_REFERENCE.md)*

