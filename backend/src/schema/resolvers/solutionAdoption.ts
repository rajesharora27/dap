import { prisma } from '../../context';
import { ensureRole, requireUser } from '../../lib/auth';
import { logAudit } from '../../lib/audit';
import { LicenseLevel, TaskSourceType, SolutionProductStatus } from '@prisma/client';
import { evaluateTelemetryAttribute, evaluateTaskStatusFromTelemetry } from '../../services/telemetry/evaluationEngine';

// Helper function to calculate progress for solution adoption plans
function calculateSolutionProgress(tasks: any[]): {
  totalTasks: number;
  completedTasks: number;
  totalWeight: number;
  completedWeight: number;
  progressPercentage: number;
} {
  // Filter out NOT_APPLICABLE tasks
  const applicableTasks = tasks.filter(t => t.status !== 'NOT_APPLICABLE');

  const totalTasks = applicableTasks.length;
  const completedTasks = applicableTasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE').length;

  const totalWeight = applicableTasks.reduce((sum, task) => {
    const weight = typeof task.weight === 'object' && 'toNumber' in task.weight
      ? task.weight.toNumber()
      : Number(task.weight || 0);
    return sum + weight;
  }, 0);

  const completedWeight = applicableTasks
    .filter(t => t.status === 'COMPLETED' || t.status === 'DONE')
    .reduce((sum, task) => {
      const weight = typeof task.weight === 'object' && 'toNumber' in task.weight
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

// Helper function to evaluate telemetry criteria
function evaluateCriteria(criteria: any, value: any): boolean {
  try {
    if (!criteria || typeof criteria !== 'object') return false;

    const { operator, targetValue, conditions } = criteria;

    // Handle AND/OR logic
    if (conditions && Array.isArray(conditions)) {
      if (operator === 'AND') {
        return conditions.every((cond: any) => evaluateCriteria(cond, value));
      } else if (operator === 'OR') {
        return conditions.some((cond: any) => evaluateCriteria(cond, value));
      }
    }

    if (!operator || targetValue === undefined) return false;

    switch (operator.toUpperCase()) {
      case 'EQUALS':
      case 'EQ':
        return value === targetValue;
      case 'NOT_EQUALS':
      case 'NE':
        return value !== targetValue;
      case 'GREATER_THAN':
      case 'GT':
        return Number(value) > Number(targetValue);
      case 'GREATER_THAN_OR_EQUAL':
      case 'GTE':
        return Number(value) >= Number(targetValue);
      case 'LESS_THAN':
      case 'LT':
        return Number(value) < Number(targetValue);
      case 'LESS_THAN_OR_EQUAL':
      case 'LTE':
        return Number(value) <= Number(targetValue);
      case 'CONTAINS':
        return String(value).includes(String(targetValue));
      case 'IS_TRUE':
        return value === true;
      case 'IS_FALSE':
        return value === false;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// Query Resolvers
export const SolutionAdoptionQueryResolvers = {
  solutionAdoptionPlan: async (_: any, { id }: any, ctx: any) => {
    requireUser(ctx);
    return prisma.solutionAdoptionPlan.findUnique({
      where: { id },
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
            telemetryAttributes: {
              include: {
                values: {
                  orderBy: { createdAt: 'desc' }
                }
              }
            },
            outcomes: true,
            releases: true
          }
        },
        products: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });
  },

  solutionAdoptionPlansForCustomer: async (_: any, { customerId }: any, ctx: any) => {
    requireUser(ctx);
    const customerSolutions = await prisma.customerSolution.findMany({
      where: { customerId },
      include: {
        adoptionPlan: {
          include: {
            customerSolution: {
              include: {
                customer: true,
                solution: true
              }
            },
            tasks: {
              orderBy: { sequenceNumber: 'asc' }
            },
            products: {
              orderBy: { sequenceNumber: 'asc' }
            }
          }
        }
      }
    });

    return customerSolutions
      .map((cs: any) => cs.adoptionPlan)
      .filter((plan: any) => plan !== null);
  },

  customerSolutionTask: async (_: any, { id }: any, ctx: any) => {
    requireUser(ctx);
    return prisma.customerSolutionTask.findUnique({
      where: { id },
      include: {
        solutionAdoptionPlan: true,
        telemetryAttributes: {
          include: {
            values: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        outcomes: {
          include: {
            outcome: true
          }
        },
        releases: {
          include: {
            release: true
          }
        }
      }
    });
  },

  customerSolutionTasksForPlan: async (_: any, { solutionAdoptionPlanId, status }: any, ctx: any) => {
    requireUser(ctx);
    const where: any = { solutionAdoptionPlanId };
    if (status) where.status = status;

    return prisma.customerSolutionTask.findMany({
      where,
      orderBy: { sequenceNumber: 'asc' },
      include: {
        telemetryAttributes: {
          include: {
            values: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        outcomes: {
          include: {
            outcome: true
          }
        },
        releases: {
          include: {
            release: true
          }
        }
      }
    });
  }
};

// Mutation Resolvers
export const SolutionAdoptionMutationResolvers = {
  assignSolutionToCustomer: async (_: any, { input }: any, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'CS', 'CSS']);

    const { customerId, solutionId, name, licenseLevel, selectedOutcomeIds, selectedReleaseIds } = input;

    // Convert GraphQL enum to Prisma enum
    const prismaLicenseLevel = licenseLevel.toUpperCase() as LicenseLevel;

    // Check if assignment already exists
    const existing = await prisma.customerSolution.findUnique({
      where: {
        customerId_solutionId: { customerId, solutionId }
      }
    });

    if (existing) {
      throw new Error('This solution is already assigned to this customer');
    }

    // Get solution with all underlying products
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId },
      include: {
        products: {
          include: {
            product: {
              include: {
                outcomes: true,
                releases: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!solution) {
      throw new Error('Solution not found');
    }

    // Create customer solution assignment
    const customerSolution = await prisma.customerSolution.create({
      data: {
        customerId,
        solutionId,
        name,
        licenseLevel: prismaLicenseLevel,
        selectedOutcomes: selectedOutcomeIds || [],
        selectedReleases: selectedReleaseIds || []
      },
      include: {
        customer: true,
        solution: true
      }
    });

    await logAudit('ASSIGN_SOLUTION_TO_CUSTOMER', 'CustomerSolution', customerSolution.id, { input }, ctx.user?.id);

    // Automatically assign all underlying products to the customer
    const productAssignments = [];
    for (const solutionProduct of solution.products) {
      const product = solutionProduct.product;

      // Check if this product is already assigned to this customer
      const existingProductAssignment = await prisma.customerProduct.findFirst({
        where: {
          customerId,
          productId: product.id,
          name: `${name} - ${solution.name} - ${product.name}` // Format: assignmentName - solutionName - productName
        }
      });

      if (!existingProductAssignment) {
        // Get all outcome and release IDs for this product
        const allProductOutcomeIds = product.outcomes.map((o: any) => o.id);
        const allProductReleaseIds = product.releases.map((r: any) => r.id);

        // Filter based on solution's selected outcomes/releases
        // Only include outcomes/releases that BOTH:
        // 1. Belong to this specific product
        // 2. Are in the solution's selection
        // If solution has empty selection, products will also have empty selection

        let productOutcomeIds: string[] = [];
        let productReleaseIds: string[] = [];

        if (selectedOutcomeIds) {
          // Only include outcomes that are both in the solution's selection AND belong to this product
          productOutcomeIds = allProductOutcomeIds.filter((id: string) =>
            selectedOutcomeIds.includes(id)
          );
        }

        if (selectedReleaseIds) {
          // Only include releases that are both in the solution's selection AND belong to this product
          productReleaseIds = allProductReleaseIds.filter((id: string) =>
            selectedReleaseIds.includes(id)
          );
        }

        const customerProduct = await prisma.customerProduct.create({
          data: {
            customerId,
            productId: product.id,
            name: `${name} - ${solution.name} - ${product.name}`, // Format: assignmentName - solutionName - productName
            licenseLevel: prismaLicenseLevel, // Same license level as solution
            selectedOutcomes: productOutcomeIds,
            selectedReleases: productReleaseIds,
            customerSolutionId: customerSolution.id // Link to parent solution
          }
        });

        productAssignments.push(customerProduct);

        await logAudit('AUTO_ASSIGN_PRODUCT_FROM_SOLUTION', 'CustomerProduct', customerProduct.id, {
          solutionId,
          productId: product.id,
          customerSolutionId: customerSolution.id
        }, ctx.user?.id);
      }
    }

    console.log(`Assigned solution "${name}" to customer with ${productAssignments.length} underlying products`);

    return customerSolution;
  },

  updateCustomerSolution: async (_: any, { id, input }: any, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'CS', 'CSS']);

    const updateData: any = {};
    const oldName = input.name ? (await prisma.customerSolution.findUnique({ where: { id }, select: { name: true } }))?.name : null;

    if (input.name) updateData.name = input.name;
    if (input.licenseLevel) updateData.licenseLevel = input.licenseLevel.toUpperCase();
    if (input.selectedOutcomeIds !== undefined) updateData.selectedOutcomes = input.selectedOutcomeIds;
    if (input.selectedReleaseIds !== undefined) updateData.selectedReleases = input.selectedReleaseIds;

    const customerSolution = await prisma.customerSolution.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        solution: {
          include: {
            products: {
              include: {
                product: {
                  include: {
                    outcomes: true,
                    releases: true
                  }
                }
              }
            }
          }
        }
      }
    });

    await logAudit('UPDATE_CUSTOMER_SOLUTION', 'CustomerSolution', id, { input }, ctx.user?.id);

    // Update all underlying products to match the solution settings
    const underlyingProducts = await prisma.customerProduct.findMany({
      where: { customerSolutionId: id },
      include: {
        product: {
          include: {
            outcomes: true,
            releases: true
          }
        }
      }
    });

    for (const customerProduct of underlyingProducts) {
      const productUpdateData: any = {};

      // Update license level if changed
      if (input.licenseLevel) {
        productUpdateData.licenseLevel = input.licenseLevel.toUpperCase();
      }

      // Update name prefix if solution assignment name changed
      // Format: {assignmentName} - {solutionName} - {productName}
      if (input.name && oldName) {
        // Parse the current product name to extract components
        const nameParts = customerProduct.name.split(' - ');

        if (nameParts.length === 3) {
          // Current format is correct: assignmentName - solutionName - productName
          const [oldAssignmentName, solutionName, productName] = nameParts;
          if (oldAssignmentName === oldName) {
            // Update only the assignment name part
            productUpdateData.name = `${input.name} - ${solutionName} - ${productName}`;
          }
        } else if (nameParts.length === 2) {
          // Legacy format: assignmentName - productName (missing solutionName)
          // Update to new format with solution name included
          const [oldAssignmentName, productName] = nameParts;
          if (oldAssignmentName === oldName) {
            productUpdateData.name = `${input.name} - ${customerSolution.solution.name} - ${productName}`;
          }
        }
      }

      // Update outcomes/releases if changed
      if (input.selectedOutcomeIds !== undefined) {
        // Filter: only include outcomes that BOTH belong to this product AND are in solution's selection
        // If solution has empty selection, products will also have empty selection
        const allProductOutcomeIds = customerProduct.product.outcomes.map((o: any) => o.id);
        productUpdateData.selectedOutcomes = allProductOutcomeIds.filter((id: string) =>
          input.selectedOutcomeIds.includes(id)
        );
      }

      if (input.selectedReleaseIds !== undefined) {
        // Filter: only include releases that BOTH belong to this product AND are in solution's selection
        // If solution has empty selection, products will also have empty selection
        const allProductReleaseIds = customerProduct.product.releases.map((r: any) => r.id);
        productUpdateData.selectedReleases = allProductReleaseIds.filter((id: string) =>
          input.selectedReleaseIds.includes(id)
        );
      }

      if (Object.keys(productUpdateData).length > 0) {
        await prisma.customerProduct.update({
          where: { id: customerProduct.id },
          data: productUpdateData
        });

        await logAudit('UPDATE_PRODUCT_FROM_SOLUTION', 'CustomerProduct', customerProduct.id, {
          customerSolutionId: id,
          updates: productUpdateData
        }, ctx.user?.id);
      }
    }


    // If license level, outcomes, or releases changed, re-sync the solution adoption plan
    // to apply new filters to solution tasks
    if (input.licenseLevel || input.selectedOutcomeIds !== undefined || input.selectedReleaseIds !== undefined) {
      const adoptionPlan = await prisma.solutionAdoptionPlan.findFirst({
        where: { customerSolutionId: id }
      });

      if (adoptionPlan) {
        await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan(
          _,
          { solutionAdoptionPlanId: adoptionPlan.id },
          ctx
        );
      }
    }

    return customerSolution;
  },

  removeSolutionFromCustomerEnhanced: async (_: any, { id }: any, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'CS', 'CSS']);

    try {
      // Get the customer solution with its linked products
      const customerSolution = await prisma.customerSolution.findUnique({
        where: { id },
        include: {
          products: true // Get all linked customer products
        }
      });

      if (!customerSolution) {
        return { success: false, message: 'Customer solution not found' };
      }

      const productCount = customerSolution.products.length;

      // Delete the customer solution
      // This will CASCADE delete all linked products due to the foreign key relationship
      await prisma.customerSolution.delete({ where: { id } });

      await logAudit('REMOVE_SOLUTION_FROM_CUSTOMER', 'CustomerSolution', id, {
        deletedProductsCount: productCount
      }, ctx.user?.id);

      return {
        success: true,
        message: `Solution and ${productCount} associated product(s) removed successfully`
      };
    } catch (error: any) {
      console.error('Error removing solution:', error);
      return { success: false, message: error.message };
    }
  },

  createSolutionAdoptionPlan: async (_: any, { customerSolutionId }: any, ctx: any) => {
    requireUser(ctx);

    // Get customer solution with all related data
    const customerSolution = await prisma.customerSolution.findUnique({
      where: { id: customerSolutionId },
      include: {
        solution: {
          include: {
            products: {
              include: {
                product: {
                  include: {
                    tasks: {
                      where: { deletedAt: null },
                      orderBy: { sequenceNumber: 'asc' },
                      include: {
                        outcomes: {
                          include: { outcome: true }
                        },
                        releases: {
                          include: { release: true }
                        },
                        telemetryAttributes: true
                      }
                    }
                  }
                }
              },
              orderBy: { order: 'asc' }
            },
            tasks: {
              where: { deletedAt: null },
              orderBy: { sequenceNumber: 'asc' },
              include: {
                outcomes: {
                  include: { outcome: true }
                },
                releases: {
                  include: { release: true }
                },
                telemetryAttributes: true
              }
            }
          }
        },
        customer: true
      }
    });

    if (!customerSolution) {
      throw new Error('Customer solution not found');
    }

    // Check if adoption plan already exists
    const existingPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { customerSolutionId }
    });

    if (existingPlan) {
      throw new Error('Adoption plan already exists for this solution assignment');
    }

    const selectedOutcomes = (customerSolution.selectedOutcomes as string[]) || [];
    const selectedReleases = (customerSolution.selectedReleases as string[]) || [];

    // Filter tasks based on license level, outcomes, and releases
    const filterTasks = (tasks: any[]) => {
      return tasks.filter(task => {
        // Filter by license level (hierarchical)
        const licenseMap: { [key: string]: number } = {
          'ESSENTIAL': 1,
          'ADVANTAGE': 2,
          'SIGNATURE': 3
        };
        const customerLevel = licenseMap[customerSolution.licenseLevel];
        const taskLevel = licenseMap[task.licenseLevel];
        if (taskLevel > customerLevel) return false;

        // Filter by outcomes (if any selected)
        if (selectedOutcomes.length > 0) {
          const taskOutcomeIds = task.outcomes.map((to: any) => to.outcome.id);
          const hasMatchingOutcome = taskOutcomeIds.some((id: string) => selectedOutcomes.includes(id));
          if (!hasMatchingOutcome) return false;
        }

        // Filter by releases (if any selected)
        if (selectedReleases.length > 0) {
          const taskReleaseIds = task.releases.map((tr: any) => tr.release.id);
          const hasMatchingRelease = taskReleaseIds.some((id: string) => selectedReleases.includes(id));
          if (!hasMatchingRelease) return false;
        }

        return true;
      });
    };

    // Collect all tasks with their source information
    const allTasksToAdd: any[] = [];
    let globalSequence = 1;

    // Collect product IDs
    const includedProductIds: string[] = [];

    // Collect product IDs only (don't add product tasks to solution adoption plan)
    // Product tasks will be managed in separate AdoptionPlan records
    for (const solutionProduct of customerSolution.solution.products) {
      includedProductIds.push(solutionProduct.product.id);
    }

    // Add ONLY solution tasks (product tasks are handled separately in their own AdoptionPlans)
    const solutionTasks = filterTasks(customerSolution.solution.tasks);
    for (const task of solutionTasks) {
      allTasksToAdd.push({
        originalTaskId: task.id,
        sourceType: 'SOLUTION' as TaskSourceType,
        sourceProductId: null,
        name: task.name,
        description: task.description,
        estMinutes: task.estMinutes,
        weight: task.weight,
        sequenceNumber: globalSequence++,
        howToDoc: task.howToDoc || [],
        howToVideo: task.howToVideo || [],
        notes: task.notes,
        licenseLevel: task.licenseLevel,
        outcomes: task.outcomes,
        releases: task.releases,
        telemetryAttributes: task.telemetryAttributes
      });
    }

    // Calculate initial progress from solution tasks only
    // Product task progress will come from their separate AdoptionPlan records
    const progress = calculateSolutionProgress(allTasksToAdd);
    const solutionTasksCount = allTasksToAdd.length;

    // Create adoption plan with all tasks
    const adoptionPlan = await prisma.solutionAdoptionPlan.create({
      data: {
        customerSolutionId,
        solutionId: customerSolution.solutionId,
        solutionName: customerSolution.solution.name,
        licenseLevel: customerSolution.licenseLevel,
        selectedOutcomes: selectedOutcomes,
        selectedReleases: selectedReleases,
        includedProductIds,
        totalTasks: progress.totalTasks,
        completedTasks: 0,
        totalWeight: progress.totalWeight,
        completedWeight: 0,
        progressPercentage: 0,
        solutionTasksTotal: solutionTasksCount,
        solutionTasksComplete: 0,
        lastSyncedAt: new Date()
      }
    });

    // Create customer tasks
    for (const taskData of allTasksToAdd) {
      const { outcomes, releases, telemetryAttributes, ...taskFields } = taskData;

      const customerTask = await prisma.customerSolutionTask.create({
        data: {
          ...taskFields,
          solutionAdoptionPlanId: adoptionPlan.id
        }
      });

      // Create outcome associations
      if (outcomes && outcomes.length > 0) {
        await prisma.customerTaskOutcome.createMany({
          data: outcomes.map((to: any) => ({
            customerSolutionTaskId: customerTask.id,
            outcomeId: to.outcome.id
          })),
          skipDuplicates: true
        });
      }

      // Create release associations
      if (releases && releases.length > 0) {
        await prisma.customerTaskRelease.createMany({
          data: releases.map((tr: any) => ({
            customerSolutionTaskId: customerTask.id,
            releaseId: tr.release.id
          })),
          skipDuplicates: true
        });
      }

      // Create telemetry attributes
      if (telemetryAttributes && telemetryAttributes.length > 0) {
        await prisma.customerTelemetryAttribute.createMany({
          data: telemetryAttributes.map((attr: any) => ({
            customerSolutionTaskId: customerTask.id,
            originalAttributeId: attr.id,
            name: attr.name,
            description: attr.description,
            dataType: attr.dataType,
            isRequired: attr.isRequired,
            successCriteria: attr.successCriteria,
            order: attr.order,
            isActive: attr.isActive
          }))
        });
      }
    }

    // Create product progress records for tracking (tasks are in separate AdoptionPlans)
    // Preserve the original order from SolutionProduct
    for (const solutionProduct of customerSolution.solution.products) {
      await prisma.solutionAdoptionProduct.create({
        data: {
          solutionAdoptionPlanId: adoptionPlan.id,
          productId: solutionProduct.product.id,
          productName: solutionProduct.product.name || 'Unknown',
          sequenceNumber: solutionProduct.order, // Use original order from SolutionProduct
          status: 'NOT_STARTED',
          totalTasks: 0, // Will be populated from AdoptionPlan during sync
          completedTasks: 0,
          totalWeight: 0, // Will be populated from AdoptionPlan during sync
          completedWeight: 0,
          progressPercentage: 0
        }
      });
    }

    await logAudit('CREATE_SOLUTION_ADOPTION_PLAN', 'SolutionAdoptionPlan', adoptionPlan.id, {
      customerSolutionId,
      totalTasks: progress.totalTasks
    }, ctx.user?.id);

    // Create adoption plans for all underlying products
    // Find customer products that match the solution name pattern
    const customerProducts = await prisma.customerProduct.findMany({
      where: {
        customerId: customerSolution.customerId,
        name: {
          startsWith: `${customerSolution.name} - `
        }
      },
      include: {
        product: {
          include: {
            tasks: {
              where: { deletedAt: null },
              orderBy: { sequenceNumber: 'asc' },
              include: {
                outcomes: { include: { outcome: true } },
                releases: { include: { release: true } },
                telemetryAttributes: true
              }
            }
          }
        },
        adoptionPlan: true
      }
    });

    // Create adoption plan for each product if it doesn't exist
    for (const customerProduct of customerProducts) {
      if (!customerProduct.adoptionPlan) {
        // Import the createAdoptionPlan logic inline (simplified version)
        const selectedOutcomes = (customerProduct.selectedOutcomes as string[]) || [];
        const selectedReleases = (customerProduct.selectedReleases as string[]) || [];

        // Filter tasks by license level, outcomes, releases (same logic as product adoption)
        const filteredTasks = customerProduct.product.tasks.filter((task: any) => {
          // Filter by license level
          const licenseMap: { [key: string]: number } = { 'ESSENTIAL': 1, 'ADVANTAGE': 2, 'SIGNATURE': 3 };
          const customerLevel = licenseMap[customerProduct.licenseLevel];
          const taskLevel = licenseMap[task.licenseLevel];
          if (taskLevel > customerLevel) return false;

          // Filter by outcomes (if any selected)
          if (selectedOutcomes.length > 0) {
            const taskOutcomeIds = task.outcomes.map((to: any) => to.outcome.id);
            const hasMatchingOutcome = taskOutcomeIds.some((id: string) => selectedOutcomes.includes(id));
            if (!hasMatchingOutcome) return false;
          }

          // Filter by releases (if any selected)
          if (selectedReleases.length > 0) {
            const taskReleaseIds = task.releases.map((tr: any) => tr.release.id);
            const hasMatchingRelease = taskReleaseIds.some((id: string) => selectedReleases.includes(id));
            if (!hasMatchingRelease) return false;
          }

          return true;
        });

        const totalWeight = filteredTasks.reduce((sum: number, t: any) => sum + Number(t.weight), 0);

        // Create adoption plan for this product
        const productAdoptionPlan = await prisma.adoptionPlan.create({
          data: {
            customerProductId: customerProduct.id,
            productId: customerProduct.productId,
            productName: customerProduct.product.name,
            licenseLevel: customerProduct.licenseLevel,
            selectedOutcomes: selectedOutcomes,
            selectedReleases: selectedReleases,
            totalTasks: filteredTasks.length,
            completedTasks: 0,
            totalWeight: totalWeight,
            completedWeight: 0,
            progressPercentage: 0,
            lastSyncedAt: new Date()
          }
        });

        // Create customer tasks for this product adoption plan
        for (const task of filteredTasks) {
          const customerTask = await prisma.customerTask.create({
            data: {
              adoptionPlanId: productAdoptionPlan.id,
              originalTaskId: task.id,
              name: task.name,
              description: task.description,
              estMinutes: task.estMinutes,
              weight: task.weight,
              sequenceNumber: task.sequenceNumber,
              howToDoc: task.howToDoc || [],
              howToVideo: task.howToVideo || [],
              notes: task.notes,
              licenseLevel: task.licenseLevel,
              status: 'NOT_STARTED',
              isComplete: false
            }
          });

          // Create outcome associations
          if (task.outcomes && task.outcomes.length > 0) {
            await prisma.customerTaskOutcome.createMany({
              data: task.outcomes.map((to: any) => ({
                customerTaskId: customerTask.id,
                outcomeId: to.outcome.id
              })),
              skipDuplicates: true
            });
          }

          // Create release associations
          if (task.releases && task.releases.length > 0) {
            await prisma.customerTaskRelease.createMany({
              data: task.releases.map((tr: any) => ({
                customerTaskId: customerTask.id,
                releaseId: tr.release.id
              })),
              skipDuplicates: true
            });
          }

          // Create telemetry attributes
          if (task.telemetryAttributes && task.telemetryAttributes.length > 0) {
            await prisma.customerTelemetryAttribute.createMany({
              data: task.telemetryAttributes.map((attr: any) => ({
                customerTaskId: customerTask.id,
                originalAttributeId: attr.id,
                name: attr.name,
                description: attr.description,
                dataType: attr.dataType,
                isRequired: attr.isRequired,
                successCriteria: attr.successCriteria,
                order: attr.order,
                isActive: attr.isActive
              }))
            });
          }
        }

        await logAudit('AUTO_CREATE_PRODUCT_ADOPTION_PLAN', 'AdoptionPlan', productAdoptionPlan.id, {
          customerProductId: customerProduct.id,
          solutionAdoptionPlanId: adoptionPlan.id
        }, ctx.user?.id);

        console.log(`Created adoption plan for product "${customerProduct.product.name}" as part of solution adoption plan`);
      }
    }

    // STEP: Aggregate product adoption plan progress into solution adoption plan
    // Re-fetch customer products with their newly created adoption plans
    const customerProductsWithPlans = await prisma.customerProduct.findMany({
      where: {
        customerId: customerSolution.customerId,
        name: {
          startsWith: `${customerSolution.name} - `
        }
      },
      include: {
        adoptionPlan: {
          include: {
            tasks: true
          }
        }
      }
    });

    // Calculate aggregated totals: solution tasks + product tasks
    let totalTasksWithProducts = progress.totalTasks; // Solution tasks
    let totalWeightWithProducts = Number(progress.totalWeight); // Solution weight

    for (const cp of customerProductsWithPlans) {
      if (cp.adoptionPlan) {
        totalTasksWithProducts += cp.adoptionPlan.totalTasks;
        totalWeightWithProducts += Number(cp.adoptionPlan.totalWeight);
      }
    }

    // Update solution adoption plan with aggregated totals
    await prisma.solutionAdoptionPlan.update({
      where: { id: adoptionPlan.id },
      data: {
        totalTasks: totalTasksWithProducts,
        totalWeight: totalWeightWithProducts
      }
    });

    // Update SolutionAdoptionProduct records with actual product adoption plan data
    for (const cp of customerProductsWithPlans) {
      if (cp.adoptionPlan) {
        const solutionProduct = await prisma.solutionAdoptionProduct.findFirst({
          where: {
            solutionAdoptionPlanId: adoptionPlan.id,
            productId: cp.productId
          }
        });

        if (solutionProduct) {
          await prisma.solutionAdoptionProduct.update({
            where: { id: solutionProduct.id },
            data: {
              totalTasks: cp.adoptionPlan.totalTasks,
              totalWeight: Number(cp.adoptionPlan.totalWeight),
              status: cp.adoptionPlan.totalTasks > 0 ? 'NOT_STARTED' : 'NOT_STARTED'
            }
          });
        }
      }
    }

    console.log(`Solution adoption plan created with ${progress.totalTasks} solution tasks + ${totalTasksWithProducts - progress.totalTasks} product tasks = ${totalTasksWithProducts} total tasks`);

    return prisma.solutionAdoptionPlan.findUnique({
      where: { id: adoptionPlan.id },
      include: {
        customerSolution: {
          include: {
            customer: true,
            solution: true
          }
        },
        tasks: {
          orderBy: { sequenceNumber: 'asc' }
        },
        products: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });
  },

  // Sync only the underlying product definitions
  syncSolutionProducts: async (_: any, { solutionAdoptionPlanId }: any, ctx: any) => {
    console.log(`=== syncSolutionProducts START: ${solutionAdoptionPlanId} ===`);

    try {
      requireUser(ctx);

      const plan = await prisma.solutionAdoptionPlan.findUnique({
        where: { id: solutionAdoptionPlanId },
        include: {
          tasks: true,
          products: true,
          customerSolution: true
        }
      });

      if (!plan) {
        throw new Error('Solution adoption plan not found');
      }

      console.log(`syncSolutionProducts: Found plan, customerSolutionId=${plan.customerSolutionId}`);

      // Sync all underlying product adoption plans - use customerSolutionId relationship
      const customerProducts = await prisma.customerProduct.findMany({
        where: {
          customerSolutionId: plan.customerSolutionId  // Use proper relationship instead of name matching
        },
        include: {
          product: true,
          adoptionPlan: {
            include: {
              tasks: true
            }
          }
        }
      });

      console.log(`syncSolutionProducts: Found ${customerProducts.length} customer products`);

      const { CustomerAdoptionMutationResolvers } = require('./customerAdoption');
      const syncResults: { productId: string; productName: string; synced: boolean; error?: string }[] = [];

      for (const cp of customerProducts) {
        if (cp.adoptionPlan) {
          try {
            await CustomerAdoptionMutationResolvers.syncAdoptionPlan(
              _,
              { adoptionPlanId: cp.adoptionPlan.id },
              ctx
            );
            syncResults.push({
              productId: cp.productId,
              productName: cp.name,
              synced: true
            });
          } catch (error: any) {
            console.error(`Failed to sync product adoption plan for ${cp.name}:`, error.message);
            syncResults.push({
              productId: cp.productId,
              productName: cp.name,
              synced: false,
              error: error.message
            });
          }
        }
      }

      // Recalculate overall progress
      // Re-fetch tasks after updates
      const updatedPlanWithTasks = await prisma.solutionAdoptionPlan.findUnique({
        where: { id: solutionAdoptionPlanId },
        include: {
          tasks: true,
          products: true
        }
      });

      if (updatedPlanWithTasks) {
        const solutionSpecificTasks = updatedPlanWithTasks.tasks.filter((t: any) => t.sourceType === 'SOLUTION');
        const progress = calculateSolutionProgress(solutionSpecificTasks);
        const solutionTasksComplete = solutionSpecificTasks.filter(
          (t: any) => (t.status === 'COMPLETED' || t.status === 'DONE')
        ).length;

        // Calculate aggregated progress: solution tasks + synced product adoption plans
        let totalTasksWithProducts = progress.totalTasks;
        let completedTasksWithProducts = progress.completedTasks;
        let totalWeightWithProducts = Number(progress.totalWeight);
        let completedWeightWithProducts = Number(progress.completedWeight);

        // Re-fetch updated customer products to get latest progress
        const updatedCustomerProducts = await prisma.customerProduct.findMany({
          where: {
            customerId: plan.customerSolution.customerId,
            name: {
              startsWith: `${plan.customerSolution.name} - `
            }
          },
          include: {
            adoptionPlan: true
          }
        });

        for (const cp of updatedCustomerProducts) {
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
      }

      // Fetch final updated plan
      const finalPlan = await prisma.solutionAdoptionPlan.findUnique({
        where: { id: solutionAdoptionPlanId },
        include: {
          tasks: true,
          products: true,
          customerSolution: {
            include: {
              customer: true,
              solution: true
            }
          }
        }
      });

      console.log(`syncSolutionProducts completed: synced ${syncResults.filter(r => r.synced).length}/${syncResults.length} products`);

      if (!finalPlan) {
        throw new Error('Failed to fetch solution adoption plan after sync');
      }

      return finalPlan;
    } catch (error: any) {
      console.error(`=== syncSolutionProducts ERROR: ${error.message} ===`);
      console.error(error.stack);
      throw error;
    }
  },

  // Sync only the solution-specific definition
  syncSolutionDefinition: async (_: any, { solutionAdoptionPlanId }: any, ctx: any) => {
    requireUser(ctx);

    const plan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true,
        products: true,
        customerSolution: true
      }
    });

    if (!plan) {
      throw new Error('Solution adoption plan not found');
    }

    // Re-filter solution tasks based on current license level, outcomes, and releases
    const customerSolutionFull = await prisma.customerSolution.findUnique({
      where: { id: plan.customerSolutionId },
      include: {
        solution: {
          include: {
            tasks: {
              where: { deletedAt: null },
              include: {
                outcomes: {
                  include: {
                    outcome: true
                  }
                },
                releases: {
                  include: {
                    release: true
                  }
                },
                telemetryAttributes: true
              },
              orderBy: { sequenceNumber: 'asc' }
            }
          }
        }
      }
    });

    if (customerSolutionFull && customerSolutionFull.solution.tasks.length > 0) {
      const selectedOutcomes = (customerSolutionFull.selectedOutcomes as string[]) || [];
      const selectedReleases = (customerSolutionFull.selectedReleases as string[]) || [];

      // Filter tasks based on license level, outcomes, and releases
      const filterTasks = (tasks: any[]) => {
        return tasks.filter(task => {
          // Filter by license level (hierarchical)
          const licenseMap: { [key: string]: number } = {
            'ESSENTIAL': 1,
            'ADVANTAGE': 2,
            'SIGNATURE': 3
          };
          const customerLevel = licenseMap[customerSolutionFull.licenseLevel];
          const taskLevel = licenseMap[task.licenseLevel];
          if (taskLevel > customerLevel) return false;

          // Filter by outcomes (if any selected)
          if (selectedOutcomes.length > 0) {
            const taskOutcomeIds = task.outcomes.map((to: any) => to.outcome.id);
            const hasMatchingOutcome = taskOutcomeIds.some((id: string) => selectedOutcomes.includes(id));
            if (!hasMatchingOutcome) return false;
          }

          // Filter by releases (if any selected)
          if (selectedReleases.length > 0) {
            const taskReleaseIds = task.releases.map((tr: any) => tr.release.id);
            const hasMatchingRelease = taskReleaseIds.some((id: string) => selectedReleases.includes(id));
            if (!hasMatchingRelease) return false;
          }

          return true;
        });
      };

      const eligibleSolutionTasks = filterTasks(customerSolutionFull.solution.tasks);
      const existingTaskMap = new Map(plan.tasks.map((t: any) => [t.originalTaskId, t]));

      // Mark tasks as NOT_APPLICABLE if they no longer match criteria
      for (const existingTask of plan.tasks.filter((t: any) => t.sourceType === 'SOLUTION')) {
        const originalTask = customerSolutionFull.solution.tasks.find((t: any) => t.id === existingTask.originalTaskId);
        if (originalTask) {
          const isEligible = eligibleSolutionTasks.some((t: any) => t.id === existingTask.originalTaskId);
          if (!isEligible && existingTask.status !== 'NOT_APPLICABLE') {
            await prisma.customerSolutionTask.update({
              where: { id: existingTask.id },
              data: { status: 'NOT_APPLICABLE' }
            });
          } else if (isEligible && existingTask.status === 'NOT_APPLICABLE') {
            // Re-enable task if it now matches criteria
            await prisma.customerSolutionTask.update({
              where: { id: existingTask.id },
              data: { status: 'NOT_STARTED' }
            });
          }
        }
      }

      // Add new tasks that are now eligible
      let maxSequence = Math.max(...plan.tasks.map((t: any) => t.sequenceNumber), 0);
      for (const solutionTask of eligibleSolutionTasks) {
        if (!existingTaskMap.has(solutionTask.id)) {
          maxSequence++;
          const customerTask = await prisma.customerSolutionTask.create({
            data: {
              solutionAdoptionPlanId: plan.id,
              originalTaskId: solutionTask.id,
              sourceType: 'SOLUTION',
              sourceProductId: null,
              name: solutionTask.name,
              description: solutionTask.description,
              notes: solutionTask.notes,
              sequenceNumber: maxSequence,
              estMinutes: solutionTask.estMinutes || 0,
              weight: solutionTask.weight,
              licenseLevel: solutionTask.licenseLevel,
              status: 'NOT_STARTED',
              howToDoc: solutionTask.howToDoc || [],
              howToVideo: solutionTask.howToVideo || []
            }
          });

          // Create outcome associations
          if (solutionTask.outcomes && solutionTask.outcomes.length > 0) {
            await prisma.customerTaskOutcome.createMany({
              data: solutionTask.outcomes.map((to: any) => ({
                customerSolutionTaskId: customerTask.id,
                outcomeId: to.outcome.id
              })),
              skipDuplicates: true
            });
          }

          // Create release associations
          if (solutionTask.releases && solutionTask.releases.length > 0) {
            await prisma.customerTaskRelease.createMany({
              data: solutionTask.releases.map((tr: any) => ({
                customerSolutionTaskId: customerTask.id,
                releaseId: tr.release.id
              })),
              skipDuplicates: true
            });
          }

          // Create telemetry attributes
          if (solutionTask.telemetryAttributes && solutionTask.telemetryAttributes.length > 0) {
            await prisma.customerTelemetryAttribute.createMany({
              data: solutionTask.telemetryAttributes.map((attr: any) => ({
                customerSolutionTaskId: customerTask.id,
                originalAttributeId: attr.id,
                name: attr.name,
                description: attr.description,
                dataType: attr.dataType,
                isRequired: attr.isRequired,
                successCriteria: attr.successCriteria,
                order: attr.order,
                isActive: attr.isActive
              }))
            });
          }
        }
      }
    }

    // Recalculate overall progress
    // Re-fetch tasks after updates
    const updatedPlanWithTasks = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true,
        products: true
      }
    });

    if (updatedPlanWithTasks) {
      const solutionSpecificTasks = updatedPlanWithTasks.tasks.filter((t: any) => t.sourceType === 'SOLUTION');
      const progress = calculateSolutionProgress(solutionSpecificTasks);
      const solutionTasksComplete = solutionSpecificTasks.filter(
        (t: any) => (t.status === 'COMPLETED' || t.status === 'DONE')
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
          name: {
            startsWith: `${plan.customerSolution.name} - `
          }
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
    }

    // Fetch final updated plan
    const finalPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true,
        products: true,
        customerSolution: {
          include: {
            customer: true,
            solution: true
          }
        }
      }
    });

    return finalPlan!;
  },

  syncSolutionAdoptionPlan: async (_: any, { solutionAdoptionPlanId }: any, ctx: any) => {
    requireUser(ctx);

    // Get adoption plan with all tasks and customer solution info
    const plan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true,
        products: true,
        customerSolution: true
      }
    });

    if (!plan) {
      throw new Error('Solution adoption plan not found');
    }

    // STEP 1: First, sync all underlying product adoption plans
    // Get underlying product adoption plans using customerSolutionId relationship
    const customerProducts = await prisma.customerProduct.findMany({
      where: {
        customerSolutionId: plan.customerSolutionId  // Use proper relationship instead of name matching
      },
      include: {
        product: true,
        adoptionPlan: {
          include: {
            tasks: true
          }
        }
      }
    });

    console.log(`syncSolutionAdoptionPlan STEP 1: Found ${customerProducts.length} products linked to solution`);

    // Sync each product adoption plan to ensure they reflect latest product changes
    const { CustomerAdoptionMutationResolvers } = require('./customerAdoption');
    const syncResults: { productId: string; productName: string; synced: boolean; error?: string }[] = [];

    for (const cp of customerProducts) {
      if (cp.adoptionPlan) {
        try {
          await CustomerAdoptionMutationResolvers.syncAdoptionPlan(
            _,
            { adoptionPlanId: cp.adoptionPlan.id },
            ctx
          );
          syncResults.push({
            productId: cp.productId,
            productName: cp.name,
            synced: true
          });
        } catch (error: any) {
          console.error(`Failed to sync product adoption plan for ${cp.name}:`, error.message);
          syncResults.push({
            productId: cp.productId,
            productName: cp.name,
            synced: false,
            error: error.message
          });
        }
      }
    }

    // STEP 2: Re-fetch customer products with updated adoption plans after sync
    const updatedCustomerProducts = await prisma.customerProduct.findMany({
      where: {
        customerSolutionId: plan.customerSolutionId  // Use proper relationship
      },
      include: {
        product: true,
        adoptionPlan: {
          include: {
            tasks: true
          }
        }
      }
    });

    console.log(`syncSolutionAdoptionPlan STEP 2: Re-fetched ${updatedCustomerProducts.length} products after sync`);

    // STEP 2.5: Re-filter solution tasks and sync with latest solution definition
    // Get the full customer solution with solution tasks
    const customerSolutionFull = await prisma.customerSolution.findUnique({
      where: { id: plan.customerSolutionId },
      include: {
        solution: {
          include: {
            tasks: {
              where: { deletedAt: null },
              include: {
                outcomes: {
                  include: {
                    outcome: true
                  }
                },
                releases: {
                  include: {
                    release: true
                  }
                },
                telemetryAttributes: true
              },
              orderBy: { sequenceNumber: 'asc' }
            },
            outcomes: true,
            releases: true
          }
        }
      }
    });

    if (customerSolutionFull) {
      // Get valid solution outcomes and releases
      const validSolutionOutcomeIds = customerSolutionFull.solution.outcomes?.map((o: any) => o.id) || [];
      const validSolutionReleaseIds = customerSolutionFull.solution.releases?.map((r: any) => r.id) || [];

      // Clean up invalid selections (deleted outcomes/releases)
      const originalSelectedOutcomes = (customerSolutionFull.selectedOutcomes as string[]) || [];
      const originalSelectedReleases = (customerSolutionFull.selectedReleases as string[]) || [];

      const selectedOutcomes = originalSelectedOutcomes.filter((id: string) => validSolutionOutcomeIds.includes(id));
      const selectedReleases = originalSelectedReleases.filter((id: string) => validSolutionReleaseIds.includes(id));

      // Update customer solution if selections changed
      if (selectedOutcomes.length !== originalSelectedOutcomes.length ||
        selectedReleases.length !== originalSelectedReleases.length) {
        await prisma.customerSolution.update({
          where: { id: customerSolutionFull.id },
          data: {
            selectedOutcomes: selectedOutcomes,
            selectedReleases: selectedReleases,
          },
        });
        console.log(`Cleaned up customer solution: removed ${originalSelectedOutcomes.length - selectedOutcomes.length} invalid outcomes, ${originalSelectedReleases.length - selectedReleases.length} invalid releases`);
      }

      // Filter tasks based on license level, outcomes, and releases
      const filterTasks = (tasks: any[]) => {
        return tasks.filter(task => {
          // Filter by license level (hierarchical)
          const licenseMap: { [key: string]: number } = {
            'ESSENTIAL': 1,
            'ADVANTAGE': 2,
            'SIGNATURE': 3
          };
          const customerLevel = licenseMap[customerSolutionFull.licenseLevel];
          const taskLevel = licenseMap[task.licenseLevel];
          if (taskLevel > customerLevel) return false;

          // Filter by outcomes (if any selected)
          if (selectedOutcomes.length > 0) {
            const taskOutcomeIds = task.outcomes.map((to: any) => to.outcome.id);
            const hasMatchingOutcome = taskOutcomeIds.some((id: string) => selectedOutcomes.includes(id));
            if (!hasMatchingOutcome) return false;
          }

          // Filter by releases (if any selected)
          if (selectedReleases.length > 0) {
            const taskReleaseIds = task.releases.map((tr: any) => tr.release.id);
            const hasMatchingRelease = taskReleaseIds.some((id: string) => selectedReleases.includes(id));
            if (!hasMatchingRelease) return false;
          }

          return true;
        });
      };

      const eligibleSolutionTasks = filterTasks(customerSolutionFull.solution.tasks);
      const existingTaskMap = new Map(plan.tasks.map((t: any) => [t.originalTaskId, t]));

      // Update existing solution tasks with any changes from the solution definition
      for (const existingTask of plan.tasks.filter((t: any) => t.sourceType === 'SOLUTION')) {
        const originalTask = customerSolutionFull.solution.tasks.find((t: any) => t.id === existingTask.originalTaskId);
        if (originalTask) {
          const isEligible = eligibleSolutionTasks.some((t: any) => t.id === existingTask.originalTaskId);

          if (!isEligible && existingTask.status !== 'NOT_APPLICABLE') {
            // Mark as not applicable if no longer eligible
            await prisma.customerSolutionTask.update({
              where: { id: existingTask.id },
              data: { status: 'NOT_APPLICABLE' }
            });
          } else if (isEligible) {
            // Update task with any changes from the solution definition
            const hasChanges =
              existingTask.name !== originalTask.name ||
              existingTask.description !== originalTask.description ||
              existingTask.estMinutes !== (originalTask.estMinutes || 0) ||
              Number(existingTask.weight) !== Number(originalTask.weight) ||
              existingTask.licenseLevel !== originalTask.licenseLevel ||
              JSON.stringify(existingTask.howToDoc) !== JSON.stringify(originalTask.howToDoc || []) ||
              JSON.stringify(existingTask.howToVideo) !== JSON.stringify(originalTask.howToVideo || []) ||
              existingTask.notes !== originalTask.notes;

            if (hasChanges || existingTask.status === 'NOT_APPLICABLE') {
              await prisma.customerSolutionTask.update({
                where: { id: existingTask.id },
                data: {
                  name: originalTask.name,
                  description: originalTask.description,
                  estMinutes: originalTask.estMinutes || 0,
                  weight: originalTask.weight,
                  licenseLevel: originalTask.licenseLevel,
                  howToDoc: originalTask.howToDoc || [],
                  howToVideo: originalTask.howToVideo || [],
                  notes: originalTask.notes,
                  // Re-enable if it was NOT_APPLICABLE but now eligible
                  ...(existingTask.status === 'NOT_APPLICABLE' ? { status: 'NOT_STARTED' } : {})
                }
              });

            }

            // Sync telemetry attributes for existing task
            const originalAttrIds = originalTask.telemetryAttributes?.map((a: any) => a.id) || [];

            // Delete attributes that are no longer present
            await prisma.customerTelemetryAttribute.deleteMany({
              where: {
                customerSolutionTaskId: existingTask.id,
                originalAttributeId: { notIn: originalAttrIds }
              }
            });

            // Update or create attributes
            if (originalTask.telemetryAttributes) {
              for (const attr of originalTask.telemetryAttributes) {
                const existingAttr = await prisma.customerTelemetryAttribute.findFirst({
                  where: {
                    customerSolutionTaskId: existingTask.id,
                    originalAttributeId: attr.id
                  }
                });

                if (existingAttr) {
                  await prisma.customerTelemetryAttribute.update({
                    where: { id: existingAttr.id },
                    data: {
                      name: attr.name,
                      description: attr.description,
                      dataType: attr.dataType,
                      isRequired: attr.isRequired,
                      successCriteria: attr.successCriteria,
                      order: attr.order,
                      isActive: attr.isActive
                    }
                  });
                } else {
                  await prisma.customerTelemetryAttribute.create({
                    data: {
                      customerSolutionTaskId: existingTask.id,
                      originalAttributeId: attr.id,
                      name: attr.name,
                      description: attr.description,
                      dataType: attr.dataType,
                      isRequired: attr.isRequired,
                      successCriteria: attr.successCriteria,
                      order: attr.order,
                      isActive: attr.isActive
                    }
                  });
                }
              }
            }
          }
        } else {
          // Original task was deleted - remove customer task
          await prisma.customerSolutionTask.delete({
            where: { id: existingTask.id }
          });
        }
      }

      // Add new tasks that are now eligible
      let maxSequence = plan.tasks.length > 0
        ? Math.max(...plan.tasks.map((t: any) => t.sequenceNumber))
        : 0;
      for (const solutionTask of eligibleSolutionTasks) {
        if (!existingTaskMap.has(solutionTask.id)) {
          maxSequence++;
          const customerTask = await prisma.customerSolutionTask.create({
            data: {
              solutionAdoptionPlanId: plan.id,
              originalTaskId: solutionTask.id,
              sourceType: 'SOLUTION',
              sourceProductId: null,
              name: solutionTask.name,
              description: solutionTask.description,
              notes: solutionTask.notes,
              sequenceNumber: maxSequence,
              estMinutes: solutionTask.estMinutes || 0,
              weight: solutionTask.weight,
              licenseLevel: solutionTask.licenseLevel,
              status: 'NOT_STARTED',
              howToDoc: solutionTask.howToDoc || [],
              howToVideo: solutionTask.howToVideo || []
            }
          });

          // Create outcome associations
          if (solutionTask.outcomes && solutionTask.outcomes.length > 0) {
            await prisma.customerTaskOutcome.createMany({
              data: solutionTask.outcomes.map((to: any) => ({
                customerSolutionTaskId: customerTask.id,
                outcomeId: to.outcome.id
              })),
              skipDuplicates: true
            });
          }

          // Create release associations
          if (solutionTask.releases && solutionTask.releases.length > 0) {
            await prisma.customerTaskRelease.createMany({
              data: solutionTask.releases.map((tr: any) => ({
                customerSolutionTaskId: customerTask.id,
                releaseId: tr.release.id
              })),
              skipDuplicates: true
            });
          }

          // Create telemetry attributes
          if (solutionTask.telemetryAttributes && solutionTask.telemetryAttributes.length > 0) {
            await prisma.customerTelemetryAttribute.createMany({
              data: solutionTask.telemetryAttributes.map((attr: any) => ({
                customerSolutionTaskId: customerTask.id,
                originalAttributeId: attr.id,
                name: attr.name,
                description: attr.description,
                dataType: attr.dataType,
                isRequired: attr.isRequired,
                successCriteria: attr.successCriteria,
                order: attr.order,
                isActive: attr.isActive
              }))
            });
          }
        }
      }
    }

    // STEP 3: Calculate progress from solution-specific tasks
    // Re-fetch tasks after updates
    const updatedPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true
      }
    });

    const solutionSpecificTasks = updatedPlan!.tasks.filter((t: any) => t.sourceType === 'SOLUTION');
    const progress = calculateSolutionProgress(solutionSpecificTasks);
    const solutionTasksComplete = solutionSpecificTasks.filter(
      (t: any) => (t.status === 'COMPLETED' || t.status === 'DONE')
    ).length;

    // STEP 4: Calculate aggregated progress: solution tasks + synced product adoption plans
    let totalTasksWithProducts = progress.totalTasks; // Solution tasks only
    let completedTasksWithProducts = progress.completedTasks; // Solution tasks only
    let totalWeightWithProducts = Number(progress.totalWeight); // Solution tasks only
    let completedWeightWithProducts = Number(progress.completedWeight); // Solution tasks only

    // Use the updated customer products (post-sync)
    for (const cp of updatedCustomerProducts) {
      if (cp.adoptionPlan) {
        totalTasksWithProducts += cp.adoptionPlan.totalTasks;
        completedTasksWithProducts += cp.adoptionPlan.completedTasks;
        totalWeightWithProducts += Number(cp.adoptionPlan.totalWeight);
        completedWeightWithProducts += Number(cp.adoptionPlan.completedWeight);
      }
    }

    // Calculate overall progress percentage
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
        solutionName: customerSolutionFull?.solution.name,
        licenseLevel: customerSolutionFull?.licenseLevel,
        lastSyncedAt: new Date()
      }
    });

    // STEP 5: Update product order and progress tracking in SolutionAdoptionProduct
    // Fetch current product order from Solution
    const solution = await prisma.solution.findUnique({
      where: { id: plan.solutionId },
      include: {
        products: {
          orderBy: { order: 'asc' }
        }
      }
    });

    // Create a map of productId -> order from the solution
    const productOrderMap = new Map<string, number>();
    if (solution) {
      solution.products.forEach((sp: any) => {
        productOrderMap.set(sp.productId, sp.order);
      });
    }

    // Update each SolutionAdoptionProduct with current order and progress
    for (const product of plan.products) {
      // Find the corresponding CustomerProduct adoption plan (use updated data)
      const customerProduct = updatedCustomerProducts.find((cp: any) => cp.productId === product.productId);

      let finalTotalTasks = 0;
      let finalCompletedTasks = 0;
      let finalTotalWeight = 0;
      let finalCompletedWeight = 0;

      // Use product adoption plan progress if it exists
      if (customerProduct?.adoptionPlan) {
        finalTotalTasks = customerProduct.adoptionPlan.totalTasks;
        finalCompletedTasks = customerProduct.adoptionPlan.completedTasks;
        finalTotalWeight = Number(customerProduct.adoptionPlan.totalWeight);
        finalCompletedWeight = Number(customerProduct.adoptionPlan.completedWeight);
      }

      const finalProgressPercentage = finalTotalWeight > 0
        ? (finalCompletedWeight / finalTotalWeight) * 100
        : 0;

      const newStatus = finalCompletedTasks === 0
        ? 'NOT_STARTED'
        : finalCompletedTasks === finalTotalTasks
          ? 'COMPLETED'
          : 'IN_PROGRESS';

      // Get the current order from the solution (if it changed)
      const currentOrder = productOrderMap.get(product.productId) || product.sequenceNumber;

      await prisma.solutionAdoptionProduct.update({
        where: { id: product.id },
        data: {
          sequenceNumber: currentOrder, // ✅ Update order from solution
          totalTasks: finalTotalTasks,
          completedTasks: finalCompletedTasks,
          totalWeight: finalTotalWeight,
          completedWeight: finalCompletedWeight,
          progressPercentage: finalProgressPercentage,
          status: newStatus as SolutionProductStatus
        }
      });
    }

    await logAudit('SYNC_SOLUTION_ADOPTION_PLAN', 'SolutionAdoptionPlan', solutionAdoptionPlanId, {
      productsSynced: syncResults.filter(r => r.synced).length,
      productsTotal: syncResults.length,
      syncResults
    }, ctx.user?.id);

    return prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        customerSolution: {
          include: {
            customer: true,
            solution: true
          }
        },
        tasks: {
          orderBy: { sequenceNumber: 'asc' }
        },
        products: {
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });
  },

  updateCustomerSolutionTaskStatus: async (_: any, { input }: any, ctx: any) => {
    requireUser(ctx);

    const { customerSolutionTaskId, status, notes, updateSource } = input;

    const customerTask = await prisma.customerSolutionTask.update({
      where: { id: customerSolutionTaskId },
      data: {
        status: status.toUpperCase(),
        statusNotes: notes,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: ctx.user?.id,
        statusUpdateSource: updateSource || 'MANUAL',
        isComplete: status === 'COMPLETED' || status === 'DONE',
        completedAt: (status === 'COMPLETED' || status === 'DONE') ? new Date() : null,
        completedBy: (status === 'COMPLETED' || status === 'DONE') ? ctx.user?.id : null
      },
      include: {
        solutionAdoptionPlan: true
      }
    });

    // Trigger progress recalculation
    await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan(
      _,
      { solutionAdoptionPlanId: customerTask.solutionAdoptionPlanId },
      ctx
    );

    await logAudit('UPDATE_SOLUTION_TASK_STATUS', 'CustomerSolutionTask', customerSolutionTaskId, { input }, ctx.user?.id);

    return prisma.customerSolutionTask.findUnique({
      where: { id: customerSolutionTaskId },
      include: {
        telemetryAttributes: {
          include: {
            values: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        outcomes: {
          include: { outcome: true }
        },
        releases: {
          include: { release: true }
        }
      }
    });
  },

  bulkUpdateCustomerSolutionTaskStatus: async (_: any, { solutionAdoptionPlanId, taskIds, status, notes }: any, ctx: any) => {
    requireUser(ctx);

    const updates = await Promise.all(
      taskIds.map((taskId: string) =>
        prisma.customerSolutionTask.update({
          where: { id: taskId },
          data: {
            status: status.toUpperCase(),
            statusNotes: notes,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: ctx.user?.id,
            statusUpdateSource: 'MANUAL',
            isComplete: status === 'COMPLETED' || status === 'DONE',
            completedAt: (status === 'COMPLETED' || status === 'DONE') ? new Date() : null,
            completedBy: (status === 'COMPLETED' || status === 'DONE') ? ctx.user?.id : null
          }
        })
      )
    );

    // Trigger progress recalculation
    await SolutionAdoptionMutationResolvers.syncSolutionAdoptionPlan(
      _,
      { solutionAdoptionPlanId },
      ctx
    );

    await logAudit('BULK_UPDATE_SOLUTION_TASK_STATUS', 'CustomerSolutionTask', undefined, {
      solutionAdoptionPlanId,
      taskIds,
      status
    }, ctx.user?.id);

    return updates;
  },

  evaluateSolutionTaskTelemetry: async (_: any, { customerSolutionTaskId }: any, ctx: any) => {
    requireUser(ctx);

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



  // Export telemetry template for solution adoption plan
  exportSolutionAdoptionPlanTelemetryTemplate: async (_: any, { solutionAdoptionPlanId }: { solutionAdoptionPlanId: string }, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'CS', 'CSS']);

    // Use the customer telemetry export service with solution-specific queries
    const { CustomerTelemetryExportService } = require('../../services/telemetry/CustomerTelemetryExportService');

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
    const path = require('path');
    const fs = require('fs');
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

  // Import telemetry data for solution adoption plan
  importSolutionAdoptionPlanTelemetry: async (_: any, { solutionAdoptionPlanId, file }: { solutionAdoptionPlanId: string; file: any }, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'CS', 'CSS']);

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
    const { CustomerTelemetryImportService } = require('../../services/telemetry/CustomerTelemetryImportService');
    const result = await CustomerTelemetryImportService.importSolutionTelemetryValues(solutionAdoptionPlanId, fileBuffer);



    await logAudit('IMPORT_SOLUTION_TELEMETRY_DATA', 'SolutionAdoptionPlan', solutionAdoptionPlanId, result.summary, ctx.user?.id);

    return result;
  },

  // Product management mutations
  addProductToSolutionEnhanced: async (_: any, { solutionId, productId, order }: any, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'SME']);

    // Get max order if not provided
    let effectiveOrder = order;
    if (!effectiveOrder) {
      const maxOrderProduct = await prisma.solutionProduct.findFirst({
        where: { solutionId },
        orderBy: { order: 'desc' }
      });
      effectiveOrder = (maxOrderProduct?.order || 0) + 1;
    }

    await prisma.solutionProduct.upsert({
      where: {
        productId_solutionId: { productId, solutionId }
      },
      update: { order: effectiveOrder },
      create: { productId, solutionId, order: effectiveOrder }
    });

    await logAudit('ADD_PRODUCT_TO_SOLUTION', 'Solution', solutionId, { productId, order: effectiveOrder }, ctx.user?.id);
    return true;
  },

  removeProductFromSolutionEnhanced: async (_: any, { solutionId, productId }: any, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'SME']);

    await prisma.solutionProduct.deleteMany({
      where: { solutionId, productId }
    });

    await logAudit('REMOVE_PRODUCT_FROM_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id);
    return true;
  },

  reorderProductsInSolution: async (_: any, { solutionId, productOrders }: any, ctx: any) => {
    ensureRole(ctx, ['ADMIN', 'SME']);

    // Update each product's order
    for (const { productId, order } of productOrders) {
      await prisma.solutionProduct.update({
        where: {
          productId_solutionId: { productId, solutionId }
        },
        data: { order }
      });
    }

    await logAudit('REORDER_PRODUCTS_IN_SOLUTION', 'Solution', solutionId, { productOrders }, ctx.user?.id);
    return true;
  },

  migrateProductNamesToNewFormat: async (_: any, args: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');

    // Get all customer products that are part of a solution
    const customerProducts = await prisma.customerProduct.findMany({
      where: {
        customerSolutionId: { not: null }
      },
      include: {
        product: true,
        customerSolution: {
          include: {
            solution: true
          }
        }
      }
    });

    let migratedCount = 0;
    let alreadyCorrectCount = 0;

    for (const customerProduct of customerProducts) {
      if (!customerProduct.customerSolution) continue;

      const assignmentName = customerProduct.customerSolution.name;
      const solutionName = customerProduct.customerSolution.solution.name;
      const productName = customerProduct.product.name;

      // Expected format: {assignmentName} - {solutionName} - {productName}
      const expectedName = `${assignmentName} - ${solutionName} - ${productName}`;

      // Check if name is already in correct format
      if (customerProduct.name === expectedName) {
        alreadyCorrectCount++;
        continue;
      }

      // Parse current name to check format
      const nameParts = customerProduct.name.split(' - ');

      if (nameParts.length === 2) {
        // Legacy format: {assignmentName} - {productName}
        // Update to new format with solution name
        await prisma.customerProduct.update({
          where: { id: customerProduct.id },
          data: { name: expectedName }
        });

        console.log(`Migrated product: "${customerProduct.name}" -> "${expectedName}"`);
        migratedCount++;
      } else if (nameParts.length === 3) {
        // Has 3 parts but might be incorrect
        // Force update to expected format
        await prisma.customerProduct.update({
          where: { id: customerProduct.id },
          data: { name: expectedName }
        });

        console.log(`Fixed product name: "${customerProduct.name}" -> "${expectedName}"`);
        migratedCount++;
      }
    }

    const summary = {
      totalChecked: customerProducts.length,
      migratedCount,
      alreadyCorrectCount,
      message: `Migration complete: ${migratedCount} product names updated, ${alreadyCorrectCount} were already correct`
    };

    console.log('Product name migration summary:', summary);
    await logAudit('MIGRATE_PRODUCT_NAMES', 'CustomerProduct', 'bulk', summary, ctx.user?.id);

    return summary;
  }
};

