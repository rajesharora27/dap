/**
 * Personal Product GraphQL Resolvers
 */

import * as PersonalProductService from './personal-product.service';
import { PersonalTelemetryService } from './personal-telemetry.service';
import { ExcelExportService } from '../import/excel-export.service';

export const personalProductResolvers = {
    Query: {
        myPersonalProducts: async (_: any, __: any, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.getMyPersonalProducts(context.user.id);
        },

        personalProduct: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.getPersonalProduct(id, context.user.id);
        },

        personalProductTasks: async (_: any, { personalProductId }: { personalProductId: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            const product = await PersonalProductService.getPersonalProduct(personalProductId, context.user.id);
            return product?.tasks ?? [];
        },

        exportPersonalProduct: async (_: any, { personalProductId }: { personalProductId: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return ExcelExportService.exportPersonalProduct(personalProductId, context.user.id);
        },
    },

    Mutation: {
        createPersonalProduct: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalProduct(context.user.id, input);
        },

        updatePersonalProduct: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalProduct(id, context.user.id, input);
        },

        deletePersonalProduct: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalProduct(id, context.user.id);
        },

        createPersonalTask: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalTask(context.user.id, input);
        },

        updatePersonalTask: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalTask(id, context.user.id, input);
        },

        deletePersonalTask: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalTask(id, context.user.id);
        },

        createPersonalOutcome: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalOutcome(context.user.id, input);
        },

        deletePersonalOutcome: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalOutcome(id, context.user.id);
        },

        updatePersonalOutcome: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalOutcome(id, context.user.id, input);
        },

        createPersonalRelease: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalRelease(context.user.id, input);
        },

        deletePersonalRelease: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalRelease(id, context.user.id);
        },

        updatePersonalRelease: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalRelease(id, context.user.id, input);
        },

        importPersonalProduct: async (_: any, { exportData }: { exportData: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.importPersonalProduct(context.user.id, exportData);
        },

        copyGlobalProductToPersonal: async (_: any, { productId }: { productId: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.copyGlobalProductToPersonal(context.user.id, productId);
        },

        // -- New Mutations --

        createPersonalLicense: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalLicense(context.user.id, input);
        },

        updatePersonalLicense: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalLicense(id, context.user.id, input);
        },

        deletePersonalLicense: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalLicense(id, context.user.id);
        },

        reorderPersonalLicenses: async (_: any, { ids }: { ids: string[] }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.reorderPersonalLicenses(ids, context.user.id);
        },

        createPersonalTag: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalTag(context.user.id, input);
        },

        updatePersonalTag: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalTag(id, context.user.id, input);
        },

        deletePersonalTag: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalTag(id, context.user.id);
        },

        reorderPersonalTags: async (_: any, { ids }: { ids: string[] }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.reorderPersonalTags(ids, context.user.id);
        },

        createPersonalTelemetryAttribute: async (_: any, { input }: { input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.createPersonalTelemetryAttribute(context.user.id, input);
        },

        updatePersonalTelemetryAttribute: async (_: any, { id, input }: { id: string; input: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.updatePersonalTelemetryAttribute(id, context.user.id, input);
        },

        deletePersonalTelemetryAttribute: async (_: any, { id }: { id: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalProductService.deletePersonalTelemetryAttribute(id, context.user.id);
        },

        reorderPersonalTelemetryAttributes: async (_: any, { ids }: { ids: string[] }, { user }: any) => {
            return PersonalProductService.reorderPersonalTelemetryAttributes(ids, user.id);
        },

        reorderPersonalTasks: async (_: any, { personalProductId, taskIds }: { personalProductId: string, taskIds: string[] }, { user }: any) => {
            return PersonalProductService.reorderPersonalTasks(personalProductId, taskIds, user.id);
        },

        // Telemetry Mutations
        exportPersonalTelemetryTemplate: async (_: any, { personalProductId }: { personalProductId: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            const buffer = await PersonalTelemetryService.generateTelemetryTemplate(personalProductId, context.user.id);
            return {
                url: '', // Should be handled by frontend via download
                filename: `telemetry_template_${personalProductId}.xlsx`,
                content: (buffer as any).toString('base64'),
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                size: (buffer as any).length
            };
        },

        importPersonalTelemetry: async (_: any, { personalProductId, file }: { personalProductId: string, file: any }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            const { createReadStream } = await file;
            const stream = createReadStream();
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            const result = await PersonalTelemetryService.importTelemetry(personalProductId, context.user.id, buffer);
            return {
                success: result.success,
                summary: {
                    tasksProcessed: result.summary?.tasksProcessed ?? 0,
                    attributesUpdated: result.summary?.attributesUpdated ?? 0,
                    errors: result.summary?.errors ?? []
                }
            };
        },

        evaluatePersonalTaskTelemetry: async (_: any, { personalTaskId }: { personalTaskId: string }, context: any) => {
            if (!context.user?.id) throw new Error('Authentication required');
            return PersonalTelemetryService.evaluateTaskTelemetry(personalTaskId, context.user.id);
        }
    },

    PersonalProduct: {
        taskCount: (parent: any) => parent.tasks?.length ?? 0,
        progress: (parent: any) => {
            // First check assignments (legacy/sync mode)
            if (parent.assignments?.length) {
                const firstAssignment = parent.assignments[0];
                if (!firstAssignment.tasks?.length) return 0;
                const completed = firstAssignment.tasks.filter((t: any) =>
                    t.status === 'COMPLETED' || t.status === 'DONE'
                ).length;
                return (completed / firstAssignment.tasks.length) * 100;
            }

            // If no assignments, check base tasks (Personal Sandbox mode)
            if (parent.tasks?.length) {
                const completed = parent.tasks.filter((t: any) =>
                    t.status === 'COMPLETED' || t.status === 'DONE'
                ).length;
                return (completed / parent.tasks.length) * 100;
            }

            return 0;
        },
    },

    PersonalTask: {
        outcomes: (parent: any) => parent.outcomes?.map((o: any) => o.personalOutcome) ?? [],
        releases: (parent: any) => parent.releases?.map((r: any) => r.personalRelease) ?? [],
        tags: (parent: any) => parent.taskTags?.map((t: any) => t.personalTag) ?? [],
        telemetryAttributes: (parent: any) => parent.telemetryAttributes ?? [],
        telemetryProgress: (parent: any) => {
            const attrs = parent.telemetryAttributes || [];
            if (attrs.length === 0) return null;
            const required = attrs.filter((a: any) => a.isRequired);
            const met = attrs.filter((a: any) => a.isMet);
            const metRequired = required.filter((a: any) => a.isMet);
            return {
                totalAttributes: attrs.length,
                requiredAttributes: required.length,
                metAttributes: met.length,
                metRequiredAttributes: metRequired.length,
                completionPercentage: attrs.length > 0 ? (met.length / attrs.length) * 100 : 0,
                allRequiredMet: required.length === 0 || metRequired.length === required.length
            };
        },
        licenseLevel: (parent: any) => parent.licenseLevel ?? 0,
    },

    PersonalTelemetryAttribute: {
        values: (parent: any, { limit }: { limit?: number }, { prisma }: any) => {
            return prisma.personalTelemetryValue.findMany({
                where: { personalAttributeId: parent.id },
                orderBy: { createdAt: 'desc' },
                take: limit || 100
            });
        },
        latestValue: (parent: any, _: any, { prisma }: any) => {
            return prisma.personalTelemetryValue.findFirst({
                where: { personalAttributeId: parent.id },
                orderBy: { createdAt: 'desc' }
            });
        }
    },

    PersonalTelemetryValue: {
        criteriaMet: async (parent: any, _: any, { prisma }: any) => {
            // Fetch the related attribute to get its isMet status
            const attribute = await prisma.personalTelemetryAttribute.findUnique({
                where: { id: parent.personalAttributeId },
                select: { isMet: true }
            });
            return attribute?.isMet ?? false;
        },
    },

    PersonalLicense: {
        taskCount: async (parent: any, _: any, { prisma }: any) => {
            return prisma.personalTask.count({
                where: {
                    personalProductId: parent.personalProductId,
                    licenseLevel: { lte: parent.level }
                }
            });
        }
    }
};
