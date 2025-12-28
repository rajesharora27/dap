import { listChangeSets, getChangeSet, createChangeSet, commitChangeSet, undoChangeSet, revertChangeSet } from '../../shared/utils/changes';
import { prisma } from '../../shared/graphql/context';

export const ChangeTrackingQueryResolvers = {
    changeSets: async (_: any, { limit = 50 }: any) => {
        const sets = await listChangeSets(limit);
        return Promise.all(sets.map(async (s: any) => ({
            ...s,
            items: await prisma.changeItem.findMany({ where: { changeSetId: s.id } })
        })));
    },
    changeSet: async (_: any, { id }: any) => {
        const s = await getChangeSet(id);
        if (!s) return null;
        return {
            ...s,
            items: await prisma.changeItem.findMany({ where: { changeSetId: s.id } })
        };
    }
};

export const ChangeTrackingMutationResolvers = {
    beginChangeSet: async () => createChangeSet(),
    commitChangeSet: async (_: any, { id }: any) => commitChangeSet(id),
    undoChangeSet: async (_: any, { id }: any) => undoChangeSet(id),
    revertChangeSet: async (_: any, { id }: any) => revertChangeSet(id)
};
