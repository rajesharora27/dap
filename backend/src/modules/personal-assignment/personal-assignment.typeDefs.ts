/**
 * Personal Assignment GraphQL Type Definitions
 */

import gql from 'graphql-tag';

export const personalAssignmentTypeDefs = gql`
  # ===================
  # TYPES
  # ===================
  
  type PersonalAssignment {
    id: ID!
    userId: String!
    personalProductId: String!
    name: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    personalProduct: PersonalProduct!
    tasks: [PersonalAssignmentTask!]!
    progress: Float!
    taskCount: Int!
    completedCount: Int!
  }
  
  type PersonalAssignmentTask {
    id: ID!
    personalAssignmentId: String!
    personalTaskId: String!
    status: String!
    statusNotes: String
    statusUpdatedAt: DateTime
    sequenceNumber: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    personalTask: PersonalTask!
  }
  
  # ===================
  # INPUTS
  # ===================
  
  input CreatePersonalAssignmentInput {
    personalProductId: String!
    name: String!
  }
  
  input UpdatePersonalAssignmentTaskInput {
    status: String!
    statusNotes: String
  }
  
  # ===================
  # QUERIES
  # ===================
  
  extend type Query {
    myPersonalAssignments: [PersonalAssignment!]!
    personalAssignment(id: ID!): PersonalAssignment
  }
  
  # ===================
  # MUTATIONS
  # ===================
  
  extend type Mutation {
    createPersonalAssignment(input: CreatePersonalAssignmentInput!): PersonalAssignment!
    deletePersonalAssignment(id: ID!): Boolean!
    syncPersonalAssignment(id: ID!): PersonalAssignment!
    updatePersonalAssignmentTaskStatus(
      taskId: ID!
      input: UpdatePersonalAssignmentTaskInput!
    ): PersonalAssignmentTask!
  }
`;
