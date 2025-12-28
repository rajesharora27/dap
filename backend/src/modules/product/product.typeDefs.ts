import gql from 'graphql-tag';

export const productTypeDefs = gql`
  type Product implements Node {
    id: ID!
    name: String!
    description: String
    tasks(first: Int, after: String, last: Int, before: String): TaskConnection!
    statusPercent: Int!
    completionPercentage: Int!
    customAttrs: JSON
    solutions: [Solution!]!
    customers: [Customer!]!
    licenses: [License!]!
    outcomes: [Outcome!]!
    releases: [Release!]!
    tags: [ProductTag!]!
  }

  type Release implements Node {
    id: ID!
    name: String!
    description: String
    level: Float!
    isActive: Boolean!
    product: Product
    productId: ID
    tasks: [Task!]!
    inheritedTasks: [Task!]!
    customAttrs: JSON
  }

  type Outcome implements Node {
    id: ID!
    name: String!
    description: String
    product: Product
    solution: Solution
    productId: ID
    solutionId: ID
  }

  type License implements Node { 
    id: ID! 
    name: String! 
    description: String 
    level: Int!
    isActive: Boolean!
    product: Product
    productId: ID
    solution: Solution
    solutionId: ID
    customAttrs: JSON
  }

  type ProductEdge { cursor: String! node: Product! }
  type ProductConnection { edges: [ProductEdge!]! pageInfo: PageInfo! totalCount: Int! }

  input ProductInput { 
    name: String! 
    description: String 
    customAttrs: JSON 
    licenseIds: [ID!]
  }

  input LicenseInput { 
    name: String! 
    description: String 
    level: Int
    isActive: Boolean
    productId: ID
    solutionId: ID
    customAttrs: JSON
  }

  input ReleaseInput {
    name: String!
    description: String
    level: Float!
    isActive: Boolean
    productId: ID
    solutionId: ID
    customAttrs: JSON
  }

  input OutcomeInput { 
    name: String! 
    description: String 
    productId: ID 
    solutionId: ID 
  }

  extend type Query {
    product(id: ID!): Product
    products(first: Int, after: String, last: Int, before: String): ProductConnection!
    licenses(productId: ID, solutionId: ID): [License!]!
    releases(productId: ID): [Release!]!
    outcomes(productId: ID, solutionId: ID): [Outcome!]!
  }

  extend type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    createLicense(input: LicenseInput!): License!
    updateLicense(id: ID!, input: LicenseInput!): License!
    deleteLicense(id: ID!): Boolean!
    createRelease(input: ReleaseInput!): Release!
    updateRelease(id: ID!, input: ReleaseInput!): Release!
    deleteRelease(id: ID!): Boolean!
    createOutcome(input: OutcomeInput!): Outcome!
    updateOutcome(id: ID!, input: OutcomeInput!): Outcome!
    deleteOutcome(id: ID!): Boolean!
  }
`;
