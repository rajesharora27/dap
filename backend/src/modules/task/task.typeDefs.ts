import gql from 'graphql-tag';

export const taskTypeDefs = gql`
  type Task implements Node {
    id: ID!
    name: String!
    description: String
    estMinutes: Int!
    notes: String
    weight: Float!
    sequenceNumber: Int!
    licenseLevel: LicenseLevel!
    howToDoc: [String!]!
    howToVideo: [String!]!
    product: Product
    solution: Solution
    outcomes: [Outcome!]!
    license: License
    releases: [Release!]!
    availableInReleases: [Release!]!
    telemetryAttributes: [TelemetryAttribute!]!
    isCompleteBasedOnTelemetry: Boolean!
    telemetryCompletionPercentage: Float!
    deletedAt: String
    tags: [ProductTag!]!
    solutionTags: [SolutionTag!]!
    customAttrs: JSON
  }

  type TaskStatus implements Node { id: ID! code: String! label: String! }
  type TaskEdge { cursor: String! node: Task! }
  type TaskConnection { edges: [TaskEdge!]! pageInfo: PageInfo! totalCount: Int! }

  input TaskCreateInput { 
    productId: ID
    solutionId: ID
    name: String! 
    description: String 
    estMinutes: Int! 
    weight: Float! 
    sequenceNumber: Int 
    licenseLevel: LicenseLevel
    notes: String 
    howToDoc: [String!]
    howToVideo: [String!]
    outcomeIds: [ID!]
    licenseId: ID
    releaseIds: [ID!]
    telemetryAttributes: [TelemetryAttributeNestedInput!]
    tagIds: [ID!]
  }

  input TaskUpdateInput { 
    name: String
    description: String 
    estMinutes: Int 
    weight: Float 
    sequenceNumber: Int 
    licenseLevel: LicenseLevel
    notes: String 
    howToDoc: [String!]
    howToVideo: [String!]
    outcomeIds: [ID!]
    licenseId: ID
    releaseIds: [ID!]
    telemetryAttributes: [TelemetryAttributeNestedInput!]
    tagIds: [ID!]
  }

  input TaskStatusInput { code: String! label: String! }

  extend type Query {
    task(id: ID!): Task
    tasks(first: Int, after: String, last: Int, before: String, productId: ID, solutionId: ID): TaskConnection!
    taskStatuses: [TaskStatus!]!
    taskDependencies(taskId: ID!): [TaskDependencyEdge!]!
  }

  extend type Mutation {
    createTask(input: TaskCreateInput!): Task!
    updateTask(id: ID!, input: TaskUpdateInput!): Task!
    deleteTask(id: ID!): Boolean!
    markTaskDone(id: ID!, reason: String): Task!
    reorderTasks(productId: ID, solutionId: ID, order: [ID!]!): Boolean!
    addTaskDependency(taskId: ID!, dependsOnId: ID!): Boolean!
    removeTaskDependency(taskId: ID!, dependsOnId: ID!): Boolean!
    createTaskStatus(input: TaskStatusInput!): TaskStatus!
    updateTaskStatus(id: ID!, input: TaskStatusInput!): TaskStatus!
    deleteTaskStatus(id: ID!): Boolean!
  }

  type TaskDependencyEdge { id: ID! taskId: ID! dependsOnId: ID! task: Task! dependsOn: Task! }
`;
