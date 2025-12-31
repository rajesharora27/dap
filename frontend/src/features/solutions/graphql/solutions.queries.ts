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
                tasks(first: 100) {
                  edges {
                    node {
                      id
                    }
                  }
                }
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

// Consolidated query for AssignSolutionDialog - replaces duplicate GetSolutionsWithDetails
export const SOLUTIONS_WITH_DETAILS = gql`
  query SolutionsWithDetails {
    solutions(first: 100) {
      edges {
        node {
          id
          name
          description
          resources { label url }
          outcomes {
            id
            name
            description
          }
          releases {
            id
            name
            description
          }
          licenses {
            id
            name
            level
            isActive
          }
          products {
            edges {
              node {
                id
                name
                tasks(first: 100) {
                  edges {
                    node {
                      id
                    }
                  }
                }
                outcomes {
                  id
                  name
                  description
                }
                releases {
                  id
                  name
                  description
                }
              }
            }
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
            tasks(first: 100) {
              edges {
                node {
                  id
                }
              }
            }
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
