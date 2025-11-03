# Backup and Restore Feature - Complete Guide

## Overview

The DAP (Digital Adoption Platform) now includes a comprehensive backup and restore system that allows you to:
- Create full database snapshots with a single click
- View all available backups with detailed metadata
- Restore the database to any previous state
- Download backup files for external storage
- Delete old/unnecessary backups

## Features

### 1. **One-Click Backup Creation**
- Creates a complete PostgreSQL dump of the entire database
- Captures all data including:
  - Users and authentication data
  - Products, Solutions, and Customers
  - Tasks and Adoption Plans
  - Telemetry data and values
  - All relationships and configurations

### 2. **Backup Metadata**
Each backup includes comprehensive metadata:
- Unique ID and filename
- Timestamp of creation
- File size
- Record counts for all major tables
  - Users
  - Products
  - Solutions
  - Customers
  - Customer Products & Solutions
  - Adoption Plans
  - Tasks (Product and Customer tasks)
  - And more...

### 3. **Easy Restoration**
- Restore any backup with a single click
- Confirmation dialog prevents accidental restores
- Automatic page reload after restore completes
- Progress indicators during the restore process

### 4. **Backup Management**
- List all available backups
- View detailed information for each backup
- Download backups for external storage
- Delete old or unnecessary backups

## Architecture

### Backend Components

#### 1. **BackupRestoreService** (`backend/src/services/BackupRestoreService.ts`)

Main service class that handles all backup operations:

**Methods:**
- `createBackup()`: Creates a new database backup using `pg_dump`
- `restoreBackup(filename)`: Restores database from a backup file using `psql`
- `listBackups()`: Returns list of all available backups with metadata
- `deleteBackup(filename)`: Deletes a backup file and its metadata
- `getRecordCounts()`: Counts records in all major tables

**Storage:**
- Backups stored in: `backend/temp/backups/`
- Metadata stored in: `backend/temp/backups/metadata/`
- Files are named: `dap_backup_YYYY-MM-DDTHH-MM-SS-mmmZ.sql`

#### 2. **GraphQL Schema** (`backend/src/schema/backup.graphql`)

**Types:**
```graphql
type BackupMetadata {
  id: String!
  filename: String!
  timestamp: DateTime!
  size: Int!
  recordCounts: BackupRecordCounts!
}

type BackupResult {
  success: Boolean!
  filename: String
  size: Int
  url: String
  metadata: BackupMetadata
  message: String
  error: String
}

type RestoreResult {
  success: Boolean!
  message: String!
  recordsRestored: BackupRecordCounts
  error: String
}
```

**Queries:**
```graphql
listBackups: [BackupMetadata!]!
```

**Mutations:**
```graphql
createBackup: BackupResult!
restoreBackup(filename: String!): RestoreResult!
deleteBackup(filename: String!): DeleteBackupResult!
```

#### 3. **Resolvers** (`backend/src/schema/resolvers/backup.ts`)

Implements GraphQL resolvers with admin-only access control.

#### 4. **REST Endpoint**

Download endpoint for backup files:
```
GET /api/downloads/backups/:filename
```

### Frontend Components

#### **BackupManagementPanel** (`frontend/src/components/BackupManagementPanel.tsx`)

Complete React component with Material-UI interface:

**Features:**
- Responsive grid layout
- Real-time backup list updates (30-second polling)
- Detailed backup information display
- Confirmation dialogs for destructive actions
- Status messages and error handling
- Progress indicators
- Download functionality

**UI Sections:**
1. **Header**: Title and "Create Backup" button
2. **Status Messages**: Success/error alerts
3. **Backup List**: Left panel with all available backups
4. **Backup Details**: Right panel with selected backup information
5. **Actions**: Restore, Delete, and Download buttons
6. **Confirmation Dialogs**: Safety prompts for restore/delete operations

## Usage Guide

### Creating a Backup

1. Navigate to the Backup Management panel
2. Click the "Create Backup" button in the header
3. Wait for the backup process to complete (usually a few seconds)
4. Success message will appear
5. New backup will be added to the list

**Backend Process:**
```bash
pg_dump -h localhost -p 5432 -U postgres -d dap -F p -f "backup_file.sql"
```

