
import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { pubsub, PUBSUB_EVENTS } from '../../shared/pubsub/pubsub';
import { exportCsv, importCsv } from '../../shared/utils/csv';
import { generateTaskSampleCsv, validateTaskHeaders } from '../import/csvSamples';
import { createChangeSet, recordChange } from '../../shared/utils/changes';

export class TaskService {
    /**
     * Create a new task with retry logic for sequence number conflicts
     */
    static async createTask(userId: string, input: any) {
        const { outcomeIds, releaseIds, tagIds, telemetryAttributes, licenseLevel, productId, solutionId, licenseId, ...taskData } = input;

        let effectiveLicenseLevel = licenseLevel;

        // If a licenseId is provided (UI selects a specific license), translate it to the task's licenseLevel.
        // Tasks do NOT store a direct license relation in Prisma; license is derived from (productId/solutionId + licenseLevel).
        if (licenseId && !effectiveLicenseLevel) {
            const license = await prisma.license.findFirst({
                where: {
                    id: licenseId,
                    OR: [
                        { productId: productId || undefined },
                        { solutionId: solutionId || undefined }
                    ],
                    isActive: true,
                    deletedAt: null
                }
            });

            if (!license) {
                throw new Error(`License with ID "${licenseId}" not found, is inactive, or does not belong to this ${productId ? 'product' : 'solution'}`);
            }

            const levelMap: { [key: number]: string } = {
                1: 'Essential',
                2: 'Advantage',
                3: 'Signature'
            };
            effectiveLicenseLevel = levelMap[license.level] || 'Essential';
        }

        // Convert GraphQL LicenseLevel enum to Prisma enum format
        const licenseLevelMap: { [key: string]: string } = {
            'Essential': 'ESSENTIAL',
            'Advantage': 'ADVANTAGE',
            'Signature': 'SIGNATURE'
        };
        const prismaLicenseLevel = effectiveLicenseLevel ? licenseLevelMap[effectiveLicenseLevel] || 'ESSENTIAL' : 'ESSENTIAL';

        // Validate that the license level corresponds to an actual license for the product/solution
        if ((productId || solutionId) && effectiveLicenseLevel) {
            const levelMap: { [key: string]: number } = {
                'Essential': 1,
                'Advantage': 2,
                'Signature': 3
            };
            const requiredLevel = levelMap[effectiveLicenseLevel];
            if (requiredLevel) {
                const productLicense = await prisma.license.findFirst({
                    where: {
                        ...(productId ? { productId } : { solutionId }),
                        level: requiredLevel,
                        isActive: true,
                        deletedAt: null
                    }
                });
                if (!productLicense) {
                    throw new Error(`License level "${effectiveLicenseLevel}" (level ${requiredLevel}) does not exist for this ${productId ? 'product' : 'solution'}. Please create the required license first.`);
                }
            }
        }

        // Create task with retry logic for sequence number conflicts
        let task: any;
        let attempts = 0;
        const maxAttempts = 3;

        // If sequenceNumber is not provided, assign the next available sequence number.
        // This avoids noisy Prisma errors and ensures tasks can be created with minimal input.
        if (taskData.sequenceNumber === undefined || taskData.sequenceNumber === null) {
            const lastTask = await prisma.task.findFirst({
                where: {
                    deletedAt: null,
                    ...(productId ? { productId } : { solutionId })
                },
                orderBy: { sequenceNumber: 'desc' }
            });
            taskData.sequenceNumber = (lastTask?.sequenceNumber || 0) + 1;
        }

        while (attempts < maxAttempts) {
            try {
                // Re-calculate sequence number on each attempt to handle race conditions
                if (attempts > 0) {
                    // Only recalculate on retry attempts
                    const lastTask = await prisma.task.findFirst({
                        where: {
                            deletedAt: null,
                            ...(productId ? { productId } : { solutionId })
                        },
                        orderBy: { sequenceNumber: 'desc' }
                    });
                    taskData.sequenceNumber = (lastTask?.sequenceNumber || 0) + 1;
                }

                task = await prisma.task.create({
                    data: {
                        ...taskData,
                        licenseLevel: prismaLicenseLevel,
                        // Use Prisma relation syntax instead of direct foreign keys
                        ...(productId && { product: { connect: { id: productId } } }),
                        ...(solutionId && { solution: { connect: { id: solutionId } } })
                    }
                });

                // Success - break out of retry loop
                break;

            } catch (error: any) {
                attempts++;

                // Check if it's a sequence number conflict (Prisma unique constraint error)
                const isSequenceConflict =
                    (error?.code === 'P2002' && String(error?.meta?.target || '').includes('sequenceNumber')) ||
                    (typeof error?.message === 'string' &&
                        error.message.includes('Unique constraint failed') &&
                        error.message.includes('sequenceNumber'));

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
            await prisma.taskOutcome.createMany({
                data: outcomeIds.map((outcomeId: string) => ({
                    taskId: task.id,
                    outcomeId: outcomeId
                }))
            });
        }

        // Handle release associations if provided
        if (releaseIds && releaseIds.length > 0) {
            // Validate that all releases belong to the task's product/solution
            const validReleases = await prisma.release.findMany({
                where: {
                    id: { in: releaseIds },
                    deletedAt: null,
                    isActive: true,
                    ...(input.productId ? { productId: input.productId } : { solutionId: input.solutionId })
                }
            });

            if (validReleases.length !== releaseIds.length) {
                throw new Error(`Some releases are invalid, inactive, or do not belong to this ${input.productId ? 'product' : 'solution'}`);
            }

            await prisma.taskRelease.createMany({
                data: releaseIds.map((releaseId: string) => ({
                    taskId: task.id,
                    releaseId: releaseId
                }))
            });
        }

        // Handle telemetry attributes if provided
        if (input.telemetryAttributes && input.telemetryAttributes.length > 0) {
            await prisma.telemetryAttribute.createMany({
                data: input.telemetryAttributes.map((attr: any, index: number) => ({
                    taskId: task.id,
                    name: attr.name,
                    description: attr.description || '',
                    dataType: attr.dataType,
                    isRequired: attr.isRequired || false,
                    successCriteria: attr.successCriteria ?? null,
                    order: attr.order !== undefined ? attr.order : index,
                    isActive: true
                }))
            });
        }

        // Handle tags if provided
        if (tagIds && tagIds.length > 0) {
            await prisma.taskTag.createMany({
                data: tagIds.map((tagId: string) => ({
                    taskId: task.id,
                    tagId: tagId
                }))
            });
        }

        await logAudit('CREATE_TASK', 'Task', task.id, { name: task.name, input }, userId);
        return task;
    }

    /**
     * Update an existing task, including handling reordering and complex relationships
     */
    static async updateTask(userId: string, id: string, input: any) {
        const before = await prisma.task.findUnique({ where: { id } });
        if (!before) {
            throw new Error('Task not found');
        }

        // Track if sequence number is being updated
        let sequenceWasUpdated = false;

        // If sequence number is being updated, handle reordering
        if (input.sequenceNumber && input.sequenceNumber !== before.sequenceNumber) {
            const oldSequence = before.sequenceNumber;
            const newSequence = input.sequenceNumber;
            sequenceWasUpdated = true;

            console.log(`Reordering tasks: moving task ${id} from sequence ${oldSequence} to ${newSequence}`);

            // Use a transaction with two-step approach to avoid unique constraint violations
            await prisma.$transaction(async (tx: any) => {
                if (newSequence < oldSequence) {
                    // Moving task to a lower sequence (e.g., from 5 to 2)
                    // Step 1: Get all tasks that need to shift up
                    const tasksToShift = await tx.task.findMany({
                        where: {
                            id: { not: id },
                            deletedAt: null,
                            sequenceNumber: { gte: newSequence, lt: oldSequence },
                            ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
                        },
                        orderBy: { sequenceNumber: 'desc' } // Process in reverse order
                    });

                    // Step 2: Move affected tasks to temporary negative sequences
                    for (let i = 0; i < tasksToShift.length; i++) {
                        await tx.task.update({
                            where: { id: tasksToShift[i].id },
                            data: { sequenceNumber: -(i + 1000) }
                        });
                    }

                    // Step 3: Move current task to new sequence
                    await tx.task.update({
                        where: { id },
                        data: { sequenceNumber: newSequence }
                    });

                    // Step 4: Move affected tasks to their final sequences
                    for (let i = 0; i < tasksToShift.length; i++) {
                        await tx.task.update({
                            where: { id: tasksToShift[i].id },
                            data: { sequenceNumber: tasksToShift[i].sequenceNumber + 1 }
                        });
                    }
                } else if (newSequence > oldSequence) {
                    // Moving task to a higher sequence (e.g., from 2 to 5)
                    // Step 1: Get all tasks that need to shift down
                    const tasksToShift = await tx.task.findMany({
                        where: {
                            id: { not: id },
                            deletedAt: null,
                            sequenceNumber: { gt: oldSequence, lte: newSequence },
                            ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
                        },
                        orderBy: { sequenceNumber: 'asc' }
                    });

                    // Step 2: Move affected tasks to temporary negative sequences
                    for (let i = 0; i < tasksToShift.length; i++) {
                        await tx.task.update({
                            where: { id: tasksToShift[i].id },
                            data: { sequenceNumber: -(i + 1000) }
                        });
                    }

                    // Step 3: Move current task to new sequence
                    await tx.task.update({
                        where: { id },
                        data: { sequenceNumber: newSequence }
                    });

                    // Step 4: Move affected tasks to their final sequences
                    for (let i = 0; i < tasksToShift.length; i++) {
                        await tx.task.update({
                            where: { id: tasksToShift[i].id },
                            data: { sequenceNumber: tasksToShift[i].sequenceNumber - 1 }
                        });
                    }
                }
            });
        }

        // If weight is being updated, validate total doesn't exceed 100
        const beforeWeight = typeof before.weight === 'object' && 'toNumber' in before.weight ? before.weight.toNumber() : before.weight;
        if (input.weight !== undefined && input.weight !== beforeWeight) {
            const existingTasks = await prisma.task.findMany({
                where: {
                    id: { not: id },
                    deletedAt: null,
                    ...(before.productId ? { productId: before.productId } : { solutionId: before.solutionId })
                }
            });

            const currentWeightSum = existingTasks.reduce((sum: number, task: any) => {
                const weight = typeof task.weight === 'object' && 'toNumber' in task.weight ? task.weight.toNumber() : (task.weight || 0);
                return sum + weight;
            }, 0);
            if (currentWeightSum + (input.weight || 0) > 100) {
                throw new Error(`Total weight of tasks cannot exceed 100% for this ${before.productId ? 'product' : 'solution'}. Current (excluding this task): ${currentWeightSum.toFixed(2)}%, Trying to set: ${input.weight || 0}%`);
            }
        }

        // Extract fields that need special handling
        const { outcomeIds, licenseId, releaseIds, telemetryAttributes, tagIds, ...inputData } = input;

        // Handle licenseId by converting it to licenseLevel
        let effectiveLicenseLevel = inputData.licenseLevel;
        if (licenseId && !effectiveLicenseLevel) {
            // Validate that the license belongs to the task's product or one of its solutions
            if (!before.productId && !before.solutionId) {
                throw new Error('Cannot assign license to task without a product or solution');
            }

            // Look up the license and ensure it belongs to the task's product or solution
            const license = await prisma.license.findFirst({
                where: {
                    id: licenseId,
                    OR: [
                        { productId: before.productId || undefined },
                        { solutionId: before.solutionId || undefined }
                    ],
                    isActive: true,
                    deletedAt: null
                }
            });

            if (!license) {
                throw new Error(`License with ID "${licenseId}" not found, is inactive, or does not belong to this product`);
            }

            // Convert license level number to string
            const levelMap: { [key: number]: string } = {
                1: 'Essential',
                2: 'Advantage',
                3: 'Signature'
            };
            effectiveLicenseLevel = levelMap[license.level] || 'Essential';

            // Update inputData with the converted license level
            inputData.licenseLevel = effectiveLicenseLevel;
        }

        // Convert GraphQL LicenseLevel enum to Prisma enum format if provided
        const licenseLevelMap: { [key: string]: string } = {
            'Essential': 'ESSENTIAL',
            'Advantage': 'ADVANTAGE',
            'Signature': 'SIGNATURE'
        };
        const updateData = { ...inputData }; // Now clean of licenseId and outcomeIds
        if (effectiveLicenseLevel) {
            updateData.licenseLevel = licenseLevelMap[effectiveLicenseLevel] || 'ESSENTIAL';

            // Validate that the license level corresponds to an actual license for the product or solution
            if (before.productId || before.solutionId) {
                const levelMap: { [key: string]: number } = {
                    'Essential': 1,
                    'Advantage': 2,
                    'Signature': 3
                };
                const requiredLevel = levelMap[effectiveLicenseLevel];
                if (requiredLevel) {
                    const license = await prisma.license.findFirst({
                        where: {
                            OR: [
                                { productId: before.productId || undefined },
                                { solutionId: before.solutionId || undefined }
                            ],
                            level: requiredLevel,
                            isActive: true,
                            deletedAt: null
                        }
                    });
                    if (!license) {
                        throw new Error(`License level "${effectiveLicenseLevel}" (level ${requiredLevel}) does not exist for this ${before.productId ? 'product' : 'solution'}. Please create the required license first.`);
                    }
                }
            }
        }

        // Remove sequenceNumber from updateData if it was already handled in the reordering transaction
        if (sequenceWasUpdated && updateData.sequenceNumber !== undefined) {
            delete updateData.sequenceNumber;
        }

        const task = await prisma.task.update({
            where: { id },
            data: updateData
        });

        // Handle outcome associations if provided
        if (outcomeIds !== undefined) {
            // First, remove all existing associations
            await prisma.taskOutcome.deleteMany({
                where: { taskId: id }
            });

            // Then, create new associations if provided
            if (outcomeIds.length > 0) {
                await prisma.taskOutcome.createMany({
                    data: outcomeIds.map((outcomeId: string) => ({
                        taskId: id,
                        outcomeId: outcomeId
                    }))
                });
            }
        }

        // Handle release associations if provided
        if (releaseIds !== undefined) {
            // First, remove all existing associations
            await prisma.taskRelease.deleteMany({
                where: { taskId: id }
            });

            // Then, create new associations if provided
            if (releaseIds.length > 0) {
                await prisma.taskRelease.createMany({
                    data: releaseIds.map((releaseId: string) => ({
                        taskId: id,
                        releaseId: releaseId
                    }))
                });
            }
        }

        // Handle telemetry attributes if provided
        if (telemetryAttributes !== undefined) {
            // First, remove all existing telemetry attributes
            await prisma.telemetryAttribute.deleteMany({
                where: { taskId: id }
            });

            // Then, create new attributes if provided
            if (telemetryAttributes.length > 0) {
                await prisma.telemetryAttribute.createMany({
                    data: telemetryAttributes.map((attr: any, index: number) => ({
                        taskId: id,
                        name: attr.name,
                        description: attr.description || '',
                        dataType: attr.dataType,
                        isRequired: attr.isRequired || false,
                        successCriteria: attr.successCriteria ?? null,
                        order: attr.order !== undefined ? attr.order : index,
                        isActive: true
                    }))
                });
            }
        }

        // Handle tags if provided
        if (tagIds !== undefined) {
            if (before.solutionId) {
                // Solution Task Tags
                await prisma.solutionTaskTag.deleteMany({ where: { taskId: id } });

                if (tagIds.length > 0) {
                    await prisma.solutionTaskTag.createMany({
                        data: tagIds.map((tagId: string) => ({
                            taskId: id,
                            tagId: tagId
                        }))
                    });
                }
            } else {
                // Product Task Tags (Default)
                await prisma.taskTag.deleteMany({ where: { taskId: id } });

                // Add new tags
                if (tagIds.length > 0) {
                    await prisma.taskTag.createMany({
                        data: tagIds.map((tagId: string) => ({
                            taskId: id,
                            tagId: tagId
                        }))
                    });
                }
            }
        }

        // Only create changeset if we have a valid user context
        if (before && userId) {
            const cs = await createChangeSet(userId);
            await recordChange(cs.id, 'Task', id, before, task);
        }

        await logAudit('UPDATE_TASK', 'Task', id, { name: task.name, before, after: task }, userId);
        pubsub.publish(PUBSUB_EVENTS.TASK_UPDATED, { taskUpdated: task });
        return task;
    }

    /**
     * Soft delete a task (immediate)
     */
    static async deleteTask(userId: string, id: string) {
        console.log(`Deleting task: ${id}`);

        const before = await prisma.task.findUnique({ where: { id } });
        if (!before) {
            throw new Error('Task not found');
        }

        // Disconnect telemetry
        await prisma.telemetry.deleteMany({ where: { taskId: id } });

        // Remove dependencies where this task is target or source
        await prisma.taskDependency.deleteMany({
            where: {
                OR: [{ fromTaskId: id }, { toTaskId: id }]
            }
        });

        // Finally soft delete the task
        const deleted = await prisma.task.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                sequenceNumber: 0 // Remove from sequence order
            }
        });

        console.log(`Task deleted successfully: ${id}`);
        await logAudit('DELETE_TASK', 'Task', id, { name: before.name, deletedTask: { id: before.id, name: before.name } }, userId);
        return true;
    }

    /**
     * Reorder tasks in a list
     */
    static async reorderTasks(userId: string, entityId: string, order: string[], isProduct: boolean) {
        const entityType = isProduct ? 'Product' : 'Solution';

        try {
            // Use a transaction to avoid unique constraint violations
            await prisma.$transaction(async (tx: any) => {
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

            await logAudit('REORDER_TASKS', entityType, entityId, { order }, userId);
            return true;
        } catch (error) {
            console.error('Failed to reorder tasks in database:', error);
            return false;
        }
    }

    /**
     * Queue a task for soft deletion and reorder remaining list
     */
    static async queueTaskSoftDelete(userId: string, id: string) {
        console.log(`Deleting task: ${id}`);
        try {
            // First, get the task to know its product/solution and sequence number
            const taskToDelete = await prisma.task.findUnique({
                where: { id }
            });

            if (!taskToDelete) {
                throw new Error('Task not found');
            }

            // Delete the task
            await prisma.task.delete({ where: { id } });

            // Recalculate sequence numbers for remaining tasks
            const entityFilter = taskToDelete.productId
                ? { productId: taskToDelete.productId }
                : { solutionId: taskToDelete.solutionId };

            // Get all remaining tasks ordered by sequence number
            const remainingTasks = await prisma.task.findMany({
                where: {
                    ...entityFilter,
                    deletedAt: null
                },
                orderBy: { sequenceNumber: 'asc' },
                select: { id: true, sequenceNumber: true }
            });

            // Update sequence numbers to be contiguous (1, 2, 3, ...)
            for (let i = 0; i < remainingTasks.length; i++) {
                const expectedSeq = i + 1;
                if (remainingTasks[i].sequenceNumber !== expectedSeq) {
                    await prisma.task.update({
                        where: { id: remainingTasks[i].id },
                        data: { sequenceNumber: expectedSeq }
                    });
                }
            }

            console.log(`Reordered ${remainingTasks.length} remaining tasks after deletion`);
            console.log(`Task deleted successfully: ${id}`);

            await logAudit('DELETE_TASK', 'Task', id, { name: taskToDelete.name, deletedTask: { id: taskToDelete.id, name: taskToDelete.name } }, userId);
            // Return the task that was deleted (captured before deletion)
            // We need to ensure it has the ID since it's the most critical field for the frontend
            return {
                ...taskToDelete,
                id // Ensure ID is present
            };
        } catch (error: any) {
            console.error(`Failed to delete task ${id}:`, error.message);
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    }

    /**
     * Process batch deletion of soft-deleted tasks
     */
    static async processDeletionQueue(limit: number = 50) {
        // Find all tasks marked for deletion (soft deleted)
        // Note: The logic from index.ts assumes checking deletedAt: { not: null } and then hard deleting them.
        const tasksToDelete = await prisma.task.findMany({
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
                const taskToDelete = await prisma.task.findUnique({
                    where: { id: task.id },
                    select: {
                        id: true,
                        sequenceNumber: true,
                        productId: true,
                        solutionId: true
                    }
                });

                if (!taskToDelete) {
                    continue; // Task might have been already deleted
                }

                // Delete related records first (only delete records that exist in schema)
                await prisma.taskOutcome.deleteMany({ where: { taskId: task.id } });
                await prisma.telemetry.deleteMany({ where: { taskId: task.id } });

                // Delete the task
                await prisma.task.delete({ where: { id: task.id } });

                // Reorder sequence numbers for remaining tasks
                // All tasks with sequence numbers higher than the deleted task should be decremented by 1
                if (taskToDelete.sequenceNumber) {

                    // Use two-step approach to avoid unique constraint violations
                    // Step 1: Move all affected tasks to negative sequences
                    const tasksToReorder = await prisma.task.findMany({
                        where: {
                            deletedAt: null,
                            sequenceNumber: { gt: taskToDelete.sequenceNumber },
                            ...(taskToDelete.productId ? { productId: taskToDelete.productId } : { solutionId: taskToDelete.solutionId })
                        },
                        orderBy: { sequenceNumber: 'asc' }
                    });

                    // Step 2: Update each task to temporary negative value, then to final value
                    for (let i = 0; i < tasksToReorder.length; i++) {
                        const task = tasksToReorder[i];
                        const newSeq = task.sequenceNumber - 1;

                        // First move to negative to avoid constraint
                        await prisma.task.update({
                            where: { id: task.id },
                            data: { sequenceNumber: -(i + 1000) }
                        });
                    }

                    // Step 3: Update to final positive values
                    for (let i = 0; i < tasksToReorder.length; i++) {
                        const task = tasksToReorder[i];
                        const newSeq = task.sequenceNumber - 1;

                        await prisma.task.update({
                            where: { id: task.id },
                            data: { sequenceNumber: newSeq }
                        });
                    }
                }

                deletedCount++;
            } catch (error: any) {
                console.error(`Failed to delete task ${task.id}:`, error.message);
            }
        }

        await logAudit('PROCESS_DELETE_QUEUE', 'Task', undefined, { count: deletedCount });
        return deletedCount;
    }

    static async exportTasksCsv(userId: string, productId: string | null) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true }
        });

        if (!product) {
            throw new Error('Product not found');
        }

        const tasks = await prisma.task.findMany({
            where: { productId, deletedAt: null },
            orderBy: { sequenceNumber: 'asc' },
            include: {
                outcomes: {
                    select: { outcomeId: true }
                }
            }
        });

        const rows = tasks.map((task: any) => ({
            id: task.id,
            name: task.name,
            description: task.description || '',
            estMinutes: task.estMinutes,
            weight: task.weight,
            sequenceNumber: task.sequenceNumber,
            licenseLevel: task.licenseLevel,
            notes: task.notes || '',
            outcomeIds: task.outcomes.length > 0 ? JSON.stringify(task.outcomes.map((o: any) => o.outcomeId)) : ''
        }));

        const csv = exportCsv(rows);
        await logAudit('EXPORT_TASKS_CSV', 'Task', undefined, { count: tasks.length, productId }, userId);
        return csv;
    }

    static async importTasksCsv(userId: string, productId: string | null, csv: string, mode: string) {
        const result = {
            success: false,
            productId,
            tasksCreated: 0,
            tasksUpdated: 0,
            tasksDeleted: 0,
            mode,
            errors: [] as string[],
            warnings: [] as string[]
        };

        try {
            // Verify product exists
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { id: true, name: true }
            });

            if (!product) {
                result.errors.push('Product not found');
                return result;
            }

            const rows = importCsv(csv);
            if (rows.length === 0) {
                result.errors.push('CSV file is empty');
                return result;
            }

            // Validate headers
            const headers = Object.keys(rows[0]);
            const headerValidation = validateTaskHeaders(headers);
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
                const deletedTasks = await prisma.task.updateMany({
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
            const sequenceNumbers = new Set<number>();

            // Get existing sequence numbers for APPEND mode
            if (mode === 'APPEND') {
                const existingTasks = await prisma.task.findMany({
                    where: { productId, deletedAt: null },
                    select: { sequenceNumber: true }
                });
                existingTasks.forEach((task: any) => sequenceNumbers.add(task.sequenceNumber));
            }

            // Find next available sequence number for auto-assignment
            let nextSequence = 1;
            while (sequenceNumbers.has(nextSequence)) {
                nextSequence++;
            }

            for (const row of rows) {
                try {
                    // Basic validation
                    if (!row.name) {
                        result.errors.push(`Row ${row.id || 'unknown'}: Name is required`);
                        continue;
                    }

                    const taskData: any = {
                        name: row.name,
                        description: row.description || '',
                        estMinutes: parseInt(row.estMinutes) || 0,
                        weight: parseFloat(row.weight) || 0,
                        licenseLevel: row.licenseLevel || 'ESSENTIAL',
                        notes: row.notes || '',
                        productId,
                        sequenceNumber: row.sequenceNumber ? parseInt(row.sequenceNumber) : nextSequence++
                    };

                    if (!row.sequenceNumber) {
                        // Mark as used if we auto-assigned
                        sequenceNumbers.add(taskData.sequenceNumber);
                        // Advance nextSequence
                        while (sequenceNumbers.has(nextSequence)) {
                            nextSequence++;
                        }
                    }

                    // Handle outcomes if present
                    let outcomeIds: string[] = [];
                    if (row.outcomeIds) {
                        try {
                            outcomeIds = JSON.parse(row.outcomeIds);
                        } catch (e) {
                            result.warnings.push(`Row ${row.name}: Invalid outcomeIds format`);
                        }
                    }

                    if (row.id && mode === 'APPEND') {
                        // Check if task exists
                        const existingTask = await prisma.task.findUnique({
                            where: { id: row.id }
                        });

                        if (existingTask) {
                            // Update existing task
                            await prisma.task.update({
                                where: { id: row.id },
                                data: taskData
                            });

                            // Update outcomes
                            if (outcomeIds.length > 0) {
                                await prisma.taskOutcome.deleteMany({ where: { taskId: row.id } });
                                await prisma.taskOutcome.createMany({
                                    data: outcomeIds.map((id) => ({ taskId: row.id, outcomeId: id }))
                                });
                            }

                            result.tasksUpdated++;
                        } else {
                            // Create new task with specific ID? No, Prisma usually handles ID. 
                            // If CSV has ID but it's not found, treat as new?
                            // For simplicity, create new task (ignoring CSV ID)
                            const task = await prisma.task.create({ data: taskData });
                            if (outcomeIds.length > 0) {
                                await prisma.taskOutcome.createMany({
                                    data: outcomeIds.map((id) => ({ taskId: task.id, outcomeId: id }))
                                });
                            }
                            result.tasksCreated++;
                        }
                    } else {
                        // Create new product/task
                        const task = await prisma.task.create({ data: taskData });
                        if (outcomeIds.length > 0) {
                            await prisma.taskOutcome.createMany({
                                data: outcomeIds.map((id) => ({ taskId: task.id, outcomeId: id }))
                            });
                        }
                        result.tasksCreated++;
                    }

                } catch (error: any) {
                    result.errors.push(`Row ${row.name || 'unknown'}: ${error.message}`);
                }
            }

            result.success = result.errors.length === 0;

            await logAudit('IMPORT_TASKS_CSV', 'Task', undefined, {
                tasksCreated: result.tasksCreated,
                tasksUpdated: result.tasksUpdated,
                errorCount: result.errors.length,
                warningCount: result.warnings.length
            }, userId);

            return result;

        } catch (error: any) {
            result.errors.push(`Import failed: ${error.message}`);
            return result;
        }
    }

    static async addTaskDependency(userId: string, taskId: string, dependsOnId: string) {
        await prisma.taskDependency.create({ data: { taskId, dependsOnId } });
        await logAudit('ADD_TASK_DEP', 'TaskDependency', taskId, { dependsOnId });
        return true;
    }

    static async removeTaskDependency(userId: string, taskId: string, dependsOnId: string) {
        await prisma.taskDependency.deleteMany({ where: { taskId, dependsOnId } });
        await logAudit('REMOVE_TASK_DEP', 'TaskDependency', taskId, { dependsOnId });
        return true;
    }

    static async addTelemetry(userId: string, taskId: string, data: any) {
        await prisma.telemetry.create({ data: { taskId, data } });
        await logAudit('ADD_TELEMETRY', 'Telemetry', taskId, { taskId, action: 'telemetry_added' });
        return true;
    }
}
