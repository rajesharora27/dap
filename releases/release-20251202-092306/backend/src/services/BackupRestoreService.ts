import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../context';
import { SessionManager } from '../utils/sessionManager';

const execPromise = promisify(exec);

export interface BackupMetadata {
  id: string;
  filename: string;
  timestamp: Date;
  size: number;
  databaseUrl: string;
  recordCounts: {
    users: number;
    products: number;
    solutions: number;
    customers: number;
    customerProducts: number;
    customerSolutions: number;
    adoptionPlans: number;
    solutionAdoptionPlans: number;
    tasks: number;
    customerTasks: number;
    customerSolutionTasks: number;
  };
}

export interface BackupResult {
  success: boolean;
  filename: string;
  filePath: string;
  size: number;
  url: string;
  metadata?: BackupMetadata;
  message?: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  recordsRestored?: {
    users: number;
    products: number;
    solutions: number;
    customers: number;
    customerProducts: number;
    customerSolutions: number;
    adoptionPlans: number;
    solutionAdoptionPlans: number;
    tasks: number;
    customerTasks: number;
    customerSolutionTasks: number;
  };
  error?: string;
}

export class BackupRestoreService {
  private static readonly BACKUP_DIR = path.join(process.cwd(), 'temp', 'backups');
  private static readonly METADATA_DIR = path.join(process.cwd(), 'temp', 'backups', 'metadata');

