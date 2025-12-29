import gql from 'graphql-tag';

export const tagTypeDefs = gql`
  type ProductTag {
    id: ID!
    productId: ID!
    name: String!
    description: String
    color: String
    displayOrder: Int
    taskTags: [TaskTag!]
  }

  type SolutionTag {
    id: ID!
    solutionId: ID!
    name: String!
    description: String
    color: String
    displayOrder: Int
    taskTags: [SolutionTaskTag!]
  }

  type TaskTag {
    id: ID!
    taskId: ID!
    tag: ProductTag!
  }

  type SolutionTaskTag {
    id: ID!
    taskId: ID!
    tag: SolutionTag!
  }

  type CustomerProductTag {
      id: ID!
      customerProductId: ID!
      sourceTagId: ID
      name: String!
      color: String
      displayOrder: Int
      description: String
  }

  type CustomerTaskTag {
      id: ID!
      customerTaskId: ID!
      tag: CustomerProductTag!
  }

  type CustomerSolutionTag {
      id: ID!
      customerSolutionId: ID!
      sourceTagId: ID
      name: String!
      color: String
      displayOrder: Int
      description: String
  }

  type CustomerSolutionTaskTag {
      id: ID!
      customerSolutionTaskId: ID!
      tag: CustomerSolutionTag!
  }

  input ProductTagInput {
    productId: ID!
    name: String!
    description: String
    color: String
    displayOrder: Int
  }

  input ProductTagUpdateInput {
    name: String
    description: String
    color: String
    displayOrder: Int
  }

  input SolutionTagInput {
    solutionId: ID!
    name: String!
    description: String
    color: String
    displayOrder: Int
  }

  input SolutionTagUpdateInput {
    name: String
    description: String
    color: String
    displayOrder: Int
  }

  extend type Query {
    productTag(id: ID!): ProductTag
    productTags(productId: ID!): [ProductTag!]
    taskTag(id: ID!): TaskTag
    taskTags(taskId: ID!): [TaskTag!]
    customerProductTags(customerProductId: ID!): [CustomerProductTag!]
    solutionTags(solutionId: ID!): [SolutionTag!]
    customerSolutionTags(customerSolutionId: ID!): [CustomerSolutionTag!]
  }

  extend type Mutation {
    createProductTag(input: ProductTagInput!): ProductTag!
    updateProductTag(id: ID!, input: ProductTagUpdateInput!): ProductTag!
    deleteProductTag(id: ID!): Boolean!
    setTaskTags(taskId: ID!, tagIds: [ID!]!): Task!
    addTagToTask(taskId: ID!, tagId: ID!): Task!
    removeTagFromTask(taskId: ID!, tagId: ID!): Task!

    createSolutionTag(input: SolutionTagInput!): SolutionTag!
    updateSolutionTag(id: ID!, input: SolutionTagUpdateInput!): SolutionTag!
    deleteSolutionTag(id: ID!): Boolean!
    setSolutionTaskTags(taskId: ID!, tagIds: [ID!]!): Task!
    addSolutionTagToTask(taskId: ID!, tagId: ID!): Task!
    removeSolutionTagFromTask(taskId: ID!, tagId: ID!): Task!
    
    reorderProductTags(productId: ID!, tagIds: [ID!]!): [ProductTag!]!
    reorderSolutionTags(solutionId: ID!, tagIds: [ID!]!): [SolutionTag!]!
  }
`;
