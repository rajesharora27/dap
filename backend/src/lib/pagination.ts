import { prisma, fallbackActive } from '../context';
import * as fallbackStore from '../lib/fallbackStore';

interface DecodedCursor { id: string; createdAt?: string }

export function encodeCursor(item: { id: string; createdAt?: Date | string } | string): string {
  if (typeof item === 'string') return Buffer.from(JSON.stringify({ id: item }), 'utf8').toString('base64');
  const createdAt = item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt;
  return Buffer.from(JSON.stringify({ id: item.id, createdAt }), 'utf8').toString('base64');
}
export function decodeCursor(cursor?: string | null): DecodedCursor | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf8');
    const obj = JSON.parse(raw);
    if (obj && obj.id) return obj;
    return { id: raw };
  } catch {
    return null;
  }
}

export interface ConnectionArgs { first?: number; after?: string | null; last?: number; before?: string | null }

export interface ConnectionEdge<T> { cursor: string; node: T }
export interface ConnectionPageInfo { hasNextPage: boolean; hasPreviousPage: boolean; startCursor?: string | null; endCursor?: string | null }
export interface Connection<T> { edges: ConnectionEdge<T>[]; pageInfo: ConnectionPageInfo; totalCount: number }

// Generic builder given already sliced list + total count
export function buildConnection<T extends { id: string; createdAt?: Date }>(items: T[], totalCount: number, limit: number, hasNextPage: boolean, hasPreviousPage: boolean): Connection<T> {
  const edges = items.map(i => ({ cursor: encodeCursor(i), node: i }));
  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor
    },
    totalCount
  };
}

// Specific fetch helpers
export async function fetchProductsPaginated(args: ConnectionArgs) {
  const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
  if (fb === '1' || fb === 'true') {
    const sample = [
      { id: 'p-1', name: 'Sample Product A', description: 'Demo product A', createdAt: new Date() },
      { id: 'p-2', name: 'Sample Product B', description: 'Demo product B', createdAt: new Date() },
      { id: 'p-3', name: 'Sample Product C', description: 'Demo product C', createdAt: new Date() }
    ];
    return buildConnection(sample as any, sample.length, sample.length, false, false);
  }
  if (fallbackActive) {
    const sample = [
      { id: 'p-1', name: 'Sample Product A', description: 'Demo product A', createdAt: new Date() },
      { id: 'p-2', name: 'Sample Product B', description: 'Demo product B', createdAt: new Date() },
      { id: 'p-3', name: 'Sample Product C', description: 'Demo product C', createdAt: new Date() }
    ];
    return buildConnection(sample as any, sample.length, sample.length, false, false);
  }
  const forward = args.first != null;
  const backward = args.last != null;
  if (forward && backward) throw new Error('Cannot use first & last together');
  const baseWhere: any = { deletedAt: null };
  const orderBy = { id: 'asc' as const };
  let rows;
  let limit = 25;
  let hasNext = false;
  let hasPrev = false;
  if (forward) {
    if ((args.first as number) <= 0) throw new Error('first must be > 0');
  }
  if (backward) {
    if ((args.last as number) <= 0) throw new Error('last must be > 0');
  }
  // Composite ordering
  const forwardOrder = [{ createdAt: 'asc' as const }, { id: 'asc' as const }];
  const backwardOrder = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
  if (forward) {
    limit = Math.min(args.first!, 100);
    const after = decodeCursor(args.after);
    const where = { ...baseWhere } as any;
    if (after?.createdAt) {
      where.OR = [
        { createdAt: { gt: after.createdAt } },
        { AND: [{ createdAt: after.createdAt }, { id: { gt: after.id } }] }
      ];
    } else if (after?.id) {
      where.id = { gt: after.id };
    }
    rows = await prisma.product.findMany({ 
      where, 
      orderBy: forwardOrder, 
      take: limit + 1,
      include: {
        licenses: true,
        releases: true,
        outcomes: true
      }
    });
    hasNext = rows.length > limit;
    hasPrev = !!after;
    rows = rows.slice(0, limit);
  } else if (backward) {
    limit = Math.min(args.last!, 100);
    const before = decodeCursor(args.before);
    const where = { ...baseWhere } as any;
    if (before?.createdAt) {
      where.OR = [
        { createdAt: { lt: before.createdAt } },
        { AND: [{ createdAt: before.createdAt }, { id: { lt: before.id } }] }
      ];
    } else if (before?.id) {
      where.id = { lt: before.id };
    }
    rows = await prisma.product.findMany({ 
      where, 
      orderBy: backwardOrder, 
      take: limit + 1,
      include: {
        licenses: true,
        releases: true,
        outcomes: true
      }
    });
    hasPrev = rows.length > limit;
    rows = rows.slice(0, limit).reverse();
    hasNext = !!before;
  } else {
    rows = await prisma.product.findMany({ 
      where: baseWhere, 
      orderBy: forwardOrder, 
      take: limit + 1,
      include: {
        licenses: true,
        releases: true,
        outcomes: true
      }
    });
    hasNext = rows.length > limit;
    rows = rows.slice(0, limit);
  }
  const total = await prisma.product.count({ where: baseWhere });
  return buildConnection(rows, total, limit, hasNext, hasPrev);
}

