/**
 * Personal Product GraphQL Type Definitions
 */

import gql from 'graphql-tag';

export const personalProductTypeDefs = gql`
  # ===================
  # TYPES
  # ===================
  
  type PersonalProduct {
    id: ID!
    userId: String!
    name: String!
    description: String
    resources: JSON
    customAttrs: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    tasks: [PersonalTask!]!
    outcomes: [PersonalOutcome!]!
    releases: [PersonalRelease!]!
    licenses: [PersonalLicense!]!
    tags: [PersonalTag!]!
    assignments: [PersonalAssignment!]!
    taskCount: Int!
    progress: Float
  }
  
  type PersonalTask {
    id: ID!
    personalProductId: String!
    name: String!
    description: String
    estMinutes: Int!
    weight: Float!
    sequenceNumber: Int!
    howToDoc: [String!]!
    howToVideo: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    outcomes: [PersonalOutcome!]!
    releases: [PersonalRelease!]!
    tags: [PersonalTag!]!
    telemetryAttributes: [PersonalTelemetryAttribute!]!
    status: TaskStatus
    statusNotes: String
    statusUpdatedAt: DateTime
    statusUpdateSource: String
    licenseLevel: Int
    telemetryProgress: PersonalTelemetryProgress
  }
  
  type PersonalOutcome {
    id: ID!
    personalProductId: String!
    name: String!
    description: String
    createdAt: DateTime!
  }
  
  type PersonalRelease {
    id: ID!
    personalProductId: String!
    name: String!
    description: String
    level: Float
    version: String
    releaseDate: DateTime
    createdAt: DateTime!
  }

  type PersonalLicense {
    id: ID!
    personalProductId: String!
    name: String!
    description: String
    level: Int!
    isActive: Boolean!
    customAttrs: JSON
    displayOrder: Int!
    taskCount: Int
  }

  type PersonalTag {
    id: ID!
    personalProductId: String!
    name: String!
    description: String
    color: String
    displayOrder: Int!
  }

  type PersonalTelemetryAttribute {
    id: ID!
    personalTaskId: String!
    name: String!
    description: String
    dataType: String! 
    isRequired: Boolean!
    successCriteria: JSON
    order: Int!
    isActive: Boolean!
    isMet: Boolean!
    lastCheckedAt: DateTime
    values(limit: Int): [PersonalTelemetryValue!]!
    latestValue: PersonalTelemetryValue
  }

  type PersonalTelemetryValue {
    id: ID!
    personalAttributeId: String!
    value: JSON!
    source: String
    batchId: String
    notes: String
    createdAt: DateTime!
    criteriaMet: Boolean
  }

  type PersonalTelemetryProgress {
    totalAttributes: Int!
    requiredAttributes: Int!
    metAttributes: Int!
    metRequiredAttributes: Int!
    completionPercentage: Float!
    allRequiredMet: Boolean!
  }

  type PersonalTelemetryExport {
    filename: String!
    content: String!
    mimeType: String!
    size: Int!
  }

  type PersonalTelemetryImportSummary {
    tasksProcessed: Int!
    attributesUpdated: Int!
    criteriaEvaluated: Int!
    errors: [String!]!
  }

  type PersonalTaskTelemetryResult {
    taskId: ID!
    taskName: String!
    attributesUpdated: Int!
    criteriaMet: Int!
    criteriaTotal: Int!
    completionPercentage: Float!
  }

  type PersonalTelemetryImportResult {
    success: Boolean!
    summary: PersonalTelemetryImportSummary!
    taskResults: [PersonalTaskTelemetryResult!]!
  }
  
  # ===================
  # ENUMS
  # ===================
  
  enum TaskStatus {
    NOT_STARTED
    IN_PROGRESS
    COMPLETED
    DONE
    NOT_APPLICABLE
    NO_LONGER_USING
  }

  # ===================
  # INPUTS
  # ===================
  
  input CreatePersonalProductInput {
    name: String!
    description: String
    resources: JSON
    customAttrs: JSON
  }
  
  input UpdatePersonalProductInput {
    name: String
    description: String
    resources: JSON
    customAttrs: JSON
  }
  
  input CreatePersonalTaskInput {
    personalProductId: String!
    name: String!
    description: String
    estMinutes: Int
    weight: Float
    outcomeIds: [String!]
    releaseIds: [String!]
    tagIds: [String!]
    howToDoc: [String!]
    howToVideo: [String!]
    licenseLevel: Int
  }
  
  input UpdatePersonalTaskInput {
    name: String
    description: String
    estMinutes: Int
    weight: Float
    sequenceNumber: Int
    outcomeIds: [String!]
    releaseIds: [String!]
    tagIds: [String!]
    status: TaskStatus
    statusNotes: String
    howToDoc: [String!]
    howToVideo: [String!]
    licenseLevel: Int
  }
  
  input CreatePersonalOutcomeInput {
    personalProductId: String!
    name: String!
    description: String
  }

  input UpdatePersonalOutcomeInput {
    name: String
    description: String
  }

  
  input CreatePersonalReleaseInput {
    personalProductId: String!
    name: String!
    version: String
    releaseDate: DateTime
  }

  input UpdatePersonalReleaseInput {
    name: String
    description: String
    version: String
    releaseDate: DateTime
  }

  # -- New Inputs --

  input CreatePersonalLicenseInput {
    personalProductId: String!
    name: String!
    description: String
    level: Int
    isActive: Boolean
    customAttrs: JSON
  }

  input UpdatePersonalLicenseInput {
    name: String
    description: String
    level: Int
    isActive: Boolean
    customAttrs: JSON
  }

  input CreatePersonalTagInput {
    personalProductId: String!
    name: String!
    description: String
    color: String
  }

  input UpdatePersonalTagInput {
    name: String
    description: String
    color: String
  }

  input CreatePersonalTelemetryAttributeInput {
    personalTaskId: String!
    name: String!
    description: String
    dataType: String
    isRequired: Boolean
    successCriteria: JSON
    order: Int
    isActive: Boolean
  }

  input UpdatePersonalTelemetryAttributeInput {
    name: String
    description: String
    dataType: String
    isRequired: Boolean
    successCriteria: JSON
    order: Int
    isActive: Boolean
  }

  
  # ===================
  # QUERIES
  # ===================
  
  extend type Query {
    myPersonalProducts: [PersonalProduct!]!
    personalProduct(id: ID!): PersonalProduct
    personalProductTasks(personalProductId: ID!): [PersonalTask!]!
    exportPersonalProduct(personalProductId: ID!): ExcelExportResult!
  }
  
  # ===================
  # MUTATIONS
  # ===================
  
  extend type Mutation {
    createPersonalProduct(input: CreatePersonalProductInput!): PersonalProduct!
    updatePersonalProduct(id: ID!, input: UpdatePersonalProductInput!): PersonalProduct!
    deletePersonalProduct(id: ID!): Boolean!
    
    createPersonalTask(input: CreatePersonalTaskInput!): PersonalTask!
    updatePersonalTask(id: ID!, input: UpdatePersonalTaskInput!): PersonalTask!
    deletePersonalTask(id: ID!): Boolean!
    
    createPersonalOutcome(input: CreatePersonalOutcomeInput!): PersonalOutcome!
    updatePersonalOutcome(id: ID!, input: UpdatePersonalOutcomeInput!): PersonalOutcome!
    deletePersonalOutcome(id: ID!): Boolean!
    
    createPersonalRelease(input: CreatePersonalReleaseInput!): PersonalRelease!
    updatePersonalRelease(id: ID!, input: UpdatePersonalReleaseInput!): PersonalRelease!
    deletePersonalRelease(id: ID!): Boolean!
    
    importPersonalProduct(exportData: JSON!): PersonalProduct!
    copyGlobalProductToPersonal(productId: ID!): PersonalProduct!

    # -- New Mutations --
    createPersonalLicense(input: CreatePersonalLicenseInput!): PersonalLicense!
    updatePersonalLicense(id: ID!, input: UpdatePersonalLicenseInput!): PersonalLicense!
    deletePersonalLicense(id: ID!): Boolean!
    reorderPersonalLicenses(ids: [ID!]!): Boolean!

    createPersonalTag(input: CreatePersonalTagInput!): PersonalTag!
    updatePersonalTag(id: ID!, input: UpdatePersonalTagInput!): PersonalTag!
    deletePersonalTag(id: ID!): Boolean!
    reorderPersonalTags(ids: [ID!]!): Boolean!

    createPersonalTelemetryAttribute(input: CreatePersonalTelemetryAttributeInput!): PersonalTelemetryAttribute!
    updatePersonalTelemetryAttribute(id: ID!, input: UpdatePersonalTelemetryAttributeInput!): PersonalTelemetryAttribute!
    deletePersonalTelemetryAttribute(id: ID!): Boolean!
    reorderPersonalTelemetryAttributes(ids: [ID!]!): Boolean!
    reorderPersonalTasks(personalProductId: ID!, taskIds: [ID!]!): Boolean!
    
    # Telemetry
    exportPersonalTelemetryTemplate(personalProductId: ID!): PersonalTelemetryExport!
    importPersonalTelemetry(personalProductId: ID!, file: Upload!): PersonalTelemetryImportResult!
    evaluatePersonalTaskTelemetry(personalTaskId: ID!): PersonalTask!
  }
`;
