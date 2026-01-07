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

export async function getLoginStats(prisma: PrismaClient, period: ActivityPeriod = 'week', userId?: string): Promise<UserLoginStats[]> {
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
            createdAt: { gte: startDate },
            ...(userId ? { userId } : {})
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

    // Group by date, but also track individual users
    const statsMap = new Map<string, {
        count: number;
        roles: Set<string>;
        users: Array<{ id: string; username: string; roles: string[]; loginTime: Date }>
    }>();

    logs.forEach(log => {
        if (!log.user) return;
        const dateStr = log.createdAt.toISOString().split('T')[0];
        const roles = log.user.userRoles.map(ur => ur.role?.name).filter(Boolean) as string[];

        if (!statsMap.has(dateStr)) {
            statsMap.set(dateStr, { count: 0, roles: new Set(), users: [] });
        }

        const stat = statsMap.get(dateStr)!;
        stat.count++;
        roles.forEach(r => stat.roles.add(r));
        stat.users.push({
            id: log.user.id,
            username: log.user.username,
            roles: roles,
            loginTime: log.createdAt
        });
    });

    return Array.from(statsMap.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        roles: Array.from(data.roles),
        users: data.users
    }));
}


export async function getEntityChangeLogs(prisma: PrismaClient, period: ActivityPeriod = 'week', userId?: string, entity?: string): Promise<EntityChangeLog[]> {
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
            ...(userId ? { userId } : {}),
            AND: [
                entity ? {
                    OR: [
                        { resourceType: { equals: entity.toUpperCase() } },
                        { entity: { equals: entity, mode: 'insensitive' as any } }
                    ]
                } : {},
                {
                    OR: [
                        { resourceType: { in: ['PRODUCT', 'SOLUTION', 'CUSTOMER', 'APPSETTING'] } },
                        { entity: { in: ['Product', 'Solution', 'Customer', 'AppSetting', 'PRODUCT', 'SOLUTION', 'CUSTOMER', 'APPSETTING'] } }
                    ]
                }
            ]
        },
        include: {
            user: {
                select: { id: true, username: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 200
    });

    // Collect entity IDs that need name lookup (grouped by type)
    const productIds: string[] = [];
    const solutionIds: string[] = [];
    const customerIds: string[] = [];
    const appSettingIds: string[] = [];

    // First pass: extract entity names from details where possible
    const entityNamesFromDetails = new Map<string, string>();

    logs.forEach(log => {
        let detailsObj: any = {};
        try {
            detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        } catch (e) {
            detailsObj = {};
        }

        // For AppSetting, prefer 'key' field as name
        const nameFromDetails =
            detailsObj?.name ||
            detailsObj?.input?.name ||
            detailsObj?.before?.name ||
            detailsObj?.after?.name ||
            detailsObj?.key || // For AppSetting
            null;

        const entityId = log.entityId || log.resourceId;
        const entityType = (log.entity || log.resourceType || '').toLowerCase();

        if (nameFromDetails && entityId) {
            entityNamesFromDetails.set(entityId, nameFromDetails);
        } else if (entityId && !entityNamesFromDetails.has(entityId)) {
            // Need to look up
            if (entityType === 'product') productIds.push(entityId);
            else if (entityType === 'solution') solutionIds.push(entityId);
            else if (entityType === 'customer') customerIds.push(entityId);
            else if (entityType === 'appsetting') appSettingIds.push(entityId);
        }
    });

    // Batch lookup entity names
    const entityNamesById = new Map<string, string>(entityNamesFromDetails);

    if (productIds.length > 0) {
        const products = await prisma.product.findMany({
            where: { id: { in: [...new Set(productIds)] } },
            select: { id: true, name: true }
        });
        products.forEach(p => entityNamesById.set(p.id, p.name));
    }

    if (solutionIds.length > 0) {
        const solutions = await prisma.solution.findMany({
            where: { id: { in: [...new Set(solutionIds)] } },
            select: { id: true, name: true }
        });
        solutions.forEach(s => entityNamesById.set(s.id, s.name));
    }

    if (customerIds.length > 0) {
        const customers = await prisma.customer.findMany({
            where: { id: { in: [...new Set(customerIds)] } },
            select: { id: true, name: true }
        });
        customers.forEach(c => entityNamesById.set(c.id, c.name));
    }

    if (appSettingIds.length > 0) {
        const settings = await prisma.appSetting.findMany({
            where: { id: { in: [...new Set(appSettingIds)] } },
            select: { id: true, key: true }
        });
        settings.forEach(s => entityNamesById.set(s.id, s.key));
    }

    // Collect userIds that need lookup (where user relation is missing)
    const missingUserIds = logs
        .filter(log => !log.user && log.userId)
        .map(log => log.userId!)
        .filter((id, idx, arr) => arr.indexOf(id) === idx); // unique

    // Batch lookup of users by ID
    const usersById = new Map<string, string>();
    if (missingUserIds.length > 0) {
        const lookedUpUsers = await prisma.user.findMany({
            where: { id: { in: missingUserIds } },
            select: { id: true, username: true }
        });
        lookedUpUsers.forEach(u => usersById.set(u.id, u.username));
    }

    // For logs with no userId at all, try to find the admin user as a fallback
    // (Historical logs before the fix had no userId captured)
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { username: true }
    });
    const fallbackUsername = adminUser?.username || 'admin';

    return logs.map(log => {
        const entityId = log.entityId || log.resourceId || 'N/A';
        const entityName = entityNamesById.get(entityId) || entityId;

        // Determine username: prefer user relation, then lookup by ID
        // For historical logs with no userId, show the action type context
        let username = log.user?.username;
        if (!username && log.userId) {
            username = usersById.get(log.userId) || log.userId;
        }
        if (!username) {
            // Historical log - no userId captured; show this is historical
            username = `${fallbackUsername} (historical)`;
        }

        return {
            id: log.id,
            action: log.action,
            entity: log.entity || log.resourceType || 'UNKNOWN',
            entityId: entityId,
            entityName: String(entityName),
            createdAt: log.createdAt,
            userId: log.userId || 'system',
            username: username,
            details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details)
        };
    });
}

