# Backup & Restore Security

## Overview

The backup and restore system is designed with security as a top priority. User passwords are **never** included in backups and existing passwords are **always preserved** during restore operations.

## Security Features

### 1. Password Exclusion from Backups

**Critical Security Feature**: User password hashes are automatically stripped from backup files.

#### How It Works

1. **Database Dump**: Full database backup is created using `pg_dump`
2. **Post-Processing**: Backup file is scanned for User table INSERT statements
3. **Password Removal**: The `password` column and its values are removed
4. **Header Comment**: Backup file is marked as password-protected

#### Implementation

**Location**: `backend/src/services/BackupRestoreService.ts`

```typescript
// Post-process backup to remove password column
console.log('Removing password hashes from backup for security...');
let backupContent = fs.readFileSync(filePath, 'utf-8');

// Remove password column from User INSERT statements
backupContent = backupContent.replace(
  /INSERT INTO "User" \([^)]*\bpassword\b[^)]*\) VALUES \(([^;]+)\);/gi,
  (match) => {
    // Parse and remove password column and value
    const columns = columnsMatch[1].split(',').map(c => c.trim());
    const values = valuesMatch[1].split(',').map(v => v.trim());
    
    const passwordIndex = columns.findIndex(c => c === '"password"');
    
    if (passwordIndex !== -1) {
      columns.splice(passwordIndex, 1);
      values.splice(passwordIndex, 1);
    }
    
    return `INSERT INTO "User" (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  }
);

// Add security header
backupContent = `-- DAP Backup (Passwords excluded for security)\n` + backupContent;
```

#### Backup File Header

Every backup file includes a clear security notice:

```sql
-- DAP Backup (Passwords excluded for security - existing passwords will be preserved on restore)
-- Generated: 2025-11-11T12:00:00.000Z
```

### 2. Password Preservation on Restore

**Critical Security Feature**: Existing user passwords are saved before restore and restored afterward.

#### Restore Process

1. **Save Passwords**: Query all existing user passwords before restore
2. **Database Restore**: Restore backup data (without passwords)
3. **Restore Passwords**: Update users with their original passwords
4. **Clear Sessions**: Force all users to re-authenticate

#### Implementation

**Location**: `backend/src/services/BackupRestoreService.ts`

```typescript
// STEP 1: Save existing passwords
console.log('Saving existing user passwords...');
let existingPasswords: Map<string, string> = new Map();

const users = await prisma.user.findMany({
  select: {
    username: true,
    password: true
  }
});

users.forEach(user => {
  existingPasswords.set(user.username, user.password);
});

console.log(`✅ Saved passwords for ${existingPasswords.size} user(s)`);

// STEP 2: Restore database (without passwords)
// ... restore operations ...

// STEP 3: Restore original passwords
console.log('Restoring original user passwords...');
let restoredCount = 0;

for (const [username, passwordHash] of existingPasswords) {
  try {
    await prisma.user.updateMany({
      where: { username },
      data: { password: passwordHash }
    });
    restoredCount++;
  } catch (err) {
    console.error(`Failed to restore password for ${username}`);
  }
}

console.log(`✅ Restored passwords for ${restoredCount} user(s)`);

