import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON

  enum Role { ADMIN USER }
  enum LicenseLevel { Essential Advantage Signature }

  interface Node { id: ID! }

  type PageInfo { hasNextPage: Boolean! hasPreviousPage: Boolean! startCursor: String endCursor: String }

  type User implements Node { id: ID! email: String! username: String name: String role: Role! }

  type TaskStatus implements Node { id: ID! code: String! label: String! }

  type Outcome implements Node {
    id: ID!
    name: String!
    description: String
    product: Product!
  }

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
  }

  type Solution implements Node {
    id: ID!
    name: String!
    description: String
    products(first: Int, after: String): ProductConnection!
    tasks(first: Int, after: String, last: Int, before: String): TaskConnection!
    completionPercentage: Int!
    customAttrs: JSON
    customers: [Customer!]!
    licenses: [License!]!
  }

  type Customer implements Node {
    id: ID!
    name: String!
    description: String
    products: [Product!]!
    solutions: [Solution!]!
  }

  type Task implements Node {
    id: ID!
    name: String!
    description: String
    estMinutes: Int!
    notes: String
    weight: Float!                  # Weightage percentage (sum in parent = 100%)
    sequenceNumber: Int!            # Execution sequence number
    licenseLevel: LicenseLevel!     # License level required for this task (backward compatibility)
    priority: String                # Priority level (Low, Medium, High, Critical)
    product: Product                # Parent product (mutually exclusive with solution)
    solution: Solution              # Parent solution (mutually exclusive with product)
    outcomes: [Outcome!]!           # Outcomes this task contributes to
    license: License                # Single license associated with this task (hierarchical)
    deletedAt: String               # Soft delete timestamp
  }

  type License implements Node { 
    id: ID! 
    name: String! 
    description: String 
    level: Int!                     # Hierarchical level (1=lowest, higher numbers include lower levels)
    isActive: Boolean!              # Whether this license is currently active
    product: Product                # Product this license belongs to
    productId: ID                   # Product this license belongs to
  }

  type AuditLog implements Node { id: ID! action: String! entity: String entityId: String details: JSON createdAt: String! }

  type Telemetry implements Node { id: ID! data: JSON createdAt: String! }
  type ChangeItem implements Node { id: ID! entityType: String! entityId: String! before: JSON after: JSON }
  type ChangeSet implements Node { id: ID! createdAt: String! committedAt: String items: [ChangeItem!]! }

  type TaskDependencyEdge { id: ID! taskId: ID! dependsOnId: ID! task: Task! dependsOn: Task! }
  type TelemetryEdge { id: ID! data: JSON createdAt: String! }

  type TaskEdge { cursor: String! node: Task! }
  type TaskConnection { edges: [TaskEdge!]! pageInfo: PageInfo! totalCount: Int! }
  type ProductEdge { cursor: String! node: Product! }
  type ProductConnection { edges: [ProductEdge!]! pageInfo: PageInfo! totalCount: Int! }

  enum TaskImportMode { APPEND OVERWRITE }

  type TaskImportResult {
    success: Boolean!
    productId: ID!
    tasksCreated: Int!
    tasksUpdated: Int!
    tasksDeleted: Int
    mode: TaskImportMode!
    errors: [String!]!
    warnings: [String!]!
  }

  type ProductImportResult {
    success: Boolean!
    productsCreated: Int!
    productsUpdated: Int!
    errors: [String!]!
    warnings: [String!]!
  }



  type Query {
    node(id: ID!): Node
    products(first: Int, after: String, last: Int, before: String): ProductConnection!
    solutions(first: Int, after: String, last: Int, before: String): ProductConnection! # simplified
    tasks(first: Int, after: String, last: Int, before: String, productId: ID, solutionId: ID): TaskConnection!
    customers: [Customer!]!
    licenses: [License!]!
    taskStatuses: [TaskStatus!]!
  outcomes(productId: ID): [Outcome!]!
    auditLogs(limit: Int = 50): [AuditLog!]!
    changeSets(limit: Int = 50): [ChangeSet!]!
    changeSet(id: ID!): ChangeSet
    search(query: String!, first: Int = 20, after: String): [SearchResult!]!
    telemetry(taskId: ID!, limit: Int = 50): [TelemetryEdge!]!
    taskDependencies(taskId: ID!): [TaskDependencyEdge!]!
  }

  input ProductInput { 
    name: String! 
    description: String 
    customAttrs: JSON 
    licenseIds: [ID!]
  }
  input SolutionInput { name: String! description: String customAttrs: JSON }
  input CustomerInput { name: String! description: String }
  input LicenseInput { 
    name: String! 
    description: String 
    level: Int
    isActive: Boolean
    productId: ID!              # Product this license belongs to
  }
  input TaskStatusInput { code: String! label: String! }
  input OutcomeInput { name: String! description: String productId: ID! }
  input TaskInput { 
    productId: ID
    solutionId: ID
    name: String! 
    description: String 
    estMinutes: Int! 
    weight: Float! 
    sequenceNumber: Int 
    licenseLevel: LicenseLevel
    notes: String 
    priority: String
    outcomeIds: [ID!]
    licenseId: ID                   # Single license ID for hierarchical system
  }

  input TaskUpdateInput { 
    name: String
    description: String 
    estMinutes: Int 
    weight: Float 
    sequenceNumber: Int 
    licenseLevel: LicenseLevel
    notes: String 
    priority: String
    outcomeIds: [ID!]
    licenseId: ID                   # Single license ID for hierarchical system
  }

  type Mutation {
  signup(email: String!, username: String, password: String!, role: Role = USER, name: String): String! # returns JWT
  login(email: String, username: String, password: String!): String! # returns JWT (identify by email or username)
  simpleLogin(username: String!, password: String!): String! # convenience alias
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
  deleteProduct(id: ID!): Boolean!
  createSolution(input: SolutionInput!): Solution!
  updateSolution(id: ID!, input: SolutionInput!): Solution!
  deleteSolution(id: ID!): Boolean!
  createCustomer(input: CustomerInput!): Customer!
  updateCustomer(id: ID!, input: CustomerInput!): Customer!
  deleteCustomer(id: ID!): Boolean!
  createLicense(input: LicenseInput!): License!
  updateLicense(id: ID!, input: LicenseInput!): License!
  deleteLicense(id: ID!): Boolean!
  createTaskStatus(input: TaskStatusInput!): TaskStatus!
  updateTaskStatus(id: ID!, input: TaskStatusInput!): TaskStatus!
  deleteTaskStatus(id: ID!): Boolean!
  createOutcome(input: OutcomeInput!): Outcome!
  updateOutcome(id: ID!, input: OutcomeInput!): Outcome!
  deleteOutcome(id: ID!): Boolean!
  addProductToSolution(solutionId: ID!, productId: ID!): Boolean!
  removeProductFromSolution(solutionId: ID!, productId: ID!): Boolean!
  addProductToCustomer(customerId: ID!, productId: ID!): Boolean!
  removeProductFromCustomer(customerId: ID!, productId: ID!): Boolean!
  addSolutionToCustomer(customerId: ID!, solutionId: ID!): Boolean!
  removeSolutionFromCustomer(customerId: ID!, solutionId: ID!): Boolean!
  reorderTasks(productId: ID!, order: [ID!]!): Boolean!
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskUpdateInput!): Task!
    markTaskDone(id: ID!, reason: String): Task!
    acquireLock(entityType: String!, entityId: ID!): Boolean!
    releaseLock(entityType: String!, entityId: ID!): Boolean!
    beginChangeSet: ID!
    commitChangeSet(id: ID!): Boolean!
    undoChangeSet(id: ID!): Boolean!
    revertChangeSet(id: ID!): Boolean!
    # Task Export/Import (Tasks for specific product with append/overwrite modes)
    exportTasksCsv(productId: ID!): String!
    importTasksCsv(productId: ID!, csv: String!, mode: TaskImportMode!): TaskImportResult!
    downloadTaskSampleCsv: String!
    # Product Export/Import (Simple product fields only)
    exportProductsCsv: String!
    importProductsCsv(csv: String!): ProductImportResult!
    downloadProductSampleCsv: String!
  addTaskDependency(taskId: ID!, dependsOnId: ID!): Boolean!
  removeTaskDependency(taskId: ID!, dependsOnId: ID!): Boolean!
  addTelemetry(taskId: ID!, data: JSON!): Boolean!
  queueTaskSoftDelete(id: ID!): Boolean!
  processDeletionQueue(limit: Int = 50): Int!
  }

  union SearchResult = Product | Task | Solution | Customer

  type Subscription {
    productUpdated: Product!
    taskUpdated: Task!
  }
`;