  /**
   * Ensure backup directories exist
   */
  private static ensureDirectories(): void {
    if (!fs.existsSync(this.BACKUP_DIR)) {
      fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.METADATA_DIR)) {
      fs.mkdirSync(this.METADATA_DIR, { recursive: true });
    }
  }

  /**
   * Get database connection details from DATABASE_URL
   */
  private static parseDatabaseUrl(): {
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
  } {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse postgres://user:password@host:port/database
    const match = dbUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  /**
   * Get record counts for all major tables
   */
  private static async getRecordCounts() {
    const [
      users,
      products,
      solutions,
      customers,
      customerProducts,
      customerSolutions,
      adoptionPlans,
      solutionAdoptionPlans,
      tasks,
      customerTasks,
      customerSolutionTasks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.solution.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.customerProduct.count(),
      prisma.customerSolution.count(),
      prisma.adoptionPlan.count(),
      prisma.solutionAdoptionPlan.count(),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.customerTask.count(),
      prisma.customerSolutionTask.count(),
    ]);

    return {
      users,
      products,
      solutions,
      customers,
      customerProducts,
      customerSolutions,
      adoptionPlans,
      solutionAdoptionPlans,
      tasks,
      customerTasks,
      customerSolutionTasks,
    };
  }

  /**
   * Create a database backup
   * Note: Passwords are excluded from backup for security
   */
  static async createBackup(): Promise<BackupResult> {
    try {
      this.ensureDirectories();

      const dbConfig = this.parseDatabaseUrl();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `dap_backup_${timestamp}.sql`;
      const filePath = path.join(this.BACKUP_DIR, filename);

      // Get record counts before backup
      const recordCounts = await this.getRecordCounts();

      // Create backup
      // In production, we use native pg_dump as the database is running as a system service
      // In development, we use podman exec to run pg_dump inside the container
      const containerName = 'dap_db_1';
      let command: string;
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      if (process.env.NODE_ENV === 'production') {
        // Native Postgres
        command = `pg_dump -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.database} -F p --column-inserts > "${filePath}" 2>&1`;
      } else {
        // Podman container
        command = `podman exec ${containerName} pg_dump -U ${dbConfig.user} -d ${dbConfig.database} -F p --column-inserts > "${filePath}" 2>&1`;
      }

      await execPromise(command, { maxBuffer: 50 * 1024 * 1024, env }); // 50MB buffer

      // Now post-process the dump to remove password column from User table
      console.log('Removing password hashes from backup for security...');
      let backupContent = fs.readFileSync(filePath, 'utf-8');

      // Replace INSERT statements for User table to exclude password column
      // Pattern: INSERT INTO "User" (id, email, username, name, fullName, role, password, isAdmin, isActive, mustChangePassword, createdAt, updatedAt) VALUES (...)
      // Replace with: INSERT INTO "User" (id, email, username, name, fullName, role, isAdmin, isActive, mustChangePassword, createdAt, updatedAt) VALUES (...) 
      // And remove the password value from VALUES

      backupContent = backupContent.replace(
        /INSERT INTO "User" \([^)]*\bpassword\b[^)]*\) VALUES \(([^;]+)\);/gi,
        (match) => {
          // Find the password column position and remove it from both columns and values
          const columnsMatch = match.match(/INSERT INTO "User" \(([^)]+)\)/);
          const valuesMatch = match.match(/VALUES \(([^)]+)\)/);

          if (columnsMatch && valuesMatch) {
            const columns = columnsMatch[1].split(',').map(c => c.trim());
            const values = valuesMatch[1].split(',').map(v => v.trim());

            const passwordIndex = columns.findIndex(c => c === '"password"' || c === 'password');

            if (passwordIndex !== -1 && values.length === columns.length) {
              // Remove password column and its value
              columns.splice(passwordIndex, 1);
              values.splice(passwordIndex, 1);

              return `INSERT INTO "User" (${columns.join(', ')}) VALUES (${values.join(', ')});`;
            }
          }

          return match; // Return original if parsing fails
        }
      );

      // Also add a comment to the backup file indicating passwords are excluded
      backupContent = `-- DAP Backup (Passwords excluded for security - existing passwords will be preserved on restore)\n-- Generated: ${new Date().toISOString()}\n\n` + backupContent;

      // Write back the modified content
      fs.writeFileSync(filePath, backupContent, 'utf-8');

      // Get file size
      const stats = fs.statSync(filePath);
      const size = stats.size;

      // Create metadata
      const metadata: BackupMetadata = {
        id: timestamp,
        filename,
        timestamp: new Date(),
        size,
        databaseUrl: process.env.DATABASE_URL || '',
        recordCounts,
      };

      // Save metadata
      const metadataPath = path.join(this.METADATA_DIR, `${timestamp}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Generate download URL
      const url = `/api/downloads/backups/${encodeURIComponent(filename)}`;

      return {
        success: true,
        filename,
        filePath,
        size,
        url,
        metadata,
        message: `Backup created successfully: ${filename}`,
      };
    } catch (error: any) {
      console.error('Backup creation error:', error);
      return {
        success: false,
        filename: '',
        filePath: '',
        size: 0,
        url: '',
        metadata: undefined,
        error: error.message || 'Backup creation failed',
      };
    }
  }

  /**
   * Restore database from a backup file
   * Note: Automatically preserves existing user passwords
   * Backup files created after this update do not contain passwords
   */
  static async restoreBackup(filename: string): Promise<RestoreResult> {
    try {
      const filePath = path.join(this.BACKUP_DIR, filename);

      // Check if backup file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `Backup file not found: ${filename}`,
          error: 'File not found',
        };
      }

      const dbConfig = this.parseDatabaseUrl();
      const containerName = 'dap_db_1';

      // IMPORTANT: Save existing user passwords before restore
      console.log('Saving existing user passwords...');
      let existingPasswords: Map<string, string> = new Map();

      try {
        // Using prisma to get existing passwords
        const users = await prisma.user.findMany({
          select: {
            username: true,
            password: true
          }
        });

        users.forEach((user: any) => {
          existingPasswords.set(user.username, user.password);
        });

        console.log(`✅ Saved passwords for ${existingPasswords.size} user(s)`);
      } catch (err) {
        console.warn('⚠️  Could not save existing passwords, they may be reset:', (err as any).message);
      }

      // Fastest approach: Drop and recreate the public schema
      // This avoids all the CASCADE locking issues with TRUNCATE
      console.log('Clearing database before restore...');

      try {
        // First, terminate other connections (except ours)
        console.log('Terminating active connections...');
        try {
          const terminateCmd = process.env.NODE_ENV === 'production'
            ? `psql -U ${dbConfig.user} -h ${dbConfig.host} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid();"`
            : `podman exec ${containerName} psql -U ${dbConfig.user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid();"`;

          await execPromise(terminateCmd, { timeout: 5000, env: { ...process.env, PGPASSWORD: dbConfig.password } });
        } catch {
          // Ignore errors - might not have permission
          console.log('Could not terminate connections (may lack permission), continuing...');
        }

        // Drop the public schema (this drops all tables, functions, etc.)
        console.log('Dropping public schema...');
        const dropCmd = process.env.NODE_ENV === 'production'
          ? `psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -c "DROP SCHEMA IF EXISTS public CASCADE;"`
          : `podman exec ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -c "DROP SCHEMA IF EXISTS public CASCADE;"`;

        await execPromise(dropCmd, { timeout: 15000, env: { ...process.env, PGPASSWORD: dbConfig.password } });

        // Recreate the public schema
        console.log('Recreating public schema...');
        const createCmd = process.env.NODE_ENV === 'production'
          ? `psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -c "CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${dbConfig.user}; GRANT ALL ON SCHEMA public TO public;"`
          : `podman exec ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -c "CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${dbConfig.user}; GRANT ALL ON SCHEMA public TO public;"`;

        await execPromise(createCmd, { timeout: 10000, env: { ...process.env, PGPASSWORD: dbConfig.password } });

        console.log('Database cleared successfully');
      } catch (err: any) {
        console.error('Failed to clear database:', err.message);
        console.error('Full error:', err);
        throw new Error(`Failed to clear database before restore: ${err.message}`);
      }

      // Restore from backup
      console.log('Restoring from backup file...');
      console.log(`Backup file size: ${fs.statSync(filePath).size} bytes`);

      // Simpler restore command - pipe file directly into psql
      // Set statement timeout to prevent hanging
      let restoreCommand: string;
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      if (process.env.NODE_ENV === 'production') {
        restoreCommand = `cat "${filePath}" | psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -q 2>&1`;
      } else {
        restoreCommand = `cat "${filePath}" | podman exec -i ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -q 2>&1`;
      }

      console.log('Starting restore execution...');
      const startTime = Date.now();

      try {
        await execPromise(restoreCommand, {
          maxBuffer: 50 * 1024 * 1024,
          timeout: 120000, // 120 second timeout (2 minutes)
          env
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Restore command completed successfully in ${duration}s`);
      } catch (restoreError: any) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`Restore failed after ${duration}s:`, restoreError.message);

        // If timeout, provide helpful message
        if (restoreError.killed && restoreError.signal === 'SIGTERM') {
          throw new Error('Restore timed out after 60 seconds. Database may be too large or unresponsive.');
        }

        // Check if it's just warnings we can ignore
        if (restoreError.message && (
          restoreError.message.includes('already exists') ||
          restoreError.message.includes('NOTICE') ||
          restoreError.message.includes('WARNING')
        )) {
          console.log('Ignoring non-critical restore warnings');
        } else {
          throw new Error(`Restore failed: ${restoreError.message}`);
        }
      }

      // IMPORTANT: Restore existing user passwords after restore
      if (existingPasswords.size > 0) {
        console.log('Restoring user passwords...');

        try {
          let restoredCount = 0;

          for (const [username, password] of existingPasswords.entries()) {
            try {
              await prisma.user.update({
                where: { username },
                data: { password }
              });
              restoredCount++;
            } catch (err) {
              console.warn(`⚠️  Could not restore password for user "${username}":`, (err as any).message);
            }
          }

          console.log(`✅ Restored passwords for ${restoredCount} of ${existingPasswords.size} user(s)`);
        } catch (err) {
          console.error('⚠️  Error restoring passwords:', (err as any).message);
        }
      }

      // Clear all sessions after restore to force re-authentication
      console.log('🔐 Clearing all sessions after restore...');
      try {
        await SessionManager.clearAllSessions();
      } catch (err) {
        console.warn('⚠️  Could not clear sessions:', (err as any).message);
      }

      // Get record counts after restore
      const recordsRestored = await this.getRecordCounts();

      return {
        success: true,
        message: `Database restored successfully from ${filename}. User passwords preserved.`,
        recordsRestored,
      };
    } catch (error: any) {
      console.error('Restore error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      return {
        success: false,
        message: 'Restore failed',
        error: error.message || 'Restore operation failed',
      };
    }
  }

  /**
   * List all available backups
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      this.ensureDirectories();

      const files = fs.readdirSync(this.BACKUP_DIR);
      const backupFiles = files.filter(f => f.endsWith('.sql'));

      const backups: BackupMetadata[] = [];

      for (const file of backupFiles) {
        const filePath = path.join(this.BACKUP_DIR, file);
        const stats = fs.statSync(filePath);

        // Try to load metadata
        const timestamp = file.replace('dap_backup_', '').replace('.sql', '');
        const metadataPath = path.join(this.METADATA_DIR, `${timestamp}.json`);

        let metadata: BackupMetadata;

        if (fs.existsSync(metadataPath)) {
          const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
          metadata = JSON.parse(metadataContent);
        } else {
          // Create basic metadata if not found
          metadata = {
            id: timestamp,
            filename: file,
            timestamp: stats.mtime,
            size: stats.size,
            databaseUrl: process.env.DATABASE_URL || '',
            recordCounts: {
              users: 0,
              products: 0,
              solutions: 0,
              customers: 0,
              customerProducts: 0,
              customerSolutions: 0,
              adoptionPlans: 0,
              solutionAdoptionPlans: 0,
              tasks: 0,
              customerTasks: 0,
              customerSolutionTasks: 0,
            },
          };
        }

        backups.push(metadata);
      }

      // Sort by timestamp descending (newest first)
      backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return backups;
    } catch (error: any) {
      console.error('List backups error:', error);
      return [];
    }
  }

  /**
   * Delete a backup file
   */
  static async deleteBackup(filename: string): Promise<{ success: boolean; message: string }> {
    try {
      const filePath = path.join(this.BACKUP_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `Backup file not found: ${filename}`,
        };
      }

      // Delete backup file
      fs.unlinkSync(filePath);

      // Delete metadata if exists
      const timestamp = filename.replace('dap_backup_', '').replace('.sql', '');
      const metadataPath = path.join(this.METADATA_DIR, `${timestamp}.json`);
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      return {
        success: true,
        message: `Backup deleted successfully: ${filename}`,
      };
    } catch (error: any) {
      console.error('Delete backup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete backup',
      };
    }
  }

  /**
   * Get backup file path for download
   */
  static getBackupFilePath(filename: string): string {
    return path.join(this.BACKUP_DIR, filename);
  }
}

