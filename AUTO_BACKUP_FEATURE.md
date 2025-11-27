# Auto-Backup Feature

## Overview

The DAP application now includes an **automated backup feature** that creates database backups daily at 1:00 AM, but **only if changes have been detected** in the database. This ensures efficient use of storage while maintaining regular backups.

## Features

### 1. **Smart Change Detection**
- The system calculates a checksum based on:
  - Record counts from all major tables (users, products, solutions, customers, tasks)
  - Last updated timestamps from each table
- Backups are only created if this checksum has changed since the last backup
- Prevents unnecessary backups when no data changes have occurred

### 2. **Configurable Schedule**
- Default schedule: **1:00 AM daily** (cron: `0 1 * * *`)
- Can be customized through the configuration file

### 3. **Automatic Retention Management**
- Default retention: **7 days**
- Automatically deletes backups older than the retention period
- Retention period can be customized from 1-90 days

### 4. **Easy Management UI**
- Toggle auto-backup on/off with a single switch
- Adjust retention period directly from the UI
- "Test Now" button to trigger an immediate backup
- Shows last backup time

## How to Use

### Enabling Auto-Backup

1. **Open the Backup Management Panel**:
   - Log in as admin
   - Navigate to Settings → Backup & Restore

2. **Enable Auto-Backup**:
   - Toggle the "Enable Auto-Backup" switch to ON
   - Set your desired retention period (1-90 days)
   - Click "Test Now" to verify it works

3. **Verify**:
   - Check that the "Last auto-backup" timestamp appears after testing
   - The scheduler will now run daily at 1:00 AM

### Configuration

The auto-backup configuration is stored in:
```
/data/dap/backend/temp/auto-backup-config.json
```

Example configuration:
```json
{
  "enabled": true,
  "schedule": "0 1 * * *",
  "retentionDays": 7,
  "lastBackupTime": "2025-11-14T01:00:00.000Z",
  "lastChangeChecksum": "{...}"
}
```

## Technical Details

### Backend Components

1. **AutoBackupScheduler Service** (`backend/src/services/AutoBackupScheduler.ts`):
   - Singleton service that manages the backup schedule
   - Uses `node-cron` for scheduling
   - Handles change detection and cleanup

2. **GraphQL API**:
   - Query: `autoBackupConfig` - Get current configuration
   - Mutation: `updateAutoBackupConfig` - Update settings
   - Mutation: `triggerAutoBackup` - Trigger immediate backup

3. **Server Integration**:
   - Scheduler initializes automatically on server startup
   - Logs all backup operations

### Frontend Components

**Backup Management Panel** (`frontend/src/components/BackupManagementPanel.tsx`):
- New "Automated Backup" section with:
  - Enable/disable toggle
  - Retention days selector
  - Test button
  - Status display

## Logging

Auto-backup operations are logged with the `[AutoBackup]` prefix:

```
[AutoBackup] Starting scheduled backup check at 2025-11-14T01:00:00.000Z
[AutoBackup] Database changes detected, creating backup...
[AutoBackup] Backup created successfully: dap_backup_2025-11-14T01-00-00-000Z.sql
[AutoBackup] Cleaned up 2 old backup(s)
```

Or, when no changes detected:
```
[AutoBackup] No database changes detected, skipping backup
```

## How Change Detection Works

The system creates a checksum by combining:

1. **Record Counts**:
   - Users
   - Products
   - Solutions
   - Customers
   - Tasks

2. **Last Update Timestamps** (most recent `updatedAt` from each table):
   - User table
   - Product table
   - Solution table
   - Customer table
   - Task table

Example checksum:
```json
{
  "counts": {
    "userCount": 5,
    "productCount": 10,
    "solutionCount": 3,
    "customerCount": 8,
    "taskCount": 150
  },
  "lastUpdates": {
    "user": "2025-11-14T10:30:00.000Z",
    "product": "2025-11-13T15:20:00.000Z",
    "solution": "2025-11-12T08:45:00.000Z",
    "customer": "2025-11-14T11:15:00.000Z",
    "task": "2025-11-14T12:00:00.000Z"
  }
}
```

If any of these values change, a new backup is created.

## Manual Backup vs Auto-Backup

- **Manual Backup**: Always creates a backup immediately, regardless of changes
- **Auto-Backup**: Only creates a backup if changes are detected

Both types of backups are stored in the same directory and managed together.

## Troubleshooting

### Auto-backup not running

1. Check if it's enabled:
   ```bash
   cat /data/dap/backend/temp/auto-backup-config.json
   ```

2. Check backend logs:
   ```bash
   tail -f /data/dap/backend-auto-backup.log | grep AutoBackup
   ```

3. Verify the scheduler initialized:
   - Look for "✅ Auto-backup scheduler initialized" in logs

### Backups not being created

1. Check if changes are being detected:
   - Look for "[AutoBackup] No database changes detected, skipping backup"
   - Make some changes in the database and wait for next scheduled run

2. Trigger a manual test:
   - Use the "Test Now" button in the UI
   - Check the response and logs

### Old backups not being deleted

1. Check retention setting:
   - Ensure `retentionDays` is set correctly
   - Check the UI or config file

2. Verify cleanup is running:
   - Look for "[AutoBackup] Cleaned up X old backup(s)" in logs

## API Examples

### Get Current Configuration

```graphql
query {
  autoBackupConfig {
    enabled
    schedule
    retentionDays
    lastBackupTime
  }
}
```

### Enable Auto-Backup

```graphql
mutation {
  updateAutoBackupConfig(input: {
    enabled: true
    retentionDays: 7
  }) {
    enabled
    schedule
    retentionDays
    lastBackupTime
  }
}
```

### Trigger Manual Auto-Backup

```graphql
mutation {
  triggerAutoBackup {
    success
    filename
    message
    error
  }
}
```

## Files Modified/Created

### Backend
- ✅ `src/services/AutoBackupScheduler.ts` (NEW)
- ✅ `src/schema/typeDefs.ts` (MODIFIED - added AutoBackupConfig types)
- ✅ `src/schema/resolvers/backup.ts` (MODIFIED - added auto-backup resolvers)
- ✅ `src/server.ts` (MODIFIED - initialize scheduler on startup)
- ✅ `package.json` (MODIFIED - added node-cron dependency)

### Frontend
- ✅ `src/components/BackupManagementPanel.tsx` (MODIFIED - added auto-backup UI)

### Documentation
- ✅ `AUTO_BACKUP_FEATURE.md` (NEW - this file)

## Dependencies Added

- **node-cron** (`^3.0.3`): Cron job scheduler for Node.js
- **@types/node-cron** (`^3.0.11`): TypeScript definitions

## Future Enhancements

Potential improvements that could be added:

1. **Email Notifications**: Send email alerts on backup success/failure
2. **Cloud Storage**: Automatically upload backups to S3/Cloud Storage
3. **Multiple Schedules**: Support for hourly, weekly, monthly backups
4. **Backup Compression**: Compress backups to save space
5. **Incremental Backups**: Only backup changed data
6. **Backup Validation**: Automatically test restore from backups

## Summary

The auto-backup feature provides:
- ✅ Automated daily backups at 1:00 AM
- ✅ Smart change detection (only backs up when needed)
- ✅ Automatic cleanup of old backups
- ✅ Easy UI configuration
- ✅ Manual testing capability
- ✅ Full logging and monitoring

This ensures your DAP database is regularly backed up without manual intervention, while being efficient about storage usage.



