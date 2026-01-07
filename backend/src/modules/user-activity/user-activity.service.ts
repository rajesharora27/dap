import { PrismaClient } from '@prisma/client';
import { ActivityPeriod, EntityChangeLog, UserLoginStats, ActiveSession } from './user-activity.types';

export async function getActiveSessions(prisma: PrismaClient): Promise<ActiveSession[]> {
    const sessions = await prisma.session.findMany({
        where: {
            expiresAt: { gte: new Date() }
        },
        include: {
            user: {
                select: { username: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    return sessions.map(s => ({
        id: s.id,
        userId: s.userId,
        username: s.user?.username || 'unknown',
        createdAt: s.createdAt,
        expiresAt: s.expiresAt
    }));
}

export async function getLoginStats(prisma: PrismaClient, period: ActivityPeriod = 'week'): Promise<UserLoginStats[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const logs = await prisma.auditLog.findMany({
        where: {
            action: 'login',
            createdAt: { gte: startDate }
        },
        include: {
            user: {
                include: {
                    userRoles: {
                        include: { role: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    const statsMap = new Map<string, { count: number; roles: Set<string> }>();

    logs.forEach(log => {
        if (!log.user) return;
        const dateStr = log.createdAt.toISOString().split('T')[0];
        const roles = log.user.userRoles.map(ur => ur.role?.name).filter(Boolean) as string[];

        if (!statsMap.has(dateStr)) {
            statsMap.set(dateStr, { count: 0, roles: new Set() });
        }

        const stat = statsMap.get(dateStr)!;
        stat.count++;
        roles.forEach(r => stat.roles.add(r));
    });

    return Array.from(statsMap.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        roles: Array.from(data.roles)
    }));
}

export async function getEntityChangeLogs(prisma: PrismaClient, period: ActivityPeriod = 'week'): Promise<EntityChangeLog[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const logs = await prisma.auditLog.findMany({
        where: {
            createdAt: { gte: startDate },
            resourceType: { in: ['PRODUCT', 'SOLUTION', 'CUSTOMER'] }
        },
        include: {
            user: {
                select: { username: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 200
    });

    return logs.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.resourceType || 'UNKNOWN',
        entityId: log.resourceId || 'N/A',
        entityName: (log.details as any)?.name || (log.details as any)?.label || 'N/A',
        createdAt: log.createdAt,
        userId: log.userId || 'system',
        username: log.user?.username || 'system',
        details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details)
    }));
}
