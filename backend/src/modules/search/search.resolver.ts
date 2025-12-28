import { prisma } from '../../shared/graphql/context';

export const SearchQueryResolvers = {
    search: async (_: any, { query, first = 20 }: any) => {
        const q = query.trim();
        if (!q) return [];

        const [products, tasks, solutions, customers] = await Promise.all([
            prisma.product.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first }),
            prisma.task.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first }),
            prisma.solution.findMany({ where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null }, take: first }),
            prisma.customer.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, take: first })
        ]);

        return [...products, ...tasks, ...solutions, ...customers].slice(0, first);
    }
};

export const SearchResolvers = {
    SearchResult: {
        __resolveType(obj: any) {
            if (obj.tasks !== undefined && obj.solutions !== undefined) return 'Product';
            if (obj.products !== undefined && obj.customers !== undefined) return 'Solution';
            if (obj.estMinutes !== undefined) return 'Task';
            if (obj.overviewMetrics !== undefined) return 'Customer';
            return null;
        }
    }
};