// Type Resolvers
export const CustomerSolutionWithPlanResolvers = {
  customer: (parent: any) => {
    return parent.customer || prisma.customer.findUnique({ where: { id: parent.customerId } });
  },
  solution: (parent: any) => {
    return parent.solution || prisma.solution.findUnique({ where: { id: parent.solutionId } });
  },
  licenseLevel: (parent: any) => {
    const prismaToGraphQLMap: { [key: string]: string } = {
      'ESSENTIAL': 'Essential',
      'ADVANTAGE': 'Advantage',
      'SIGNATURE': 'Signature'
    };
    return prismaToGraphQLMap[parent.licenseLevel] || 'Essential';
  },
  selectedOutcomes: async (parent: any) => {
    const outcomeIds = (parent.selectedOutcomes as string[]) || [];
    if (outcomeIds.length === 0) return [];
    return prisma.outcome.findMany({
      where: { id: { in: outcomeIds } }
    });
  },
  selectedReleases: async (parent: any) => {
    const releaseIds = (parent.selectedReleases as string[]) || [];
    if (releaseIds.length === 0) return [];
    return prisma.release.findMany({
      where: { id: { in: releaseIds } }
    });
  },
  products: async (parent: any) => {
    // Fetch all customer products linked to this solution
    return parent.products || prisma.customerProduct.findMany({
      where: { customerSolutionId: parent.id }
    });
  },
  adoptionPlan: (parent: any) => {
    return parent.adoptionPlan || prisma.solutionAdoptionPlan.findUnique({
      where: { customerSolutionId: parent.id }
    });
  }
};

