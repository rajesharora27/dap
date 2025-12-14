import { BackupRestoreService } from '../../services/BackupRestoreService';
import { AutoBackupScheduler } from '../../services/AutoBackupScheduler';
import { ensureRole } from '../../lib/auth';

export const BackupQueryResolvers = {
  /**
   * List all available backups
   */
  listBackups: async (_: any, __: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    return await BackupRestoreService.listBackups();
  },

  /**
   * Get auto-backup configuration
   */
  autoBackupConfig: async (_: any, __: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    const scheduler = AutoBackupScheduler.getInstance();
    return scheduler.getConfig();
  },
};

export const BackupMutationResolvers = {
  /**
   * Create a new database backup
   */
  createBackup: async (_: any, { customName }: { customName?: string }, ctx: any) => {
    ensureRole(ctx, 'ADMIN');

    const result = await BackupRestoreService.createBackup(customName);

    return result;
  },

  /**
   * Restore database from a backup
   */
  restoreBackup: async (_: any, { filename }: { filename: string }, ctx: any) => {
    ensureRole(ctx, 'ADMIN');

    const result = await BackupRestoreService.restoreBackup(filename);

    return result;
  },

  /**
   * Delete a backup file
   */
  deleteBackup: async (_: any, { filename }: { filename: string }, ctx: any) => {
    ensureRole(ctx, 'ADMIN');

    const result = await BackupRestoreService.deleteBackup(filename);

    return result;
  },

  /**
   * Update auto-backup configuration
   */
  updateAutoBackupConfig: async (_: any, { input }: { input: any }, ctx: any) => {
    ensureRole(ctx, 'ADMIN');

    try {
      console.log('[AutoBackup] Updating config with input:', JSON.stringify(input));
      const scheduler = AutoBackupScheduler.getInstance();
      scheduler.updateConfig(input);

      const config = scheduler.getConfig();
      console.log('[AutoBackup] Returning config:', JSON.stringify(config));
      return config;
    } catch (error: any) {
      console.error('[AutoBackup] Error updating config:', error);
      throw new Error(`Failed to update auto-backup config: ${error.message}`);
    }
  },

  /**
   * Trigger auto-backup immediately
   */
  triggerAutoBackup: async (_: any, __: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');

    console.log('[AutoBackup] Manual trigger requested by admin');

    try {
      // Create backup immediately
      const result = await BackupRestoreService.createBackup();

      if (result.success) {
        // Update scheduler's checksum
        const scheduler = AutoBackupScheduler.getInstance();
        scheduler.updateConfig({
          lastBackupTime: new Date(),
          lastChangeChecksum: result.metadata?.recordCounts ? JSON.stringify(result.metadata.recordCounts) : undefined,
        });
      }

      return result;
    } catch (error: any) {
      console.error('[AutoBackup] Error during manual trigger:', error);
      return {
        success: false,
        filename: '',
        filePath: '',
        size: 0,
        url: '',
        metadata: {
          id: '',
          filename: '',
          timestamp: new Date(),
          size: 0,
          databaseUrl: '',
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
        },
        error: error.message || 'Failed to trigger auto-backup',
      };
    }
  },
};

