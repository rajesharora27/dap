/**
 * Personal Assignment GraphQL Resolvers
 */

import * as PersonalAssignmentService from './personal-assignment.service';

export const personalAssignmentResolvers = {
    Query: {
        myPersonalAssignments: async (_: any, __: any, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalAssignmentService.getMyPersonalAssignments(context.user.id);
        },

        personalAssignment: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalAssignmentService.getPersonalAssignment(id, context.user.id);
        },
    },

    Mutation: {
        createPersonalAssignment: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalAssignmentService.createPersonalAssignment(context.user.id, input);
        },

        deletePersonalAssignment: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalAssignmentService.deletePersonalAssignment(id, context.user.id);
        },

        syncPersonalAssignment: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalAssignmentService.syncPersonalAssignment(id, context.user.id);
        },

        updatePersonalAssignmentTaskStatus: async (
            _: any,
            { taskId, input }: { taskId: string; input: any },
            context: any
        ) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalAssignmentService.updatePersonalAssignmentTaskStatus(taskId, context.user.id, input);
        },
    },

    PersonalAssignment: {
        progress: (parent: any) => {
            if (!parent.tasks?.length) return 0;
            return PersonalAssignmentService.calculateProgress(parent.tasks);
        },
        taskCount: (parent: any) => parent.tasks?.length ?? 0,
        completedCount: (parent: any) => {
            if (!parent.tasks?.length) return 0;
            return parent.tasks.filter((t: any) =>
                t.status === 'DONE' || t.status === 'COMPLETED'
            ).length;
        },
    },
};
