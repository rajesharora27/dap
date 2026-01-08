import { PrismaClient } from '@prisma/client';
import { ActivityPeriod, EntityChangeLog, UserLoginStats, ActiveSession } from './user-activity.types';

/**
 * Retrieves all currently active user sessions.
 * 
 * Sessions are considered active if their expiration time is in the future.
 * Results are ordered by creation time (newest first) and limited to 100.
 * 
 * @param prisma - Prisma client instance for database access
 * @returns Promise resolving to array of active sessions with user info
 * 
 * @example
 * ```typescript
 * const sessions = await getActiveSessions(prisma);
 * console.log(`${sessions.length} active sessions`);
 * ```
 */
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

/**
 * Retrieves login statistics aggregated by date for a given time period.
 * 
 * Statistics include login counts, roles involved, and individual user details.
 * Can be filtered by specific user ID for individual user tracking.
 * 
 * @param prisma - Prisma client instance for database access
 * @param period - Time period to query: 'day', 'week', 'month', or 'year'
 * @param userId - Optional user ID to filter stats for a specific user
 * @returns Promise resolving to array of daily login statistics
 * 
 * @example
 * ```typescript
 * // Get all login stats for past week
 * const stats = await getLoginStats(prisma, 'week');
 * 
 * // Get stats for specific user
 * const userStats = await getLoginStats(prisma, 'month', 'user-123');
 * ```
 */
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


/**
 * Retrieves entity change logs (audit trail) for the specified time period.
 * 
 * Tracks all CRUD operations on major entities (Product, Solution, Customer, Task,
 * Outcome, Release, License, Tag, User, Role, etc.). Excludes personal/diary items
 * which are user-private sandbox data.
 * 
 * **Implementation Notes:**
 * - Uses bulletproof fetch-all + JavaScript filter approach for reliability
 * - Automatically resolves entity names from IDs via batch lookups
 * - Falls back to "(historical)" attribution for pre-audit logs without userId
 * 
 * @param prisma - Prisma client instance for database access
 * @param period - Time period to query: 'day', 'week', 'month', or 'year'
 * @param userId - Optional user ID to filter changes by specific user
 * @param entity - Optional entity type filter (e.g., 'Product', 'Task')
 * @returns Promise resolving to array of entity change logs with resolved names
 * 
 * @example
 * ```typescript
 * // Get all entity changes for past week
 * const changes = await getEntityChangeLogs(prisma, 'week');
 * 
 * // Get only Task changes for specific user
 * const taskChanges = await getEntityChangeLogs(prisma, 'month', 'user-123', 'Task');
 * ```
 * 
 * @see ActivityPeriod for valid period values
 * @see EntityChangeLog for return type structure
 */
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

    // BULLETPROOF: Simple query + code filtering for maximum reliability
    // Fetch all non-login audit logs, then filter in JavaScript
    const allLogs = await prisma.auditLog.findMany({
        where: {
            createdAt: { gte: startDate },
            ...(userId ? { userId } : {}),
            // Basic exclusion - login actions shown in separate tab
            action: { not: 'login' },
            // Filter by specific entity if provided
            ...(entity ? {
                OR: [
                    { resourceType: { equals: entity.toUpperCase() } },
                    { entity: { equals: entity, mode: 'insensitive' as any } }
                ]
            } : {})
        },
        include: {
            user: {
                select: { id: true, username: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Fetch more, filter down
    });

    // Filter out personal/diary items in JavaScript (bulletproof approach)
    const excludedPrefixes = ['personal', 'diary'];
    const excludedExact = ['session', 'login'];
    
    const logs = allLogs.filter(log => {
        const entityLower = (log.entity || '').toLowerCase();
        const resourceTypeLower = (log.resourceType || '').toLowerCase();
        
        // Exclude exact matches
        if (excludedExact.includes(entityLower) || excludedExact.includes(resourceTypeLower)) {
            return false;
        }
        
        // Exclude prefix matches
        for (const prefix of excludedPrefixes) {
            if (entityLower.startsWith(prefix) || resourceTypeLower.startsWith(prefix)) {
                return false;
            }
        }
        
        return true;
    }).slice(0, 500);

    // Collect entity IDs that need name lookup (grouped by type)
    const productIds: string[] = [];
    const solutionIds: string[] = [];
    const customerIds: string[] = [];
    const appSettingIds: string[] = [];
    const taskIds: string[] = [];
    const outcomeIds: string[] = [];
    const releaseIds: string[] = [];
    const licenseIds: string[] = [];
    const tagIds: string[] = [];
    const userIds: string[] = [];
    const roleIds: string[] = [];

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
            else if (entityType === 'task') taskIds.push(entityId);
            else if (entityType === 'outcome') outcomeIds.push(entityId);
            else if (entityType === 'release') releaseIds.push(entityId);
            else if (entityType === 'license') licenseIds.push(entityId);
            else if (entityType === 'tag') tagIds.push(entityId);
            else if (entityType === 'user') userIds.push(entityId);
            else if (entityType === 'role') roleIds.push(entityId);
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

    if (taskIds.length > 0) {
        const tasks = await prisma.task.findMany({
            where: { id: { in: [...new Set(taskIds)] } },
            select: { id: true, name: true }
        });
        tasks.forEach(t => entityNamesById.set(t.id, t.name));
    }

    if (outcomeIds.length > 0) {
        const outcomes = await prisma.outcome.findMany({
            where: { id: { in: [...new Set(outcomeIds)] } },
            select: { id: true, name: true }
        });
        outcomes.forEach(o => entityNamesById.set(o.id, o.name));
    }

    if (releaseIds.length > 0) {
        const releases = await prisma.release.findMany({
            where: { id: { in: [...new Set(releaseIds)] } },
            select: { id: true, name: true }
        });
        releases.forEach(r => entityNamesById.set(r.id, r.name));
    }

    if (licenseIds.length > 0) {
        const licenses = await prisma.license.findMany({
            where: { id: { in: [...new Set(licenseIds)] } },
            select: { id: true, name: true }
        });
        licenses.forEach(l => entityNamesById.set(l.id, l.name));
    }

    if (tagIds.length > 0) {
        // Tags are stored in ProductTag and SolutionTag tables
        const [productTags, solutionTags] = await Promise.all([
            prisma.productTag.findMany({
                where: { id: { in: [...new Set(tagIds)] } },
                select: { id: true, name: true }
            }),
            prisma.solutionTag.findMany({
                where: { id: { in: [...new Set(tagIds)] } },
                select: { id: true, name: true }
            })
        ]);
        productTags.forEach((t: { id: string; name: string }) => entityNamesById.set(t.id, t.name));
        solutionTags.forEach((t: { id: string; name: string }) => entityNamesById.set(t.id, t.name));
    }

    if (userIds.length > 0) {
        const usersLookup = await prisma.user.findMany({
            where: { id: { in: [...new Set(userIds)] } },
            select: { id: true, username: true, fullName: true }
        });
        usersLookup.forEach(u => entityNamesById.set(u.id, u.fullName || u.username));
    }

    if (roleIds.length > 0) {
        const roles = await prisma.role.findMany({
            where: { id: { in: [...new Set(roleIds)] } },
            select: { id: true, name: true }
        });
        roles.forEach(r => entityNamesById.set(r.id, r.name));
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

