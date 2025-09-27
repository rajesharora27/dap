"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const context_1 = require("../../context");
// (removed earlier simpler import replaced by extended import below)
const fallbackStore_1 = require("../../lib/fallbackStore");
const lock_1 = require("../../lib/lock");
const changes_1 = require("../../lib/changes");
const csv_1 = require("../../lib/csv");
const csvSamples_1 = require("../../lib/csvSamples");
const pubsub_1 = require("../../lib/pubsub");
const pagination_1 = require("../../lib/pagination");
const audit_1 = require("../../lib/audit");
const auth_1 = require("../../lib/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JSONScalar = new graphql_1.GraphQLScalarType({
    name: 'JSON',
    description: 'Arbitrary JSON value',
    parseValue: (v) => v,
    serialize: (v) => v,
    parseLiteral(ast) {
        switch (ast.kind) {
            case graphql_1.Kind.STRING:
            case graphql_1.Kind.BOOLEAN:
            case graphql_1.Kind.INT:
            case graphql_1.Kind.FLOAT:
                return ast.value;
            case graphql_1.Kind.OBJECT:
            case graphql_1.Kind.LIST:
                return ast.value;
            default:
                return null;
        }
    }
});
// legacy helper kept for potential backward compatibility (unused now)
function relayFromArray(items, args) {
    const offset = args.after ? (0, graphql_relay_1.cursorToOffset)(args.after) + 1 : 0;
    const limit = args.first ?? 25;
    const slice = items.slice(offset, offset + limit);
    const conn = (0, graphql_relay_1.connectionFromArraySlice)(slice, args, { sliceStart: offset, arrayLength: items.length });
    return { ...conn, totalCount: items.length };
}
exports.resolvers = {
    JSON: JSONScalar,
    Node: {
        __resolveType(obj) {
            if (obj.tasks !== undefined)
                return 'Product';
            if (obj.estMinutes !== undefined)
                return 'Task';
            return null;
        }
    },
    Product: {
        tasks: async (parent, args) => {
            if (context_1.fallbackActive) {
                return fallbackStore_1.fallbackConnections.tasksForProduct(parent.id);
            }
            return (0, pagination_1.fetchTasksPaginated)(parent.id, args);
        },
        statusPercent: async (parent) => {
            if (context_1.fallbackActive) {
                const { tasks: allTasks } = require('../../lib/fallbackStore');
                const tasks = allTasks.filter((t) => t.productId === parent.id);
                if (!tasks.length)
                    return 0;
                const totalWeight = tasks.reduce((a, t) => a + t.weight, 0) || 1;
                const completed = tasks.filter((t) => !!t.completedAt).reduce((a, t) => a + t.weight, 0);
                return Math.round((completed / totalWeight) * 100);
            }
            const tasks = await context_1.prisma.task.findMany({ where: { productId: parent.id, deletedAt: null } });
            if (!tasks.length)
                return 0;
            const totalWeight = tasks.reduce((a, t) => a + t.weight, 0) || 1;
            const completed = tasks.filter((t) => !!t.completedAt).reduce((a, t) => a + t.weight, 0);
            return Math.round((completed / totalWeight) * 100);
        },
        completionPercentage: async (parent) => {
            if (context_1.fallbackActive) {
                const { tasks: allTasks } = require('../../lib/fallbackStore');
                const tasks = allTasks.filter((t) => t.productId === parent.id);
                if (!tasks.length)
                    return 0;
                const totalWeight = tasks.reduce((a, t) => a + t.weight, 0) || 1;
                const completed = tasks.filter((t) => !!t.completedAt).reduce((a, t) => a + t.weight, 0);
                return Math.round((completed / totalWeight) * 100);
            }
            const tasks = await context_1.prisma.task.findMany({ where: { productId: parent.id, deletedAt: null } });
            if (!tasks.length)
                return 0;
            const totalWeight = tasks.reduce((a, t) => a + t.weight, 0) || 1;
            const completed = tasks.filter((t) => !!t.completedAt).reduce((a, t) => a + t.weight, 0);
            return Math.round((completed / totalWeight) * 100);
        },
        outcomes: async (parent) => {
            if (context_1.fallbackActive) {
                return (0, fallbackStore_1.listOutcomesForProduct)(parent.id);
            }
            return context_1.prisma.outcome.findMany({ where: { productId: parent.id } });
        },
        licenses: async (parent) => {
            if (context_1.fallbackActive) {
                return (0, fallbackStore_1.listLicenses)().filter((l) => l.productId === parent.id);
            }
            return context_1.prisma.license.findMany({ where: { productId: parent.id, deletedAt: null } });
        }
    },
    Solution: {
        products: async (parent, args, ctx) => {
            if (context_1.fallbackActive) {
                const { products } = require('../../lib/fallbackStore');
                const list = products.filter((p) => parent.productIds?.includes(p.id));
                return { edges: list.map((p) => ({ cursor: Buffer.from(JSON.stringify({ id: p.id }), 'utf8').toString('base64'), node: p })), pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }, totalCount: list.length };
            }
            const prods = await context_1.prisma.solutionProduct.findMany({ where: { solutionId: parent.id }, include: { product: true } });
            const list = prods.map((sp) => sp.product);
            return { edges: list.map((p) => ({ cursor: Buffer.from(JSON.stringify({ id: p.id }), 'utf8').toString('base64'), node: p })), pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: list.length };
        },
        tasks: async (parent, args) => {
            if (context_1.fallbackActive) {
                // For fallback, return empty tasks or implement fallback logic
                return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false }, totalCount: 0 };
            }
            return (0, pagination_1.fetchTasksPaginated)(undefined, { ...args, solutionId: parent.id });
        },
        completionPercentage: async (parent) => {
            if (context_1.fallbackActive) {
                return 0; // Fallback doesn't support solution tasks yet
            }
            const tasks = await context_1.prisma.task.findMany({ where: { solutionId: parent.id, deletedAt: null } });
            if (!tasks.length)
                return 0;
            const totalWeight = tasks.reduce((a, t) => a + t.weight, 0) || 1;
            const completed = tasks.filter((t) => !!t.completedAt).reduce((a, t) => a + t.weight, 0);
            return Math.round((completed / totalWeight) * 100);
        }
    },
    Customer: {
        products: (parent) => {
            if (context_1.fallbackActive) {
                const { products } = require('../../lib/fallbackStore');
                return products.filter((p) => parent.productIds?.includes(p.id));
            }
            return context_1.prisma.customerProduct.findMany({ where: { customerId: parent.id }, include: { product: true } }).then((rows) => rows.map((r) => r.product));
        },
        solutions: (parent) => {
            if (context_1.fallbackActive) {
                const { solutions } = require('../../lib/fallbackStore');
                return solutions.filter((s) => parent.solutionIds?.includes(s.id));
            }
            return context_1.prisma.customerSolution.findMany({ where: { customerId: parent.id }, include: { solution: true } }).then((rows) => rows.map((r) => r.solution));
        }
    },
    Task: {
        product: (parent) => {
            if (context_1.fallbackActive) {
                const { products } = require('../../lib/fallbackStore');
                return products.find((p) => p.id === parent.productId);
            }
            return parent.productId ? context_1.prisma.product.findUnique({ where: { id: parent.productId } }) : null;
        },
        solution: (parent) => {
            if (context_1.fallbackActive) {
                const { solutions } = require('../../lib/fallbackStore');
                return solutions.find((s) => s.id === parent.solutionId);
            }
            return parent.solutionId ? context_1.prisma.solution.findUnique({ where: { id: parent.solutionId } }) : null;
        },
        outcomes: async (parent) => {
            if (context_1.fallbackActive) {
                return (0, fallbackStore_1.getOutcomesForTask)(parent.id);
            }
            const taskOutcomes = await context_1.prisma.taskOutcome.findMany({
                where: { taskId: parent.id },
                include: { outcome: true }
            });
            return taskOutcomes.map((to) => to.outcome);
        },
        licenseLevel: (parent) => {
            // Convert Prisma enum to GraphQL enum
            const prismaToGraphQLMap = {
                'ESSENTIAL': 'Essential',
                'ADVANTAGE': 'Advantage',
                'SIGNATURE': 'Signature'
            };
            return prismaToGraphQLMap[parent.licenseLevel] || 'Essential';
        }
    },
    Outcome: {
        product: (parent) => {
            if (context_1.fallbackActive) {
                const { products } = require('../../lib/fallbackStore');
                return products.find((p) => p.id === parent.productId);
            }
            return context_1.prisma.product.findUnique({ where: { id: parent.productId } });
        }
    },
    License: {
        product: (parent) => {
            if (context_1.fallbackActive) {
                const { products } = require('../../lib/fallbackStore');
                return products.find((p) => p.id === parent.productId);
            }
            return parent.productId ? context_1.prisma.product.findUnique({ where: { id: parent.productId } }) : null;
        }
    },
    Query: {
        node: async (_, { id }) => {
            return context_1.prisma.product.findUnique({ where: { id } }) || context_1.prisma.task.findUnique({ where: { id } });
        },
        products: async (_, args) => {
            if (context_1.fallbackActive)
                return fallbackStore_1.fallbackConnections.products();
            return (0, pagination_1.fetchProductsPaginated)(args);
        },
        solutions: async (_, args) => { if (context_1.fallbackActive)
            return fallbackStore_1.fallbackConnections.solutions(); return (0, pagination_1.fetchSolutionsPaginated)(args); },
        tasks: async (_, args) => {
            if (args.productId) {
                return (0, pagination_1.fetchTasksPaginated)(args.productId, args);
            }
            else if (args.solutionId) {
                return (0, pagination_1.fetchTasksPaginated)(undefined, { ...args, solutionId: args.solutionId });
            }
            else {
                throw new Error('Either productId or solutionId must be provided');
            }
        },
        customers: async () => { if (context_1.fallbackActive)
            return (0, fallbackStore_1.listCustomers)(); return context_1.prisma.customer.findMany({ where: { deletedAt: null } }).catch(() => []); },
        licenses: async () => { if (context_1.fallbackActive)
            return (0, fallbackStore_1.listLicenses)(); return context_1.prisma.license.findMany({ where: { deletedAt: null } }); },
        outcomes: async (_, { productId }) => {
            if (context_1.fallbackActive)
                return productId ? (0, fallbackStore_1.listOutcomesForProduct)(productId) : (0, fallbackStore_1.listOutcomes)();
            return productId ? context_1.prisma.outcome.findMany({ where: { productId } }) : context_1.prisma.outcome.findMany({});
        },
        auditLogs: async (_, { limit = 50 }) => context_1.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(limit, 200) }),
        changeSets: async (_, { limit = 50 }) => (0, changes_1.listChangeSets)(limit).then(async (sets) => Promise.all(sets.map(async (s) => ({ ...s, items: await context_1.prisma.changeItem.findMany({ where: { changeSetId: s.id } }) })))),
        changeSet: async (_, { id }) => (0, changes_1.getChangeSet)(id).then(async (s) => s ? { ...s, items: await context_1.prisma.changeItem.findMany({ where: { changeSetId: s.id } }) } : null),
        search: async (_, { query, first = 20 }) => {
            const q = query.trim();
            if (!q)
                return [];
            const products = await context_1.prisma.product.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first });
            const tasks = await context_1.prisma.task.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first });
            return [...products, ...tasks].slice(0, first);
        },
        telemetry: async (_, { taskId, limit = 50 }) => context_1.prisma.telemetry.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' }, take: Math.min(limit, 200) }),
        taskDependencies: async (_, { taskId }) => context_1.prisma.taskDependency.findMany({ where: { taskId }, orderBy: { createdAt: 'asc' } })
    },
    Mutation: {
        signup: async (_, { email, username, password, role, name }) => {
            const hashed = await bcryptjs_1.default.hash(password, 10);
            const user = await context_1.prisma.user.create({ data: { email, username: username || email.split('@')[0], password: hashed, role, name } });
            const token = jsonwebtoken_1.default.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
            return token;
        },
        login: async (_, { email, username, password }) => {
            const fallbackActive = (process.env.AUTH_FALLBACK || '').toLowerCase() === '1' || (process.env.AUTH_FALLBACK || '').toLowerCase() === 'true';
            if (fallbackActive) {
                const list = [
                    { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
                    { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
                ];
                const u = list.find(u => (email && u.email === email) || (username && u.username === username));
                if (!u || u.password !== password)
                    throw new Error('INVALID_CREDENTIALS');
                return jsonwebtoken_1.default.sign({ uid: u.id, role: u.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
            }
            let user = null;
            if (email)
                user = await context_1.prisma.user.findUnique({ where: { email } });
            if (!user && username)
                user = await context_1.prisma.user.findUnique({ where: { username } });
            if (!user)
                throw new Error('INVALID_CREDENTIALS');
            const ok = await bcryptjs_1.default.compare(password, user.password);
            if (!ok)
                throw new Error('INVALID_CREDENTIALS');
            return jsonwebtoken_1.default.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
        },
        simpleLogin: async (_, { username, password }) => {
            const fallbackActive = (process.env.AUTH_FALLBACK || '').toLowerCase() === '1' || (process.env.AUTH_FALLBACK || '').toLowerCase() === 'true';
            if (fallbackActive) {
                const list = [
                    { id: 'u-admin', username: 'admin', email: 'admin@example.com', password: 'admin', role: 'ADMIN' },
                    { id: 'u-user', username: 'user', email: 'user@example.com', password: 'user', role: 'USER' }
                ];
                const u = list.find(u => u.username === username && u.password === password);
                if (!u)
                    throw new Error('INVALID_CREDENTIALS');
                return jsonwebtoken_1.default.sign({ uid: u.id, role: u.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
            }
            const user = await context_1.prisma.user.findUnique({ where: { username } });
            if (!user)
                throw new Error('INVALID_CREDENTIALS');
            const ok = await bcryptjs_1.default.compare(password, user.password);
            if (!ok)
                throw new Error('INVALID_CREDENTIALS');
            return jsonwebtoken_1.default.sign({ uid: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
        },
        createProduct: async (_, { input }, ctx) => {
            if (!context_1.fallbackActive)
                (0, auth_1.ensureRole)(ctx, 'ADMIN');
            if (context_1.fallbackActive) {
                const product = (0, fallbackStore_1.createProduct)(input);
                await (0, audit_1.logAudit)('CREATE_PRODUCT', 'Product', product.id, { input }, ctx.user?.id);
                return product;
            }
            // Extract license IDs from input and handle relationship
            const { licenseIds, ...productData } = input;
            const product = await context_1.prisma.product.create({
                data: {
                    name: productData.name,
                    description: productData.description,
                    customAttrs: productData.customAttrs
                }
            });
            // Handle license relationship if licenseIds provided
            if (licenseIds && licenseIds.length > 0) {
                await context_1.prisma.license.updateMany({
                    where: {
                        id: { in: licenseIds },
                        deletedAt: null // Only update active licenses
                    },
                    data: { productId: product.id }
                });
            }
            await (0, audit_1.logAudit)('CREATE_PRODUCT', 'Product', product.id, { input }, ctx.user?.id);
            return product;
        },
        updateProduct: async (_, { id, input }, ctx) => {
            if (!context_1.fallbackActive)
                (0, auth_1.ensureRole)(ctx, 'ADMIN');
            if (context_1.fallbackActive) {
                const before = (0, fallbackStore_1.updateProduct)(id, {});
                const updated = (0, fallbackStore_1.updateProduct)(id, input);
                await (0, audit_1.logAudit)('UPDATE_PRODUCT', 'Product', id, { before, after: updated });
                pubsub_1.pubsub.publish(pubsub_1.PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: updated });
                return updated;
            }
            const before = await context_1.prisma.product.findUnique({ where: { id } });
            // Extract license IDs from input and handle relationship update
            const { licenseIds, ...productData } = input;
            // Update the product with basic data
            const updated = await context_1.prisma.product.update({
                where: { id },
                data: productData
            });
            // Handle license relationship updates if licenseIds provided
            if (licenseIds !== undefined) {
                // First, clear existing licenses for this product
                await context_1.prisma.license.updateMany({
                    where: { productId: id },
                    data: { productId: null }
                });
                // Then, assign new licenses to this product
                if (licenseIds.length > 0) {
                    await context_1.prisma.license.updateMany({
                        where: {
                            id: { in: licenseIds },
                            deletedAt: null // Only update active licenses
                        },
                        data: { productId: id }
                    });
                }
            }
            if (before) {
                const cs = await (0, changes_1.createChangeSet)();
                await (0, changes_1.recordChange)(cs.id, 'Product', id, before, updated);
            }
            await (0, audit_1.logAudit)('UPDATE_PRODUCT', 'Product', id, { before, after: updated });
            pubsub_1.pubsub.publish(pubsub_1.PUBSUB_EVENTS.PRODUCT_UPDATED, { productUpdated: updated });
            return updated;
        },
        deleteProduct: async (_, { id }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.softDeleteProduct)(id);
            await (0, audit_1.logAudit)('DELETE_PRODUCT', 'Product', id, {});
            return true;
        } try {
            await context_1.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
            await (0, audit_1.logAudit)('DELETE_PRODUCT', 'Product', id, {});
        }
        catch { } return true; },
        createSolution: async (_, { input }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            const solution = (0, fallbackStore_1.createSolution)(input);
            await (0, audit_1.logAudit)('CREATE_SOLUTION', 'Solution', solution.id, { input }, ctx.user?.id);
            return solution;
        } const solution = await context_1.prisma.solution.create({ data: { name: input.name, description: input.description, customAttrs: input.customAttrs } }); await (0, audit_1.logAudit)('CREATE_SOLUTION', 'Solution', solution.id, { input }, ctx.user?.id); return solution; },
        updateSolution: async (_, { id, input }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            const before = (0, fallbackStore_1.updateSolution)(id, {});
            const updated = (0, fallbackStore_1.updateSolution)(id, input);
            await (0, audit_1.logAudit)('UPDATE_SOLUTION', 'Solution', id, { before, after: updated }, ctx.user?.id);
            return updated;
        } const before = await context_1.prisma.solution.findUnique({ where: { id } }); const updated = await context_1.prisma.solution.update({ where: { id }, data: { ...input } }); if (before) {
            const cs = await (0, changes_1.createChangeSet)(ctx.user?.id);
            await (0, changes_1.recordChange)(cs.id, 'Solution', id, before, updated);
        } await (0, audit_1.logAudit)('UPDATE_SOLUTION', 'Solution', id, { before, after: updated }, ctx.user?.id); return updated; },
        deleteSolution: async (_, { id }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.softDeleteSolution)(id);
            await (0, audit_1.logAudit)('DELETE_SOLUTION', 'Solution', id, {}, ctx.user?.id);
            return true;
        } try {
            await context_1.prisma.solution.update({ where: { id }, data: { deletedAt: new Date() } });
        }
        catch { } await (0, audit_1.logAudit)('DELETE_SOLUTION', 'Solution', id, {}, ctx.user?.id); return true; },
        createCustomer: async (_, { input }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            const customer = (0, fallbackStore_1.createCustomer)(input);
            await (0, audit_1.logAudit)('CREATE_CUSTOMER', 'Customer', customer.id, { input }, ctx.user?.id);
            return customer;
        } const customer = await context_1.prisma.customer.create({ data: { name: input.name, description: input.description } }); await (0, audit_1.logAudit)('CREATE_CUSTOMER', 'Customer', customer.id, { input }, ctx.user?.id); return customer; },
        updateCustomer: async (_, { id, input }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            const before = (0, fallbackStore_1.updateCustomer)(id, {});
            const updated = (0, fallbackStore_1.updateCustomer)(id, input);
            await (0, audit_1.logAudit)('UPDATE_CUSTOMER', 'Customer', id, { before, after: updated }, ctx.user?.id);
            return updated;
        } const before = await context_1.prisma.customer.findUnique({ where: { id } }); const updated = await context_1.prisma.customer.update({ where: { id }, data: { ...input } }); if (before) {
            const cs = await (0, changes_1.createChangeSet)(ctx.user?.id);
            await (0, changes_1.recordChange)(cs.id, 'Customer', id, before, updated);
        } await (0, audit_1.logAudit)('UPDATE_CUSTOMER', 'Customer', id, { before, after: updated }, ctx.user?.id); return updated; },
        deleteCustomer: async (_, { id }, ctx) => { if (!context_1.fallbackActive)
            (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.softDeleteCustomer)(id);
            await (0, audit_1.logAudit)('DELETE_CUSTOMER', 'Customer', id, {}, ctx.user?.id);
            return true;
        } try {
            await context_1.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
        }
        catch { } await (0, audit_1.logAudit)('DELETE_CUSTOMER', 'Customer', id, {}, ctx.user?.id); return true; },
        createLicense: async (_, { input }, ctx) => {
            (0, auth_1.ensureRole)(ctx, 'ADMIN');
            if (context_1.fallbackActive) {
                const l = (0, fallbackStore_1.createLicense)(input);
                await (0, audit_1.logAudit)('CREATE_LICENSE', 'License', l.id, { input }, ctx.user?.id);
                return l;
            }
            const l = await context_1.prisma.license.create({
                data: {
                    name: input.name,
                    description: input.description,
                    level: input.level,
                    isActive: input.isActive,
                    productId: input.productId
                }
            });
            await (0, audit_1.logAudit)('CREATE_LICENSE', 'License', l.id, { input }, ctx.user?.id);
            return l;
        },
        updateLicense: async (_, { id, input }, ctx) => {
            (0, auth_1.ensureRole)(ctx, 'ADMIN');
            if (context_1.fallbackActive) {
                const before = (0, fallbackStore_1.updateLicense)(id, {});
                const l = (0, fallbackStore_1.updateLicense)(id, input);
                await (0, audit_1.logAudit)('UPDATE_LICENSE', 'License', id, { before, after: l }, ctx.user?.id);
                return l;
            }
            const before = await context_1.prisma.license.findUnique({ where: { id } });
            const l = await context_1.prisma.license.update({
                where: { id },
                data: {
                    name: input.name,
                    description: input.description,
                    level: input.level,
                    isActive: input.isActive,
                    productId: input.productId
                }
            });
            await (0, audit_1.logAudit)('UPDATE_LICENSE', 'License', id, { before, after: l }, ctx.user?.id);
            return l;
        },
        deleteLicense: async (_, { id }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.softDeleteLicense)(id);
            await (0, audit_1.logAudit)('DELETE_LICENSE', 'License', id, {}, ctx.user?.id);
            return true;
        } try {
            await context_1.prisma.license.update({ where: { id }, data: { deletedAt: new Date() } });
        }
        catch { } await (0, audit_1.logAudit)('DELETE_LICENSE', 'License', id, {}, ctx.user?.id); return true; },
        createOutcome: async (_, { input }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            if (context_1.fallbackActive) {
                try {
                    // Check for duplicate names in the same product
                    const existing = (0, fallbackStore_1.listOutcomesForProduct)(input.productId).find(o => o.name === input.name);
                    if (existing) {
                        throw new Error(`An outcome with the name "${input.name}" already exists for this product. Please choose a different name.`);
                    }
                    return (0, fallbackStore_1.createOutcome)(input);
                }
                catch (error) {
                    throw error;
                }
            }
            try {
                const outcome = await context_1.prisma.outcome.create({
                    data: {
                        name: input.name,
                        description: input.description,
                        productId: input.productId
                    }
                });
                await (0, audit_1.logAudit)('CREATE_OUTCOME', 'Outcome', outcome.id, { input }, ctx.user?.id);
                return outcome;
            }
            catch (error) {
                // Handle unique constraint violation for outcome name
                if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                    throw new Error(`An outcome with the name "${input.name}" already exists for this product. Please choose a different name.`);
                }
                // Re-throw other errors
                throw error;
            }
        },
        updateOutcome: async (_, { id, input }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            if (context_1.fallbackActive) {
                // Check for duplicate names in the same product
                const currentOutcome = (0, fallbackStore_1.listOutcomes)().find(o => o.id === id);
                if (!currentOutcome) {
                    throw new Error('Outcome not found');
                }
                const existing = (0, fallbackStore_1.listOutcomesForProduct)(currentOutcome.productId).find(o => o.name === input.name && o.id !== id);
                if (existing) {
                    throw new Error(`An outcome with the name "${input.name}" already exists for this product. Please choose a different name.`);
                }
                return (0, fallbackStore_1.updateOutcome)(id, input);
            }
            const before = await context_1.prisma.outcome.findUnique({ where: { id } });
            const outcome = await context_1.prisma.outcome.update({
                where: { id },
                data: {
                    name: input.name,
                    description: input.description
                }
            });
            await (0, audit_1.logAudit)('UPDATE_OUTCOME', 'Outcome', id, { before, after: outcome }, ctx.user?.id);
            return outcome;
        },
        deleteOutcome: async (_, { id }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            if (context_1.fallbackActive) {
                return (0, fallbackStore_1.softDeleteOutcome)(id);
            }
            try {
                await context_1.prisma.outcome.delete({ where: { id } });
            }
            catch { }
            await (0, audit_1.logAudit)('DELETE_OUTCOME', 'Outcome', id, {}, ctx.user?.id);
            return true;
        },
        addProductToSolution: async (_, { solutionId, productId }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.addProductToSolution)(solutionId, productId);
            await (0, audit_1.logAudit)('ADD_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id);
            return true;
        } await context_1.prisma.solutionProduct.upsert({ where: { productId_solutionId: { productId, solutionId } }, update: {}, create: { productId, solutionId } }); await (0, audit_1.logAudit)('ADD_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id); return true; },
        removeProductFromSolution: async (_, { solutionId, productId }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.removeProductFromSolution)(solutionId, productId);
            await (0, audit_1.logAudit)('REMOVE_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id);
            return true;
        } await context_1.prisma.solutionProduct.deleteMany({ where: { solutionId, productId } }); await (0, audit_1.logAudit)('REMOVE_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id); return true; },
        addProductToCustomer: async (_, { customerId, productId }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.addProductToCustomer)(customerId, productId);
            await (0, audit_1.logAudit)('ADD_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id);
            return true;
        } await context_1.prisma.customerProduct.upsert({ where: { customerId_productId: { customerId, productId } }, update: {}, create: { customerId, productId } }); await (0, audit_1.logAudit)('ADD_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id); return true; },
        removeProductFromCustomer: async (_, { customerId, productId }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.removeProductFromCustomer)(customerId, productId);
            await (0, audit_1.logAudit)('REMOVE_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id);
            return true;
        } await context_1.prisma.customerProduct.deleteMany({ where: { customerId, productId } }); await (0, audit_1.logAudit)('REMOVE_PRODUCT_CUSTOMER', 'Customer', customerId, { productId }, ctx.user?.id); return true; },
        addSolutionToCustomer: async (_, { customerId, solutionId }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.addSolutionToCustomer)(customerId, solutionId);
            await (0, audit_1.logAudit)('ADD_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id);
            return true;
        } await context_1.prisma.customerSolution.upsert({ where: { customerId_solutionId: { customerId, solutionId } }, update: {}, create: { customerId, solutionId } }); await (0, audit_1.logAudit)('ADD_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id); return true; },
        removeSolutionFromCustomer: async (_, { customerId, solutionId }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.removeSolutionFromCustomer)(customerId, solutionId);
            await (0, audit_1.logAudit)('REMOVE_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id);
            return true;
        } await context_1.prisma.customerSolution.deleteMany({ where: { customerId, solutionId } }); await (0, audit_1.logAudit)('REMOVE_SOLUTION_CUSTOMER', 'Customer', customerId, { solutionId }, ctx.user?.id); return true; },
        reorderTasks: async (_, { productId, order }, ctx) => {
            (0, auth_1.ensureRole)(ctx, 'ADMIN');
            if (context_1.fallbackActive) {
                const ok = (0, fallbackStore_1.reorderTasks)(productId, order);
                await (0, audit_1.logAudit)('REORDER_TASKS', 'Product', productId, { order }, ctx.user?.id);
                return ok;
            }
            // Database implementation: Update sequence numbers based on new order
            try {
                // Use a transaction to avoid unique constraint violations
                await context_1.prisma.$transaction(async (tx) => {
                    // First, set all sequence numbers to negative values to avoid conflicts
                    for (let i = 0; i < order.length; i++) {
                        await tx.task.update({
                            where: { id: order[i] },
                            data: { sequenceNumber: -(i + 1) }
                        });
                    }
                    // Then, set them to the correct positive values
                    for (let i = 0; i < order.length; i++) {
                        await tx.task.update({
                            where: { id: order[i] },
                            data: { sequenceNumber: i + 1 }
                        });
                    }
                });
                await (0, audit_1.logAudit)('REORDER_TASKS', 'Product', productId, { order }, ctx.user?.id);
                return true;
            }
            catch (error) {
                console.error('Failed to reorder tasks in database:', error);
                return false;
            }
        },
        createTask: async (_, { input }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            // Ensure either productId or solutionId is provided
            if (!input.productId && !input.solutionId) {
                throw new Error('Either productId or solutionId must be provided');
            }
            // Ensure both are not provided
            if (input.productId && input.solutionId) {
                throw new Error('Cannot provide both productId and solutionId');
            }
            // Auto-assign sequence number if not provided with retry logic for race conditions
            if (!input.sequenceNumber) {
                if (context_1.fallbackActive) {
                    // For fallback mode, find max sequence number from existing tasks
                    const { tasks } = require('../../lib/fallbackStore');
                    const existingTasks = tasks.filter((t) => (input.productId && t.productId === input.productId) ||
                        (input.solutionId && t.solutionId === input.solutionId));
                    const maxSequence = existingTasks.reduce((max, task) => Math.max(max, task.sequenceNumber || 0), 0);
                    input.sequenceNumber = maxSequence + 1;
                }
                else {
                    // Get next available sequence number with retry logic for concurrent creation
                    const lastTask = await context_1.prisma.task.findFirst({
                        where: {
                            deletedAt: null,
                            ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
                        },
                        orderBy: { sequenceNumber: 'desc' }
                    });
                    input.sequenceNumber = (lastTask?.sequenceNumber || 0) + 1;
                }
            }
            if (context_1.fallbackActive) {
                // Extract outcomeIds before creating task
                const { outcomeIds, ...taskData } = input;
                const task = (0, fallbackStore_1.createTask)(taskData);
                // Handle outcome associations if provided
                if (outcomeIds && outcomeIds.length > 0) {
                    const { addTaskOutcome } = require('../../lib/fallbackStore');
                    for (const outcomeId of outcomeIds) {
                        addTaskOutcome(task.id, outcomeId);
                    }
                }
                await (0, audit_1.logAudit)('CREATE_TASK', 'Task', task.id, { input }, ctx.user?.id);
                pubsub_1.pubsub.publish(pubsub_1.PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task });
                return task;
            }
            // Validate weightage sum for product/solution doesn't exceed 100
            const existingTasks = await context_1.prisma.task.findMany({
                where: {
                    deletedAt: null,
                    ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
                }
            });
            const currentWeightSum = existingTasks.reduce((sum, task) => sum + (task.weight || 0), 0);
            if (currentWeightSum + (input.weight || 0) > 100) {
                throw new Error(`Total weight of tasks cannot exceed 100% for this ${input.productId ? 'product' : 'solution'}. Current: ${currentWeightSum}%, Trying to add: ${input.weight || 0}%`);
            }
            // Extract fields that need special handling
            const { outcomeIds, dependencies, licenseId, ...taskData } = input;
            // Handle licenseId by converting it to licenseLevel
            let effectiveLicenseLevel = input.licenseLevel;
            if (licenseId && !effectiveLicenseLevel) {
                // Validate that the license belongs to the task's product (if product-based)
                if (input.productId) {
                    // Look up the license and ensure it belongs to the task's product
                    const license = await context_1.prisma.license.findFirst({
                        where: {
                            id: licenseId,
                            productId: input.productId, // Ensure license belongs to the task's product
                            isActive: true,
                            deletedAt: null
                        }
                    });
                    if (!license) {
                        throw new Error(`License with ID "${licenseId}" not found, is inactive, or does not belong to this product`);
                    }
                    // Convert license level number to string
                    const levelMap = {
                        1: 'Essential',
                        2: 'Advantage',
                        3: 'Signature'
                    };
                    effectiveLicenseLevel = levelMap[license.level] || 'Essential';
                }
                else if (input.solutionId) {
                    // For solution-based tasks, we still need to find the license globally for now
                    const license = await context_1.prisma.license.findFirst({
                        where: {
                            id: licenseId,
                            isActive: true,
                            deletedAt: null
                        }
                    });
                    if (!license) {
                        throw new Error(`License with ID "${licenseId}" not found or is inactive`);
                    }
                    // Convert license level number to string
                    const levelMap = {
                        1: 'Essential',
                        2: 'Advantage',
                        3: 'Signature'
                    };
                    effectiveLicenseLevel = levelMap[license.level] || 'Essential';
                }
            }
            // Convert GraphQL LicenseLevel enum to Prisma enum format
            const licenseLevelMap = {
                'Essential': 'ESSENTIAL',
                'Advantage': 'ADVANTAGE',
                'Signature': 'SIGNATURE'
            };
            const prismaLicenseLevel = effectiveLicenseLevel ? licenseLevelMap[effectiveLicenseLevel] || 'ESSENTIAL' : 'ESSENTIAL';
            // Validate that the license level corresponds to an actual license for the product
            if (input.productId && effectiveLicenseLevel) {
                const levelMap = {
                    'Essential': 1,
                    'Advantage': 2,
                    'Signature': 3
                };
                const requiredLevel = levelMap[effectiveLicenseLevel];
                if (requiredLevel) {
                    const productLicense = await context_1.prisma.license.findFirst({
                        where: {
                            productId: input.productId,
                            level: requiredLevel,
                            isActive: true,
                            deletedAt: null
                        }
                    });
                    if (!productLicense) {
                        throw new Error(`License level "${effectiveLicenseLevel}" (level ${requiredLevel}) does not exist for this product. Please create the required license first.`);
                    }
                }
            }
            // Create task with retry logic for sequence number conflicts
            let task;
            let attempts = 0;
            const maxAttempts = 3;
            while (attempts < maxAttempts) {
                try {
                    // Re-calculate sequence number on each attempt to handle race conditions
                    if (attempts > 0) {
                        // Only recalculate on retry attempts
                        const lastTask = await context_1.prisma.task.findFirst({
                            where: {
                                deletedAt: null,
                                ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
                            },
                            orderBy: { sequenceNumber: 'desc' }
                        });
                        input.sequenceNumber = (lastTask?.sequenceNumber || 0) + 1;
                    }
                    task = await context_1.prisma.task.create({
                        data: {
                            ...taskData,
                            licenseLevel: prismaLicenseLevel,
                            sequenceNumber: input.sequenceNumber
                        }
                    });
                    // Success - break out of retry loop
                    break;
                }
                catch (error) {
                    attempts++;
                    // Check if it's a sequence number conflict (Prisma unique constraint error)
                    const isSequenceConflict = (error.code === 'P2002' &&
                        error.meta?.target?.includes('sequenceNumber')) ||
                        error.message?.includes('Unique constraint failed') ||
                        error.message?.includes('sequenceNumber');
                    if (isSequenceConflict && attempts < maxAttempts) {
                        // Small delay to prevent tight retry loop with jitter
                        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 30));
                        continue;
                    }
                    // If it's not a sequence number conflict or we've exceeded max attempts, rethrow
                    throw error;
                }
            }
            if (!task) {
                throw new Error(`Failed to create task after ${maxAttempts} attempts due to sequence number conflicts`);
            }
            // Handle outcome associations if provided
            if (outcomeIds && outcomeIds.length > 0) {
                await context_1.prisma.taskOutcome.createMany({
                    data: outcomeIds.map((outcomeId) => ({
                        taskId: task.id,
                        outcomeId: outcomeId
                    }))
                });
            }
            await (0, audit_1.logAudit)('CREATE_TASK', 'Task', task.id, { input }, ctx.user?.id);
            return task;
        },
        updateTask: async (_, { id, input }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            if (context_1.fallbackActive) {
                const before = (0, fallbackStore_1.updateTask)(id, {});
                // Extract outcomeIds before updating task
                const { outcomeIds, ...taskData } = input;
                const task = (0, fallbackStore_1.updateTask)(id, taskData);
                // Handle outcome associations if provided
                if (outcomeIds !== undefined) {
                    const { removeTaskOutcome, addTaskOutcome, getOutcomesForTask } = require('../../lib/fallbackStore');
                    // Get current outcomes for this task
                    const currentOutcomes = getOutcomesForTask(id);
                    // Remove all existing associations
                    for (const outcome of currentOutcomes) {
                        removeTaskOutcome(id, outcome.id);
                    }
                    // Add new associations if provided
                    if (outcomeIds.length > 0) {
                        for (const outcomeId of outcomeIds) {
                            addTaskOutcome(id, outcomeId);
                        }
                    }
                }
                await (0, audit_1.logAudit)('UPDATE_TASK', 'Task', id, { before, after: task }, ctx.user?.id);
                pubsub_1.pubsub.publish(pubsub_1.PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task });
                return task;
            }
            const before = await context_1.prisma.task.findUnique({ where: { id } });
            if (!before) {
                throw new Error('Task not found');
            }
            // If sequence number is being updated, check for conflicts
            if (input.sequenceNumber && input.sequenceNumber !== before.sequenceNumber) {
                const existingTask = await context_1.prisma.task.findFirst({
                    where: {
                        sequenceNumber: input.sequenceNumber,
                        id: { not: id },
                        ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
                    }
                });
                if (existingTask) {
                    throw new Error('Sequence number already exists for this product/solution');
                }
            }
            // If weight is being updated, validate total doesn't exceed 100
            if (input.weight !== undefined && input.weight !== before.weight) {
                const existingTasks = await context_1.prisma.task.findMany({
                    where: {
                        id: { not: id },
                        deletedAt: null,
                        ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
                    }
                });
                const currentWeightSum = existingTasks.reduce((sum, task) => sum + (task.weight || 0), 0);
                if (currentWeightSum + (input.weight || 0) > 100) {
                    throw new Error(`Total weight of tasks cannot exceed 100% for this ${before.productId ? 'product' : 'solution'}. Current (excluding this task): ${currentWeightSum}%, Trying to set: ${input.weight || 0}%`);
                }
            }
            // Extract fields that need special handling
            const { outcomeIds, licenseId, ...inputData } = input;
            // Handle licenseId by converting it to licenseLevel
            let effectiveLicenseLevel = inputData.licenseLevel;
            if (licenseId && !effectiveLicenseLevel) {
                // Validate that the license belongs to the task's product
                if (!before.productId) {
                    throw new Error('Cannot assign license to task without a product');
                }
                // Look up the license and ensure it belongs to the task's product
                const license = await context_1.prisma.license.findFirst({
                    where: {
                        id: licenseId,
                        productId: before.productId, // Ensure license belongs to the task's product
                        isActive: true,
                        deletedAt: null
                    }
                });
                if (!license) {
                    throw new Error(`License with ID "${licenseId}" not found, is inactive, or does not belong to this product`);
                }
                // Convert license level number to string
                const levelMap = {
                    1: 'Essential',
                    2: 'Advantage',
                    3: 'Signature'
                };
                effectiveLicenseLevel = levelMap[license.level] || 'Essential';
                // Update inputData with the converted license level
                inputData.licenseLevel = effectiveLicenseLevel;
            }
            // Convert GraphQL LicenseLevel enum to Prisma enum format if provided
            const licenseLevelMap = {
                'Essential': 'ESSENTIAL',
                'Advantage': 'ADVANTAGE',
                'Signature': 'SIGNATURE'
            };
            const updateData = { ...inputData }; // Now clean of licenseId and outcomeIds
            if (effectiveLicenseLevel) {
                updateData.licenseLevel = licenseLevelMap[effectiveLicenseLevel] || 'ESSENTIAL';
                // Validate that the license level corresponds to an actual license for the product
                if (before.productId) {
                    const levelMap = {
                        'Essential': 1,
                        'Advantage': 2,
                        'Signature': 3
                    };
                    const requiredLevel = levelMap[effectiveLicenseLevel];
                    if (requiredLevel) {
                        const productLicense = await context_1.prisma.license.findFirst({
                            where: {
                                productId: before.productId,
                                level: requiredLevel,
                                isActive: true,
                                deletedAt: null
                            }
                        });
                        if (!productLicense) {
                            throw new Error(`License level "${effectiveLicenseLevel}" (level ${requiredLevel}) does not exist for this product. Please create the required license first.`);
                        }
                    }
                }
            }
            const task = await context_1.prisma.task.update({
                where: { id },
                data: updateData
            });
            // Handle outcome associations if provided
            if (outcomeIds !== undefined) {
                // First, remove all existing associations
                await context_1.prisma.taskOutcome.deleteMany({
                    where: { taskId: id }
                });
                // Then, create new associations if provided
                if (outcomeIds.length > 0) {
                    await context_1.prisma.taskOutcome.createMany({
                        data: outcomeIds.map((outcomeId) => ({
                            taskId: id,
                            outcomeId: outcomeId
                        }))
                    });
                }
            }
            // Only create changeset if we have a valid user context
            if (before && ctx.user?.id) {
                const cs = await (0, changes_1.createChangeSet)(ctx.user.id);
                await (0, changes_1.recordChange)(cs.id, 'Task', id, before, task);
            }
            await (0, audit_1.logAudit)('UPDATE_TASK', 'Task', id, { before, after: task }, ctx.user?.id);
            return task;
        },
        acquireLock: async (_, { entityType, entityId }, ctx) => { await (0, lock_1.acquireLock)(ctx.sessionId || 'anon', entityType, entityId); await (0, audit_1.logAudit)('ACQUIRE_LOCK', entityType, entityId, {}, ctx.user?.id); return true; },
        releaseLock: async (_, { entityType, entityId }, ctx) => { await (0, lock_1.releaseLock)(ctx.sessionId || 'anon', entityType, entityId); await (0, audit_1.logAudit)('RELEASE_LOCK', entityType, entityId, {}, ctx.user?.id); return true; },
        beginChangeSet: async (_, __, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); const cs = await (0, changes_1.createChangeSet)(ctx.user?.id); await (0, audit_1.logAudit)('BEGIN_CHANGE_SET', 'ChangeSet', cs.id, {}, ctx.user?.id); return cs.id; },
        commitChangeSet: async (_, { id }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); await (0, changes_1.commitChangeSet)(id); await (0, audit_1.logAudit)('COMMIT_CHANGE_SET', 'ChangeSet', id, {}, ctx.user?.id); return true; },
        undoChangeSet: async (_, { id }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); await (0, changes_1.undoChangeSet)(id); await (0, audit_1.logAudit)('UNDO_CHANGE_SET', 'ChangeSet', id, {}, ctx.user?.id); return true; },
        revertChangeSet: async (_, { id }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); const ok = await (0, changes_1.revertChangeSet)(id); await (0, audit_1.logAudit)('REVERT_CHANGE_SET', 'ChangeSet', id, {}, ctx.user?.id); return ok; },
        // Task Export/Import (Tasks for specific product with append/overwrite modes)
        exportTasksCsv: async (_, { productId }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            const product = await context_1.prisma.product.findUnique({
                where: { id: productId },
                select: { id: true, name: true }
            });
            if (!product) {
                throw new Error('Product not found');
            }
            const tasks = await context_1.prisma.task.findMany({
                where: { productId, deletedAt: null },
                orderBy: { sequenceNumber: 'asc' },
                include: {
                    outcomes: {
                        select: { outcomeId: true }
                    }
                }
            });
            const rows = tasks.map((task) => ({
                id: task.id,
                name: task.name,
                description: task.description || '',
                estMinutes: task.estMinutes,
                weight: task.weight,
                sequenceNumber: task.sequenceNumber,
                licenseLevel: task.licenseLevel,
                priority: task.priority || '',
                notes: task.notes || '',
                outcomeIds: task.outcomes.length > 0 ? JSON.stringify(task.outcomes.map((o) => o.outcomeId)) : ''
            }));
            const csv = (0, csv_1.exportCsv)(rows);
            await (0, audit_1.logAudit)('EXPORT_TASKS_CSV', 'Task', undefined, { count: tasks.length, productId }, ctx.user?.id);
            return csv;
        },
        importTasksCsv: async (_, { productId, csv, mode }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            const result = {
                success: false,
                productId,
                tasksCreated: 0,
                tasksUpdated: 0,
                tasksDeleted: 0,
                mode,
                errors: [],
                warnings: []
            };
            try {
                // Verify product exists
                const product = await context_1.prisma.product.findUnique({
                    where: { id: productId },
                    select: { id: true, name: true }
                });
                if (!product) {
                    result.errors.push('Product not found');
                    return result;
                }
                const rows = (0, csv_1.importCsv)(csv);
                if (rows.length === 0) {
                    result.errors.push('CSV file is empty');
                    return result;
                }
                // Validate headers
                const headers = Object.keys(rows[0]);
                const headerValidation = (0, csvSamples_1.validateTaskHeaders)(headers);
                if (!headerValidation.valid) {
                    result.errors.push(`Missing required fields: ${headerValidation.missing.join(', ')}`);
                }
                if (headerValidation.extra.length > 0) {
                    result.warnings.push(`Ignoring unknown fields: ${headerValidation.extra.join(', ')}`);
                }
                if (result.errors.length > 0) {
                    return result;
                }
                // Handle OVERWRITE mode - delete existing tasks first
                if (mode === 'OVERWRITE') {
                    const deletedTasks = await context_1.prisma.task.updateMany({
                        where: { productId, deletedAt: null },
                        data: { deletedAt: new Date() }
                    });
                    result.tasksDeleted = deletedTasks.count;
                }
                // Validate weight sum
                const weightSum = rows.reduce((sum, row) => {
                    const weight = parseFloat(row.weight) || 0;
                    return sum + weight;
                }, 0);
                if (weightSum > 100) {
                    result.warnings.push(`Total task weight ${weightSum.toFixed(1)}% exceeds 100%`);
                }
                // Track sequence numbers to ensure uniqueness
                const sequenceNumbers = new Set();
                // Get existing sequence numbers for APPEND mode
                if (mode === 'APPEND') {
                    const existingTasks = await context_1.prisma.task.findMany({
                        where: { productId, deletedAt: null },
                        select: { sequenceNumber: true }
                    });
                    existingTasks.forEach((task) => sequenceNumbers.add(task.sequenceNumber));
                }
                // Find next available sequence number for auto-assignment
                let nextSequence = 1;
                while (sequenceNumbers.has(nextSequence)) {
                    nextSequence++;
                }
                for (const row of rows) {
                    try {
                        // Validate required fields
                        if (!row.name?.trim()) {
                            result.warnings.push('Skipping row with empty name');
                            continue;
                        }
                        const estMinutes = parseInt(row.estMinutes) || 0;
                        const weight = parseFloat(row.weight) || 0;
                        let sequenceNumber = parseInt(row.sequenceNumber) || nextSequence;
                        // Handle sequence number conflicts
                        if (sequenceNumbers.has(sequenceNumber)) {
                            result.warnings.push(`Task ${row.name}: sequence number ${sequenceNumber} already exists, using ${nextSequence}`);
                            sequenceNumber = nextSequence;
                            while (sequenceNumbers.has(nextSequence)) {
                                nextSequence++;
                            }
                        }
                        sequenceNumbers.add(sequenceNumber);
                        nextSequence = Math.max(nextSequence, sequenceNumber) + 1;
                        // Validate license level
                        const validLicenseLevels = ['ESSENTIAL', 'ADVANTAGE', 'SIGNATURE'];
                        let licenseLevel = 'ESSENTIAL';
                        if (row.licenseLevel?.trim()) {
                            const inputLevel = row.licenseLevel.toUpperCase();
                            if (validLicenseLevels.includes(inputLevel)) {
                                licenseLevel = inputLevel;
                            }
                            else {
                                result.warnings.push(`Task ${row.name}: invalid license level '${row.licenseLevel}', using 'ESSENTIAL'`);
                            }
                        }
                        const taskData = {
                            productId,
                            name: row.name.trim(),
                            description: row.description?.trim() || null,
                            estMinutes: estMinutes,
                            weight: weight,
                            sequenceNumber: sequenceNumber,
                            licenseLevel: licenseLevel,
                            priority: row.priority?.trim() || null,
                            notes: row.notes?.trim() || null
                        };
                        if (row.id?.trim()) {
                            // Try to update existing task
                            try {
                                await context_1.prisma.task.update({
                                    where: { id: row.id.trim() },
                                    data: taskData
                                });
                                result.tasksUpdated++;
                            }
                            catch (e) {
                                if (e.code === 'P2025') {
                                    result.warnings.push(`Task ID ${row.id} not found, creating new task instead`);
                                    await context_1.prisma.task.create({
                                        data: { id: row.id.trim(), ...taskData }
                                    });
                                    result.tasksCreated++;
                                }
                                else {
                                    throw e;
                                }
                            }
                        }
                        else {
                            // Create new task
                            await context_1.prisma.task.create({ data: taskData });
                            result.tasksCreated++;
                        }
                    }
                    catch (error) {
                        result.errors.push(`Row ${row.name || 'unknown'}: ${error.message}`);
                    }
                }
                result.success = result.errors.length === 0;
                await (0, audit_1.logAudit)('IMPORT_TASKS_CSV', 'Task', undefined, {
                    productId,
                    mode,
                    tasksCreated: result.tasksCreated,
                    tasksUpdated: result.tasksUpdated,
                    tasksDeleted: result.tasksDeleted,
                    errorCount: result.errors.length,
                    warningCount: result.warnings.length
                }, ctx.user?.id);
                return result;
            }
            catch (error) {
                result.errors.push(`Import failed: ${error.message}`);
                return result;
            }
        },
        downloadTaskSampleCsv: async () => {
            return (0, csvSamples_1.generateTaskSampleCsv)();
        },
        // Product Export/Import (Simple product fields only)
        exportProductsCsv: async (_, __, ctx) => {
            (0, auth_1.requireUser)(ctx);
            const products = await context_1.prisma.product.findMany({
                where: { deletedAt: null },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    statusPercent: true
                }
            });
            const rows = products.map((product) => ({
                id: product.id,
                name: product.name,
                description: product.description || '',
                statusPercent: product.statusPercent || 0
            }));
            const csv = (0, csv_1.exportCsv)(rows);
            await (0, audit_1.logAudit)('EXPORT_PRODUCTS_CSV', 'Product', undefined, { count: products.length }, ctx.user?.id);
            return csv;
        },
        importProductsCsv: async (_, { csv }, ctx) => {
            (0, auth_1.requireUser)(ctx);
            const result = {
                success: false,
                productsCreated: 0,
                productsUpdated: 0,
                errors: [],
                warnings: []
            };
            try {
                const rows = (0, csv_1.importCsv)(csv);
                if (rows.length === 0) {
                    result.errors.push('CSV file is empty');
                    return result;
                }
                // Validate headers - only allow simple product fields
                const headers = Object.keys(rows[0]);
                const requiredHeaders = ['name'];
                const allowedHeaders = ['id', 'name', 'description', 'statusPercent'];
                const missing = requiredHeaders.filter(h => !headers.includes(h));
                const invalid = headers.filter(h => !allowedHeaders.includes(h));
                if (missing.length > 0) {
                    result.errors.push(`Missing required fields: ${missing.join(', ')}`);
                }
                if (invalid.length > 0) {
                    result.warnings.push(`Ignoring unsupported fields (only simple product fields supported): ${invalid.join(', ')}`);
                }
                if (result.errors.length > 0) {
                    return result;
                }
                for (const row of rows) {
                    try {
                        // Validate required fields
                        if (!row.name?.trim()) {
                            result.warnings.push('Skipping row with empty name');
                            continue;
                        }
                        const productData = {
                            name: row.name.trim(),
                            description: row.description?.trim() || null,
                            statusPercent: row.statusPercent ? Math.max(0, Math.min(100, parseInt(row.statusPercent) || 0)) : 0
                        };
                        if (row.id?.trim()) {
                            // Try to update existing product
                            try {
                                await context_1.prisma.product.update({
                                    where: { id: row.id.trim() },
                                    data: productData
                                });
                                result.productsUpdated++;
                            }
                            catch (e) {
                                if (e.code === 'P2025') {
                                    result.warnings.push(`Product ID ${row.id} not found, creating new product instead`);
                                    await context_1.prisma.product.create({
                                        data: { id: row.id.trim(), ...productData }
                                    });
                                    result.productsCreated++;
                                }
                                else {
                                    throw e;
                                }
                            }
                        }
                        else {
                            // Create new product
                            await context_1.prisma.product.create({ data: productData });
                            result.productsCreated++;
                        }
                    }
                    catch (error) {
                        result.errors.push(`Row ${row.name || 'unknown'}: ${error.message}`);
                    }
                }
                result.success = result.errors.length === 0;
                await (0, audit_1.logAudit)('IMPORT_PRODUCTS_CSV', 'Product', undefined, {
                    productsCreated: result.productsCreated,
                    productsUpdated: result.productsUpdated,
                    errorCount: result.errors.length,
                    warningCount: result.warnings.length
                }, ctx.user?.id);
                return result;
            }
            catch (error) {
                result.errors.push(`Import failed: ${error.message}`);
                return result;
            }
        },
        downloadProductSampleCsv: async () => {
            return (0, csvSamples_1.generateProductSampleCsv)();
        },
        addTaskDependency: async (_, { taskId, dependsOnId }, ctx) => { (0, auth_1.requireUser)(ctx); await context_1.prisma.taskDependency.create({ data: { taskId, dependsOnId } }); await (0, audit_1.logAudit)('ADD_TASK_DEP', 'TaskDependency', taskId, { dependsOnId }); return true; },
        removeTaskDependency: async (_, { taskId, dependsOnId }, ctx) => { (0, auth_1.requireUser)(ctx); await context_1.prisma.taskDependency.deleteMany({ where: { taskId, dependsOnId } }); await (0, audit_1.logAudit)('REMOVE_TASK_DEP', 'TaskDependency', taskId, { dependsOnId }); return true; },
        addTelemetry: async (_, { taskId, data }, ctx) => { (0, auth_1.requireUser)(ctx); await context_1.prisma.telemetry.create({ data: { taskId, data } }); await (0, audit_1.logAudit)('ADD_TELEMETRY', 'Telemetry', taskId, {}); return true; },
        queueTaskSoftDelete: async (_, { id }, ctx) => { (0, auth_1.ensureRole)(ctx, 'ADMIN'); if (context_1.fallbackActive) {
            (0, fallbackStore_1.softDeleteTask)(id);
        }
        else {
            await context_1.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
        } await (0, audit_1.logAudit)('QUEUE_TASK_DELETE', 'Task', id, {}); return true; },
        processDeletionQueue: async (_, { limit = 50 }, ctx) => {
            (0, auth_1.ensureRole)(ctx, 'ADMIN');
            if (context_1.fallbackActive) {
                // In fallback mode, just return 0 as deletions are handled immediately
                await (0, audit_1.logAudit)('PROCESS_DELETE_QUEUE', 'Task', undefined, { count: 0 });
                return 0;
            }
            // Find all tasks marked for deletion (soft deleted)
            const tasksToDelete = await context_1.prisma.task.findMany({
                where: {
                    deletedAt: { not: null }
                },
                take: limit
            });
            // Actually delete them from the database and reorder sequence numbers
            let deletedCount = 0;
            for (const task of tasksToDelete) {
                try {
                    // Get task details before deletion for sequence number reordering
                    const taskToDelete = await context_1.prisma.task.findUnique({
                        where: { id: task.id },
                        select: {
                            id: true,
                            sequenceNumber: true,
                            productId: true,
                            solutionId: true
                        }
                    });
                    if (!taskToDelete) {
                        console.log(`Task ${task.id} not found for deletion`);
                        continue; // Task might have been already deleted
                    }
                    console.log(`Deleting task ${task.id} with sequence ${taskToDelete.sequenceNumber} for product ${taskToDelete.productId}`);
                    // Delete related records first (only delete records that exist in schema)
                    await context_1.prisma.taskOutcome.deleteMany({ where: { taskId: task.id } });
                    await context_1.prisma.telemetry.deleteMany({ where: { taskId: task.id } });
                    // Delete the task
                    await context_1.prisma.task.delete({ where: { id: task.id } });
                    // Reorder sequence numbers for remaining tasks
                    // All tasks with sequence numbers higher than the deleted task should be decremented by 1
                    if (taskToDelete.sequenceNumber) {
                        console.log(`Reordering tasks with sequence > ${taskToDelete.sequenceNumber} for product ${taskToDelete.productId}`);
                        const updatedCount = await context_1.prisma.task.updateMany({
                            where: {
                                deletedAt: null,
                                sequenceNumber: { gt: taskToDelete.sequenceNumber },
                                ...(taskToDelete.productId ? { productId: taskToDelete.productId } : { solutionId: taskToDelete.solutionId })
                            },
                            data: {
                                sequenceNumber: {
                                    decrement: 1
                                }
                            }
                        });
                        console.log(`Reordered ${updatedCount.count} tasks after deleting task with sequence ${taskToDelete.sequenceNumber}`);
                    }
                    deletedCount++;
                }
                catch (error) {
                    console.error(`Failed to delete task ${task.id}:`, error.message);
                }
            }
            await (0, audit_1.logAudit)('PROCESS_DELETE_QUEUE', 'Task', undefined, { count: deletedCount });
            return deletedCount;
        }
    },
    Subscription: {
        productUpdated: {
            subscribe: () => pubsub_1.pubsub.asyncIterator(pubsub_1.PUBSUB_EVENTS.PRODUCT_UPDATED)
        },
        taskUpdated: {
            subscribe: () => pubsub_1.pubsub.asyncIterator(pubsub_1.PUBSUB_EVENTS.TASK_UPDATED)
        }
    }
};
