import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../context';

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
  metadata: BackupMetadata;
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

      // Create backup using pg_dump from the container
      // Use podman/docker to execute pg_dump inside the PostgreSQL container
      const containerName = 'dap_db_1';
      const command = `podman exec ${containerName} pg_dump -U ${dbConfig.user} -d ${dbConfig.database} -F p > "${filePath}" 2>&1`;

      await execPromise(command, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer

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
        metadata: {} as BackupMetadata,
        error: error.message || 'Backup creation failed',
      };
    }
  }

  /**
   * Restore database from a backup file
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

      // Drop and recreate database (alternative: truncate all tables)
      // For safety, we'll use TRUNCATE CASCADE instead of DROP DATABASE
      console.log('Clearing database before restore...');

      // Get list of all tables
      const getTablesQuery = `
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations';
      `;

      const { stdout: tablesOutput } = await execPromise(
        `podman exec ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -t -c "${getTablesQuery}"`
      );

      const tables = tablesOutput
        .split('\n')
        .map(t => t.trim())
        .filter(t => t);

      // Truncate all tables one by one to avoid shell escaping issues with reserved keywords
      if (tables.length > 0) {
        console.log(`Truncating ${tables.length} tables...`);
        for (const table of tables) {
          try {
            await execPromise(
              `podman exec ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -c 'TRUNCATE TABLE "${table}" CASCADE;'`
            );
          } catch (err: any) {
            // Continue even if truncate fails (table might not exist)
            console.warn(`Warning: Failed to truncate table ${table}:`, err.message);
          }
        }
      }

      // Restore from backup
      console.log('Restoring from backup file...');
      // Use -v ON_ERROR_STOP=0 to continue on errors (like "type already exists")
      // Redirect stderr to stdout so we can capture it
      const restoreCommand = `cat "${filePath}" | podman exec -i ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -v ON_ERROR_STOP=0`;

      try {
        await execPromise(restoreCommand, { maxBuffer: 50 * 1024 * 1024 });
        console.log('Restore command completed successfully');
      } catch (restoreError: any) {
        // If the error is just about types already existing, we can ignore it
        if (restoreError.message && restoreError.message.includes('already exists')) {
          console.log('Ignoring "already exists" errors during restore');
        } else {
          throw restoreError;
        }
      }

      // Get record counts after restore
      const recordsRestored = await this.getRecordCounts();

      return {
        success: true,
        message: `Database restored successfully from ${filename}`,
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

