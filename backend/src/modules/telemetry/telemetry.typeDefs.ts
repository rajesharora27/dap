import gql from 'graphql-tag';

export const telemetryTypeDefs = gql`
  type Telemetry implements Node { id: ID! data: JSON createdAt: String! }
  
  type TelemetryAttribute implements Node {
    id: ID!
    taskId: ID!
    name: String!
    description: String
    dataType: TelemetryDataType!
    isRequired: Boolean!
    successCriteria: JSON
    order: Int!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    task: Task!
    values(limit: Int): [TelemetryValue!]!
    currentValue: TelemetryValue
    isSuccessful: Boolean!
  }

  type TelemetryValue implements Node {
    id: ID!
    attributeId: ID!
    value: JSON!
    source: String
    batchId: String
    notes: String
    createdAt: String!
    attribute: TelemetryAttribute!
  }

  enum TelemetryDataType { BOOLEAN NUMBER STRING TIMESTAMP JSON }

  type TelemetryEdge { id: ID! data: JSON createdAt: String! }

  input TelemetryAttributeNestedInput {
    name: String!
    description: String
    dataType: TelemetryDataType!
    isRequired: Boolean
    successCriteria: JSON
    order: Int
  }

  input TelemetryAttributeInput {
    taskId: ID!
    name: String!
    description: String
    dataType: TelemetryDataType!
    isRequired: Boolean = false
    successCriteria: JSON
    order: Int = 0
    isActive: Boolean = true
  }

  input TelemetryAttributeUpdateInput {
    name: String
    description: String
    dataType: TelemetryDataType
    isRequired: Boolean
    successCriteria: JSON
    order: Int
    isActive: Boolean
  }

  input TelemetryValueInput {
    attributeId: ID!
    value: JSON!
    source: String
    batchId: String
    notes: String
  }

  input BatchTelemetryValueInput {
    batchId: String!
    values: [TelemetryValueInput!]!
  }

  extend type Query {
    telemetry(taskId: ID!, limit: Int = 50): [TelemetryEdge!]!
    telemetryAttribute(id: ID!): TelemetryAttribute
    telemetryAttributes(taskId: ID!): [TelemetryAttribute!]!
    telemetryValue(id: ID!): TelemetryValue
    telemetryValues(attributeId: ID!, limit: Int = 50): [TelemetryValue!]!
    telemetryValuesByBatch(batchId: String!): [TelemetryValue!]!
  }

  extend type Mutation {
    createTelemetryAttribute(input: TelemetryAttributeInput!): TelemetryAttribute!
    updateTelemetryAttribute(id: ID!, input: TelemetryAttributeUpdateInput!): TelemetryAttribute!
    deleteTelemetryAttribute(id: ID!): Boolean!
    addTelemetryValue(input: TelemetryValueInput!): TelemetryValue!
    addBatchTelemetryValues(input: BatchTelemetryValueInput!): [TelemetryValue!]!
    updateTelemetryValue(id: ID!, value: JSON!, notes: String): TelemetryValue!
    deleteTelemetryValue(id: ID!): Boolean!
    addTelemetry(taskId: ID!, data: JSON!): Boolean!
  }
`;
