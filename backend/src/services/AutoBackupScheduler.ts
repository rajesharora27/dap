import { BackupRestoreService } from './BackupRestoreService';
import { prisma } from '../context';
import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';

interface AutoBackupConfig {
  enabled: boolean;
  schedule: string; // cron expression
  retentionDays: number;
  lastBackupTime?: Date;
  lastChangeChecksum?: string;
}

export class AutoBackupScheduler {
  private static instance: AutoBackupScheduler;
  private cronJob: cron.ScheduledTask | null = null;
  private config: AutoBackupConfig = {
    enabled: false,
    schedule: '0 1 * * *', // Default: 1:00 AM daily
    retentionDays: 7,
  };
  private configPath = path.join(process.cwd(), 'temp', 'auto-backup-config.json');

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): AutoBackupScheduler {
    if (!AutoBackupScheduler.instance) {
      AutoBackupScheduler.instance = new AutoBackupScheduler();
    }
    return AutoBackupScheduler.instance;
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(configData);
        console.log('[AutoBackup] Loaded config:', this.config);
      } else {
        console.log('[AutoBackup] No config file found, using defaults');
        this.saveConfig();
      }
    } catch (error: any) {
      console.error('[AutoBackup] Error loading config:', error.message);
    }
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('[AutoBackup] Saved config');
    } catch (error: any) {
      console.error('[AutoBackup] Error saving config:', error.message);
    }
  }

  /**
   * Calculate database checksum based on record counts and update times
   */
  private async getDatabaseChecksum(): Promise<string> {
    try {
      // Get counts and last update times from all major tables
      const [
        userCount,
        productCount,
        solutionCount,
        customerCount,
        taskCount,
        // Get the most recent updatedAt from each table
        recentUser,
        recentProduct,
        recentSolution,
        recentCustomer,
        recentTask,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.product.count({ where: { deletedAt: null } }),
        prisma.solution.count({ where: { deletedAt: null } }),
        prisma.customer.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { deletedAt: null } }),
        prisma.user.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
        prisma.product.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
        prisma.solution.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
        prisma.customer.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
        prisma.task.findFirst({ orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
      ]);

      // Create a checksum string combining counts and latest timestamps
      const checksumData = {
        counts: { userCount, productCount, solutionCount, customerCount, taskCount },
        lastUpdates: {
          user: recentUser?.updatedAt?.toISOString() || '',
          product: recentProduct?.updatedAt?.toISOString() || '',
          solution: recentSolution?.updatedAt?.toISOString() || '',
          customer: recentCustomer?.updatedAt?.toISOString() || '',
          task: recentTask?.updatedAt?.toISOString() || '',
        },
      };

      return JSON.stringify(checksumData);
    } catch (error: any) {
      console.error('[AutoBackup] Error calculating checksum:', error.message);
      return '';
    }
  }

  /**
   * Check if database has changes since last backup
   */
  private async hasChanges(): Promise<boolean> {
    const currentChecksum = await this.getDatabaseChecksum();
    
    if (!this.config.lastChangeChecksum) {
      console.log('[AutoBackup] No previous checksum, assuming changes exist');
      return true;
    }

    const hasChanges = currentChecksum !== this.config.lastChangeChecksum;
    console.log('[AutoBackup] Database changes detected:', hasChanges);
    
    return hasChanges;
  }

  /**
   * Perform automatic backup
   */
  private async performBackup(): Promise<void> {
    try {
      console.log('[AutoBackup] Starting scheduled backup check at', new Date().toISOString());

      // Check if changes exist
      const changesExist = await this.hasChanges();
      
      if (!changesExist) {
        console.log('[AutoBackup] No database changes detected, skipping backup');
        return;
      }

      console.log('[AutoBackup] Database changes detected, creating backup...');
      
      // Create backup
      const result = await BackupRestoreService.createBackup();
      
      if (result.success) {
        console.log('[AutoBackup] Backup created successfully:', result.filename);
        
        // Update config with new checksum and time
        this.config.lastBackupTime = new Date();
        this.config.lastChangeChecksum = await this.getDatabaseChecksum();
        this.saveConfig();
        
        // Clean up old backups
        await this.cleanupOldBackups();
      } else {
        console.error('[AutoBackup] Backup failed:', result.error);
      }
    } catch (error: any) {
      console.error('[AutoBackup] Error during backup:', error.message);
    }
  }

  /**
   * Delete backups older than retention period
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await BackupRestoreService.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      
      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp);
        if (backupDate < cutoffDate) {
          console.log('[AutoBackup] Deleting old backup:', backup.filename);
          await BackupRestoreService.deleteBackup(backup.filename);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[AutoBackup] Cleaned up ${deletedCount} old backup(s)`);
      }
    } catch (error: any) {
      console.error('[AutoBackup] Error during cleanup:', error.message);
    }
  }

  /**
   * Start the auto-backup scheduler
   */
  start(): void {
    if (this.cronJob) {
      console.log('[AutoBackup] Scheduler already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[AutoBackup] Scheduler is disabled');
      return;
    }

    try {
      console.log(`[AutoBackup] Starting scheduler with cron: ${this.config.schedule}`);
      
      this.cronJob = cron.schedule(this.config.schedule, async () => {
        await this.performBackup();
      });

      console.log('[AutoBackup] Scheduler started successfully');
    } catch (error: any) {
      console.error('[AutoBackup] Error starting scheduler:', error.message);
    }
  }

  /**
   * Stop the auto-backup scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[AutoBackup] Scheduler stopped');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AutoBackupConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();

    // Restart scheduler if it was running
    if (this.cronJob) {
      this.stop();
      if (this.config.enabled) {
        this.start();
      }
    } else if (this.config.enabled) {
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoBackupConfig {
    // Ensure we always return a valid config object
    return {
      enabled: this.config.enabled ?? false,
      schedule: this.config.schedule ?? '0 1 * * *',
      retentionDays: this.config.retentionDays ?? 7,
      lastBackupTime: this.config.lastBackupTime,
      lastChangeChecksum: this.config.lastChangeChecksum,
    };
  }

  /**
   * Trigger manual backup now (for testing)
   */
  async triggerNow(): Promise<void> {
    console.log('[AutoBackup] Manual trigger initiated');
    await this.performBackup();
  }
}


