import { gql } from '@apollo/client';

export const SOLUTIONS = gql`
  query Solutions {
    solutions {
      edges {
        node {
          id
          name
          resources { label url }
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
      resources { label url }
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

export const EXPORT_SOLUTION = gql`
  query ExportSolution($solutionId: ID!) {
    exportSolution(solutionId: $solutionId) {
      filename
      content
      mimeType
      size
      stats {
        tasksExported
        customAttributesExported
        licensesExported
        outcomesExported
        releasesExported
        telemetryAttributesExported
      }
    }
  }
`;
