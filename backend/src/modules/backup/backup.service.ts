import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../shared/graphql/context';
import { SessionManager } from '../auth/session.service';

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
    productTags: number;
    solutionTags: number;
    taskTags: number;
    solutionTaskTags: number;
    // Telemetry tables
    telemetryAttributes?: number;
    customerTelemetryAttributes?: number;
    telemetrySubmissions?: number;
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
    productTags: number;
    solutionTags: number;
    taskTags: number;
    solutionTaskTags: number;
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
    password?: string;
  } {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse postgres://user:password@host:port/database or postgres://user@host:port/database
    // Regex allows optional password part
    const match = dbUrl.match(/postgres(?:ql)?:\/\/([^:@]+)(?::([^@]+))?@([^:]+):(\d+)\/([^?]+)/);

    if (!match) {
      // Try fallback for simple connection strings without strict validation
      throw new Error('Invalid DATABASE_URL format. Expected postgres://user:password@host:port/database');
    }

    return {
      user: match[1],
      password: match[2], // Can be undefined
      host: match[3],
      port: match[4],
      database: match[5],
    };
  }

  /**
   * Check if a command exists in the system path
   */
  private static async checkCommand(cmd: string): Promise<boolean> {
    try {
      await execPromise(`which ${cmd}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get record counts for all major tables
   */
  private static async getRecordCounts() {
    // Core tables - always exist
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

    // Tag tables - may not exist in older backups, fail gracefully
    let productTags = 0, solutionTags = 0, taskTags = 0, solutionTaskTags = 0;
    try {
      [productTags, solutionTags, taskTags, solutionTaskTags] = await Promise.all([
        prisma.productTag.count(),
        prisma.solutionTag.count(),
        prisma.taskTag.count(),
        prisma.solutionTaskTag.count(),
      ]);
    } catch (err) {
      // Tag tables may not exist in older databases - that's ok
      console.log('[Backup] Tag tables not found, using 0 counts');
    }

    // Telemetry tables - may not exist in older backups
    let telemetryAttributes = 0, customerTelemetryAttributes = 0, telemetrySubmissions = 0;
    try {
      [telemetryAttributes, customerTelemetryAttributes, telemetrySubmissions] = await Promise.all([
        prisma.telemetryAttribute.count(),
        prisma.customerTelemetryAttribute.count(),
        prisma.telemetrySubmission.count(),
      ]);
    } catch (err) {
      // Telemetry tables may not exist in older databases
      console.log('[Backup] Telemetry tables not found, using 0 counts');
    }

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
      productTags,
      solutionTags,
      taskTags,
      solutionTaskTags,
      telemetryAttributes,
      customerTelemetryAttributes,
      telemetrySubmissions,
    };
  }

  /**
   * Create a database backup
   * Note: Passwords are excluded from backup for security
   */
  static async createBackup(customName?: string): Promise<BackupResult> {
    try {
      this.ensureDirectories();

      const dbConfig = this.parseDatabaseUrl();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      let filenamePart = '';
      if (customName) {
        // Sanitize name: remove non-alphanumeric chars (keep - and _)
        const safeName = customName.replace(/[^a-zA-Z0-9-_]/g, '');
        if (safeName) {
          filenamePart = `_${safeName}`;
        }
      }

      const filename = `dap_backup${filenamePart}_${timestamp}.sql`;
      const filePath = path.join(this.BACKUP_DIR, filename);

      // Get record counts before backup
      const recordCounts = await this.getRecordCounts();

      // Create backup
      // In production, we use native pg_dump as the database is running as a system service
      // In development, we use docker/podman exec to run pg_dump inside the container
      const containerName = process.env.DB_CONTAINER_NAME || 'dap_db_1';
      let command: string;

      // Construct env with password only if it exists
      const env: NodeJS.ProcessEnv = { ...process.env };
      if (dbConfig.password) {
        env.PGPASSWORD = dbConfig.password;
      }

      // Check if pg_dump is available natively
      let pgDumpCmd = 'pg_dump';
      const hasPgDump = await this.checkCommand('pg_dump');
      const forceContainer = process.env.DB_FORCE_CONTAINER === 'true';

      // On macOS, check for version-specific pg_dump paths to handle version mismatches
      if (hasPgDump && process.platform === 'darwin') {
        // Try to find a matching version pg_dump
        const versionPaths = [
          '/opt/homebrew/opt/postgresql@16/bin/pg_dump',
          '/usr/local/opt/postgresql@16/bin/pg_dump',
          '/opt/homebrew/opt/postgresql@15/bin/pg_dump',
          '/opt/homebrew/bin/pg_dump',
          '/usr/local/bin/pg_dump',
        ];

        for (const vPath of versionPaths) {
          if (await this.checkCommand(vPath)) {
            // Check if this version matches the server
            try {
              const { stdout: versionOut } = await execPromise(`${vPath} --version`);
              const match = versionOut.match(/(\d+)\./);
              if (match) {
                const pgDumpMajor = parseInt(match[1], 10);
                // Get server version
                const { stdout: serverVersion } = await execPromise(
                  `psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -t -c "SHOW server_version;"`,
                  { env }
                );
                const serverMatch = serverVersion.match(/(\d+)\./);
                if (serverMatch && parseInt(serverMatch[1], 10) === pgDumpMajor) {
                  console.log(`Using pg_dump version ${pgDumpMajor} from ${vPath}`);
                  pgDumpCmd = vPath;
                  break;
                }
              }
            } catch {
              // Ignore errors, try next path
            }
          }
        }
      }

      // Detect container runtime
      let containerRuntime = 'docker';
      if (await this.checkCommand('podman')) {
        containerRuntime = 'podman';
      } else if (await this.checkCommand('docker')) {
        containerRuntime = 'docker';
      }

      const excludeTables = [
        'User',
        'Role',
        'UserRole',
        'Permission',
        'RolePermission',
        'Session',
        'LockedEntity',
        'AuditLog',
        'ChangeSet'
      ].map(t => `--exclude-table-data='"${t}"'`).join(' ');

      if (hasPgDump && !forceContainer) {
        // Native Postgres (macOS light mode or prod)
        // On macOS with local socket (no password), use simpler connection
        if (process.platform === 'darwin' && !dbConfig.password) {
          // macOS local socket connection (peer auth)
          command = `${pgDumpCmd} -d ${dbConfig.database} -F p --column-inserts --no-owner --no-acl ${excludeTables} > "${filePath}" 2>&1`;
          console.log('Using macOS local socket connection for pg_dump');
        } else {
          // Standard connection with host/user/password
          command = `${pgDumpCmd} -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.database} -F p --column-inserts --no-owner --no-acl ${excludeTables} > "${filePath}" 2>&1`;
        }
      } else {
        // Containerized Postgres
        // Verify container runtime exists
        if (!(await this.checkCommand(containerRuntime))) {
          if (!hasPgDump) {
            throw new Error(`pg_dump not found natively and ${containerRuntime} not found. Cannot create backup.`);
          }
        }

        command = `${containerRuntime} exec ${containerName} pg_dump -U ${dbConfig.user} -d ${dbConfig.database} -F p --column-inserts --no-owner --no-acl ${excludeTables} > "${filePath}" 2>&1`;
      }

      console.log('Executing backup command...');
      await execPromise(command, { maxBuffer: 50 * 1024 * 1024, env, timeout: 120000 }); // 50MB buffer, 2min timeout

      // Post-processing: Add header comment
      let backupContent = fs.readFileSync(filePath, 'utf-8');
      backupContent = `-- DAP Backup (User data excluded - restore users via separate script)\n-- Generated: ${new Date().toISOString()}\n\n` + backupContent;

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
      console.error('Backup creation error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return {
        success: false,
        filename: '',
        filePath: '',
        size: 0,
        url: '',
        metadata: undefined,
        error: error.message || 'Backup creation failed (Unknown error)',
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
      const containerName = process.env.DB_CONTAINER_NAME || 'dap_db_1';

      // Check if psql and pg_dump are available natively
      const hasPsql = await this.checkCommand('psql');
      const hasPgDump = await this.checkCommand('pg_dump');
      const forceContainer = process.env.DB_FORCE_CONTAINER === 'true';
      const useNative = hasPsql && !forceContainer;

      // Detect container runtime
      let containerRuntime = 'docker';
      if (await this.checkCommand('podman')) {
        containerRuntime = 'podman';
      } else if (await this.checkCommand('docker')) {
        containerRuntime = 'docker';
      }

      const env: NodeJS.ProcessEnv = { ...process.env };
      if (dbConfig.password) {
        env.PGPASSWORD = dbConfig.password;
      }

      // On macOS, try to add common homebrew pg bin paths to avoid version mismatch
      if (process.platform === 'darwin') {
        const pgPaths = [
          '/opt/homebrew/opt/postgresql@16/bin',
          '/opt/homebrew/opt/postgresql@15/bin',
          '/opt/homebrew/bin',
          '/usr/local/bin'
        ];
        env.PATH = `${pgPaths.join(':')}:${process.env.PATH}`;
      }

      // Helper for commands
      // On macOS with local socket (no password), use simpler connection
      const isMacLocal = process.platform === 'darwin' && !dbConfig.password;

      const runQuery = async (query: string, timeoutMs: number = 10000) => {
        let cmd: string;
        if (useNative) {
          if (isMacLocal) {
            cmd = `psql -d ${dbConfig.database} -c "${query}"`;
          } else {
            cmd = `psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -c "${query}"`;
          }
        } else {
          cmd = `${containerRuntime} exec ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -c "${query}"`;
        }

        await execPromise(cmd, { timeout: timeoutMs, env });
      };

      // IMPORTANT: Save existing user passwords/identity before restore
      console.log('Preserving existing Identity data (Users, Roles, Permissions)...');

      const identityTables = [
        'User',
        'Role',
        'UserRole',
        'Permission',
        'RolePermission',
        'AuditLog',
        'ChangeSet',
        'Session',
        'LockedEntity'
      ];
      const preserveFilePath = filePath + '.identity.sql';

      try {
        // Construct pg_dump command for identity tables
        // Use the same connection logic as backup
        // Need to replicate pgCommand logic slightly or assume psql connection params suffice?
        // We have dbConfig.

        // Flush any pending Prisma writes before dumping
        await prisma.$executeRawUnsafe('CHECKPOINT;');

        let preserveCmd: string;
        // The most robust way to quote for pg_dump across shells: -t '"TableName"'
        const tableArgs = identityTables.map(t => `-t '"${t}"'`).join(' ');
        const pgDumpBin = hasPgDump ? 'pg_dump' : 'pg_dump'; // fallback

        // Note: We use data-only, column-inserts. 
        // Quotes around table names require careful shell escaping. 
        if (useNative) {
          if (isMacLocal) {
            preserveCmd = `pg_dump -d ${dbConfig.database} --data-only --column-inserts ${tableArgs} > "${preserveFilePath}"`;
          } else {
            preserveCmd = `pg_dump -U ${dbConfig.user} -h ${dbConfig.host} -p ${dbConfig.port} -d ${dbConfig.database} --data-only --column-inserts ${tableArgs} > "${preserveFilePath}"`;
          }
        } else {
          preserveCmd = `${containerRuntime} exec ${containerName} pg_dump -U ${dbConfig.user} -d ${dbConfig.database} --data-only --column-inserts ${tableArgs} > "${preserveFilePath}"`;
        }

        // Execute preservation
        if (process.platform === 'win32') {
          // Windows escaping is hard, skipping complex logic or assuming native psql works
          console.log('Skipping preservation on Windows (not supported automatically yet).');
        } else {
          console.log(`Executing identity preservation: ${preserveCmd}`);
          await execPromise(preserveCmd, { timeout: 30000, env });
          console.log(`Identity data preserved to ${preserveFilePath}`);
        }
      } catch (err: any) {
        console.error('Failed to preserve identity data:', err.message);
        if (err.stderr) console.error('Preservation stderr:', err.stderr);
        if (err.stdout) console.error('Preservation stdout:', err.stdout);

        // If preservation fails, we lose users. ABORT is safer.
        throw new Error(`Failed to preserve existing users (${err.message}). Aborting restore to prevent data loss.`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingPasswords: Map<string, string> = new Map();

      // Fastest approach: Drop and recreate the public schema
      // This avoids all the CASCADE locking issues with TRUNCATE
      console.log('Disconnecting Prisma client...');
      await prisma.$disconnect();

      console.log('Clearing database before restore...');

      try {
        // First, terminate other connections (except ours)
        console.log('Terminating active connections...');
        try {
          const terminateSql = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbConfig.database}' AND pid <> pg_backend_pid();`;

          // Use a different database (postgres) to terminate connections to target DB
          const terminateCmd = useNative
            ? `psql -U ${dbConfig.user} -h ${dbConfig.host} -d postgres -c "${terminateSql}"`
            : `${containerRuntime} exec ${containerName} psql -U ${dbConfig.user} -d postgres -c "${terminateSql}"`;

          await execPromise(terminateCmd, { timeout: 5000, env });
        } catch {
          // Ignore errors - might not have permission
          console.log('Could not terminate connections (may lack permission), continuing...');
        }

        // Drop the public schema (this drops all tables, functions, etc.)
        console.log('Dropping public schema...');
        await runQuery("DROP SCHEMA IF EXISTS public CASCADE;", 15000);

        // Recreate the public schema
        console.log('Recreating public schema...');
        await runQuery(`CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${dbConfig.user}; GRANT ALL ON SCHEMA public TO public;`, 10000);

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

      if (useNative) {
        if (isMacLocal) {
          // macOS local socket connection
          restoreCommand = `cat "${filePath}" | psql -d ${dbConfig.database} -v ON_ERROR_STOP=1 -q 2>&1`;
          console.log('Using macOS local socket connection for restore');
        } else {
          restoreCommand = `cat "${filePath}" | psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -v ON_ERROR_STOP=1 -q 2>&1`;
        }
      } else {
        restoreCommand = `cat "${filePath}" | ${containerRuntime} exec -i ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -v ON_ERROR_STOP=1 -q 2>&1`;
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

      // Reconnect Prisma client
      console.log('Reconnecting Prisma client...');
      await prisma.$connect();

      // IMPORTANT: Sync schema to ensure backward compatibility with older backups
      // This adds any missing columns/tables that exist in the current schema but not in the backup
      console.log('🔄 Syncing database schema for backward compatibility...');
      try {
        const prismaPushCmd = 'npx prisma db push --accept-data-loss --skip-generate';
        const { stdout, stderr } = await execPromise(prismaPushCmd, {
          cwd: process.cwd(),
          timeout: 60000, // 60 second timeout
          maxBuffer: 10 * 1024 * 1024,
        });
        if (stdout) console.log('Prisma output:', stdout);
        if (stderr && !stderr.includes('Your database is now in sync')) {
          console.warn('Prisma warnings:', stderr);
        }
        console.log('✅ Database schema synced successfully');
      } catch (schemaErr: any) {
        // Don't fail the restore if schema sync fails - just warn
        console.error('⚠️  Schema sync warning:', schemaErr.message);
        console.error('   You may need to run: npx prisma db push --accept-data-loss');
      }

      // Regenerate Prisma client to pick up any schema changes
      console.log('🔄 Regenerating Prisma client...');
      try {
        await execPromise('npx prisma generate', {
          cwd: process.cwd(),
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
        });
        console.log('✅ Prisma client regenerated');
      } catch (genErr: any) {
        console.warn('⚠️  Prisma generate warning:', genErr.message);
      }

      // Reconnect with fresh client after generation
      await prisma.$disconnect();
      await prisma.$connect();

      // NOTE: User passwords are not restored here as User data is excluded
      console.log('Skipping password restore (User data managed separately)...');

      // Clear all sessions after restore to force re-authentication
      console.log('🔐 Clearing all sessions after restore...');
      try {
        await SessionManager.clearAllSessions();
      } catch (err) {
        console.warn('⚠️  Could not clear sessions:', (err as any).message);
      }

      // Get record counts after restore
      console.log('Main restore completed.');

      // Restore Preserved Identity Data
      if (fs.existsSync(preserveFilePath)) {
        console.log('Restoring preserved Identity data...');
        try {
          // We must use session_replication_role = replica to avoid FK issues during insert (unordered)?
          // Actually pg_dump orders them? Or maybe not if -t arguments passed.
          // Safer to use replica role wrapping.

          // Read SQL content
          const identitySql = fs.readFileSync(preserveFilePath, 'utf-8');

          // Wrap in transaction. Try to use replica role but fallback if no permission
          const wrappedSql = `
             -- Ensure UTF8 for bcrypt hashes and special characters
             SET client_encoding = 'UTF8';
             SET search_path = public;
             
             BEGIN;
             DO $$ 
             BEGIN
                SET session_replication_role = replica;
             EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipping session_replication_role due to lack of permissions';
             END $$;

             -- Clear any data that might have been seeded or restored from a non-exclusive backup
             -- This prevents "Duplicate Key" errors during the following INSERTs
             DELETE FROM "RolePermission";
             DELETE FROM "UserRole";
             DELETE FROM "Permission";
             DELETE FROM "AuditLog";
             DELETE FROM "ChangeSet";
             DELETE FROM "LockedEntity";
             DELETE FROM "Session";
             DELETE FROM "User";
             DELETE FROM "Role";
             
             ${identitySql}
             
             COMMIT;
           `;

          // Write to temp file for execution (to avoid shell limit)
          const wrapperPath = preserveFilePath + '.run.sql';
          const sqlContent = Buffer.from(wrappedSql, 'utf-8');
          fs.writeFileSync(wrapperPath, sqlContent);
          // Count inserts per table for verification
          const insertCounts: Record<string, number> = {};
          const insertRegex = /INSERT INTO public\."([^"]+)"/g;
          let match;
          while ((match = insertRegex.exec(identitySql)) !== null) {
            const table = match[1];
            insertCounts[table] = (insertCounts[table] || 0) + 1;
          }
          console.log('Restoring Identity data:', JSON.stringify(insertCounts));

          if (identitySql.includes('$2a$10$')) {
            console.log('✅ Found bcrypt-like signatures in identity data.');
          } else {
            console.warn('⚠️  No bcrypt-like signatures found in identity data (passwords might be missing!)');
          }

          // Execute psql
          let restoreIdentityCmd: string;
          if (useNative) {
            if (isMacLocal) {
              restoreIdentityCmd = `psql -d ${dbConfig.database} -v ON_ERROR_STOP=1 -f "${wrapperPath}"`;
            } else {
              restoreIdentityCmd = `psql -U ${dbConfig.user} -h ${dbConfig.host} -d ${dbConfig.database} -v ON_ERROR_STOP=1 -f "${wrapperPath}"`;
            }
          } else {
            restoreIdentityCmd = `cat "${wrapperPath}" | ${containerRuntime} exec -i ${containerName} psql -U ${dbConfig.user} -d ${dbConfig.database} -v ON_ERROR_STOP=1`;
          }

          const { stderr } = await execPromise(restoreIdentityCmd, { timeout: 30000, env });
          if (stderr) console.warn('Identity restore warnings:', stderr);
          console.log('Identity data restored successfully.');

          // Post-restore verification: Check if admin user exists and log found IDs
          try {
            const adminCheck = await prisma.user.findUnique({ where: { username: 'admin' } });
            if (adminCheck) {
              console.log(`✅ Verified: Admin user exists after restore (ID: ${adminCheck.id})`);
            } else {
              console.warn('⚠️  CRITICAL: Admin user MISSING after identity restoration!');
            }
          } catch (verifyErr) {
            console.warn('Could not verify admin user status:', (verifyErr as any).message);
          }

          // Cleanup
          fs.unlinkSync(preserveFilePath);
          fs.unlinkSync(wrapperPath);

        } catch (err: any) {
          console.error('Failed to restore identity data:', err);
          // Non-fatal? Users might be missing.
          // We should throw to warn user.
          throw new Error(`Main restore succeeded but User restoration failed: ${err.message}`);
        }
      }

      // Get record counts after restore
      const recordsRestored = await this.getRecordCounts();

      return {
        success: true,
        message: `Database restored successfully from ${filename}. Schema synced. User data managed separately.`,
        recordsRestored,
      };
    } catch (error: any) {
      // Ensure Prisma is reconnected even if restore failed
      try { await prisma.$connect(); } catch (e) { console.error('Failed to reconnect Prisma:', e); }

      // Try to recover schema so the app remains functional (even if data is missing)
      console.log('⚠️ Restore failed. Attempting to recover schema to prevent crash loop...');
      try {
        const prismaPushCmd = 'npx prisma db push --accept-data-loss --skip-generate';
        await execPromise(prismaPushCmd, { timeout: 60000 });
        console.log('✅ Schema recovered (tables created empty)');
      } catch (schemaErr: any) {
        console.error('❌ Failed to recover schema:', schemaErr.message);
      }

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
              productTags: 0,
              solutionTags: 0,
              taskTags: 0,
              solutionTaskTags: 0,
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

