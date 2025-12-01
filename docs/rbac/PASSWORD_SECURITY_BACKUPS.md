# Password Security in Backup & Restore

## ✅ Passwords Are Automatically Excluded from Backups

### How It Works

#### During Backup Creation

1. **Full Database Dump**: Creates a complete pg_dump with `--column-inserts` flag
2. **Post-Processing**: Automatically strips password hashes from User table
3. **Comment Added**: Backup file includes header noting passwords are excluded
4. **Security Note**: Password column and values are removed from all User INSERT statements

**Code Location**: `backend/src/services/BackupRestoreService.ts` (lines 186-224)

#### During Restore

1. **Password Preservation**: Before restoring, the system saves all existing user passwords
2. **Database Restore**: Clears and restores data from backup file
3. **Password Restoration**: After restore completes, all original passwords are restored
4. **User Experience**: Users can log in with their existing passwords after restore

**Code Location**: `backend/src/services/BackupRestoreService.ts` (lines 290-310)

### Example

**Backup File Contents** (User table):
```sql
-- DAP Backup (Passwords excluded for security - existing passwords will be preserved on restore)
-- Generated: 2025-12-01T20:00:00.000Z

INSERT INTO "User" (id, email, username, name, fullName, role, isAdmin, isActive, mustChangePassword, createdAt, updatedAt) 
VALUES ('user-id-123', 'admin@example.com', 'admin', NULL, 'Administrator', 'ADMIN', true, true, false, '2025-01-01', '2025-12-01');
-- Note: password column excluded
```

**Important**: The password field is NOT included in the INSERT statement.

### Security Benefits

| Feature | Benefit |
|---------|---------|
| **No Passwords in Backups** | Backup files can be safely shared/stored without exposing credentials |
| **Automatic Exclusion** | No manual intervention needed - happens automatically |
| **Existing Passwords Preserved** | Users don't need to reset passwords after restore |
| **Defense in Depth** | Even if backup files are compromised, passwords remain secure |

### Testing

To verify password exclusion is working:

```bash
# Create a backup
cd /data/dap
./dap add-sample  # Ensure some users exist

# Via GraphQL:
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createBackup { success filename message } }"}'

# Check the backup file
cat backend/temp/backups/dap_backup_*.sql | grep -A 5 "User"
```

**Expected**: User INSERT statements should NOT contain password column or hashed password values.

### For Administrators

#### Backup Best Practices

1. ✅ **Backups are safe to download** - No sensitive passwords included
2. ✅ **Can share backups** for testing/dev environments
3. ✅ **Store backups externally** without security concerns about password exposure
4. ⚠️  **Still protect backups** - They contain other sensitive business data

#### Password Management After Restore

| Scenario | What Happens |
|----------|--------------|
| **Normal Restore** | All users keep their existing passwords |
| **Fresh Install Restore** | System will detect no existing passwords and may require manual password reset |
| **User Added in Backup** | New users from backup will need password reset (no password in backup) |
| **User Exists Locally** | Local password is preserved |

### Troubleshooting

#### Users Can't Login After Restore

**Cause**: This should NOT happen if restore completed successfully. The system preserves passwords.

**Solution**:
1. Check backend logs: `tail -f /data/dap/backend.log`
2. Look for: "✅ Saved passwords for X user(s)"
3. If not found, passwords weren't preserved - manual reset needed

**Manual Password Reset** (via backend):
```bash
cd /data/dap/backend
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  const hashedPassword = await bcrypt.hash('newpassword', 10);
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password: hashedPassword, mustChangePassword: true }
  });
  console.log('Password reset for admin to: newpassword');
  await prisma.\$disconnect();
}

resetPassword();
"
```

#### Backup File Contains Passwords

**Cause**: Using an old backup created before password exclusion was implemented.

**Solution**: Create a new backup - all new backups automatically exclude passwords.

### Implementation Details

#### createBackup() Process

1. Execute `pg_dump` with `--column-inserts` flag
2. Read resulting SQL file
3. Use regex to find and modify User table INSERT statements:
   - Remove `password` from column list
   - Remove password value from VALUES list
4. Add security header comment
5. Write modified content back to file

#### restoreBackup() Process

1. Save existing passwords: `Map<username, password_hash>`
2. Clear database (DROP SCHEMA public CASCADE)
3. Execute backup SQL file (restores all data except passwords)
4. Restore saved passwords: UPDATE User SET password WHERE username
5. Verify record counts

### Code Reference

**Password Exclusion** (BackupRestoreService.ts):
```typescript
// Lines 186-224
console.log('Removing password hashes from backup for security...');
let backupContent = fs.readFileSync(filePath, 'utf-8');

backupContent = backupContent.replace(
  /INSERT INTO "User" \([^)]*\bpassword\b[^)]*\) VALUES \(([^;]+)\);/gi,
  (match) => {
    // Remove password column and value...
  }
);
```

**Password Preservation** (BackupRestoreService.ts):
```typescript
// Lines 290-310
console.log('Saving existing user passwords...');
let existingPasswords: Map<string, string> = new Map();

const users = await prisma.user.findMany({
  select: { username: true, password: true }
});

users.forEach((user: any) => {
  existingPasswords.set(user.username, user.password);
});
```

### Compliance & Auditing

This feature helps meet security compliance requirements:

- ✅ **PCI-DSS**: Passwords not stored in backup files
- ✅ **GDPR**: Reduces risk of credential exposure
- ✅ **SOC 2**: Demonstrates security controls over sensitive data
- ✅ **ISO 27001**: Follows best practices for backup security

### Summary

🔒 **Passwords are NEVER included in backup files**  
✅ **Existing passwords are ALWAYS preserved during restore**  
🛡️ **Backup files are safe to share and store externally**  
📝 **All processes are automatic - no manual intervention needed**

---

Last Updated: December 1, 2025  
Status: ✅ Implemented and Active

