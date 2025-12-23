# Backup & Restore System - Comprehensive Guide

## Overview

The DAP (Digital Adoption Platform) includes a comprehensive backup and restore system that allows you to create snapshots of your entire application database and restore them when needed. This is essential for disaster recovery, data corruption protection, and testing scenarios.

## Features

### ✅ On-Demand Snapshots
- Create full database backups with a single click
- Automatic metadata collection (record counts, timestamp, file size)
- Compressed SQL format for efficient storage

### ✅ Complete Data Coverage
The backup system captures all application data including:
- **Products** and their tasks, licenses, outcomes, releases
- **Solutions** and their associations
- **Customers** and all customer-specific data
- **Adoption Plans** (both product and solution)
- **Customer Tasks** with status and progress tracking
- **Telemetry data** and custom attributes

### ⚠️ User Data Excluded
**IMPORTANT**: As of v2.9.2, user and authentication data are **EXCLUDED** from the automated backup process.
The following tables will **restore as empty** (schema only):
- `User`
- `Session`
- `LockedEntity`
- `UserRole`
- `Permission`
- `AuditLog`
- `ChangeSet`

**Implications:**
- User management is handled via a separate dedicated script/process.
- Restoring a backup will **delete all existing users** (due to schema reset).
- You must run your user restoration script immediately after a system restore to regain access.

### ✅ Easy Restore
- List all available backups with metadata
- One-click restore to any previous snapshot
- Automatic table clearing before restore
- Record count verification after restore

### ✅ Download Backups
- Download backup files for offline storage
- Share backups between environments
- Archive important snapshots externally

## Accessing Backup & Restore

### Via Web Interface

1. **Log into the DAP application**
2. **Navigate to "Backup & Restore"** in the left sidebar (below Customers)
3. You'll see the Backup Management Panel with:
   - **Create Backup** button at the top
   - **List of existing backups** with metadata
   - **Actions** for each backup (Restore, Download, Delete)

### Via GraphQL API

You can also use the GraphQL API directly for automation:

```graphql
# Create a backup
mutation {
  createBackup {
    success
    filename
    size
    message
    metadata {
      recordCounts {
        customers
        products
        solutions
        tasks
      }
    }
  }
}

# List all backups
query {
  listBackups {
    id
    filename
    timestamp
    size
    recordCounts {
      customers
      products
      solutions
      customerProducts
      customerSolutions
      adoptionPlans
      tasks
    }
  }
}

# Restore from a backup
mutation {
  restoreBackup(filename: "dap_backup_2025-11-03T21-52-55-330Z.sql") {
    success
    message
    recordsRestored {
      customers
      products
      solutions
    }
  }
}

# Delete a backup
mutation {
  deleteBackup(filename: "dap_backup_2025-11-03T21-52-55-330Z.sql") {
    success
    message
  }
}
```

## How It Works

### Backend Architecture

#### 1. BackupRestoreService (`backend/src/services/BackupRestoreService.ts`)
Core service handling all backup operations:
- **createBackup()**: Creates a full database dump using `pg_dump` from the PostgreSQL container
- **restoreBackup()**: Clears tables and restores from a backup file
- **listBackups()**: Lists all available backups with metadata
- **deleteBackup()**: Removes backup files and metadata

#### 2. GraphQL Resolvers (`backend/src/schema/resolvers/backup.ts`)
- Exposes backup operations as GraphQL queries and mutations
- Enforces ADMIN role requirement
- Handles error responses

#### 3. Container-Based Execution
Backups are created by executing `pg_dump` inside the PostgreSQL container:
```bash
podman exec dap_db_1 pg_dump -U postgres -d dap -F p > backup.sql
```

This approach works regardless of whether PostgreSQL tools are installed on the host system.

### Frontend Architecture

#### BackupManagementPanel (`frontend/src/components/BackupManagementPanel.tsx`)
Full-featured React component providing:
- **Status Dashboard**: Shows system status and current database size
- **Backup Creation**: One-click backup with progress indicator
- **Backup List**: Table view of all backups with metadata
- **Action Buttons**: Restore, Download, Delete for each backup
- **Confirmation Dialogs**: Safety prompts before destructive operations
- **Success/Error Alerts**: User-friendly feedback

## Usage Examples

### Creating Your First Backup

1. **Navigate** to Backup & Restore section
2. **Click** "Create Backup" button
3. **Wait** for the backup to complete (typically 1-5 seconds)
4. **Success message** will display with backup details
5. **Backup appears** in the list below

### Restoring from a Backup

⚠️ **WARNING**: Restoring will **delete all current data** and replace it with the backup data!

1. **Find the backup** you want to restore in the list
2. **Click** the "Restore" button (blue icon)
3. **Read the warning** in the confirmation dialog
4. **Type "RESTORE"** to confirm (case-sensitive)
5. **Click** "Restore Database"
6. **Wait** for the restore to complete
7. **Page will reload** automatically with restored data

### Downloading a Backup

1. **Find the backup** in the list
2. **Click** the "Download" button (green download icon)
3. **Backup file** will download to your computer
4. **Store safely** for offline archival

### Deleting Old Backups

1. **Find the backup** to delete
2. **Click** the "Delete" button (red trash icon)
3. **Confirm** the deletion
4. **Backup is permanently removed**

## Best Practices

### When to Create Backups

✅ **Before major changes**
- Before updating products or solutions
- Before bulk data imports
- Before testing new features
- Before schema migrations

✅ **Regular snapshots**
- Daily backups for active development
- Weekly backups for production
- Before and after customer onboarding

