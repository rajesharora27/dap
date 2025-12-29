import gql from 'graphql-tag';

export const solutionTypeDefs = gql`
  type Solution implements Node {
    id: ID!
    name: String!
    resources: [Resource!]
    products(first: Int, after: String): ProductConnection!
    tasks(first: Int, after: String, last: Int, before: String): TaskConnection!
    completionPercentage: Int!
    customAttrs: JSON
    customers: [Customer!]!
    licenses: [License!]!
    releases: [Release!]!
    outcomes: [Outcome!]!
    tags: [SolutionTag!]!
  }

  type SolutionEdge { cursor: String! node: Solution! }
  type SolutionConnection { edges: [SolutionEdge!]! pageInfo: PageInfo! totalCount: Int! }

  input SolutionInput { 
    name: String! 
    resources: [ResourceInput!] 
    customAttrs: JSON 
  }

  extend type Query {
    solution(id: ID!): Solution
    solutions(first: Int, after: String, last: Int, before: String): SolutionConnection!
  }

  extend type Mutation {
    createSolution(input: SolutionInput!): Solution!
    updateSolution(id: ID!, input: SolutionInput!): Solution!
    deleteSolution(id: ID!): Boolean!
    addProductToSolution(solutionId: ID!, productId: ID!): Boolean!
    removeProductFromSolution(solutionId: ID!, productId: ID!): Boolean!
    addProductToSolutionEnhanced(solutionId: ID!, productId: ID!, order: Int): Boolean!
    removeProductFromSolutionEnhanced(solutionId: ID!, productId: ID!): Boolean!
    reorderProductsInSolution(solutionId: ID!, productOrders: [ProductOrderInput!]!): Boolean!
    migrateProductNamesToNewFormat: Boolean!
  }

  input ProductOrderInput { productId: ID!, order: Int! }
`;
