import { prisma } from '../../shared/graphql/context';
import { ensureRole } from '../../shared/auth/auth-helpers';
import { logAudit } from '../../shared/utils/audit';
import * as path from 'path';
import * as fs from 'fs';
import { CustomerTelemetryExportService } from './customer-telemetry-export.service';
import { CustomerTelemetryImportService as TelemetryImportService } from './customer-telemetry-import.service';
import { evaluateTelemetryAttribute, evaluateTaskStatusFromTelemetry } from './evaluation-engine';
// We need to lazy load/require SolutionAdoptionMutationResolvers to avoid potential circular dependency issues
// if solutionAdoption imports anything from here in the future. 
// However, currently solutionAdoption imports evaluationEngine, not this resolver file.
// Ideally, sync logic should be in a service, but for now we import the resolver.
import { SolutionAdoptionMutationResolvers } from '../solution/solution-adoption.resolver';

export const CustomerTelemetryAttributeResolvers = {
    values: async (parent: any, args: any) => {
        const limit = args.limit;
        const values = await prisma.customerTelemetryValue.findMany({
            where: { customerAttributeId: parent.id },
            orderBy: { createdAt: 'desc' },
            ...(limit && { take: limit }),
            include: {
                customerAttribute: true, // Include for criteriaMet resolver
            },
        });

        return values || []; // Always return array, never null
    },
    latestValue: async (parent: any) => {
        const value = await prisma.customerTelemetryValue.findFirst({
            where: { customerAttributeId: parent.id },
            orderBy: { createdAt: 'desc' },
        });

        return value;
    },
};

export const CustomerTelemetryValueResolvers = {
    criteriaMet: async (parent: any) => {
        // If no success criteria, return null (cannot evaluate)
        if (!parent.customerAttribute?.successCriteria) {
            return null;
        }

        // Need to fetch the attribute if not included
        let attribute = parent.customerAttribute;
        if (!attribute || !attribute.successCriteria) {
            attribute = await prisma.customerTelemetryAttribute.findUnique({
                where: { id: parent.customerAttributeId },
            });
        }

        if (!attribute?.successCriteria) {
            return null;
        }

        const criteria = typeof attribute.successCriteria === 'string'
            ? JSON.parse(attribute.successCriteria)
            : attribute.successCriteria;

        // Get the value - for STRING datatype, value is already a string in the DB
        // For other types, it may be stored as JSON
        let value = parent.value;
        if (typeof parent.value === 'string' && attribute.dataType !== 'STRING') {
            try {
                value = JSON.parse(parent.value);
            } catch {
                // If parsing fails, use the raw value
                value = parent.value;
            }
        }

        if (criteria.type === 'boolean_equals') {
            return value === criteria.expectedValue;
        } else if (criteria.type === 'number_threshold') {
            const numValue = Number(value);
            const threshold = Number(criteria.threshold);

            switch (criteria.operator) {
                case 'greater_than': return numValue > threshold;
                case 'greater_than_or_equal': return numValue >= threshold;
                case 'less_than': return numValue < threshold;
                case 'less_than_or_equal': return numValue <= threshold;
                case 'equals': return numValue === threshold;
                default: return false;
            }
        } else if (criteria.type === 'string_contains') {
            const strValue = String(value).toLowerCase();
            const expectedStr = String(criteria.expectedValue).toLowerCase();
            return strValue.includes(expectedStr);
        }

        return null;
    },
};

