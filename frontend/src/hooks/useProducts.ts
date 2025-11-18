import { gql, useQuery } from '@apollo/client';

export const PRODUCTS_QUERY = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          statusPercent
          completionPercentage
          customAttrs
          solutions {
            id
            name
            description
          }
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
          }
          licenses {
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
          releases {
            id
            name
            description
            level
            isActive
            tasks {
              id
              name
              sequenceNumber
            }
          }
          tasks(first: 100) {
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
      }
    }
  }
`;

export const TASKS_FOR_PRODUCT_QUERY = gql`
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

export const OUTCOMES_QUERY = gql`
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

export function useProducts() {
  const { data, loading, error, refetch } = useQuery(PRODUCTS_QUERY, {
    errorPolicy: 'all'
  });

  const products = data?.products?.edges?.map((edge: any) => {
    const node = edge.node;
    // Parse telemetry attributes' successCriteria (same as useTasksForProduct)
    if (node.tasks?.edges) {
      const parsedTasks = node.tasks.edges.map((taskEdge: any) => {
        const task = taskEdge.node;
        if (task.telemetryAttributes && Array.isArray(task.telemetryAttributes)) {
          const parsedAttributes = task.telemetryAttributes.map((attr: any) => {
            if (attr.successCriteria && typeof attr.successCriteria === 'string' && attr.successCriteria.trim()) {
              try {
                return { ...attr, successCriteria: JSON.parse(attr.successCriteria) };
              } catch (e) {
                console.error(`Failed to parse successCriteria for attribute "${attr.name}":`, e);
                return attr;
              }
            }
            return attr;
          });
          return { node: { ...task, telemetryAttributes: parsedAttributes } };
        }
        return taskEdge;
      });
      return { ...node, tasks: { edges: parsedTasks } };
    }
    return node;
  }) || [];

  return {
    products,
    loading,
    error,
    refetch
  };
}

export function useTasksForProduct(productId: string) {
  const { data, loading, error, refetch } = useQuery(TASKS_FOR_PRODUCT_QUERY, {
    variables: { productId },
    skip: !productId,
    errorPolicy: 'all'
  });

  const tasks = data?.tasks?.edges?.map((edge: any) => {
    const node = edge.node;
    // Parse successCriteria from JSON string to object for each telemetry attribute
    if (node.telemetryAttributes && Array.isArray(node.telemetryAttributes)) {
      const parsedAttributes = node.telemetryAttributes.map((attr: any) => {
        if (attr.successCriteria && typeof attr.successCriteria === 'string' && attr.successCriteria.trim()) {
          try {
            return { ...attr, successCriteria: JSON.parse(attr.successCriteria) };
          } catch (e) {
            console.error(`Failed to parse successCriteria for attribute "${attr.name}":`, e);
            return attr;
          }
        }
        return attr;
      });
      return { ...node, telemetryAttributes: parsedAttributes };
    }
    return node;
  }) || [];

  return {
    tasks: tasks.sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0)),
    loading,
    error,
    refetch
  };
}

export function useOutcomes(productId?: string) {
  const { data, loading, error, refetch } = useQuery(OUTCOMES_QUERY, {
    variables: { productId },
    skip: !productId,
    errorPolicy: 'all'
  });

  return {
    outcomes: data?.outcomes || [],
    loading,
    error,
    refetch
  };
}
