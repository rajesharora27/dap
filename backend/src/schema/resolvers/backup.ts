import { BackupRestoreService } from '../../services/BackupRestoreService';
import { ensureRole } from '../../lib/auth';

export const BackupQueryResolvers = {
  /**
   * List all available backups
   */
  listBackups: async (_: any, __: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    return await BackupRestoreService.listBackups();
  },
};

export const BackupMutationResolvers = {
  /**
   * Create a new database backup
   */
  createBackup: async (_: any, __: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    
    const result = await BackupRestoreService.createBackup();
    
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
};

