import { gql } from '@apollo/client';

/**
 * Solution Reporting Queries
 */

export const GET_SOLUTION_ADOPTION_REPORT = gql`
  query GetSolutionAdoptionReport($solutionAdoptionPlanId: ID!) {
    solutionAdoptionReport(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      solutionAdoptionPlanId
      customerName
      solutionName
      licenseLevel
      overallProgress
      taskCompletionPercentage
      estimatedCompletionDate
      daysInProgress
      totalTasks
      completedTasks
      inProgressTasks
      notStartedTasks
      blockedTasks
      healthScore
      telemetryHealthScore
      riskLevel
      onTrack
      estimatedDaysRemaining
      recommendations
      productProgress {
        productId
        productName
        status
        progress
        completedTasks
        totalTasks
        averageTaskCompletionTime
        estimatedCompletionDate
      }
      bottlenecks {
        type
        severity
        title
        description
        affectedTaskIds
        affectedProductIds
        suggestedAction
        estimatedImpactDays
      }
    }
  }
`;

export const GET_SOLUTION_COMPARISON_REPORT = gql`
  query GetSolutionComparisonReport($solutionId: ID!) {
    solutionComparisonReport(solutionId: $solutionId) {
      solutionId
      solutionName
      totalCustomers
      averageProgress
      averageTimeToComplete
      successRate
      bestPerformingCustomers {
        customerId
        customerName
        progress
        daysInProgress
        healthScore
      }
      strugglingCustomers {
        customerId
        customerName
        progress
        daysInProgress
        healthScore
      }
      commonBottlenecks {
        bottleneckType
        occurrenceCount
        averageResolutionTime
        affectedCustomerPercentage
      }
    }
  }
`;

/**
 * Solution Adoption Queries
 */

export const GET_SOLUTION_ADOPTION_PLAN = gql`
  query GetSolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      customerSolution {
        id
        customer {
          id
          name
        }
        solution {
          id
          name
        }
        licenseLevel
      }
      progressPercentage
      totalTasks
      completedTasks
      solutionTasksTotal
      solutionTasksComplete
      createdAt
      updatedAt
      products {
        id
        productId
        productName
        sequenceNumber
        status
        totalTasks
        completedTasks
        progressPercentage
      }
      tasks {
        id
        name
        description
        status
        isComplete
        sequenceNumber
        estMinutes
        weight
        sourceType
        licenseLevel
        completedAt
      }
    }
  }
`;

export const GET_SOLUTION_ADOPTION_PLANS_FOR_CUSTOMER = gql`
  query GetSolutionAdoptionPlansForCustomer($customerId: ID!) {
    solutionAdoptionPlansForCustomer(customerId: $customerId) {
      id
      customerSolution {
        id
        solution {
          id
          name
        }
        licenseLevel
      }
      progressPercentage
      totalTasks
      completedTasks
      solutionTasksTotal
      solutionTasksComplete
      createdAt
      updatedAt
    }
  }
`;

/**
 * Customer Adoption Queries
 */

export const GET_ADOPTION_PLAN = gql`
  query GetAdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      customerProduct {
        id
        name
        customer {
          id
          name
        }
        product {
          id
          name
        }
        licenseLevel
      }
      progressPercentage
      completedTasks
      totalTasks
      createdAt
      updatedAt
      tasks {
        id
        name
        description
        status
        isComplete
        sequenceNumber
        estMinutes
        weight
        licenseLevel
        completedAt
      }
    }
  }
`;

export const GET_ADOPTION_PLANS_FOR_CUSTOMER = gql`
  query GetAdoptionPlansForCustomer($customerId: ID!) {
    adoptionPlansForCustomer(customerId: $customerId) {
      id
      customerProduct {
        id
        name
        product {
          id
          name
        }
        licenseLevel
      }
      progressPercentage
      completedTasks
      totalTasks
      createdAt
      updatedAt
    }
  }
`;

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      name
      description
      customAttrs
      createdAt
      updatedAt
      products {
        id
        name
        licenseLevel
        product {
          id
          name
        }
        selectedOutcomes {
          id
          name
        }
        selectedReleases {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          completedTasks
          totalTasks
        }
      }
      solutions {
        id
        name
        licenseLevel
        solution {
          id
          name
        }
        selectedOutcomes {
          id
          name
        }
        selectedReleases {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
        }
      }
    }
  }
`;

export const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      description
      customAttrs
      createdAt
      updatedAt
    }
  }
`;


