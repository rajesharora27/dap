import gql from 'graphql-tag';

export const commonTypeDefs = gql`
  scalar JSON
  scalar DateTime
  scalar Upload

  enum Role { ADMIN USER }
  enum LicenseLevel { Essential Advantage Signature }
  enum CustomerTaskStatus { NOT_STARTED IN_PROGRESS COMPLETED DONE NOT_APPLICABLE NO_LONGER_USING }
  enum StatusUpdateSource { MANUAL TELEMETRY IMPORT SYSTEM }
  enum TaskSourceType { SOLUTION PRODUCT }
  enum SolutionProductStatus { NOT_STARTED IN_PROGRESS COMPLETED BLOCKED SKIPPED }

  type Resource {
    label: String!
    url: String!
  }

  input ResourceInput {
    label: String!
    url: String!
  }

  interface Node { id: ID! }

  type PageInfo { 
    hasNextPage: Boolean! 
    hasPreviousPage: Boolean! 
    startCursor: String 
    endCursor: String 
  }

  type Query {
    node(id: ID!): Node
  }

  type Mutation {
    # Base mutation
    _empty: String
  }

  type Subscription {
    productUpdated: Product!
    taskUpdated: Task!
  }
`;
