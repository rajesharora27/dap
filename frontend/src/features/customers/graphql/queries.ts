import { gql } from '@apollo/client';

export const CUSTOMERS = gql`
  query Customers {
    customers {
      id
      name
      description
      products {
        id
        name
        customerSolutionId
        product {
          id
          name
        }
        licenseLevel
        selectedOutcomes {
          id
          name
          description
        }
        selectedReleases {
          id
          name
          level
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          lastSyncedAt
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
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          needsSync
          lastSyncedAt
        }
      }
    }
  }
`;

export const ADOPTION_PLAN = gql`
  query AdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      productId
      productName
      progressPercentage
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      needsSync
      lastSyncedAt
      createdAt
      updatedAt
      licenseLevel
      filterPreference {
        id
        filterReleases
        filterOutcomes
        filterTags
      }
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
        level
      }
      customerProduct {
        name
        customerSolutionId
        tags {
          id
          name
          color
          description
        }
        customerSolution {
          id
          name
          solution {
            id
            name
          }
        }
      }
      tasks {
        id
        originalTaskId
        name
        description
        notes
        status
        weight
        sequenceNumber
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        statusNotes
        isComplete
        completedAt
        licenseLevel
        howToDoc
        howToVideo
        telemetryProgress {
          totalAttributes
          requiredAttributes
          metAttributes
          metRequiredAttributes
          completionPercentage
          allRequiredMet
        }
        telemetryAttributes {
          id
          originalAttributeId
          name
          description
          dataType
          isRequired
          successCriteria
          order
          isActive
          isMet
          lastCheckedAt
          values {
            id
            value
            criteriaMet
          }
          latestValue {
            id
            value
            source
            createdAt
          }
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
        }
        tags {
          id
          name
          color
          description
        }
      }
    }
  }
`;

export const CUSTOMER_SOLUTIONS = gql`
  query CustomerSolutions($customerId: ID!) {
    customer(id: $customerId) {
      id
      name
      solutions {
        id
        name
        licenseLevel
        solution {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          needsSync
          lastSyncedAt
        }
      }
    }
  }
`;

export const SOLUTION_ADOPTION_PLAN = gql`
  query SolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      solutionName
      solutionId
      licenseLevel
      selectedOutcomes {
        id
        name
        description
      }
      selectedReleases {
        id
        name
        description
        level
      }
      progressPercentage
      totalTasks
      completedTasks
      solutionTasksTotal
      solutionTasksComplete
      needsSync
      lastSyncedAt
      customerSolution {
        id
        name
        tags {
          id
          name
          color
        }
        solution {
          id
          name
          outcomes {
            id
            name
            description
          }
          releases {
            id
            name
            description
            level
          }
        }
      }
      products {
        id
        productId
        productName
        status
        progressPercentage
        totalTasks
        completedTasks
        productAdoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          selectedOutcomes {
            id
            name
          }
          selectedReleases {
            id
            name
            level
          }
          tasks {
            id
            name
            description
            notes
            status
            weight
            sequenceNumber
            statusUpdatedAt
            statusUpdatedBy
            statusUpdateSource
            statusNotes
            licenseLevel
            howToDoc
            howToVideo
            telemetryAttributes {
              id
              name
              description
              dataType
              successCriteria
              isMet
              values {
                id
                value
                createdAt
                notes
                criteriaMet
              }
            }
            outcomes {
              id
              name
            }
            releases {
              id
              name
              level
            }
            tags {
              id
              name
              color
            }
          }
        }
      }
      tasks {
        id
        originalTaskId
        name
        description
        notes
        status
        weight
        sequenceNumber
        sourceType
        sourceProductId
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        statusNotes
        licenseLevel
        howToDoc
        howToVideo
        telemetryAttributes {
          id
          name
          description
          dataType
          successCriteria
          isMet
          values {
            id
            value
            createdAt
            notes
            criteriaMet
          }
        }
        tags {
          id
          name
          color
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
        }
      }
    }
  }
`;

export const CUSTOMER_PRODUCT_TAGS = gql`
  query CustomerProductTags($customerProductId: ID!) {
    customerProductTags(customerProductId: $customerProductId) {
      id
      name
      color
      description
      displayOrder
    }
  }
`;

export const CUSTOMER_SOLUTION_TAGS = gql`
  query CustomerSolutionTags($customerSolutionId: ID!) {
     customerSolutionTags(customerSolutionId: $customerSolutionId) {
       id
       name
       color
       description
       displayOrder
     }
  }
`;
