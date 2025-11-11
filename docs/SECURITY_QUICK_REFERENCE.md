# Security Quick Reference Guide

## Session Management

### Automatic Session Clearing

| Event | Action | Result |
|-------|--------|--------|
| Server Restart | Clear all sessions | All users must re-login |
| Database Restore | Clear all sessions | All users must re-login |
| Password Change | Clear user sessions | User must re-login |
| Token Expiry | Automatic logout | User redirected to login |

### Session Lifecycle

- **Token Expiry**: 7 days (configurable)
- **Expiry Check**: Every 5 minutes (frontend)
- **Session Cleanup**: Every 1 minute (backend)
- **Old Session Removal**: 7+ days

### Manual Session Control

```typescript
// Clear all sessions
await SessionManager.clearAllSessions();

// Clear user sessions
await SessionManager.clearUserSessions(userId);

// Run maintenance
await SessionManager.runMaintenance();
```

## Backup & Restore

### Backup Security Features

✅ **Password Exclusion**: Passwords never included in backup files
✅ **Safe Storage**: Backup files can be safely shared/transferred  
✅ **Security Header**: Backups marked with security notice  
✅ **Metadata Tracking**: Record counts and timestamps included

### Restore Security Features

✅ **Password Preservation**: Existing passwords preserved during restore  
✅ **Session Clearing**: All sessions cleared after restore  
✅ **User Mapping**: Passwords restored by username match  
✅ **Audit Logging**: All operations logged

### Backup/Restore Process

#### Create Backup
1. Database dump with pg_dump
2. Parse and remove password column
3. Add security header
4. Save metadata
5. Return download URL

#### Restore Backup
1. Save existing passwords
2. Clear database
3. Restore backup data
4. Restore saved passwords
5. Clear all sessions
6. Force re-authentication

## Authentication Flow

### Login Process
1. User enters credentials
2. Clear all localStorage/sessionStorage
3. Validate credentials against database
4. Generate JWT token (7-day expiry)
5. Return token + user data
6. Store in localStorage
7. Redirect to application

### Token Validation
1. Extract token from localStorage
2. Decode JWT
3. Check expiration timestamp
4. Validate against current time
5. Auto-logout if expired

### Logout Process
1. Clear localStorage
2. Clear sessionStorage
3. Clear token from memory
4. Redirect to login page

## Admin Operations

### Creating Admin User

```typescript
// Via seed script (backend)
npm run seed:auth

// Via GraphQL mutation
mutation {
  createUser(input: {
    username: "admin"
    email: "admin@example.com"
    password: "DAP123"
    fullName: "Administrator"
    isAdmin: true
    isActive: true
  }) {
    id
    username
    isAdmin
  }
}
```

### Resetting User Password

```graphql
mutation {
  resetUserPassword(userId: "user-id") {
    success
    message
    user {
      username
      mustChangePassword
    }
  }
}
```

Password reset to default: **`DAP123`**

### Force User Logout

```typescript
// Clear specific user's sessions
await SessionManager.clearUserSessions(userId);

// Clear all sessions (global logout)
await SessionManager.clearAllSessions();
```

## Security Checklist

### ✅ Server Startup
- [ ] Sessions cleared
- [ ] Locked entities cleared
- [ ] Maintenance job started

### ✅ User Login
- [ ] Credentials validated
- [ ] JWT token generated
- [ ] Token expiry set
- [ ] User data stored

### ✅ Token Expiration
- [ ] Token validated periodically
- [ ] Expired tokens detected
- [ ] User auto-logged out
- [ ] Redirected to login

### ✅ Database Backup
- [ ] Full dump created
- [ ] Passwords excluded
- [ ] Security header added
- [ ] Metadata saved

### ✅ Database Restore
- [ ] Existing passwords saved
- [ ] Backup restored
- [ ] Passwords restored
- [ ] Sessions cleared

### ✅ Password Change
- [ ] Current password verified
- [ ] New password hashed
- [ ] User sessions cleared
- [ ] Must re-login

## Common Operations

### Clear All Sessions (Emergency)

**Backend (TypeScript)**:
```typescript
import { SessionManager } from './utils/sessionManager';
await SessionManager.clearAllSessions();
```

