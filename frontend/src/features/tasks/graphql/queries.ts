import { gql } from '@apollo/client';

export const TASKS_FOR_PRODUCT = gql`
  query ProductTasks($productId: ID!) {
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
  query SolutionTasks($solutionId: ID!) {
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
