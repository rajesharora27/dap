/**
 * Solution Service Module
 * 
 * Provides business logic for solution management including CRUD operations,
 * product associations, reordering, and adoption plan progress calculations.
 * 
 * Solutions are bundles of products that represent complete offerings.
 * They support their own tasks, licenses, and adoption plans.
 * 
 * @module modules/solution/solution.service
 * 
 * @example
 * ```typescript
 * import { SolutionService } from './solution.service';
 * 
 * // Create a solution
 * const solution = await SolutionService.createSolution(userId, {
 *   name: 'SASE Solution',
 *   description: 'Secure Access Service Edge'
 * });
 * 
 * // Add products to solution
 * await SolutionService.addProductToSolution(userId, solution.id, productId);
 * ```
 */

import { prisma } from '../../shared/graphql/context';
import { logAudit } from '../../shared/utils/audit';
import { createChangeSet, recordChange } from '../../shared/utils/changes';
import { CreateSolutionSchema, UpdateSolutionSchema } from './solution.validation';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

/** Input type for creating a solution, derived from Zod schema */
type CreateSolutionInput = z.infer<typeof CreateSolutionSchema>;

/** Input type for updating a solution, derived from Zod schema */
type UpdateSolutionInput = z.infer<typeof UpdateSolutionSchema>;

/**
 * Progress calculation result for solution tasks.
 * 
 * @interface TaskProgressResult
 */
interface TaskProgressResult {
  /** Total number of applicable tasks (excludes NOT_APPLICABLE) */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Sum of weights for all applicable tasks */
  totalWeight: number;
  /** Sum of weights for completed tasks */
  completedWeight: number;
  /** Weighted completion percentage (0-100) */
  progressPercentage: number;
}

/**
 * Service class for solution management operations.
 * 
 * Handles solution lifecycle, product associations, and adoption
 * plan progress tracking. All methods are static.
 * 
 * @class SolutionService
 */
export class SolutionService {
  /**
   * Create a new solution in the system.
   * 
   * Creates the solution record and optionally associates licenses.
   * 
   * @param userId - ID of the user performing the operation
   * @param input - Solution creation data
   * @param input.name - Solution name (required)
   * @param input.description - Solution description (optional)
   * @param input.resources - JSON object of resource links (optional)
   * @param input.customAttrs - Custom attributes JSON (optional)
   * @param input.licenseIds - License IDs to associate (optional)
   * @returns Promise resolving to the created Solution record
   * 
   * @example
   * ```typescript
   * const solution = await SolutionService.createSolution('user123', {
   *   name: 'Zero Trust Solution',
   *   description: 'Complete zero trust security framework',
   *   customAttrs: { category: 'Security', priority: 'High' }
   * });
   * ```
   */
  static async createSolution(userId: string, input: CreateSolutionInput) {
    const { licenseIds, ...solutionData } = input;

    const solution = await prisma.solution.create({
      data: {
        name: solutionData.name,
        description: solutionData.description,
        resources: solutionData.resources ?? undefined,
        customAttrs: solutionData.customAttrs ?? undefined
      }
    });

    // Handle license relationship if licenseIds provided
    if (licenseIds && licenseIds.length > 0) {
      await prisma.license.updateMany({
        where: {
          id: { in: licenseIds },
          deletedAt: null
        },
        data: { solutionId: solution.id }
      });
    }

    await logAudit('CREATE_SOLUTION', 'Solution', solution.id, { name: solution.name, input }, userId);
    return solution;
  }

