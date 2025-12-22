import { gql } from '@apollo/client';

export const CREATE_PRODUCT_TAG = gql`
  mutation CreateProductTag($input: ProductTagInput!) {
    createProductTag(input: $input) {
      id
      productId
      name
      color
      description
      displayOrder
    }
  }
`;

export const UPDATE_PRODUCT_TAG = gql`
  mutation UpdateProductTag($id: ID!, $input: ProductTagUpdateInput!) {
    updateProductTag(id: $id, input: $input) {
      id
      productId
      name
      color
      description
      displayOrder
    }
  }
`;

export const DELETE_PRODUCT_TAG = gql`
  mutation DeleteProductTag($id: ID!) {
    deleteProductTag(id: $id)
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

export const SET_TASK_TAGS = gql`
  mutation SetTaskTags($taskId: ID!, $tagIds: [ID!]!) {
    setTaskTags(taskId: $taskId, tagIds: $tagIds) {
      id
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

export const ADD_TAG_TO_TASK = gql`
  mutation AddTagToTask($taskId: ID!, $tagId: ID!) {
    addTagToTask(taskId: $taskId, tagId: $tagId) {
      id
      tags {
        id
        name
        color
        description
      }
    }
  }
`;

export const REMOVE_TAG_FROM_TASK = gql`
  mutation RemoveTagFromTask($taskId: ID!, $tagId: ID!) {
    removeTagFromTask(taskId: $taskId, tagId: $tagId) {
      id
      tags {
        id
        name
        color
        description
      }
    }
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
