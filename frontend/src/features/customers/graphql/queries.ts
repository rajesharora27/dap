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
        }
      }
    }
  }
`;

export const GET_ADOPTION_PLAN = gql`
  query GetAdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      needsSync
      lastSyncedAt
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
        tags {
          id
          name
          color
          description
        }
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
          description
        }
      }
    }
  }
`;

export const GET_CUSTOMER_SOLUTIONS = gql`
  query GetCustomerSolutions($customerId: ID!) {
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

export const GET_SOLUTION_ADOPTION_PLAN = gql`
  query GetSolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
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
