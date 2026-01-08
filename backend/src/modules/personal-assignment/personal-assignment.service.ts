/**
 * Personal Assignment Service
 * Handles personal adoption plan simulation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// PERSONAL ASSIGNMENT CRUD
// ============================================================================

export async function getMyPersonalAssignments(userId: string) {
    return prisma.personalAssignment.findMany({
        where: { userId },
        include: {
            personalProduct: {
                include: {
                    tasks: { orderBy: { sequenceNumber: 'asc' } },
                    outcomes: true,
                    releases: true,
                },
            },
            tasks: {
                orderBy: { sequenceNumber: 'asc' },
                include: {
                    personalTask: true,
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });
}

export async function getPersonalAssignment(id: string, userId: string) {
    return prisma.personalAssignment.findFirst({
        where: { id, userId },
        include: {
            personalProduct: {
                include: {
                    tasks: { orderBy: { sequenceNumber: 'asc' } },
                    outcomes: true,
                    releases: true,
                },
            },
            tasks: {
                orderBy: { sequenceNumber: 'asc' },
                include: {
                    personalTask: true,
                },
            },
        },
    });
}

export async function createPersonalAssignment(
    userId: string,
    data: { personalProductId: string; name: string }
) {
    // Verify product ownership
    const product = await prisma.personalProduct.findFirst({
        where: { id: data.personalProductId, userId },
        include: { tasks: { orderBy: { sequenceNumber: 'asc' } } },
    });
    if (!product) throw new Error('Personal product not found');

    // Create assignment with synced tasks
    const assignment = await prisma.personalAssignment.create({
        data: {
            userId,
            personalProductId: data.personalProductId,
            name: data.name,
            tasks: {
                create: product.tasks.map((task, index) => ({
                    personalTaskId: task.id,
                    sequenceNumber: index + 1,
                    status: 'NOT_STARTED',
                })),
            },
        },
        include: {
            personalProduct: {
                include: {
                    tasks: true,
                    outcomes: true,
                    releases: true,
                },
            },
            tasks: {
                orderBy: { sequenceNumber: 'asc' },
                include: { personalTask: true },
            },
        },
    });

    return assignment;
}

export async function deletePersonalAssignment(id: string, userId: string) {
    const assignment = await prisma.personalAssignment.findFirst({
        where: { id, userId },
    });
    if (!assignment) throw new Error('Personal assignment not found');

    await prisma.personalAssignment.delete({ where: { id } });
    return true;
}

export async function syncPersonalAssignment(id: string, userId: string) {
    const assignment = await prisma.personalAssignment.findFirst({
        where: { id, userId },
        include: {
            personalProduct: {
                include: { tasks: { orderBy: { sequenceNumber: 'asc' } } },
            },
            tasks: true,
        },
    });
    if (!assignment) throw new Error('Personal assignment not found');

    const existingTaskIds = new Set(assignment.tasks.map(t => t.personalTaskId));
    const productTaskIds = new Set(assignment.personalProduct.tasks.map(t => t.id));

    // Add new tasks from product
    for (const task of assignment.personalProduct.tasks) {
        if (!existingTaskIds.has(task.id)) {
            await prisma.personalAssignmentTask.create({
                data: {
                    personalAssignmentId: id,
                    personalTaskId: task.id,
                    sequenceNumber: task.sequenceNumber,
                    status: 'NOT_STARTED',
                },
            });
        }
    }

    // Remove tasks that no longer exist in product
    for (const assignmentTask of assignment.tasks) {
        if (!productTaskIds.has(assignmentTask.personalTaskId)) {
            await prisma.personalAssignmentTask.delete({
                where: { id: assignmentTask.id },
            });
        }
    }

    return getPersonalAssignment(id, userId);
}

// ============================================================================
// TASK STATUS UPDATES
// ============================================================================

export async function updatePersonalAssignmentTaskStatus(
    taskId: string,
    userId: string,
    data: { status: string; statusNotes?: string }
) {
    // Verify ownership through assignment
    const task = await prisma.personalAssignmentTask.findUnique({
        where: { id: taskId },
        include: { personalAssignment: true },
    });
    if (!task || task.personalAssignment.userId !== userId) {
        throw new Error('Personal assignment task not found');
    }

    return prisma.personalAssignmentTask.update({
        where: { id: taskId },
        data: {
            status: data.status as any,
            statusNotes: data.statusNotes,
            statusUpdatedAt: new Date(),
        },
        include: { personalTask: true },
    });
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

export function calculateProgress(tasks: Array<{ status: string; weight?: number }>) {
    if (!tasks.length) return 0;

    const completed = tasks.filter(
        t => t.status === 'DONE' || t.status === 'COMPLETED'
    ).length;

    return (completed / tasks.length) * 100;
}