// STEP 4: Clear all sessions
await SessionManager.clearAllSessions();
```

### 3. Session Clearing After Restore

**Security Measure**: All sessions are cleared after restore to prevent authentication confusion.

#### Why This Matters

- Prevents users from accessing with stale sessions
- Forces re-authentication with restored credentials
- Ensures clean security state

#### Implementation

```typescript
// Clear all sessions after restore to force re-authentication
console.log('🔐 Clearing all sessions after restore...');
await SessionManager.clearAllSessions();
```

## Security Benefits

### 1. **Password Protection**
- ✅ Password hashes never stored in backup files
- ✅ Backup files can be safely shared/transferred
- ✅ No risk of password exposure from backup leaks

### 2. **Account Security**
- ✅ Users' original passwords preserved during restore
- ✅ No forced password resets after restore
- ✅ Seamless user experience

### 3. **Session Security**
- ✅ All sessions cleared after restore
- ✅ No stale authentication states
- ✅ Users must re-authenticate

### 4. **Audit Trail**
- ✅ All restore operations logged
- ✅ Password preservation logged
- ✅ Session clearing logged

## Backup Metadata

Each backup includes metadata with record counts:

```json
{
  "id": "2025-11-11T12-00-00-000Z",
  "filename": "dap_backup_2025-11-11T12-00-00-000Z.sql",
  "timestamp": "2025-11-11T12:00:00.000Z",
  "size": 1048576,
  "databaseUrl": "postgresql://...",
  "recordCounts": {
    "users": 5,
    "products": 12,
    "solutions": 8,
    "customers": 25,
    "customerProducts": 150,
    "customerSolutions": 75,
    "adoptionPlans": 150,
    "solutionAdoptionPlans": 75,
    "tasks": 500,
    "customerTasks": 2500,
    "customerSolutionTasks": 1500
  }
}
```

## API Endpoints

### Create Backup

**GraphQL Mutation**:
```graphql
mutation {
  createBackup {
    success
    filename
    size
    url
    metadata {
      recordCounts {
        users
        products
        solutions
        customers
      }
    }
    message
  }
}
```

**Response**:
```json
{
  "data": {
    "createBackup": {
      "success": true,
      "filename": "dap_backup_2025-11-11T12-00-00-000Z.sql",
      "size": 1048576,
      "url": "/api/downloads/backups/dap_backup_2025-11-11T12-00-00-000Z.sql",
      "metadata": { /* ... */ },
      "message": "Backup created successfully (passwords excluded)"
    }
  }
}
```

### Restore Backup

**GraphQL Mutation**:
```graphql
mutation {
  restoreBackup(filename: "dap_backup_2025-11-11T12-00-00-000Z.sql") {
    success
    message
    recordsRestored {
      users
      products
      solutions
      customers
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "restoreBackup": {
      "success": true,
      "message": "Database restored successfully. User passwords preserved.",
      "recordsRestored": { /* ... */ }
    }
  }
}
```

### List Backups

**GraphQL Query**:
```graphql
query {
  listBackups {
    id
    filename
    timestamp
    size
    recordCounts {
      users
      products
      solutions
      customers
    }
  }
}
```

## Backup File Structure

### Header
```sql
-- DAP Backup (Passwords excluded for security - existing passwords will be preserved on restore)
-- Generated: 2025-11-11T12:00:00.000Z

SET statement_timeout = 0;
SET lock_timeout = 0;
-- ... PostgreSQL settings ...
```

### Schema
```sql
CREATE TABLE "User" (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    name text,
    "fullName" text DEFAULT ''::text,
    role "Role" DEFAULT 'USER'::"Role" NOT NULL,
    -- Note: password column excluded from INSERT statements
    "isAdmin" boolean DEFAULT false NOT NULL,
    -- ... more columns ...
);
```

### Data (Password Excluded)
```sql
-- Original (with password):
-- INSERT INTO "User" (id, email, username, password, "isAdmin") 
-- VALUES ('123', 'user@example.com', 'user', '$2a$10$...', false);

-- Actual (without password):
INSERT INTO "User" (id, email, username, "isAdmin") 
VALUES ('123', 'user@example.com', 'user', false);
```

## Monitoring & Logging

### Backup Creation
```
Creating database backup...
Removing password hashes from backup for security...
✅ Backup created successfully: dap_backup_2025-11-11T12-00-00-000Z.sql
```

### Restore Operation
```
Restoring database from backup...
Saving existing user passwords...
✅ Saved passwords for 5 user(s)
Clearing database before restore...
Restoring data...
Restoring original user passwords...
✅ Restored passwords for 5 of 5 user(s)
🔐 Clearing all sessions after restore...
✅ Cleared 12 session(s)
✅ Cleared 5 locked entit(ies)
✅ Database restored successfully
```

### Errors
```
❌ Backup creation failed: [error message]
⚠️  Could not save existing passwords: [error message]
⚠️  Error restoring passwords: [error message]
⚠️  Could not clear sessions: [error message]
```

## Best Practices

### 1. Regular Backups
- Schedule automated backups
- Store backups securely (even though passwords are excluded)
- Test restore procedures regularly

### 2. Backup Storage
- Encrypt backup files at rest
- Use secure transfer methods (SFTP, HTTPS)
- Implement access controls
- Keep multiple backup versions

### 3. Restore Testing
- Test restores in non-production environments
- Verify password preservation
- Check session clearing
- Validate data integrity

### 4. User Communication
- Notify users before planned restores
- Explain session clearing (must re-login)
- Provide support contact information

## Security Considerations

### ✅ Safe Operations
- Sharing backup files (passwords excluded)
- Storing backups in cloud storage
- Automated backup transfers
- Developer access to backups

### ⚠️ Still Requires Security
- Backup files contain sensitive business data
- Personal information (names, emails) included
- Customer data present
- Treat backups as confidential

### 🔒 Encryption Recommended
Even though passwords are excluded:
- Encrypt backup files
- Use secure storage
- Implement access controls
- Follow data protection regulations (GDPR, etc.)

## Related Documentation

- [Session Management](./SESSION_MANAGEMENT.md)
- [Authentication Implementation](./AUTH_IMPLEMENTATION_SUMMARY.md)
- [User Management](./USER_MANAGEMENT.md)
- [Database Schema](./DATABASE_SCHEMA.md)

