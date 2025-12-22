/**
 * Solution GraphQL Queries
 */

import { gql } from '@apollo/client';

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
