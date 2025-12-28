import { ConnectionArguments, connectionFromArraySlice, cursorToOffset } from 'graphql-relay';

export const CommonResolvers = {
    Node: {
        __resolveType(obj: any) {
            if (obj.tasks !== undefined) return 'Product';
            if (obj.products !== undefined) return 'Solution';
            if (obj.overviewMetrics !== undefined) return 'Customer';
            if (obj.estMinutes !== undefined) return 'Task';
            return null;
        }
    }
};

export function relayFromArray<T>(items: T[], args: ConnectionArguments) {
    const offset = args.after ? cursorToOffset(args.after) + 1 : 0;
    const limit = args.first ?? 25;
    const slice = items.slice(offset, offset + limit);
    const conn = connectionFromArraySlice(slice, args, { sliceStart: offset, arrayLength: items.length });
    return { ...conn, totalCount: items.length };
}
