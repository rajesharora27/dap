import { prisma } from '../shared/graphql/context';
import { CustomerTaskStatus, SolutionProductStatus, TaskSourceType } from '@prisma/client';

/**
 * Solution Adoption Reporting Service
 * Provides comprehensive analytics, bottleneck detection, and reporting for solution adoption
 */

export interface SolutionAdoptionReport {
  solutionAdoptionPlanId: string;
  customerName: string;
  solutionName: string;
  licenseLevel: string;

  // Overall progress
  overallProgress: number;
  taskCompletionPercentage: number;
  estimatedCompletionDate: Date | null;
  daysInProgress: number;

  // Task breakdown
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  blockedTasks: number;

  // Product breakdown
  productProgress: ProductProgressReport[];

  // Bottlenecks
  bottlenecks: BottleneckReport[];

  // Health metrics
  healthScore: number;
  telemetryHealthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Timeline analysis
  onTrack: boolean;
  estimatedDaysRemaining: number | null;

  // Recommendations
  recommendations: string[];
}

export interface ProductProgressReport {
  productId: string;
  productName: string;
  status: SolutionProductStatus;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  averageTaskCompletionTime: number | null; // in days
  estimatedCompletionDate: Date | null;
}

export interface BottleneckReport {
  type: 'TASK' | 'PRODUCT' | 'DEPENDENCY' | 'TELEMETRY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedTaskIds: string[];
  affectedProductIds: string[];
  suggestedAction: string;
  estimatedImpactDays: number | null;
}

export interface SolutionComparisonReport {
  solutionId: string;
  solutionName: string;
  totalCustomers: number;
  averageProgress: number;
  averageTimeToComplete: number | null; // in days
  successRate: number; // percentage of customers who completed
  commonBottlenecks: BottleneckSummary[];
  bestPerformingCustomers: CustomerPerformance[];
  strugglingCustomers: CustomerPerformance[];
}

export interface BottleneckSummary {
  bottleneckType: string;
  occurrenceCount: number;
  averageResolutionTime: number | null; // in days
  affectedCustomerPercentage: number;
}

export interface CustomerPerformance {
  customerId: string;
  customerName: string;
  progress: number;
  daysInProgress: number;
  healthScore: number;
}

