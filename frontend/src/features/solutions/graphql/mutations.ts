/**
 * Solution GraphQL Mutations
 */

import { gql } from '@apollo/client';

export const DELETE_SOLUTION = gql`
  mutation DeleteSolution($id: ID!) {
    deleteSolution(id: $id)
  }
`;

export const UPDATE_SOLUTION = gql`
  mutation UpdateSolution($id: ID!, $input: SolutionInput!) {
    updateSolution(id: $id, input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

export const ADD_PRODUCT_TO_SOLUTION_ENHANCED = gql`
  mutation AddProductToSolution($solutionId: ID!, $productId: ID!, $order: Int) {
    addProductToSolutionEnhanced(solutionId: $solutionId, productId: $productId, order: $order)
  }
`;

export const REMOVE_PRODUCT_FROM_SOLUTION_ENHANCED = gql`
  mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
    removeProductFromSolutionEnhanced(solutionId: $solutionId, productId: $productId)
  }
`;

export const REORDER_PRODUCTS_IN_SOLUTION = gql`
  mutation ReorderProductsInSolution($solutionId: ID!, $productOrders: [ProductOrderInput!]!) {
    reorderProductsInSolution(solutionId: $solutionId, productOrders: $productOrders)
  }
`;

export const CREATE_SOLUTION_TAG = gql`
  mutation CreateSolutionTag($input: SolutionTagInput!) {
    createSolutionTag(input: $input) {
      id
      solutionId
      name
      color
      description
      displayOrder
    }
  }
`;

export const UPDATE_SOLUTION_TAG = gql`
  mutation UpdateSolutionTag($id: ID!, $input: SolutionTagUpdateInput!) {
    updateSolutionTag(id: $id, input: $input) {
      id
      solutionId
      name
      color
      description
      displayOrder
    }
  }
`;

export const DELETE_SOLUTION_TAG = gql`
  mutation DeleteSolutionTag($id: ID!) {
     deleteSolutionTag(id: $id)
  }
`;

export const SET_SOLUTION_TASK_TAGS = gql`
  mutation SetSolutionTaskTags($taskId: ID!, $tagIds: [ID!]!) {
     setSolutionTaskTags(taskId: $taskId, tagIds: $tagIds) {
       id
       solutionTags {
         id
         name
         color
         description
       }
     }
  }
`;

export const ADD_SOLUTION_TAG_TO_TASK = gql`
  mutation AddSolutionTagToTask($taskId: ID!, $tagId: ID!) {
    addSolutionTagToTask(taskId: $taskId, tagId: $tagId) {
      id
      solutionTags {
        id
        name
        color
        description
      }
    }
  }
`;

export const REMOVE_SOLUTION_TAG_FROM_TASK = gql`
  mutation RemoveSolutionTagFromTask($taskId: ID!, $tagId: ID!) {
    removeSolutionTagFromTask(taskId: $taskId, tagId: $tagId) {
      id
      solutionTags {
        id
        name
        color
        description
      }
    }
  }
`;
