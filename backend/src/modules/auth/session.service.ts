/**
 * Session Management Utilities
 * 
 * Handles session lifecycle including:
 * - Clearing expired sessions
 * - Clearing all sessions on server restart
 * - Session cleanup after database restore
 */

import { prisma } from '../../shared/graphql/context';

export class SessionManager {
  /**
   * Clear all sessions from the database
   * Used on server restart and after database restore
   */
  static async clearAllSessions(): Promise<{ sessions: number; lockedEntities: number }> {
    console.log('🔄 Clearing all sessions...');

    try {
      // Delete all sessions
      const sessions = await prisma.session.deleteMany({});
      console.log(`✅ Cleared ${sessions.count} session(s)`);

      // Delete all locked entities
      const lockedEntities = await prisma.lockedEntity.deleteMany({});
      console.log(`✅ Cleared ${lockedEntities.count} locked entit(ies)`);

      return {
        sessions: sessions.count,
        lockedEntities: lockedEntities.count
      };
    } catch (error) {
      console.error('❌ Failed to clear sessions:', (error as any).message);
      throw error;
    }
  }

  /**
   * Clear expired sessions (cleanup job)
   * Sessions older than 7 days are removed
   */
  static async clearExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} expired session(s)`);
      }

      return result.count;
    } catch (error) {
      console.error('❌ Failed to clear expired sessions:', (error as any).message);
      return 0;
    }
  }

  /**
   * Clear expired locked entities
   */
  static async clearExpiredLocks(): Promise<number> {
    try {
      const result = await prisma.lockedEntity.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      if (result.count > 0) {
        console.log(`🧹 Cleaned up ${result.count} expired lock(s)`);
      }

      return result.count;
    } catch (error) {
      console.error('❌ Failed to clear expired locks:', (error as any).message);
      return 0;
    }
  }

  /**
   * Clear sessions for a specific user
   */
  static async clearUserSessions(userId: string): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: { userId }
      });

      console.log(`🔄 Cleared ${result.count} session(s) for user ${userId}`);
      return result.count;
    } catch (error) {
      console.error('❌ Failed to clear user sessions:', (error as any).message);
      return 0;
    }
  }

  /**
   * Run maintenance tasks
   * - Clear expired sessions
   * - Clear expired locks
   */
  static async runMaintenance(): Promise<void> {
    console.log('🔧 Running session maintenance...');

    await this.clearExpiredSessions();
    await this.clearExpiredLocks();

    console.log('✅ Session maintenance complete');
  }
}

