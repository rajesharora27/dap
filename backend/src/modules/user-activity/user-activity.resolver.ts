import * as UserActivityService from './user-activity.service';
import { ActivityPeriod } from './user-activity.types';

export const UserActivityQueryResolvers = {
    activeSessions: async (_: any, __: any, context: any) => {
        if (!context.user?.isAdmin) throw new Error('Admin access required');
        return UserActivityService.getActiveSessions(context.prisma);
    },

    loginStats: async (_: any, { period, userId }: { period: ActivityPeriod; userId?: string }, context: any) => {
        if (!context.user?.isAdmin) throw new Error('Admin access required');

        const validPeriods = ['day', 'week', 'month', 'year'];
        if (!validPeriods.includes(period)) {
            throw new Error(`Invalid period: ${period}. Must be one of: ${validPeriods.join(', ')}`);
        }

        return UserActivityService.getLoginStats(context.prisma, period, userId);
    },

    entityChangeLogs: async (_: any, { period, userId, entity }: { period: ActivityPeriod; userId?: string; entity?: string }, context: any) => {
        if (!context.user?.isAdmin) throw new Error('Admin access required');

        const validPeriods = ['day', 'week', 'month', 'year'];
        if (!validPeriods.includes(period)) {
            throw new Error(`Invalid period: ${period}. Must be one of: ${validPeriods.join(', ')}`);
        }

        return UserActivityService.getEntityChangeLogs(context.prisma, period, userId, entity);
    }
};
