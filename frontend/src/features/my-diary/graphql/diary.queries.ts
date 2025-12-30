import { gql } from '@apollo/client';

export const GET_MY_TODOS = gql`
  query GetMyTodos {
    myTodos {
      id
      task
      description
      isCompleted
      sequenceNumber
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_BOOKMARKS = gql`
  query GetMyBookmarks {
    myBookmarks {
      id
      title
      url
      sequenceNumber
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_DIARY_TODO = gql`
  mutation CreateDiaryTodo($input: CreateDiaryTodoInput!) {
    createDiaryTodo(input: $input) {
      id
      task
      description
      isCompleted
      sequenceNumber
    }
  }
`;

export const UPDATE_DIARY_TODO = gql`
  mutation UpdateDiaryTodo($id: ID!, $input: UpdateDiaryTodoInput!) {
    updateDiaryTodo(id: $id, input: $input) {
      id
      task
      description
      isCompleted
    }
  }
`;

export const DELETE_DIARY_TODO = gql`
  mutation DeleteDiaryTodo($id: ID!) {
    deleteDiaryTodo(id: $id)
  }
`;

export const REORDER_DIARY_TODOS = gql`
  mutation ReorderDiaryTodos($ids: [ID!]!) {
    reorderDiaryTodos(ids: $ids) {
      id
      sequenceNumber
    }
  }
`;

export const CREATE_DIARY_BOOKMARK = gql`
  mutation CreateDiaryBookmark($input: CreateDiaryBookmarkInput!) {
    createDiaryBookmark(input: $input) {
      id
      title
      url
      sequenceNumber
    }
  }
`;

export const UPDATE_DIARY_BOOKMARK = gql`
  mutation UpdateDiaryBookmark($id: ID!, $input: UpdateDiaryBookmarkInput!) {
    updateDiaryBookmark(id: $id, input: $input) {
      id
      title
      url
    }
  }
`;

export const DELETE_DIARY_BOOKMARK = gql`
  mutation DeleteDiaryBookmark($id: ID!) {
    deleteDiaryBookmark(id: $id)
  }
`;

export const REORDER_DIARY_BOOKMARKS = gql`
  mutation ReorderDiaryBookmarks($ids: [ID!]!) {
    reorderDiaryBookmarks(ids: $ids) {
      id
      sequenceNumber
    }
  }
`;