export const CustomerTelemetryMutationResolvers = {
    addCustomerTelemetryValue: async (_: any, { input }: any, ctx: any) => {
        const { customerAttributeId, value, source, batchId, notes } = input;

        const attribute = await prisma.customerTelemetryAttribute.findUnique({
            where: { id: customerAttributeId },
            include: { customerTask: { include: { adoptionPlan: true } } },
        });

        if (!attribute) {
            throw new Error('Customer telemetry attribute not found');
        }

        const telemetryValue = await prisma.customerTelemetryValue.create({
            data: {
                customerAttributeId,
                value,
                source: source || 'manual',
                batchId,
                notes,
            },
            include: {
                customerAttribute: true,
            },
        });

        await logAudit('ADD_CUSTOMER_TELEMETRY_VALUE', 'CustomerTelemetryValue', telemetryValue.id, { input }, ctx.user?.id);

        return telemetryValue;
    },

    bulkAddCustomerTelemetryValues: async (_: any, { inputs }: any, ctx: any) => {
        const createdValues = [];

        for (const input of inputs) {
            const { customerAttributeId, value, source, batchId, notes } = input;

            const telemetryValue = await prisma.customerTelemetryValue.create({
                data: {
                    customerAttributeId,
                    value,
                    source: source || 'api',
                    batchId,
                    notes,
                },
                include: {
                    customerAttribute: true,
                },
            });

            createdValues.push(telemetryValue);
        }

        await logAudit('BULK_ADD_CUSTOMER_TELEMETRY_VALUES', 'CustomerTelemetryValue', 'bulk', { count: inputs.length }, ctx.user?.id);

        return createdValues;
    },

    evaluateTaskTelemetry: async (_: any, { customerTaskId }: any, ctx: any) => {
        const task = await prisma.customerTask.findUnique({
            where: { id: customerTaskId },
            include: {
                adoptionPlan: true,
                telemetryAttributes: {
                    include: {
                        values: {
                            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!task) {
            throw new Error('Customer task not found');
        }

        // Update isMet status for each attribute (for display purposes)
        for (const attr of task.telemetryAttributes) {
            if (!attr.isActive) continue;
            const latestValue = attr.values[0];
            if (!latestValue) continue;

            let isMet = false;
            if (attr.successCriteria) {
                try {
                    const evaluationResult = await evaluateTelemetryAttribute(attr);
                    isMet = evaluationResult.success;
                } catch (evalError) {
                    console.error(`Failed to evaluate criteria for ${attr.name}:`, evalError);
                }
            }

            await prisma.customerTelemetryAttribute.update({
                where: { id: attr.id },
                data: { isMet, lastCheckedAt: new Date() },
            });
        }

        // Use SHARED evaluation logic for determining task status
        const { newStatus, shouldUpdate, evaluationDetails } = await evaluateTaskStatusFromTelemetry(
            { status: task.status, statusUpdateSource: task.statusUpdateSource },
            task.telemetryAttributes
        );

        // Manual status takes precedence (except for NOT_STARTED or NO_LONGER_USING regression)
        const hasManualStatus = task.statusUpdatedBy &&
            task.statusUpdatedBy !== 'telemetry' &&
            task.status !== 'NOT_STARTED';
        const shouldOverrideManual = newStatus === 'NO_LONGER_USING' && evaluationDetails.wasPreviouslyDoneByTelemetry;

        // Only update task status if:
        // 1. Status has changed, AND
        // 2. Either no manual status was set, OR current status is NOT_STARTED, OR it's NO_LONGER_USING override
        if (newStatus !== task.status && (!hasManualStatus || shouldOverrideManual)) {
            const updated = await prisma.customerTask.update({
                where: { id: customerTaskId },
                data: {
                    status: newStatus,
                    statusUpdatedAt: new Date(),
                    statusUpdatedBy: 'telemetry',
                    statusUpdateSource: 'TELEMETRY',
                    statusNotes: 'Automatically updated based on telemetry criteria',
                    isComplete: newStatus === 'DONE',
                    completedAt: newStatus === 'DONE' ? new Date() : null,
                    completedBy: newStatus === 'DONE' ? 'telemetry' : null,
                },
                include: {
                    adoptionPlan: true,
                    telemetryAttributes: {
                        include: {
                            values: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                            },
                        },
                    },
                    outcomes: { include: { outcome: true } },
                    releases: { include: { release: true } },
                },
            });

            // Recalculate adoption plan progress - we need to duplicate this locally or import it.
            // Since it's a helper function in customerAdoption.ts not exported, we implement the recalculation logic here.

            const allTasks = await prisma.customerTask.findMany({
                where: { adoptionPlanId: task.adoptionPlanId },
            });

            // Logic from calculateProgress
            const applicableTasks = allTasks.filter((t: any) => t.status !== 'NOT_APPLICABLE');
            const totalTasks = applicableTasks.length;
            const completedTasks = applicableTasks.filter((t: any) => t.status === 'COMPLETED' || t.status === 'DONE').length;

            const totalWeight = applicableTasks.reduce((sum: number, task: any) => {
                const weight = typeof task.weight === 'object' && 'toNumber' in task.weight
                    ? (task.weight as any).toNumber()
                    : Number(task.weight || 0);
                return sum + weight;
            }, 0);

            const completedWeight = applicableTasks
                .filter((t: any) => t.status === 'COMPLETED' || t.status === 'DONE')
                .reduce((sum: number, task: any) => {
                    const weight = typeof task.weight === 'object' && 'toNumber' in task.weight
                        ? (task.weight as any).toNumber()
                        : Number(task.weight || 0);
                    return sum + weight;
                }, 0);

            const progressPercentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

            await prisma.adoptionPlan.update({
                where: { id: task.adoptionPlanId },
                data: {
                    totalTasks,
                    completedTasks,
                    totalWeight,
                    completedWeight,
                    progressPercentage: Math.round(progressPercentage * 100) / 100,
                },
            });

            await logAudit('EVALUATE_TASK_TELEMETRY', 'CustomerTask', customerTaskId, { oldStatus: task.status, newStatus }, ctx.user?.id);

            return updated;
        }
        // Status not updated - either no change or manual status takes precedence
        return task;
    },

    exportAdoptionPlanTelemetryTemplate: async (_: any, { adoptionPlanId }: { adoptionPlanId: string }, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'CSS']);

        // Get metadata first
        const metadata = await CustomerTelemetryExportService.getTemplateMetadata(adoptionPlanId);

        // Generate the Excel template
        const buffer = await CustomerTelemetryExportService.generateTelemetryTemplate(adoptionPlanId);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(process.cwd(), 'temp', 'telemetry-exports');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate unique filename with sanitized names (replace special characters with underscores)
        const sanitizedCustomer = metadata.customerName.replace(/[^a-z0-9]/gi, '_');
        const sanitizedProduct = metadata.productName.replace(/[^a-z0-9]/gi, '_');
        const filename = `telemetry_template_${sanitizedCustomer}_${sanitizedProduct}_${Date.now()}.xlsx`;
        const filePath = path.join(tempDir, filename);

        // Write buffer to file
        fs.writeFileSync(filePath, buffer);

        // Generate download URL (filename is already sanitized, no special encoding needed)
        const url = `/api/downloads/telemetry-exports/${filename}`;

        await logAudit('EXPORT_TELEMETRY_TEMPLATE', 'AdoptionPlan', adoptionPlanId, metadata, ctx.user?.id);

        return {
            url,
            filename,
            taskCount: metadata.taskCount,
            attributeCount: metadata.attributeCount,
            customerName: metadata.customerName,
            productName: metadata.productName,
            assignmentName: metadata.assignmentName,
        };
    },

    importAdoptionPlanTelemetry: async (_: any, { adoptionPlanId, file }: { adoptionPlanId: string; file: any }, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'CSS']);

        // Handle file upload - file is an Upload scalar
        const { createReadStream } = await file;
        const stream = createReadStream();

        // Read stream into buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        // Import the telemetry values
        const result = await TelemetryImportService.importTelemetryValues(adoptionPlanId, fileBuffer);

        await logAudit('IMPORT_TELEMETRY_DATA', 'AdoptionPlan', adoptionPlanId, result.summary, ctx.user?.id);

        return result;
    },

    evaluateSolutionTaskTelemetry: async (_: any, { customerSolutionTaskId }: any, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'CSS']);

        const task = await prisma.customerSolutionTask.findUnique({
            where: { id: customerSolutionTaskId },
            include: {
                telemetryAttributes: {
                    include: {
                        values: {
                            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                            take: 1
                        }
                    }
                },
                solutionAdoptionPlan: true
            }
        });

        if (!task) {
            throw new Error('Customer solution task not found');
        }

        // Update isMet status for each attribute (for display purposes)
        // SAME as product task evaluation
        for (const attr of task.telemetryAttributes) {
            if (!attr.isActive) continue;
            const latestValue = attr.values[0];
            if (!latestValue) continue;

            let isMet = false;
            if (attr.successCriteria) {
                try {
                    const evaluationResult = await evaluateTelemetryAttribute(attr);
                    isMet = evaluationResult.success;
                } catch (evalError) {
                    console.error(`Failed to evaluate criteria for ${attr.name}:`, evalError);
                }
            }

            await prisma.customerTelemetryAttribute.update({
                where: { id: attr.id },
                data: { isMet, lastCheckedAt: new Date() }
            });
        }

        // Use SHARED evaluation logic - SAME function as product tasks
        const { newStatus, shouldUpdate, evaluationDetails } = await evaluateTaskStatusFromTelemetry(
            { status: task.status, statusUpdateSource: task.statusUpdateSource },
            task.telemetryAttributes
        );

        // Manual status takes precedence (except for NOT_STARTED or NO_LONGER_USING regression)
        const hasManualStatus = task.statusUpdatedBy &&
            task.statusUpdatedBy !== 'telemetry' &&
            task.status !== 'NOT_STARTED';
        const shouldOverrideManual = newStatus === 'NO_LONGER_USING' && evaluationDetails.wasPreviouslyDoneByTelemetry;

        // Only update task status if:
        // 1. Status has changed, AND
        // 2. Either no manual status was set, OR current status is NOT_STARTED, OR it's NO_LONGER_USING override
        if (newStatus !== task.status && (!hasManualStatus || shouldOverrideManual)) {
            await prisma.customerSolutionTask.update({
                where: { id: customerSolutionTaskId },
                data: {
                    status: newStatus,
                    isComplete: newStatus === 'DONE',
                    completedAt: newStatus === 'DONE' ? new Date() : null,
                    statusUpdateSource: 'TELEMETRY',
                    statusUpdatedAt: new Date()
                }
            });

            // Trigger progress recalculation
            await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan(
                _,
                { solutionAdoptionPlanId: task.solutionAdoptionPlanId },
                ctx
            );
        }

        return prisma.customerSolutionTask.findUnique({
            where: { id: customerSolutionTaskId },
            include: {
                telemetryAttributes: {
                    include: {
                        values: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
    },

    exportSolutionAdoptionPlanTelemetryTemplate: async (_: any, { solutionAdoptionPlanId }: { solutionAdoptionPlanId: string }, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'CSS']);

        // Get solution adoption plan details
        const plan = await prisma.solutionAdoptionPlan.findUnique({
            where: { id: solutionAdoptionPlanId },
            include: {
                customerSolution: {
                    include: {
                        customer: true,
                        solution: true
                    }
                },
                tasks: {
                    orderBy: { sequenceNumber: 'asc' },
                    include: {
                        telemetryAttributes: true
                    }
                }
            }
        });

        if (!plan) {
            throw new Error('Solution adoption plan not found');
        }

        const metadata = {
            customerName: plan.customerSolution.customer.name,
            solutionName: plan.customerSolution.solution.name,
            assignmentName: plan.customerSolution.name,
            taskCount: plan.tasks.length,
            attributeCount: plan.tasks.reduce((sum: number, task: any) => sum + task.telemetryAttributes.length, 0)
        };

        // Generate the Excel template (reuse the same format as customer/product)
        const buffer = await CustomerTelemetryExportService.generateSolutionTelemetryTemplate(solutionAdoptionPlanId);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(process.cwd(), 'temp', 'telemetry-exports');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Save to temp file with sanitized names
        const sanitizedCustomer = metadata.customerName.replace(/[^a-z0-9]/gi, '_');
        const sanitizedSolution = metadata.solutionName.replace(/[^a-z0-9]/gi, '_');
        const filename = `telemetry_template_${sanitizedCustomer}_${sanitizedSolution}_${Date.now()}.xlsx`;
        const filepath = path.join(tempDir, filename);
        fs.writeFileSync(filepath, buffer);

        await logAudit('EXPORT_SOLUTION_TELEMETRY_TEMPLATE', 'SolutionAdoptionPlan', solutionAdoptionPlanId, metadata, ctx.user?.id);

        return {
            url: `/api/downloads/telemetry-exports/${filename}`,
            filename,
            taskCount: metadata.taskCount,
            attributeCount: metadata.attributeCount
        };
    },

    importSolutionAdoptionPlanTelemetry: async (_: any, { solutionAdoptionPlanId, file }: { solutionAdoptionPlanId: string; file: any }, ctx: any) => {
        ensureRole(ctx, ['ADMIN', 'CSS']);

        // Handle file upload - file is an Upload scalar
        const { createReadStream } = await file;
        const stream = createReadStream();

        // Read stream into buffer
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        // Import the telemetry values (reuse customer service with solution-specific logic)
        const result = await TelemetryImportService.importSolutionTelemetryValues(solutionAdoptionPlanId, fileBuffer);

        await logAudit('IMPORT_SOLUTION_TELEMETRY_DATA', 'SolutionAdoptionPlan', solutionAdoptionPlanId, result.summary, ctx.user?.id);

        return result;
    },
};
