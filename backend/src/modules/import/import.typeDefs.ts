import gql from 'graphql-tag';

export const importTypeDefs = gql`
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

  type ExcelExportResult {
    filename: String!
    content: String!
    mimeType: String!
    size: Int!
    stats: ExcelExportStats!
  }

  type ExcelExportStats {
    tasksExported: Int!
    customAttributesExported: Int!
    licensesExported: Int!
    outcomesExported: Int!
    releasesExported: Int!
    telemetryAttributesExported: Int!
  }

  type CustomerAdoptionImportResult {
    success: Boolean!
    customerId: String!
    customerName: String!
    customerProductId: String!
    productName: String!
    stats: CustomerAdoptionImportStats!
    errors: [ImportValidationError!]!
    warnings: [ImportValidationError!]!
  }

  type CustomerAdoptionImportStats {
    telemetryValuesImported: Int!
    taskStatusesUpdated: Int!
    attributesCreated: Int!
  }

  enum EntityType { PRODUCT SOLUTION PERSONAL_PRODUCT }

  type ImportDryRunResult {
    sessionId: String!
    isValid: Boolean!
    entityType: EntityType!
    entitySummary: EntitySummary!
    records: RecordsSummary!
    errors: [ImportValidationError!]!
    warnings: [ImportValidationError!]!
    summary: ImportSummary!
  }

  type EntitySummary {
    name: String!
    action: String!
    existingId: String
  }

  type RecordsSummary {
    tasks: [RecordPreview!]!
    licenses: [RecordPreview!]!
    outcomes: [RecordPreview!]!
    releases: [RecordPreview!]!
    tags: [RecordPreview!]!
    customAttributes: [RecordPreview!]!
    telemetryAttributes: [RecordPreview!]!
    productRefs: [RecordPreview!]!
    resources: [RecordPreview!]!
  }

  type RecordPreview {
    rowNumber: Int!
    action: String!
    data: JSON!
    existingData: JSON
    existingId: String
    changes: [FieldDiff!]
  }

  type FieldDiff {
    field: String!
    oldValue: JSON
    newValue: JSON
    displayOld: String!
    displayNew: String!
  }

  type ImportValidationError {
    sheet: String!
    row: Int!
    column: String
    field: String
    value: JSON
    message: String!
    code: String!
    severity: String!
  }

  type ImportSummary {
    totalRecords: Int!
    toCreate: Int!
    toUpdate: Int!
    toDelete: Int!
    toSkip: Int!
    errorCount: Int!
    warningCount: Int!
  }

  type ImportStats {
    tasksCreated: Int!
    tasksUpdated: Int!
    tasksDeleted: Int!
    tasksSkipped: Int!
    licensesCreated: Int!
    licensesUpdated: Int!
    licensesDeleted: Int!
    outcomesCreated: Int!
    outcomesUpdated: Int!
    outcomesDeleted: Int!
    releasesCreated: Int!
    releasesUpdated: Int!
    releasesDeleted: Int!
    tagsCreated: Int!
    tagsUpdated: Int!
    tagsDeleted: Int!
    customAttributesCreated: Int!
    customAttributesUpdated: Int!
    customAttributesDeleted: Int!
    telemetryAttributesCreated: Int!
    telemetryAttributesUpdated: Int!
    telemetryAttributesDeleted: Int!
    productLinksCreated: Int!
    productLinksUpdated: Int!
    productLinksDeleted: Int!
  }

  type ImportCommitResult {
    success: Boolean!
    entityId: String
    entityName: String!
    stats: ImportStats
    errors: [ImportValidationError!]!
    message: String!
  }

  type TelemetryTemplateExport {
    url: String!
    filename: String!
    taskCount: Int!
    attributeCount: Int!
    customerName: String!
    productName: String!
    assignmentName: String!
  }

  type TelemetryImportResult {
    success: Boolean!
    batchId: String!
    summary: TelemetryImportSummary!
    taskResults: [TaskTelemetryResult!]!
  }

  type TelemetryImportSummary {
    tasksProcessed: Int!
    attributesUpdated: Int!
    criteriaEvaluated: Int!
    errors: [String!]!
  }

  type TaskTelemetryResult {
    taskId: ID!
    taskName: String!
    attributesUpdated: Int!
    criteriaMet: Int!
    criteriaTotal: Int!
    completionPercentage: Float!
    errors: [String!]!
  }

  extend type Query {
    exportProduct(productId: ID!): ExcelExportResult!
    exportSolution(solutionId: ID!): ExcelExportResult!
    exportTasksCsv(productId: ID!): String!
    downloadTaskSampleCsv: String!
    exportProductsCsv: String!
    downloadProductSampleCsv: String!
  }

  extend type Mutation {
    importTasksCsv(productId: ID!, csv: String!, mode: TaskImportMode!): TaskImportResult!
    importProductsCsv(csv: String!): ProductImportResult!
    exportCustomerAdoptionToExcel(customerId: ID!, customerProductId: ID!): ExcelExportResult!
    importCustomerAdoptionFromExcel(content: String!): CustomerAdoptionImportResult!
    importDryRun(content: String!, entityType: EntityType): ImportDryRunResult!
    importCommit(sessionId: String!): ImportCommitResult!
    importExtendSession(sessionId: String!): Boolean!
    importCancelSession(sessionId: String!): Boolean!
    exportAdoptionPlanTelemetryTemplate(adoptionPlanId: ID!): TelemetryTemplateExport!
    importAdoptionPlanTelemetry(adoptionPlanId: ID!, file: Upload!): TelemetryImportResult!
    exportSolutionAdoptionPlanTelemetryTemplate(solutionAdoptionPlanId: ID!): TelemetryTemplateExport!
    importSolutionAdoptionPlanTelemetry(solutionAdoptionPlanId: ID!, file: Upload!): TelemetryImportResult!
  }

  type ImportProgress {
    sessionId: String!
    status: String!
    progress: Int!
    message: String
  }

  extend type Subscription {
    importProgress(sessionId: String!): ImportProgress!
  }
`;
