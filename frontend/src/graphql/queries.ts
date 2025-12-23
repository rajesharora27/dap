import { gql } from '@apollo/client';

export const PRODUCTS = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          statusPercent
          customAttrs
          licenses {
            id
            name
            description
            level
            isActive
          }
          releases {
            id
            name
            description
            level
            level
            isActive
            customAttrs
          }
          outcomes {
            id
            name
            description
          }
        }
      }
    }
  }
`;

export const SOLUTIONS = gql`
  query Solutions {
    solutions {
      edges {
        node {
          id
          name
          description
          customAttrs
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
            isActive
            customAttrs
          }
          licenses {
            id
            name
            description
            level
            isActive
            customAttrs
          }
          products {
            edges {
              node {
                id
                name
              }
            }
          }
          tags {
            id
            name
            color
            description
            displayOrder
          }
        }
      }
    }
  }
`;

export const CUSTOMERS = gql`
  query Customers {
    customers {
      id
      name
      description
      products {
        id
        name
        product {
          id
          name
        }
        adoptionPlan {
          id
        }
      }
      solutions {
        id
        name
        solution {
          id
          name
        }
        adoptionPlan {
          id
        }
      }
    }
  }
`;

export const TASKS_FOR_PRODUCT = gql`
  query TasksForProduct($productId: ID!) {
    tasks(productId: $productId, first: 100) {
      edges {
        node {
          id
          name
          description
          estMinutes
          weight
          sequenceNumber
          licenseLevel
          notes
          howToDoc
          howToVideo
          license {
            id
            name
            level
          }
          outcomes {
            id
            name
          }
          releases {
            id
            name
            level
            description
          }
          telemetryAttributes {
            id
            name
            description
            dataType
            isRequired
            successCriteria
            order
            isActive
            isSuccessful
            currentValue {
              id
              value
              source
              createdAt
            }
          }
          tags {
            id
            name
            color
            description
          }
          isCompleteBasedOnTelemetry
          telemetryCompletionPercentage
        }
      }
    }
  }
`;

export const TASKS_FOR_SOLUTION = gql`
  query TasksForSolution($solutionId: ID!) {
    tasks(solutionId: $solutionId, first: 100) {
      edges {
        node {
          id
          name
          description
          estMinutes
          weight
          sequenceNumber
          licenseLevel
          notes
          howToDoc
          howToVideo
          license {
            id
            name
            level
          }
          outcomes {
            id
            name
          }
          releases {
            id
            name
            level
            description
          }
          telemetryAttributes {
            id
            name
            description
            dataType
            isRequired
            successCriteria
            order
            isActive
            isSuccessful
            currentValue {
              id
              value
              source
              createdAt
            }
          }
          tags {
            id
            name
            color
            description
          }
          solutionTags {
            id
            name
            color
            description
          }
          isCompleteBasedOnTelemetry
          telemetryCompletionPercentage
        }
      }
    }
  }
`;

export const OUTCOMES = gql`
  query Outcomes($productId: ID) {
    outcomes(productId: $productId) {
      id
      name
      product {
        id
        name
      }
    }
  }
`;

export const PRODUCT = gql`
  query ProductDetail($id: ID!) {
    product(id: $id) {
      id
      name
      description
      statusPercent
      customAttrs
      licenses {
        id
        name
        description
        level
        isActive
        customAttrs
      }
      releases {
        id
        name
        description
        level
        isActive
        customAttrs
      }
      outcomes {
        id
        name
        description
      }
      tags {
        id
        name
        color
        description
        displayOrder
      }
    }
  }
`;

export const SOLUTION = gql`
  query SolutionDetail($id: ID!) {
    solution(id: $id) {
      id
      name
      description
      customAttrs
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
        isActive
        customAttrs
      }
      licenses {
        id
        name
        description
        level
        isActive
        customAttrs
      }
      products {
        edges {
          node {
            id
            name
          }
        }
      }
      tags {
        id
        name
        color
        description
        displayOrder
      }
    }
  }
`;
export const PRODUCT_TAGS = gql`
  query ProductTags($productId: ID!) {
   productTags(productId: $productId) {
     id
     name
     color
     description
     displayOrder
   }
  }
`;

export const TASK_TAGS = gql`
  query TaskTags($taskId: ID!) {
    taskTags(taskId: $taskId) {
      id
      tag {
        id
        name
        color
        description
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

export const SOLUTION_TAGS = gql`
  query SolutionTags($solutionId: ID!) {
    solutionTags(solutionId: $solutionId) {
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

// Removed legacy EXPORT_PRODUCT_TO_EXCEL. Using V2 instead.