  /**
   * Update an existing solution.
   * 
   * Updates solution fields and optionally reassigns licenses.
   * Creates a change set for tracking modifications.
   * 
   * @param userId - ID of the user performing the operation
   * @param id - Solution ID to update
   * @param input - Fields to update (all optional)
   * @returns Promise resolving to the updated Solution record
   * @throws Error if solution not found
   * 
   * @example
   * ```typescript
   * await SolutionService.updateSolution(userId, solutionId, {
   *   name: 'Updated Solution Name',
   *   customAttrs: { category: 'New Category' }
   * });
   * ```
   */
  static async updateSolution(userId: string, id: string, input: UpdateSolutionInput) {
    const { licenseIds, ...solutionData } = input;

    const before = await prisma.solution.findUnique({ where: { id } });

    // Prepare update data, handling null values for JSON fields
    const updateData: Record<string, unknown> = { ...solutionData };
    if (solutionData.customAttrs === null) {
      updateData.customAttrs = undefined;
    }

    const updated = await prisma.solution.update({
      where: { id },
      data: updateData
    });

    // Handle license relationship if licenseIds provided
    if (licenseIds !== undefined) {
      // First, clear existing licenses for this solution
      await prisma.license.updateMany({
        where: { solutionId: id },
        data: { solutionId: null }
      });

      // Then, assign new licenses to this solution
      if (licenseIds.length > 0) {
        await prisma.license.updateMany({
          where: {
            id: { in: licenseIds },
            deletedAt: null
          },
          data: { solutionId: id }
        });
      }
    }

    if (before) {
      const cs = await createChangeSet(userId);
      await recordChange(cs.id, 'Solution', id, before, updated);
    }

    await logAudit('UPDATE_SOLUTION', 'Solution', id, { name: updated.name, before, after: updated }, userId);
    return updated;
  }

  /**
   * Delete a solution with full cascading cleanup.
   * 
   * Performs a transactional hard delete of the solution and ALL related records:
   * - Solution adoption plans and their children
   * - Customer-solution assignments
   * - Solution-product relationships
   * - Solution task ordering
   * - Tasks and their telemetry
   * - Releases, outcomes, and licenses
   * 
   * Uses a database transaction to ensure atomicity.
   * 
   * @param userId - ID of the user performing the operation
   * @param id - Solution ID to delete
   * @returns Promise resolving to true on success
   * @throws Error if deletion fails
   * 
   * @warning This is a destructive operation. All associated data including
   * customer adoption plans will be permanently deleted.
   */
  static async deleteSolution(userId: string, id: string) {
    console.log(`Deleting solution: ${id}`);

    // Get solution name before deletion for audit
    const solution = await prisma.solution.findUnique({ where: { id }, select: { id: true, name: true } });

    // Perform a safe cascading delete of all dependent records
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1) Solution adoption plans and their children
      const solutionPlans = await tx.solutionAdoptionPlan.findMany({
        where: { solutionId: id },
        select: { id: true }
      });
      const solutionPlanIds = solutionPlans.map((p: { id: string }) => p.id);

      if (solutionPlanIds.length) {
        await tx.solutionAdoptionProduct.deleteMany({
          where: { solutionAdoptionPlanId: { in: solutionPlanIds } }
        });
        await tx.solutionAdoptionPlan.deleteMany({
          where: { id: { in: solutionPlanIds } }
        });
      }

      // 2) Customer solution assignments
      await tx.customerSolution.deleteMany({ where: { solutionId: id } });

      // 3) Solution ↔ Product links and ordering
      await tx.solutionProduct.deleteMany({ where: { solutionId: id } });
      await tx.solutionTaskOrder.deleteMany({ where: { solutionId: id } });

      // 4) Solution tasks and their telemetry
      const solutionTasks = await tx.task.findMany({
        where: { solutionId: id },
        select: { id: true }
      });
      const taskIds = solutionTasks.map((t: { id: string }) => t.id);
      if (taskIds.length) {
        await tx.telemetry.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.task.deleteMany({ where: { id: { in: taskIds } } });
      }

      // 5) Solution-scoped releases, outcomes, licenses
      await tx.release.deleteMany({ where: { solutionId: id } });
      await tx.outcome.deleteMany({ where: { solutionId: id } });
      await tx.license.deleteMany({ where: { solutionId: id } });