export const SolutionAdoptionPlanResolvers = {
  customerSolution: (parent: any) => {
    return parent.customerSolution || prisma.customerSolution.findUnique({
      where: { id: parent.customerSolutionId }
    });
  },
  licenseLevel: (parent: any) => {
    const prismaToGraphQLMap: { [key: string]: string } = {
      'ESSENTIAL': 'Essential',
      'ADVANTAGE': 'Advantage',
      'SIGNATURE': 'Signature'
    };
    return prismaToGraphQLMap[parent.licenseLevel] || 'Essential';
  },
  selectedOutcomes: async (parent: any) => {
    const outcomeIds = (parent.selectedOutcomes as string[]) || [];
    if (outcomeIds.length === 0) return [];
    return prisma.outcome.findMany({
      where: { id: { in: outcomeIds } }
    });
  },
  selectedReleases: async (parent: any) => {
    const releaseIds = (parent.selectedReleases as string[]) || [];
    if (releaseIds.length === 0) return [];
    return prisma.release.findMany({
      where: { id: { in: releaseIds } }
    });
  },
  includedProductIds: (parent: any) => {
    return (parent.includedProductIds as string[]) || [];
  },
  totalWeight: (parent: any) => {
    return typeof parent.totalWeight === 'object' && 'toNumber' in parent.totalWeight
      ? parent.totalWeight.toNumber()
      : parent.totalWeight;
  },
  completedWeight: (parent: any) => {
    return typeof parent.completedWeight === 'object' && 'toNumber' in parent.completedWeight
      ? parent.completedWeight.toNumber()
      : parent.completedWeight;
  },
  progressPercentage: (parent: any) => {
    return typeof parent.progressPercentage === 'object' && 'toNumber' in parent.progressPercentage
      ? parent.progressPercentage.toNumber()
      : parent.progressPercentage;
  },
  products: (parent: any) => {
    return parent.products || prisma.solutionAdoptionProduct.findMany({
      where: { solutionAdoptionPlanId: parent.id },
      orderBy: { sequenceNumber: 'asc' }
    });
  },
  tasks: (parent: any) => {
    return parent.tasks || prisma.customerSolutionTask.findMany({
      where: { solutionAdoptionPlanId: parent.id },
      orderBy: { sequenceNumber: 'asc' }
    });
  },
  tasksByStatus: (parent: any, { status }: any) => {
    return prisma.customerSolutionTask.findMany({
      where: {
        solutionAdoptionPlanId: parent.id,
        status: status?.toUpperCase()
      },
      orderBy: { sequenceNumber: 'asc' }
    });
  },
  needsSync: async (parent: any) => {
    if (!parent.lastSyncedAt) return true;

    // Check 1: If solution itself has been updated
    const solution = await prisma.solution.findUnique({
      where: { id: parent.solutionId }
    });
    if (solution && solution.updatedAt > parent.lastSyncedAt) {
      return true;
    }

    // Check 2: If any underlying products have been updated
    const customerSolution = await prisma.customerSolution.findUnique({
      where: { id: parent.customerSolutionId },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });

    if (customerSolution) {
      for (const cp of customerSolution.products) {
        if (cp.product.updatedAt > parent.lastSyncedAt) {
          return true;
        }
      }
    }

    // Check 3: If any tasks have been modified
    const updatedTasks = await prisma.customerSolutionTask.findFirst({
      where: {
        solutionAdoptionPlanId: parent.id,
        updatedAt: { gt: parent.lastSyncedAt }
      }
    });

    return !!updatedTasks;
  }
};