### Viewing Backup Details

1. Click on any backup in the list
2. Right panel shows:
   - Filename
   - Creation timestamp
   - File size
   - Record counts for all tables

### Restoring from a Backup

⚠️ **WARNING**: This will replace ALL current data!

1. Select the backup you want to restore
2. Click the "Restore" button
3. Read the warning in the confirmation dialog
4. Click "Restore" to confirm
5. Wait for the restore process (may take 30-60 seconds)
6. Application will automatically reload

**Backend Process:**
```bash
# Truncate all tables
TRUNCATE TABLE [all_tables] CASCADE;

# Restore from backup
psql -h localhost -p 5432 -U postgres -d dap -f "backup_file.sql"
```

### Downloading a Backup

1. Hover over any backup in the list
2. Click the Download icon button
3. File will download to your browser's download folder

**Download URL:**
```
http://your-domain:port/api/downloads/backups/dap_backup_YYYY-MM-DDTHH-MM-SS-mmmZ.sql
```

### Deleting a Backup

1. Select the backup you want to delete
2. Click the "Delete" button
3. Confirm in the dialog
4. Backup file and metadata will be permanently removed

## Integration Guide

### Adding to Your Application

#### Option 1: As a Standalone Route

Add to your React Router configuration:

```typescript
import { BackupManagementPanel } from './components/BackupManagementPanel';

<Route path="/admin/backups" element={<BackupManagementPanel />} />
```

#### Option 2: In an Admin Dashboard

```typescript
import { BackupManagementPanel } from './components/BackupManagementPanel';

function AdminDashboard() {
  return (
    <Tabs>
      <Tab label="Users" panel={<UserManagement />} />
      <Tab label="Backups" panel={<BackupManagementPanel />} />
      <Tab label="Settings" panel={<Settings />} />
    </Tabs>
  );
}
```

#### Option 3: As a Dialog

```typescript
import { BackupManagementPanel } from './components/BackupManagementPanel';

<Dialog open={showBackup} maxWidth="lg" fullWidth>
  <BackupManagementPanel />
</Dialog>
```

### Environment Variables

No special configuration required! The system uses existing database connection:

```env
DATABASE_URL=postgres://user:password@host:port/database
```

## Security Considerations

### Access Control

- ✅ **Admin-only**: All backup operations require ADMIN role
- ✅ **GraphQL resolvers** check permissions via `ensureRole(ctx, 'ADMIN')`
- ✅ **REST endpoints** serve files but don't expose sensitive data

### Recommended Security Measures

1. **Restrict Network Access**
   ```bash
   # Only allow backup downloads from internal network
   location /api/downloads/backups/ {
       allow 192.168.1.0/24;
       deny all;
   }
   ```

2. **Encrypt Backups**
   ```bash
   # Example: Encrypt backup after creation
   gpg --encrypt --recipient admin@example.com backup_file.sql
   ```

3. **External Storage**
   - Download backups regularly
   - Store in secure cloud storage (S3, Azure Blob, etc.)
   - Implement retention policies

4. **Automated Backups**
   ```bash
   # Add to crontab for daily backups at 2 AM
   0 2 * * * curl -X POST http://localhost:4000/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{"query": "mutation { createBackup { success filename } }"}'
   ```

## Database Requirements

### PostgreSQL Tools Required

The backup/restore system requires PostgreSQL client tools:

```bash
# Check if installed
pg_dump --version
psql --version

# Install on Ubuntu/Debian
sudo apt-get install postgresql-client

# Install on macOS
brew install postgresql

# Install on RHEL/CentOS
sudo yum install postgresql
```

### Permissions

The database user must have:
- `SELECT` on all tables (for backup)
- `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE` (for restore)
- Ideally, use a superuser or database owner for backup operations

## Troubleshooting

### Issue: "pg_dump command not found"

**Solution:**
```bash
# Add PostgreSQL bin directory to PATH
export PATH="/usr/lib/postgresql/16/bin:$PATH"

# Or install PostgreSQL client tools
sudo apt-get install postgresql-client-16
```

### Issue: "Permission denied" during backup

**Solution:**
```bash
# Ensure temp/backups directory exists and is writable
mkdir -p backend/temp/backups/metadata
chmod 755 backend/temp/backups
```

