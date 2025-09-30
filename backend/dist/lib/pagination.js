"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
exports.buildConnection = buildConnection;
exports.fetchProductsPaginated = fetchProductsPaginated;
exports.fetchTasksPaginated = fetchTasksPaginated;
exports.fetchSolutionsPaginated = fetchSolutionsPaginated;
const context_1 = require("../context");
const fallbackStore = __importStar(require("../lib/fallbackStore"));
function encodeCursor(item) {
    if (typeof item === 'string')
        return Buffer.from(JSON.stringify({ id: item }), 'utf8').toString('base64');
    const createdAt = item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt;
    return Buffer.from(JSON.stringify({ id: item.id, createdAt }), 'utf8').toString('base64');
}
function decodeCursor(cursor) {
    if (!cursor)
        return null;
    try {
        const raw = Buffer.from(cursor, 'base64').toString('utf8');
        const obj = JSON.parse(raw);
        if (obj && obj.id)
            return obj;
        return { id: raw };
    }
    catch {
        return null;
    }
}
// Generic builder given already sliced list + total count
function buildConnection(items, totalCount, limit, hasNextPage, hasPreviousPage) {
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
async function fetchProductsPaginated(args) {
    const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
    if (fb === '1' || fb === 'true') {
        const sample = [
            { id: 'p-1', name: 'Sample Product A', description: 'Demo product A', createdAt: new Date() },
            { id: 'p-2', name: 'Sample Product B', description: 'Demo product B', createdAt: new Date() },
            { id: 'p-3', name: 'Sample Product C', description: 'Demo product C', createdAt: new Date() }
        ];
        return buildConnection(sample, sample.length, sample.length, false, false);
    }
    if (context_1.fallbackActive) {
        const sample = [
            { id: 'p-1', name: 'Sample Product A', description: 'Demo product A', createdAt: new Date() },
            { id: 'p-2', name: 'Sample Product B', description: 'Demo product B', createdAt: new Date() },
            { id: 'p-3', name: 'Sample Product C', description: 'Demo product C', createdAt: new Date() }
        ];
        return buildConnection(sample, sample.length, sample.length, false, false);
    }
    const forward = args.first != null;
    const backward = args.last != null;
    if (forward && backward)
        throw new Error('Cannot use first & last together');
    const baseWhere = { deletedAt: null };
    const orderBy = { id: 'asc' };
    let rows;
    let limit = 25;
    let hasNext = false;
    let hasPrev = false;
    if (forward) {
        if (args.first <= 0)
            throw new Error('first must be > 0');
    }
    if (backward) {
        if (args.last <= 0)
            throw new Error('last must be > 0');
    }
    // Composite ordering
    const forwardOrder = [{ createdAt: 'asc' }, { id: 'asc' }];
    const backwardOrder = [{ createdAt: 'desc' }, { id: 'desc' }];
    if (forward) {
        limit = Math.min(args.first, 100);
        const after = decodeCursor(args.after);
        const where = { ...baseWhere };
        if (after?.createdAt) {
            where.OR = [
                { createdAt: { gt: after.createdAt } },
                { AND: [{ createdAt: after.createdAt }, { id: { gt: after.id } }] }
            ];
        }
        else if (after?.id) {
            where.id = { gt: after.id };
        }
        rows = await context_1.prisma.product.findMany({
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
    }
    else if (backward) {
        limit = Math.min(args.last, 100);
        const before = decodeCursor(args.before);
        const where = { ...baseWhere };
        if (before?.createdAt) {
            where.OR = [
                { createdAt: { lt: before.createdAt } },
                { AND: [{ createdAt: before.createdAt }, { id: { lt: before.id } }] }
            ];
        }
        else if (before?.id) {
            where.id = { lt: before.id };
        }
        rows = await context_1.prisma.product.findMany({
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
    }
    else {
        rows = await context_1.prisma.product.findMany({
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
    const total = await context_1.prisma.product.count({ where: baseWhere });
    return buildConnection(rows, total, limit, hasNext, hasPrev);
}
async function fetchTasksPaginated(productId, args) {
    const fb = (process.env.AUTH_FALLBACK || '').toLowerCase();
    if (fb === '1' || fb === 'true') {
        // Use actual fallback store data directly imported (not require)
        let filteredTasks = [...fallbackStore.tasks]; // Use imported arrays to see runtime modifications
        // Filter out deleted tasks first
        filteredTasks = filteredTasks.filter((t) => !t.deletedAt);
        if (productId) {
            filteredTasks = filteredTasks.filter((t) => t.productId === productId);
        }
        else if (args?.solutionId) {
            filteredTasks = filteredTasks.filter((t) => t.solutionId === args.solutionId);
        }
        // Sort by sequence number to ensure correct execution order
        filteredTasks.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
        // Add status information to each task
        const tasksWithStatus = filteredTasks.map((task) => ({
            ...task,
            status: fallbackStore.taskStatuses.find((ts) => ts.id === task.statusId)
        }));
        return buildConnection(tasksWithStatus, tasksWithStatus.length, tasksWithStatus.length, false, false);
    }
    const safeArgs = args || {};
    const forward = safeArgs.first != null;
    const backward = safeArgs.last != null;
    if (forward && backward)
        throw new Error('Cannot use first & last together');
    if (forward && safeArgs.first <= 0)
        throw new Error('first must be > 0');
    if (backward && safeArgs.last <= 0)
        throw new Error('last must be > 0');
    // Build where clause for either productId or solutionId
    const baseWhere = { deletedAt: null };
    if (productId) {
        baseWhere.productId = productId;
    }
    else if (safeArgs.solutionId) {
        baseWhere.solutionId = safeArgs.solutionId;
    }
    let rows;
    let limit = forward ? Math.min(safeArgs.first, 200) : Math.min(safeArgs.last ?? 50, 200);
    let hasNext = false;
    let hasPrev = false;
    // Order by sequence number for execution sequence enforcement
    const forwardOrder = [{ sequenceNumber: 'asc' }, { id: 'asc' }];
    const backwardOrder = [{ sequenceNumber: 'desc' }, { id: 'desc' }];
    if (forward) {
        const after = decodeCursor(safeArgs.after);
        const where = { ...baseWhere };
        if (after?.id)
            where.id = { gt: after.id };
        rows = await context_1.prisma.task.findMany({ where, orderBy: forwardOrder, take: limit + 1 });
        hasNext = rows.length > limit;
        hasPrev = !!after;
        rows = rows.slice(0, limit);
    }
    else if (backward) {
        const before = decodeCursor(safeArgs.before);
        const where = { ...baseWhere };
        if (before?.id)
            where.id = { lt: before.id };
        rows = await context_1.prisma.task.findMany({ where, orderBy: backwardOrder, take: limit + 1 });
        hasPrev = rows.length > limit;
        rows = rows.slice(0, limit).reverse();
        hasNext = !!before;
    }
    else {
        rows = await context_1.prisma.task.findMany({ where: baseWhere, orderBy: forwardOrder, take: limit + 1 });
        hasNext = rows.length > limit;
        rows = rows.slice(0, limit);
    }
    const total = await context_1.prisma.task.count({ where: baseWhere });
    return buildConnection(rows, total, limit, hasNext, hasPrev);
}
async function fetchSolutionsPaginated(args) {
    // Still placeholder using products
    return fetchProductsPaginated(args);
}