export const SolutionAdoptionProductResolvers = {
  totalWeight: (parent: any) => {
    return typeof parent.totalWeight === 'object' && 'toNumber' in parent.totalWeight
      ? parent.totalWeight.toNumber()
      : parent.totalWeight;
  },
  completedWeight: (parent: any) => {
    return typeof parent.completedWeight === 'object' && 'toNumber' in parent.completedWeight
      ? parent.completedWeight.toNumber()
      : parent.completedWeight;
  },
  progressPercentage: (parent: any) => {
    return typeof parent.progressPercentage === 'object' && 'toNumber' in parent.progressPercentage
      ? parent.progressPercentage.toNumber()
      : parent.progressPercentage;
  },
  productAdoptionPlan: async (parent: any) => {
    // Find the CustomerProduct for this product within the solution
    // The CustomerProduct name follows the pattern: "{assignmentName} - {solutionName} - {productName}"
    const solutionAdoptionPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: parent.solutionAdoptionPlanId },
      include: {
        customerSolution: {
          include: {
            solution: true
          }
        }
      }
    });

    if (!solutionAdoptionPlan) return null;

    // Use the correct 3-part naming pattern: assignmentName - solutionName - productName
    const expectedProductName = `${solutionAdoptionPlan.customerSolution.name} - ${solutionAdoptionPlan.customerSolution.solution.name} - ${parent.productName}`;

    // Find the CustomerProduct with this name
    const customerProduct = await prisma.customerProduct.findFirst({
      where: {
        customerId: solutionAdoptionPlan.customerSolution.customerId,
        name: expectedProductName
      },
      include: {
        adoptionPlan: {
          include: {
            tasks: {
              include: {
                telemetryAttributes: {
                  include: {
                    values: {
                      orderBy: { createdAt: 'desc' },
                      take: 1
                    }
                  }
                },
                outcomes: {
                  include: { outcome: true }
                },
                releases: {
                  include: { release: true }
                }
              },
              orderBy: { sequenceNumber: 'asc' }
            }
          }
        }
      }
    });

    return customerProduct?.adoptionPlan || null;
  }
};