### Issue: "Connection refused" during backup

**Solution:**
Check DATABASE_URL environment variable:
```bash
echo $DATABASE_URL
# Should be: postgres://user:password@host:port/database
```

### Issue: Restore fails with "permission denied"

**Solution:**
- Use a database superuser account
- Or grant necessary permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE dap TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: Backup list not updating

**Solution:**
- Wait 30 seconds (auto-refresh interval)
- Or manually refresh the page
- Check browser console for errors

## Best Practices

### 1. Regular Backups

Create backups:
- Before major data imports
- Before system upgrades
- Before schema changes
- Daily for production systems

### 2. Backup Retention

- Keep at least 7 daily backups
- Keep monthly backups for 1 year
- Archive old backups to external storage

### 3. Test Restores

- Regularly test restore process
- Use a test/staging environment
- Verify data integrity after restore

### 4. Monitor Backup Size

- Large databases may take longer to backup/restore
- Consider incremental backups for very large datasets
- Monitor disk space in temp/backups directory

### 5. Document Recovery Procedures

- Document step-by-step restore process
- Include database credentials
- Store documentation securely offline

## API Reference

### GraphQL Mutations

#### Create Backup

```graphql
mutation CreateBackup {
  createBackup {
    success
    filename
    size
    url
    message
    error
    metadata {
      id
      filename
      timestamp
      size
      recordCounts {
        users
        products
        solutions
        customers
        tasks
      }
    }
  }
}
```

#### Restore Backup

```graphql
mutation RestoreBackup($filename: String!) {
  restoreBackup(filename: $filename) {
    success
    message
    error
    recordsRestored {
      users
      products
      solutions
      customers
      tasks
    }
  }
}
```

#### Delete Backup

```graphql
mutation DeleteBackup($filename: String!) {
  deleteBackup(filename: $filename) {
    success
    message
  }
}
```

### GraphQL Queries

#### List Backups

```graphql
query ListBackups {
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
      customerProducts
      customerSolutions
      adoptionPlans
      solutionAdoptionPlans
      tasks
      customerTasks
      customerSolutionTasks
    }
  }
}
```

### REST Endpoints

#### Download Backup

```
GET /api/downloads/backups/:filename
```

**Response**: Binary SQL file download

## File Structure

```
backend/
  src/
    services/
      BackupRestoreService.ts      # Main backup service
    schema/
      backup.graphql                # GraphQL schema
      resolvers/
        backup.ts                   # GraphQL resolvers
    server.ts                       # REST endpoint configuration
  temp/
    backups/                        # Backup files storage
      dap_backup_*.sql              # SQL backup files
      metadata/                     # Metadata JSON files
        *.json

frontend/
  src/
    components/
      BackupManagementPanel.tsx     # UI component
```

## Performance Considerations

### Backup Performance

- **Small Database** (< 100MB): ~1-2 seconds
- **Medium Database** (100MB - 1GB): ~5-30 seconds
- **Large Database** (> 1GB): May take several minutes

### Restore Performance

- Generally 2-3x slower than backup
- Includes table truncation time
- Depends on number of indexes and constraints

### Optimization Tips

1. **Run during off-hours** for large databases
2. **Use compression** for storage efficiency:
   ```bash
   pg_dump ... | gzip > backup.sql.gz
   ```
3. **Incremental backups** for very large databases
4. **Partition large tables** to speed up operations

## Future Enhancements

Potential improvements for future versions:

1. **Scheduled Backups**: Automatic daily/weekly backups
2. **Cloud Storage Integration**: Direct upload to S3/Azure/GCS
3. **Backup Compression**: gzip compression for storage efficiency
4. **Incremental Backups**: Only backup changed data
5. **Backup Encryption**: Automatic GPG encryption
6. **Email Notifications**: Alert on backup success/failure
7. **Backup Verification**: Automated integrity checks
8. **Multi-version Support**: Keep multiple backup versions
9. **Selective Restore**: Restore specific tables only
10. **Backup Comparison**: Compare two backups to see differences

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review server logs in `backend/logs/`
3. Check browser console for frontend errors
4. Verify database connectivity and permissions

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Author**: DAP Development Team

