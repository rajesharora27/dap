# Session Management & Security

## Overview

The Dynamic Adoption Plans application implements comprehensive session management to ensure security and proper user authentication.

## Features

### 1. Session Clearing on Server Restart

**Purpose**: Force all users to re-authenticate when the server restarts.

**Implementation**:
- On server startup, all sessions are automatically cleared from the database
- All locked entities are also cleared
- Users must log in again after server restart

**Location**: `backend/src/server.ts`

```typescript
// Clear all sessions on startup to force re-authentication
console.log('🔐 Server starting - clearing all sessions for security...');
await SessionManager.clearAllSessions();
```

### 2. Frontend Session Clearing

**Purpose**: Clear all browser-stored authentication data when user visits login page.

**Implementation**:
- `localStorage.clear()` - Removes all stored data
- `sessionStorage.clear()` - Removes all session data
- Ensures no stale tokens or user data remain

**Location**: `frontend/src/components/LoginPage.tsx`

```typescript
useEffect(() => {
  // Clear ALL auth and session data on mount
  localStorage.clear(); // Clear everything
  sessionStorage.clear(); // Clear session storage too
}, []);
```

### 3. Automatic Session Maintenance

**Purpose**: Keep the database clean by removing old sessions and expired locks.

**Schedule**: Runs every 1 minute

**Actions**:
- Clear sessions older than 7 days
- Clear expired locked entities
- Clean up old telemetry data (30+ days)

**Location**: `backend/src/server.ts`

```typescript
setInterval(async () => {
  // Clean old telemetry data (30+ days)
  await prisma.telemetry.deleteMany({ 
    where: { createdAt: { lt: thirtyDaysAgo } } 
  });
  
  // Run session maintenance
  await SessionManager.runMaintenance();
}, 60 * 1000); // Every minute
```

### 4. Token Expiration Checking

**Purpose**: Automatically log out users when their JWT token expires.

**Implementation**:
- Token expiry checked every 5 minutes
- Invalid/expired tokens trigger automatic logout
- Validation runs on app mount

**Location**: `frontend/src/components/AuthContext.tsx`

```typescript
// Check token validity periodically (every 5 minutes)
useEffect(() => {
  if (!token) return;
  
  const interval = setInterval(() => {
    if (!isTokenValid(token)) {
      console.warn('Token expired, logging out...');
      logout();
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  return () => clearInterval(interval);
}, [token]);
```

## Session Manager API

The `SessionManager` utility class provides centralized session management:

### Methods

#### `clearAllSessions()`
Clears all sessions and locked entities from the database.

```typescript
await SessionManager.clearAllSessions();
// Returns: { sessions: number, lockedEntities: number }
```

**Used in**:
- Server startup
- Database restore
- Admin operations

#### `clearExpiredSessions()`
Removes sessions older than 7 days.

```typescript
await SessionManager.clearExpiredSessions();
// Returns: number (count of deleted sessions)
```

#### `clearExpiredLocks()`
Removes expired locked entities.

```typescript
await SessionManager.clearExpiredLocks();
// Returns: number (count of deleted locks)
```

#### `clearUserSessions(userId: string)`
Clears all sessions for a specific user.

```typescript
await SessionManager.clearUserSessions('user-id-123');
// Returns: number (count of deleted sessions)
```

**Use cases**:
- User password change
- Account security breach
- Admin forcing logout

#### `runMaintenance()`
Runs all maintenance tasks (expired sessions + locks).

```typescript
await SessionManager.runMaintenance();
```

## Security Benefits

### 1. **Forced Re-authentication**
- Server restarts require all users to log in again
- Prevents unauthorized access from old sessions
- Useful after security updates or configuration changes

### 2. **Stale Session Cleanup**
- Old sessions (7+ days) automatically removed
- Reduces database bloat
- Minimizes attack surface

### 3. **Token Validation**
- Expired JWT tokens detected and rejected
- Automatic logout on expiration
- No stale authentication state

### 4. **Clean Login State**
- Fresh login page clears all browser data
- No token confusion or conflicts
- Consistent authentication experience

## Database Schema

### Session Model
```prisma
model Session {
  id             String         @id @default(cuid())
  userId         String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  expiresAt      DateTime
  lockedEntities LockedEntity[]
  user           User           @relation(fields: [userId], references: [id])
}
```

### Locked Entity Model
```prisma
model LockedEntity {
  id         String   @id @default(cuid())
  entityType String
  entityId   String
  sessionId  String
  createdAt  DateTime @default(now())
  expiresAt  DateTime
  session    Session  @relation(fields: [sessionId], references: [id])

  @@index([entityType, entityId])
}
```

## Monitoring & Logging

All session operations are logged for monitoring:

### Startup
```
🔐 Server starting - clearing all sessions for security...
✅ Cleared X session(s)
✅ Cleared Y locked entit(ies)
```

### Maintenance
```
🧹 Cleaned up X old telemetry record(s)
🧹 Cleaned up Y expired session(s)
🧹 Cleaned up Z expired lock(s)
```

### Errors
```
⚠️  Failed to clear sessions on startup: [error message]
❌ Maintenance job failed: [error message]
```

## Best Practices

### 1. Server Restarts
- Sessions are automatically cleared
- Users will need to re-authenticate
- Communicate planned restarts to users

### 2. User Password Changes
- Clear user sessions after password change
- Force re-authentication with new password
- Use `SessionManager.clearUserSessions(userId)`

### 3. Security Incidents
- Use `SessionManager.clearAllSessions()` to force global logout
- Clear all sessions if breach suspected
- Users must re-authenticate

### 4. Database Restores
- Sessions automatically cleared after restore
- Prevents authentication confusion
- Users log in with restored credentials

## Related Documentation

- [Authentication Implementation](./AUTH_IMPLEMENTATION_SUMMARY.md)
- [Backup & Restore Security](./BACKUP_RESTORE_SECURITY.md)
- [User Management](./USER_MANAGEMENT.md)

