import { prisma } from '../../context';
import { ensureRole, requireUser } from '../../lib/auth';
import { logAudit } from '../../lib/audit';
import { LicenseLevel, TaskSourceType, SolutionProductStatus } from '@prisma/client';

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
          orderBy: { sequenceNumber: 'asc' }
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
      .map(cs => cs.adoptionPlan)
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
    ensureRole(ctx, 'ADMIN');
    
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
          name: `${name} - ${product.name}` // Use solution name as identifier
        }
      });
      
      if (!existingProductAssignment) {
        // Get all outcome and release IDs for this product at the solution's license level
        const productOutcomeIds = product.outcomes.map((o: any) => o.id);
        const productReleaseIds = product.releases.map((r: any) => r.id);
        
        const customerProduct = await prisma.customerProduct.create({
          data: {
            customerId,
            productId: product.id,
            name: `${name} - ${product.name}`, // Include solution name as identifier
            licenseLevel: prismaLicenseLevel, // Same license level as solution
            selectedOutcomes: productOutcomeIds,
            selectedReleases: productReleaseIds
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
    ensureRole(ctx, 'ADMIN');
    
    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.licenseLevel) updateData.licenseLevel = input.licenseLevel.toUpperCase();
    if (input.selectedOutcomeIds !== undefined) updateData.selectedOutcomes = input.selectedOutcomeIds;
    if (input.selectedReleaseIds !== undefined) updateData.selectedReleases = input.selectedReleaseIds;
    
    const customerSolution = await prisma.customerSolution.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        solution: true
      }
    });
    
    await logAudit('UPDATE_CUSTOMER_SOLUTION', 'CustomerSolution', id, { input }, ctx.user?.id);
    
    return customerSolution;
  },

  removeSolutionFromCustomerEnhanced: async (_: any, { id }: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    
    try {
      await prisma.customerSolution.delete({ where: { id } });
      await logAudit('REMOVE_SOLUTION_FROM_CUSTOMER', 'CustomerSolution', id, {}, ctx.user?.id);
      return { success: true, message: 'Solution removed successfully' };
    } catch (error: any) {
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
    // We'll update these records when syncing
    let productSeq = 1;
    for (const productId of includedProductIds) {
      const product = customerSolution.solution.products.find(
        (sp: any) => sp.product.id === productId
      );
      
      await prisma.solutionAdoptionProduct.create({
        data: {
          solutionAdoptionPlanId: adoptionPlan.id,
          productId,
          productName: product?.product.name || 'Unknown',
          sequenceNumber: productSeq++,
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
        const filteredTasks = customerProduct.product.tasks.filter(task => {
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
        
        const totalWeight = filteredTasks.reduce((sum, t) => sum + Number(t.weight), 0);
        
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
    
    // Calculate progress ONLY from solution-specific tasks (not product tasks)
    const solutionSpecificTasks = plan.tasks.filter(t => t.sourceType === 'SOLUTION');
    const progress = calculateSolutionProgress(solutionSpecificTasks);
    const solutionTasksComplete = solutionSpecificTasks.filter(
      t => (t.status === 'COMPLETED' || t.status === 'DONE')
    ).length;
    
    // Get underlying product adoption plans
    const customerProducts = await prisma.customerProduct.findMany({
      where: {
        customerId: plan.customerSolution.customerId,
        name: {
          startsWith: `${plan.customerSolution.name} - `
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
    
    // Calculate aggregated progress: solution-specific tasks + product adoption plans
    let totalTasksWithProducts = progress.totalTasks; // Solution tasks only
    let completedTasksWithProducts = progress.completedTasks; // Solution tasks only
    let totalWeightWithProducts = Number(progress.totalWeight); // Solution tasks only
    let completedWeightWithProducts = Number(progress.completedWeight); // Solution tasks only
    
    for (const cp of customerProducts) {
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
        lastSyncedAt: new Date()
      }
    });
    
    // Update product progress tracking in SolutionAdoptionProduct
    // Note: Product tasks within solution are tracked via separate AdoptionPlan records
    // We aggregate progress from the underlying product adoption plans
    for (const product of plan.products) {
      // Find the corresponding CustomerProduct adoption plan
      const customerProduct = customerProducts.find(cp => cp.productId === product.productId);
      
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
      
      await prisma.solutionAdoptionProduct.update({
        where: { id: product.id },
        data: {
          totalTasks: finalTotalTasks,
          completedTasks: finalCompletedTasks,
          totalWeight: finalTotalWeight,
          completedWeight: finalCompletedWeight,
          progressPercentage: finalProgressPercentage,
          status: newStatus as SolutionProductStatus
        }
      });
    }
    
    await logAudit('SYNC_SOLUTION_ADOPTION_PLAN', 'SolutionAdoptionPlan', solutionAdoptionPlanId, {}, ctx.user?.id);
    
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
              orderBy: { createdAt: 'desc' },
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
    
    // Evaluate all required attributes
    let allRequiredMet = true;
    for (const attr of task.telemetryAttributes) {
      if (!attr.isRequired || !attr.isActive) continue;
      
      const latestValue = attr.values[0];
      if (!latestValue) {
        allRequiredMet = false;
        break;
      }
      
      const isMet = evaluateCriteria(attr.successCriteria, latestValue.value);
      await prisma.customerTelemetryAttribute.update({
        where: { id: attr.id },
        data: {
          isMet,
          lastCheckedAt: new Date()
        }
      });
      
      if (!isMet) {
        allRequiredMet = false;
      }
    }
    
    // Update task status if all required telemetry is met
    if (allRequiredMet && task.status !== 'COMPLETED') {
      await prisma.customerSolutionTask.update({
        where: { id: customerSolutionTaskId },
        data: {
          status: 'COMPLETED',
          isComplete: true,
          completedAt: new Date(),
          statusUpdateSource: 'TELEMETRY'
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

  evaluateAllSolutionTasksTelemetry: async (_: any, { solutionAdoptionPlanId }: any, ctx: any) => {
    requireUser(ctx);
    
    const plan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: solutionAdoptionPlanId },
      include: {
        tasks: true
      }
    });
    
    if (!plan) {
      throw new Error('Solution adoption plan not found');
    }
    
    // Evaluate each task
    for (const task of plan.tasks) {
      await SolutionAdoptionMutationResolvers.evaluateSolutionTaskTelemetry(
        _,
        { customerSolutionTaskId: task.id },
        ctx
      );
    }
    
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

  // Product management mutations
  addProductToSolutionEnhanced: async (_: any, { solutionId, productId, order }: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    
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
    ensureRole(ctx, 'ADMIN');
    
    await prisma.solutionProduct.deleteMany({
      where: { solutionId, productId }
    });
    
    await logAudit('REMOVE_PRODUCT_FROM_SOLUTION', 'Solution', solutionId, { productId }, ctx.user?.id);
    return true;
  },

  reorderProductsInSolution: async (_: any, { solutionId, productOrders }: any, ctx: any) => {
    ensureRole(ctx, 'ADMIN');
    
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
    // Check if any tasks have been modified after lastSyncedAt
    if (!parent.lastSyncedAt) return true;
    
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
    // The CustomerProduct name follows the pattern: "{SolutionName} - {ProductName}"
    const solutionAdoptionPlan = await prisma.solutionAdoptionPlan.findUnique({
      where: { id: parent.solutionAdoptionPlanId },
      include: {
        customerSolution: true
      }
    });
    
    if (!solutionAdoptionPlan) return null;
    
    const expectedProductName = `${solutionAdoptionPlan.customerSolution.name} - ${parent.productName}`;
    
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
    const requiredAttributes = attributes.filter(a => a.isRequired).length;
    const metAttributes = attributes.filter(a => a.isMet).length;
    const metRequiredAttributes = attributes.filter(a => a.isRequired && a.isMet).length;
    
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



