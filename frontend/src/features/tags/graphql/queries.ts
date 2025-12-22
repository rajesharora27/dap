import { gql } from '@apollo/client';

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
