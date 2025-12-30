import gql from 'graphql-tag';

export const diaryTypeDefs = gql`
  type DiaryTodo {
    id: ID!
    userId: ID!
    task: String!
    description: String
    isCompleted: Boolean!
    sequenceNumber: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type DiaryBookmark {
    id: ID!
    userId: ID!
    title: String!
    url: String!
    sequenceNumber: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateDiaryTodoInput {
    task: String!
    description: String
    isCompleted: Boolean
  }

  input UpdateDiaryTodoInput {
    task: String
    description: String
    isCompleted: Boolean
  }

  input CreateDiaryBookmarkInput {
    title: String!
    url: String!
  }

  input UpdateDiaryBookmarkInput {
    title: String
    url: String
  }

  type Query {
    myTodos: [DiaryTodo!]!
    myBookmarks: [DiaryBookmark!]!
  }

  type Mutation {
    createDiaryTodo(input: CreateDiaryTodoInput!): DiaryTodo!
    updateDiaryTodo(id: ID!, input: UpdateDiaryTodoInput!): DiaryTodo!
    deleteDiaryTodo(id: ID!): Boolean!
    reorderDiaryTodos(ids: [ID!]!): [DiaryTodo!]!

    createDiaryBookmark(input: CreateDiaryBookmarkInput!): DiaryBookmark!
    updateDiaryBookmark(id: ID!, input: UpdateDiaryBookmarkInput!): DiaryBookmark!
    deleteDiaryBookmark(id: ID!): Boolean!
    reorderDiaryBookmarks(ids: [ID!]!): [DiaryBookmark!]!
  }
`;