**Database (SQL)**:
```sql
DELETE FROM "Session";
DELETE FROM "LockedEntity";
```

### Check Token Validity

**Frontend (TypeScript)**:
```typescript
import { isTokenValid } from './utils/auth';

const token = localStorage.getItem('token');
if (!isTokenValid(token)) {
  // Token expired, logout
  logout();
}
```

### Verify Backup Security

```bash
# Check backup file for password exclusion
grep -i "password" temp/backups/dap_backup_*.sql

# Should only see:
# - CREATE TABLE definitions
# - NOT in INSERT statements
```

## Environment Variables

### JWT Configuration
```bash
# JWT secret (required)
JWT_SECRET=your-secret-key-here

# Token expiry (optional, default: 7d)
JWT_EXPIRY=7d

# Refresh token expiry (optional, default: 30d)
JWT_REFRESH_EXPIRY=30d
```

### Session Configuration
```bash
# Session cleanup interval (milliseconds)
SESSION_CLEANUP_INTERVAL=60000

# Session max age (days)
SESSION_MAX_AGE=7
```

## Monitoring Commands

### Check Active Sessions
```sql
SELECT COUNT(*) as active_sessions FROM "Session";
SELECT * FROM "Session" ORDER BY "updatedAt" DESC LIMIT 10;
```

### Check Locked Entities
```sql
SELECT COUNT(*) as active_locks FROM "LockedEntity";
SELECT * FROM "LockedEntity" WHERE "expiresAt" > NOW();
```

### Check User Accounts
```sql
SELECT 
  username, 
  email, 
  "isAdmin", 
  "isActive", 
  "mustChangePassword",
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
```

### Check Recent Backups
```bash
ls -lh temp/backups/
cat temp/backups/metadata/*.json | jq .
```

## Security Best Practices

### ✅ DO
- Use strong JWT secrets in production
- Enable HTTPS/TLS for production
- Regularly backup database
- Test restore procedures
- Monitor session counts
- Clear sessions after security incidents
- Rotate JWT secrets periodically
- Use secure password policies

### ⚠️ DON'T
- Don't commit JWT secrets to git
- Don't disable token expiration
- Don't skip password hashing
- Don't expose backup files publicly
- Don't store passwords in plain text
- Don't bypass authentication checks
- Don't share admin credentials

## Troubleshooting

### Users Can't Login After Restore
**Cause**: Sessions not cleared  
**Solution**: Run `SessionManager.clearAllSessions()`

### Token Expired Error
**Cause**: JWT token past expiry date  
**Solution**: Normal behavior, user must re-login

### Sessions Not Clearing on Restart
**Cause**: Server startup script not running  
**Solution**: Check `server.ts` startup code, verify SessionManager import

### AbortError in Console
**Cause**: Apollo Client requests aborted during auth changes  
**Solution**: Expected behavior - AbortErrors are normal during logout/navigation  
**Note**: If excessive, check that errorLink is properly configured in ApolloClientProvider

### Backup Contains Passwords
**Cause**: Post-processing failed  
**Solution**: Check `BackupRestoreService.ts` password removal logic

### Password Lost After Restore
**Cause**: Password preservation failed  
**Solution**: Check restore logs, may need to reset passwords to default

## Support & Documentation

- **Full Authentication Guide**: [AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)
- **Session Management**: [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md)
- **Backup Security**: [BACKUP_RESTORE_SECURITY.md](./BACKUP_RESTORE_SECURITY.md)
- **User Management**: [USER_MANAGEMENT.md](./USER_MANAGEMENT.md)

## Emergency Procedures

### 1. Security Breach - Force Global Logout
```typescript
// Backend
await SessionManager.clearAllSessions();
```

### 2. Lost Admin Access
```bash
# Reset admin password via script
cd backend
npm run seed:auth
```

### 3. Database Corruption
```bash
# Restore from latest backup
# Sessions and passwords will be handled automatically
```

### 4. Token Secret Compromised
```bash
# 1. Update JWT_SECRET in environment
# 2. Restart server (clears all sessions)
# 3. All users must re-login
```