export class SolutionReportingService {
  /**
   * Generate comprehensive report for a specific solution adoption plan
   */
  async generateSolutionAdoptionReport(solutionAdoptionPlanId: string): Promise<SolutionAdoptionReport> {
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
          include: {
            telemetryAttributes: {
              include: {
                values: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          },
          orderBy: { sequenceNumber: 'asc' }
        },
        products: {
          include: {
            product: true
          },
          orderBy: { sequenceNumber: 'asc' }
        }
      }
    });

    if (!plan) {
      throw new Error('Solution adoption plan not found');
    }

    // Calculate basic metrics
    const totalTasks = plan.tasks.length;
    const completedTasks = plan.tasks.filter((t: any) => t.isComplete).length;
    const inProgressTasks = plan.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const notStartedTasks = plan.tasks.filter((t: any) => t.status === 'NOT_STARTED').length;
    const blockedTasks = plan.tasks.filter((t: any) => t.status === 'BLOCKED').length;

    const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const overallProgress = plan.overallProgress?.toNumber() || 0;

    // Calculate days in progress
    const daysInProgress = Math.floor(
      (new Date().getTime() - plan.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate product progress
    const productProgress = await this.calculateProductProgress(plan);

    // Detect bottlenecks
    const bottlenecks = await this.detectBottlenecks(plan);

    // Calculate health scores
    const healthScore = this.calculateHealthScore(plan, bottlenecks);
    const telemetryHealthScore = this.calculateTelemetryHealthScore(plan);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(healthScore, bottlenecks, daysInProgress);

    // Estimate completion
    const { estimatedCompletionDate, estimatedDaysRemaining, onTrack } =
      this.estimateCompletion(plan, completedTasks, totalTasks, daysInProgress);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      plan,
      bottlenecks,
      healthScore,
      telemetryHealthScore,
      onTrack
    );

    return {
      solutionAdoptionPlanId: plan.id,
      customerName: plan.customerSolution.customer.name,
      solutionName: plan.customerSolution.solution.name,
      licenseLevel: plan.licenseLevel,
      overallProgress,
      taskCompletionPercentage,
      estimatedCompletionDate,
      daysInProgress,
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      blockedTasks,
      productProgress,
      bottlenecks,
      healthScore,
      telemetryHealthScore,
      riskLevel,
      onTrack,
      estimatedDaysRemaining,
      recommendations
    };
  }

  /**
   * Calculate progress for each product in the solution
   */
  private async calculateProductProgress(plan: any): Promise<ProductProgressReport[]> {
    const productReports: ProductProgressReport[] = [];

    for (const productRel of plan.products) {
      const productTasks = plan.tasks.filter((t: any) =>
        t.sourceType === TaskSourceType.PRODUCT && t.sourceProductId === productRel.productId
      );

      const totalTasks = productTasks.length;
      const completedTasks = productTasks.filter((t: any) => t.isComplete).length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average completion time for completed tasks
      const completedTasksWithDates = productTasks.filter((t: any) =>
        t.isComplete && t.completedAt && t.createdAt
      );
      let averageTaskCompletionTime = null;
      if (completedTasksWithDates.length > 0) {
        const totalDays = completedTasksWithDates.reduce((sum: number, t: any) => {
          const days = (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        averageTaskCompletionTime = totalDays / completedTasksWithDates.length;
      }

      // Estimate completion date
      let estimatedCompletionDate = null;
      if (averageTaskCompletionTime && completedTasks < totalTasks) {
        const remainingTasks = totalTasks - completedTasks;
        const estimatedDaysRemaining = remainingTasks * averageTaskCompletionTime;
        estimatedCompletionDate = new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
      }

      productReports.push({
        productId: productRel.productId,
        productName: productRel.snapshotName || productRel.product.name,
        status: productRel.status,
        progress,
        completedTasks,
        totalTasks,
        averageTaskCompletionTime,
        estimatedCompletionDate
      });
    }

    return productReports;
  }

  /**
   * Detect bottlenecks in solution adoption
   */
  private async detectBottlenecks(plan: any): Promise<BottleneckReport[]> {
    const bottlenecks: BottleneckReport[] = [];

    // 1. Detect blocked tasks
    const blockedTasks = plan.tasks.filter((t: any) => t.status === 'BLOCKED');
    if (blockedTasks.length > 0) {
      bottlenecks.push({
        type: 'TASK',
        severity: blockedTasks.length > 3 ? 'CRITICAL' : 'HIGH',
        title: `${blockedTasks.length} Blocked Tasks`,
        description: `${blockedTasks.length} tasks are currently blocked, preventing progress on the adoption plan.`,
        affectedTaskIds: blockedTasks.map((t: any) => t.id),
        affectedProductIds: [],
        suggestedAction: 'Review and resolve blockers for these tasks to unblock progress.',
        estimatedImpactDays: blockedTasks.length * 2 // Estimate 2 days per blocked task
      });
    }

    // 2. Detect tasks stuck in progress for too long
    const now = new Date();
    const stuckTasks = plan.tasks.filter((t: any) => {
      if (t.status !== 'IN_PROGRESS') return false;
      const daysInProgress = (now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const expectedDays = t.estMinutes ? t.estMinutes / (60 * 8) : 7; // Assume 8-hour workday
      return daysInProgress > expectedDays * 2; // Stuck if taking 2x expected time
    });

    if (stuckTasks.length > 0) {
      bottlenecks.push({
        type: 'TASK',
        severity: stuckTasks.length > 5 ? 'HIGH' : 'MEDIUM',
        title: `${stuckTasks.length} Tasks Taking Longer Than Expected`,
        description: `${stuckTasks.length} tasks are in progress but taking significantly longer than estimated.`,
        affectedTaskIds: stuckTasks.map((t: any) => t.id),
        affectedProductIds: [],
        suggestedAction: 'Review these tasks for unexpected complexity or resource constraints.',
        estimatedImpactDays: stuckTasks.length * 3
      });
    }

    // 3. Detect products with low progress
    for (const productRel of plan.products) {
      const productTasks = plan.tasks.filter((t: any) =>
        t.sourceType === TaskSourceType.PRODUCT && t.sourceProductId === productRel.productId
      );
      const completedCount = productTasks.filter((t: any) => t.isComplete).length;
      const progress = productTasks.length > 0 ? (completedCount / productTasks.length) * 100 : 0;

      // Check if product is significantly behind
      const avgProgress = plan.overallProgress?.toNumber() || 0;
      if (progress < avgProgress * 0.5 && productTasks.length > 3) {
        bottlenecks.push({
          type: 'PRODUCT',
          severity: 'MEDIUM',
          title: `Product "${productRel.snapshotName}" Lagging Behind`,
          description: `This product has ${progress.toFixed(1)}% progress vs ${avgProgress.toFixed(1)}% overall.`,
          affectedTaskIds: productTasks.map((t: any) => t.id),
          affectedProductIds: [productRel.productId],
          suggestedAction: 'Focus resources on catching up with this product\'s adoption.',
          estimatedImpactDays: null
        });
      }
    }

    // 4. Detect telemetry issues
    const tasksWithTelemetry = plan.tasks.filter((t: any) => t.telemetryAttributes.length > 0);
    const tasksWithFailedTelemetry = tasksWithTelemetry.filter((t: any) => {
      const requiredAttrs = t.telemetryAttributes.filter((a: any) => a.isRequired && a.isActive);
      const metAttrs = requiredAttrs.filter((a: any) => a.isMet);
      return t.status === 'IN_PROGRESS' && metAttrs.length < requiredAttrs.length;
    });

    if (tasksWithFailedTelemetry.length > 2) {
      bottlenecks.push({
        type: 'TELEMETRY',
        severity: 'MEDIUM',
        title: `${tasksWithFailedTelemetry.length} Tasks with Unmet Telemetry Requirements`,
        description: `Tasks are in progress but telemetry criteria are not being met.`,
        affectedTaskIds: tasksWithFailedTelemetry.map((t: any) => t.id),
        affectedProductIds: [],
        suggestedAction: 'Review telemetry configuration and ensure data is being collected properly.',
        estimatedImpactDays: null
      });
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(plan: any, bottlenecks: BottleneckReport[]): number {
    let score = 100;

    // Deduct for bottlenecks
    for (const bottleneck of bottlenecks) {
      switch (bottleneck.severity) {
        case 'CRITICAL': score -= 20; break;
        case 'HIGH': score -= 15; break;
        case 'MEDIUM': score -= 10; break;
        case 'LOW': score -= 5; break;
      }
    }

    // Deduct for blocked tasks
    const blockedCount = plan.tasks.filter((t: any) => t.status === 'BLOCKED').length;
    score -= blockedCount * 5;

    // Bonus for progress
    const progress = plan.overallProgress?.toNumber() || 0;
    score += progress * 0.2; // Up to 20 point bonus for completion

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate telemetry health score (0-100)
   */
  private calculateTelemetryHealthScore(plan: any): number {
    const tasksWithTelemetry = plan.tasks.filter((t: any) => t.telemetryAttributes.length > 0);
    if (tasksWithTelemetry.length === 0) return 100; // No telemetry = 100% (not tracked)

    let totalAttrs = 0;
    let metAttrs = 0;

    for (const task of tasksWithTelemetry) {
      const activeAttrs = task.telemetryAttributes.filter((a: any) => a.isActive);
      totalAttrs += activeAttrs.length;
      metAttrs += activeAttrs.filter((a: any) => a.isMet).length;
    }

    return totalAttrs > 0 ? (metAttrs / totalAttrs) * 100 : 100;
  }

  /**
   * Determine risk level based on health score and bottlenecks
   */
  private determineRiskLevel(
    healthScore: number,
    bottlenecks: BottleneckReport[],
    daysInProgress: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const hasCriticalBottleneck = bottlenecks.some(b => b.severity === 'CRITICAL');
    const hasHighBottleneck = bottlenecks.some(b => b.severity === 'HIGH');

    if (hasCriticalBottleneck || healthScore < 30) return 'CRITICAL';
    if (hasHighBottleneck || healthScore < 50) return 'HIGH';
    if (healthScore < 70 || daysInProgress > 180) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Estimate completion date and determine if on track
   */
  private estimateCompletion(
    plan: any,
    completedTasks: number,
    totalTasks: number,
    daysInProgress: number
  ): { estimatedCompletionDate: Date | null; estimatedDaysRemaining: number | null; onTrack: boolean } {
    if (totalTasks === 0 || completedTasks === 0) {
      return { estimatedCompletionDate: null, estimatedDaysRemaining: null, onTrack: true };
    }

    const completionRate = completedTasks / daysInProgress; // tasks per day
    const remainingTasks = totalTasks - completedTasks;
    const estimatedDaysRemaining = Math.ceil(remainingTasks / Math.max(completionRate, 0.1));

    const estimatedCompletionDate = new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);

    // Determine if on track (arbitrary: should complete within reasonable time)
    const targetDays = totalTasks * 7; // Assume 1 week per task as baseline
    const projectedTotalDays = daysInProgress + estimatedDaysRemaining;
    const onTrack = projectedTotalDays <= targetDays * 1.2; // Allow 20% buffer

    return { estimatedCompletionDate, estimatedDaysRemaining, onTrack };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    plan: any,
    bottlenecks: BottleneckReport[],
    healthScore: number,
    telemetryHealthScore: number,
    onTrack: boolean
  ): string[] {
    const recommendations: string[] = [];

    // Bottleneck-based recommendations
    for (const bottleneck of bottlenecks.slice(0, 3)) { // Top 3
      recommendations.push(bottleneck.suggestedAction);
    }

    // Health-based recommendations
    if (healthScore < 50) {
      recommendations.push('Consider scheduling a review meeting with the customer to address major blockers.');
    }

    if (telemetryHealthScore < 60) {
      recommendations.push('Telemetry health is low. Verify that telemetry data collection is configured correctly.');
    }

    // Progress-based recommendations
    const progress = plan.overallProgress?.toNumber() || 0;
    if (progress < 25 && plan.tasks.length > 10) {
      recommendations.push('Progress is low. Consider breaking down large tasks or providing additional support.');
    }

    if (!onTrack) {
      recommendations.push('Adoption is behind schedule. Review resource allocation and task prioritization.');
    }

    // Success recommendations
    if (healthScore > 80 && onTrack) {
      recommendations.push('Adoption is progressing well. Continue current momentum.');
    }

    return recommendations;
  }

  /**
   * Generate comparison report across all customers using a specific solution
   */
  async generateSolutionComparisonReport(solutionId: string): Promise<SolutionComparisonReport> {
    const solution = await prisma.solution.findUnique({
      where: { id: solutionId },
      include: {
        customerSolutions: {
          include: {
            customer: true,
            adoptionPlan: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!solution) {
      throw new Error('Solution not found');
    }

    const customerSolutionsWithPlans = solution.customerSolutions.filter((cs: any) => cs.adoptionPlan);
    const totalCustomers = customerSolutionsWithPlans.length;

    if (totalCustomers === 0) {
      return {
        solutionId: solution.id,
        solutionName: solution.name,
        totalCustomers: 0,
        averageProgress: 0,
        averageTimeToComplete: null,
        successRate: 0,
        commonBottlenecks: [],
        bestPerformingCustomers: [],
        strugglingCustomers: []
      };
    }

    // Calculate average progress
    const totalProgress = customerSolutionsWithPlans.reduce((sum: number, cs: any) => {
      return sum + (cs.adoptionPlan?.overallProgress?.toNumber() || 0);
    }, 0);
    const averageProgress = totalProgress / totalCustomers;

    // Calculate completion metrics
    const completedPlans = customerSolutionsWithPlans.filter((cs: any) => {
      const plan = cs.adoptionPlan;
      return plan && plan.tasks.every((t: any) => t.isComplete);
    });

    const successRate = (completedPlans.length / totalCustomers) * 100;

    const completionTimes = completedPlans
      .map((cs: any) => {
        const plan = cs.adoptionPlan;
        if (!plan) return null;
        const lastTask = plan.tasks.reduce((latest: any, t: any) => {
          if (!t.completedAt) return latest;
          if (!latest || t.completedAt > latest.completedAt) return t;
          return latest;
        }, null);
        if (!lastTask || !lastTask.completedAt) return null;
        return (lastTask.completedAt.getTime() - plan.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      })
      .filter((t: any): t is number => t !== null);

    const averageTimeToComplete = completionTimes.length > 0
      ? completionTimes.reduce((sum: number, t: number) => sum + t, 0) / completionTimes.length
      : null;

    // Identify best performing and struggling customers
    const customerPerformances: CustomerPerformance[] = customerSolutionsWithPlans.map((cs: any) => {
      const plan = cs.adoptionPlan!;
      const progress = plan.overallProgress?.toNumber() || 0;
      const daysInProgress = Math.floor(
        (new Date().getTime() - plan.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Simple health score calculation
      const completedTasks = plan.tasks.filter((t: any) => t.isComplete).length;
      const totalTasks = plan.tasks.length;
      const completionRate = daysInProgress > 0 ? completedTasks / daysInProgress : 0;
      const healthScore = Math.min(100, Math.max(0, progress + (completionRate * 100)));

      return {
        customerId: cs.customerId,
        customerName: cs.customer.name,
        progress,
        daysInProgress,
        healthScore
      };
    });

    const sortedByHealth = [...customerPerformances].sort((a, b) => b.healthScore - a.healthScore);
    const bestPerformingCustomers = sortedByHealth.slice(0, 5);
    const strugglingCustomers = sortedByHealth.slice(-5).reverse();

    return {
      solutionId: solution.id,
      solutionName: solution.name,
      totalCustomers,
      averageProgress,
      averageTimeToComplete,
      successRate,
      commonBottlenecks: [], // TODO: Implement bottleneck aggregation
      bestPerformingCustomers,
      strugglingCustomers
    };
  }
}

export const solutionReportingService = new SolutionReportingService();