      // 6) Finally delete the solution
      await tx.solution.delete({ where: { id } });
    });

    console.log(`Solution deleted successfully: ${id}`);
    await logAudit('DELETE_SOLUTION', 'Solution', id, { name: solution?.name }, userId);
    return true;
  }

  /**
   * Add a product to a solution.
   * 
   * Associates a product with a solution at a specific order position.
   * If order is not provided, appends to the end of the list.
   * Uses upsert to handle idempotency.
   * 
   * @param userId - ID of the user performing the operation
   * @param solutionId - Solution to add product to
   * @param productId - Product to add
   * @param order - Optional position in the product list
   * @returns Promise resolving to true on success
   * 
   * @example
   * ```typescript
   * // Add product at end of list
   * await SolutionService.addProductToSolution(userId, solutionId, productId);
   * 
   * // Add product at specific position
   * await SolutionService.addProductToSolution(userId, solutionId, productId, 1);
   * ```
   */
  static async addProductToSolution(
    userId: string,
    solutionId: string,
    productId: string,
    order?: number
  ) {
    let nextOrder = order;

    if (nextOrder === undefined) {
      // Calculate next order number automatically
      const maxOrderProduct = await prisma.solutionProduct.findFirst({
        where: { solutionId },
        orderBy: { order: 'desc' }
      });
      nextOrder = (maxOrderProduct?.order || 0) + 1;
    }

    await prisma.solutionProduct.upsert({
      where: { productId_solutionId: { productId, solutionId } },
      update: { order: nextOrder },
      create: { productId, solutionId, order: nextOrder }
    });

    await logAudit('ADD_PRODUCT_SOLUTION', 'Solution', solutionId, { productId, order: nextOrder }, userId);
    return true;
  }

  /**
   * Remove a product from a solution.
   * 
   * Deletes the product-solution association. Does not delete the product itself.
   * 
   * @param userId - ID of the user performing the operation
   * @param solutionId - Solution to remove product from
   * @param productId - Product to remove
   * @returns Promise resolving to true on success
   */
  static async removeProductFromSolution(userId: string, solutionId: string, productId: string) {
    await prisma.solutionProduct.deleteMany({ where: { solutionId, productId } });
    await logAudit('REMOVE_PRODUCT_SOLUTION', 'Solution', solutionId, { productId }, userId);
    return true;
  }

  /**
   * Reorder products within a solution.
   * 
   * Updates the order of all products in a single transaction to
   * ensure consistency. Useful for drag-and-drop reordering.
   * 
   * @param userId - ID of the user performing the operation
   * @param solutionId - Solution containing the products
   * @param productOrders - Array of product-order mappings
   * @returns Promise resolving to true on success
   * 
   * @example
   * ```typescript
   * await SolutionService.reorderProductsInSolution(userId, solutionId, [
   *   { productId: 'prod1', order: 1 },
   *   { productId: 'prod2', order: 2 },
   *   { productId: 'prod3', order: 3 }
   * ]);
   * ```
   */
  static async reorderProductsInSolution(
    userId: string,
    solutionId: string,
    productOrders: { productId: string; order: number }[]
  ) {
    // Use transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      productOrders.map(({ productId, order }) =>
        prisma.solutionProduct.update({
          where: { productId_solutionId: { productId, solutionId } },
          data: { order }
        })
      )
    );

    await logAudit('REORDER_PRODUCTS_SOLUTION', 'Solution', solutionId, { productOrders }, userId);
    return true;
  }

  /**
   * Calculate progress statistics for a set of tasks.
   * 
   * Computes weighted completion percentages, excluding NOT_APPLICABLE tasks.
   * Handles both raw numbers and Prisma Decimal types for weights.
   * 
   * @param tasks - Array of task objects with status and weight properties
   * @returns Progress statistics including counts and percentages
   * 
   * @internal Used internally for adoption plan progress calculations
   */
  static calculateSolutionTasksProgress(tasks: Array<{
    status: string;
    weight?: number | { toNumber(): number } | null;
  }>): TaskProgressResult {
    // Filter out NOT_APPLICABLE tasks
    const applicableTasks = tasks.filter(t => t.status !== 'NOT_APPLICABLE');

    const totalTasks = applicableTasks.length;
    const completedTasks = applicableTasks.filter(
      t => t.status === 'COMPLETED' || t.status === 'DONE'
    ).length;

    const totalWeight = applicableTasks.reduce((sum, task) => {
      const weight = typeof task.weight === 'object' && task.weight && 'toNumber' in task.weight
        ? task.weight.toNumber()
        : Number(task.weight || 0);
      return sum + weight;
    }, 0);

    const completedWeight = applicableTasks
      .filter(t => t.status === 'COMPLETED' || t.status === 'DONE')
      .reduce((sum, task) => {
        const weight = typeof task.weight === 'object' && task.weight && 'toNumber' in task.weight
          ? task.weight.toNumber()
          : Number(task.weight || 0);
        return sum + weight;
      }, 0);

    const progressPercentage = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      totalWeight,
      completedWeight,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
    };
  }

  /**
   * Recalculate and update progress for a solution adoption plan.
   * 
   * Aggregates progress from:
   * 1. Solution-specific tasks (sourceType === 'SOLUTION')
   * 2. Product adoption plans for products in the solution
   * 
   * Updates the plan record with new progress metrics and returns
   * the updated plan with all relations.
   * 
   * @param userId - ID of the user (for audit, can be undefined)
   * @param solutionAdoptionPlanId - ID of the plan to recalculate
   * @returns Promise resolving to the updated plan or null if not found
   * 
   * @example
   * ```typescript
   * const updatedPlan = await SolutionService.recalculateSolutionAdoptionPlanProgress(
   *   userId,
   *   planId
   * );
   * console.log(`Progress: ${updatedPlan?.progressPercentage}%`);
   * ```
   */
  static async recalculateSolutionAdoptionPlanProgress(
    userId: string | undefined,
    solutionAdoptionPlanId: string
  ) {
    // Fetch plan with tasks and customer solution info
    const plan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true,
        products: true,
        customerSolution: true
      }
    });

    if (!plan) return null;

    // Calculate solution-specific tasks progress
    const solutionSpecificTasks = plan.tasks.filter(
      (t: { sourceType?: string }) => t.sourceType === 'SOLUTION'
    );
    const progress = this.calculateSolutionTasksProgress(solutionSpecificTasks);
    const solutionTasksComplete = solutionSpecificTasks.filter(
      (t: { status: string }) => t.status === 'COMPLETED' || t.status === 'DONE'
    ).length;

    // Calculate aggregated progress: solution tasks + product adoption plans
    let totalTasksWithProducts = progress.totalTasks;
    let completedTasksWithProducts = progress.completedTasks;
    let totalWeightWithProducts = Number(progress.totalWeight);
    let completedWeightWithProducts = Number(progress.completedWeight);

    // Fetch customer products to get product adoption plan progress
    const customerProducts = await prisma.customerProduct.findMany({
      where: {
        customerId: plan.customerSolution.customerId,
        customerSolutionId: plan.customerSolutionId
      },
      include: {
        adoptionPlan: true
      }
    });

    for (const cp of customerProducts) {
      if (cp.adoptionPlan) {
        totalTasksWithProducts += cp.adoptionPlan.totalTasks;
        completedTasksWithProducts += cp.adoptionPlan.completedTasks;
        totalWeightWithProducts += Number(cp.adoptionPlan.totalWeight);
        completedWeightWithProducts += Number(cp.adoptionPlan.completedWeight);
      }
    }

    const overallProgressPercentage = totalWeightWithProducts > 0
      ? (completedWeightWithProducts / totalWeightWithProducts) * 100
      : 0;

    // Update plan progress
    await prisma.solutionAdoptionPlan.update({
      where: { id: solutionAdoptionPlanId },
      data: {
        totalTasks: totalTasksWithProducts,
        completedTasks: completedTasksWithProducts,
        totalWeight: totalWeightWithProducts,
        completedWeight: completedWeightWithProducts,
        progressPercentage: overallProgressPercentage,
        solutionTasksTotal: solutionSpecificTasks.length,
        solutionTasksComplete,
        lastSyncedAt: new Date()
      }
    });

    // Return updated plan with all relations needed for GraphQL
    return prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true,
        products: {
          orderBy: { sequenceNumber: 'asc' }
        },
        customerSolution: {
          include: {
            customer: true,
            solution: true
          }
        }
      }
    });
  }
}