✅ **Pre-deployment**
- Always backup before deploying new code
- Keep backups from the last 3 versions

### Backup Management

📁 **Storage Location**
- Backups are stored in `/data/dap/backend/temp/backups/`
- Metadata is stored in `/data/dap/backend/temp/backups/metadata/`
- Files are named: `dap_backup_YYYY-MM-DDTHH-MM-SS-SSSZ.sql`

🗑️ **Cleanup Strategy**
- Keep last 10 backups minimum
- Delete backups older than 30 days (except important milestones)
- Download and archive critical backups externally

💾 **Backup Size**
- Empty database: ~10 KB
- Small dataset (2-5 customers): ~100-500 KB
- Medium dataset (10-50 customers): ~1-5 MB
- Large dataset (100+ customers): ~10-50 MB

## Troubleshooting

### Backup Creation Fails

**Error**: "pg_dump: command not found"
- **Solution**: Ensure PostgreSQL container is running: `podman ps | grep postgres`
- **Fix**: Service uses container-based pg_dump automatically

**Error**: "Permission denied"
- **Solution**: Check file permissions in `/data/dap/backend/temp/backups/`
- **Fix**: `chmod 755 /data/dap/backend/temp/backups`

**Error**: "Database connection failed"
- **Solution**: Check DATABASE_URL environment variable
- **Fix**: Ensure PostgreSQL container is accessible

### Restore Fails

**Error**: "Backup file not found"
- **Solution**: Verify backup filename matches exactly
- **Fix**: List backups first to get correct filename

**Error**: "Permission denied during restore"
- **Solution**: Ensure database user has proper permissions
- **Fix**: Use superuser account or grant necessary permissions

**Error**: "Syntax error in backup file"
- **Solution**: Backup file may be corrupted
- **Fix**: Create a new backup or download a clean copy

### Download Fails

**Error**: "404 Not Found"
- **Solution**: Check if backup file still exists
- **Fix**: Refresh backup list and verify filename

## Security Considerations

🔒 **Access Control**
- Only ADMIN users can create, restore, or delete backups
- Authentication required for all backup operations
- GraphQL layer enforces role-based access

🔐 **Data Protection**
- Backups contain ALL data including sensitive information
- Store backups securely with appropriate permissions
- Encrypt backups when transferring between systems
- Use HTTPS for all backup downloads

⚠️ **Restore Safety**
- Confirmation dialog prevents accidental restores
- Type "RESTORE" to confirm (prevents misclicks)
- Current data is cleared before restore
- No automatic rollback (create backup first!)

## Technical Details

### Backup File Format

Backups are plain-text SQL files containing:
```sql
-- PostgreSQL dump
CREATE TABLE IF NOT EXISTS products (...);
INSERT INTO products VALUES (...);
-- ... more tables and data
```

### Metadata File Format

JSON metadata includes:
```json
{
  "id": "2025-11-03T21-52-55-330Z",
  "filename": "dap_backup_2025-11-03T21-52-55-330Z.sql",
  "timestamp": "2025-11-03T21:52:58.097Z",
  "size": 397106,
  "databaseUrl": "postgresql://...",
  "recordCounts": {
    "users": 1,
    "products": 6,
    "solutions": 2,
    "customers": 2,
    "customerProducts": 8,
    "customerSolutions": 3,
    "adoptionPlans": 8,
    "solutionAdoptionPlans": 3,
    "tasks": 133,
    "customerTasks": 89,
    "customerSolutionTasks": 24
  }
}
```

### Database Connection

Service parses DATABASE_URL to extract:
- Host: `localhost`
- Port: `5432`
- Database: `dap`
- User: `postgres`
- Password: from environment variable

### Container Commands

**Backup**:
```bash
podman exec dap_db_1 pg_dump -U postgres -d dap -F p > backup.sql
```

**Restore**:
```bash
cat backup.sql | podman exec -i dap_db_1 psql -U postgres -d dap
```

## Automation

### Scheduled Backups

You can automate backups using cron:

```bash
# Daily backup at 2 AM
0 2 * * * curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"mutation{createBackup{success filename}}"}' \
  >> /var/log/dap-backup.log 2>&1
```

### CI/CD Integration

Include backup creation in your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Create Pre-Deployment Backup
  run: |
    curl -X POST ${{ secrets.APP_URL }}/graphql \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}" \
      -d '{"query":"mutation{createBackup{success filename message}}"}'
```

### Backup Retention Script

```bash
#!/bin/bash
# Keep only last 10 backups
cd /data/dap/backend/temp/backups
ls -t dap_backup_*.sql | tail -n +11 | xargs -r rm
```

## Migration from v2.0 to v2.1

The backup system is new in v2.1. No migration needed, but recommended actions:

1. **Create your first backup** immediately after upgrading
2. **Test restore** in a development environment
3. **Set up backup schedule** for regular snapshots
4. **Document your backup strategy** for your team

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages in backend logs
3. Verify PostgreSQL container is running
4. Check file permissions in backup directory
5. Contact system administrator if needed

## Version History

- **v2.1.0** (2025-11-03): Initial release of backup & restore system
  - On-demand backup creation
  - Full database restore
  - Web UI and GraphQL API
  - Container-based PostgreSQL tools
  - Metadata tracking and record counts
- **v2.9.2** (2025-12-23): User Data Exclusion & Telemetry
  - User table data excluded from backups (managed separately)
  - Telemetry tables included in metadata tracking
  - Strict error checking during restore (fails on SQL errors)

---

**Last Updated**: November 3, 2025  
**Version**: 2.1.0  
**Status**: ✅ Production Ready

