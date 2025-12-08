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
            isActive
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
          }
          products {
            edges {
              node {
                id
                name
              }
            }
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
      }
      releases {
        id
        name
        description
        level
        isActive
      }
      outcomes {
        id
        name
        description
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
      }
      products {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`;