export async function fetchTasksPaginated(productId?: string, args?: ConnectionArgs & { solutionId?: string }) {
  const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
  if (fb === '1' || fb === 'true') {
    // Use actual fallback store data directly imported (not require)
    let filteredTasks = [...fallbackStore.tasks]; // Use imported arrays to see runtime modifications

    // Filter out deleted tasks first
    filteredTasks = filteredTasks.filter((t: any) => !t.deletedAt);

    if (productId) {
      filteredTasks = filteredTasks.filter((t: any) => t.productId === productId);
    } else if (args?.solutionId) {
      filteredTasks = filteredTasks.filter((t: any) => t.solutionId === args.solutionId);
    }

    // Sort by sequence number to ensure correct execution order
    filteredTasks.sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    // Add status information to each task
    const tasksWithStatus = filteredTasks.map((task: any) => ({
      ...task,
      status: fallbackStore.taskStatuses.find((ts: any) => ts.id === task.statusId)
    }));

    return buildConnection(tasksWithStatus as any, tasksWithStatus.length, tasksWithStatus.length, false, false);
  }

  const safeArgs = args || {};
  const forward = safeArgs.first != null;
  const backward = safeArgs.last != null;
  if (forward && backward) throw new Error('Cannot use first & last together');
  if (forward && (safeArgs.first as number) <= 0) throw new Error('first must be > 0');
  if (backward && (safeArgs.last as number) <= 0) throw new Error('last must be > 0');

  // Build where clause for either productId or solutionId
  const baseWhere: any = { deletedAt: null };
  if (productId) {
    baseWhere.productId = productId;
  } else if (safeArgs.solutionId) {
    baseWhere.solutionId = safeArgs.solutionId;
  }

  let rows;
  let limit = forward ? Math.min(safeArgs.first!, 200) : Math.min(safeArgs.last ?? 50, 200);
  let hasNext = false;
  let hasPrev = false;

  // Order by sequence number for execution sequence enforcement
  const forwardOrder = [{ sequenceNumber: 'asc' as const }, { id: 'asc' as const }];
  const backwardOrder = [{ sequenceNumber: 'desc' as const }, { id: 'desc' as const }];

  if (forward) {
    const after = decodeCursor(safeArgs.after);
    const where = { ...baseWhere } as any;
    if (after?.id) where.id = { gt: after.id };
    rows = await prisma.task.findMany({ where, orderBy: forwardOrder, take: limit + 1 });
    hasNext = rows.length > limit;
    hasPrev = !!after;
    rows = rows.slice(0, limit);
  } else if (backward) {
    const before = decodeCursor(safeArgs.before);
    const where = { ...baseWhere } as any;
    if (before?.id) where.id = { lt: before.id };
    rows = await prisma.task.findMany({ where, orderBy: backwardOrder, take: limit + 1 });
    hasPrev = rows.length > limit;
    rows = rows.slice(0, limit).reverse();
    hasNext = !!before;
  } else {
    rows = await prisma.task.findMany({ where: baseWhere, orderBy: forwardOrder, take: limit + 1 });
    hasNext = rows.length > limit;
    rows = rows.slice(0, limit);
  }
  const total = await prisma.task.count({ where: baseWhere });
  return buildConnection(rows, total, limit, hasNext, hasPrev);
}

export async function fetchSolutionsPaginated(args: ConnectionArgs) {
  // Still placeholder using products
  return fetchProductsPaginated(args);
}