export const CustomerSolutionTaskResolvers = {
  weight: (parent: any) => {
    return typeof parent.weight === 'object' && 'toNumber' in parent.weight
      ? parent.weight.toNumber()
      : parent.weight;
  },
  howToDoc: (parent: any) => parent.howToDoc || [],
  howToVideo: (parent: any) => parent.howToVideo || [],
  licenseLevel: (parent: any) => {
    const prismaToGraphQLMap: { [key: string]: string } = {
      'ESSENTIAL': 'Essential',
      'ADVANTAGE': 'Advantage',
      'SIGNATURE': 'Signature'
    };
    return prismaToGraphQLMap[parent.licenseLevel] || 'Essential';
  },
  status: (parent: any) => parent.status,
  telemetryAttributes: (parent: any) => {
    return parent.telemetryAttributes || prisma.customerTelemetryAttribute.findMany({
      where: { customerSolutionTaskId: parent.id },
      orderBy: { order: 'asc' }
    });
  },
  outcomes: async (parent: any) => {
    const taskOutcomes = await prisma.customerTaskOutcome.findMany({
      where: { customerSolutionTaskId: parent.id },
      include: { outcome: true }
    });
    return taskOutcomes.map((to: any) => to.outcome);
  },
  releases: async (parent: any) => {
    const taskReleases = await prisma.customerTaskRelease.findMany({
      where: { customerSolutionTaskId: parent.id },
      include: { release: true }
    });
    return taskReleases.map((tr: any) => tr.release);
  },
  telemetryProgress: async (parent: any) => {
    const attributes = await prisma.customerTelemetryAttribute.findMany({
      where: { customerSolutionTaskId: parent.id }
    });

    const totalAttributes = attributes.length;
    const requiredAttributes = attributes.filter((a: any) => a.isRequired).length;
    const metAttributes = attributes.filter((a: any) => a.isMet).length;
    const metRequiredAttributes = attributes.filter((a: any) => a.isRequired && a.isMet).length;

    const completionPercentage = requiredAttributes > 0
      ? (metRequiredAttributes / requiredAttributes) * 100
      : 0;

    return {
      totalAttributes,
      requiredAttributes,
      metAttributes,
      metRequiredAttributes,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
      allRequiredMet: requiredAttributes > 0 && metRequiredAttributes === requiredAttributes
    };
  }
};



