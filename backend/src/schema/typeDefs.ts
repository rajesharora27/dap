import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  scalar DateTime

  enum Role { ADMIN USER }
  enum LicenseLevel { Essential Advantage Signature }
  enum CustomerTaskStatus { NOT_STARTED IN_PROGRESS COMPLETED DONE NOT_APPLICABLE }
  enum StatusUpdateSource { MANUAL TELEMETRY IMPORT SYSTEM }

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

  type Release implements Node {
    id: ID!
    name: String!
    description: String
    level: Float!                   # Decimal level (1.0, 1.1, 2.0, etc.)
    isActive: Boolean!              # Whether this release is currently active
    product: Product                # Product this release belongs to
    productId: ID                   # Product this release belongs to
    tasks: [Task!]!                 # Tasks directly assigned to this release
    inheritedTasks: [Task!]!        # Tasks available through inheritance from lower releases
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
    releases: [Release!]!
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
    releases: [Release!]!
  }

  type Customer implements Node {
    id: ID!
    name: String!
    description: String
    products: [CustomerProductWithPlan!]!
    solutions: [Solution!]!
  }

  type Task implements Node {
    id: ID!
    name: String!
    description: String
    estMinutes: Int!
    notes: String
    weight: Float!                  # Weightage percentage (sum in parent = 100%, supports decimals like 0.01%)
    sequenceNumber: Int!            # Execution sequence number
    licenseLevel: LicenseLevel!     # License level required for this task (backward compatibility)
    howToDoc: [String!]!            # HTTP links explaining how to implement the task
    howToVideo: [String!]!          # Links to videos explaining how to implement the task
    product: Product                # Parent product (mutually exclusive with solution)
    solution: Solution              # Parent solution (mutually exclusive with product)
    outcomes: [Outcome!]!           # Outcomes this task contributes to
    license: License                # Single license associated with this task (hierarchical)
    releases: [Release!]!           # Releases this task is directly assigned to
    availableInReleases: [Release!]! # All releases this task is available in (including inheritance)
    telemetryAttributes: [TelemetryAttribute!]! # Telemetry attributes for this task
    isCompleteBasedOnTelemetry: Boolean! # Computed field based on telemetry criteria
    telemetryCompletionPercentage: Float! # 0-100% completion based on telemetry
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
  
  type TelemetryAttribute implements Node {
    id: ID!
    taskId: ID!
    name: String!
    description: String
    dataType: TelemetryDataType!
    isRequired: Boolean!
    successCriteria: JSON!
    order: Int!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    task: Task!
    values(limit: Int): [TelemetryValue!]!
    currentValue: TelemetryValue
    isSuccessful: Boolean!           # Computed field based on success criteria
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

  enum TelemetryDataType {
    BOOLEAN
    NUMBER
    STRING
    TIMESTAMP
    JSON
  }
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
    product(id: ID!): Product
    products(first: Int, after: String, last: Int, before: String): ProductConnection!
    solutions(first: Int, after: String, last: Int, before: String): ProductConnection! # simplified
    tasks(first: Int, after: String, last: Int, before: String, productId: ID, solutionId: ID): TaskConnection!
    customers: [Customer!]!
    licenses: [License!]!
    releases(productId: ID): [Release!]!
    taskStatuses: [TaskStatus!]!
    outcomes(productId: ID): [Outcome!]!
    auditLogs(limit: Int = 50): [AuditLog!]!
    changeSets(limit: Int = 50): [ChangeSet!]!
    changeSet(id: ID!): ChangeSet
    search(query: String!, first: Int = 20, after: String): [SearchResult!]!
    telemetry(taskId: ID!, limit: Int = 50): [TelemetryEdge!]!
    
    # Telemetry Attribute queries
    telemetryAttribute(id: ID!): TelemetryAttribute
    telemetryAttributes(taskId: ID!): [TelemetryAttribute!]!
    telemetryValue(id: ID!): TelemetryValue
    telemetryValues(attributeId: ID!, limit: Int = 50): [TelemetryValue!]!
    telemetryValuesByBatch(batchId: String!): [TelemetryValue!]!
    
    taskDependencies(taskId: ID!): [TaskDependencyEdge!]!
    
    # Customer Adoption queries
    customer(id: ID!): Customer
    adoptionPlan(id: ID!): AdoptionPlan
    adoptionPlansForCustomer(customerId: ID!): [AdoptionPlan!]!
    customerTask(id: ID!): CustomerTask
    customerTasksForPlan(adoptionPlanId: ID!, status: CustomerTaskStatus): [CustomerTask!]!
    customerTelemetryDatabase(customerId: ID, customerProductId: ID): [CustomerTelemetryRecord!]!
    
    # Excel Export
    exportProductToExcel(productName: String!): ExcelExportResult!
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

  enum ImportMode {
    CREATE_NEW
    UPDATE_EXISTING
    CREATE_OR_UPDATE
  }

  type ImportResult {
    success: Boolean!
    productId: String
    productName: String!
    stats: ImportStats!
    errors: [ValidationError!]!
    warnings: [ValidationError!]!
  }

  type ImportStats {
    tasksImported: Int!
    outcomesImported: Int!
    releasesImported: Int!
    licensesImported: Int!
    customAttributesImported: Int!
    telemetryAttributesImported: Int!
  }

  type CustomerAdoptionImportResult {
    success: Boolean!
    customerId: String!
    customerName: String!
    customerProductId: String!
    productName: String!
    stats: CustomerAdoptionImportStats!
    errors: [ValidationError!]!
    warnings: [ValidationError!]!
  }

  type CustomerAdoptionImportStats {
    telemetryValuesImported: Int!
    taskStatusesUpdated: Int!
    attributesCreated: Int!
  }

  type CustomerTelemetryRecord {
    customerId: ID!
    customerName: String!
    customerProductId: ID!
    productId: ID!
    productName: String!
    licenseLevel: String!
    adoptionPlanId: ID!
    taskId: ID!
    taskName: String!
    taskSequenceNumber: Int!
    attributeId: ID!
    attributeName: String!
    attributeType: String!
    attributeRequired: Boolean!
    attributeCriteria: JSON
    latestValue: JSON
    latestValueDate: DateTime
    criteriaMet: Boolean
    taskStatus: String!
  }

  type ValidationError {
    sheet: String!
    row: Int
    column: String
    field: String
    message: String!
    severity: String!
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
  input ReleaseInput {
    name: String!
    description: String
    level: Float!               # Decimal level (1.0, 1.1, 2.0, etc.)
    isActive: Boolean
    productId: ID!              # Product this release belongs to
  }
  input TaskStatusInput { code: String! label: String! }
  input OutcomeInput { name: String! description: String productId: ID! }
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
    howToDoc: [String!]             # HTTP links explaining how to implement the task
    howToVideo: [String!]           # Links to videos explaining how to implement the task
    outcomeIds: [ID!]
    licenseId: ID                   # Single license ID for hierarchical system
    releaseIds: [ID!]               # Release IDs this task should be assigned to
  }

  input TaskUpdateInput { 
    name: String
    description: String 
    estMinutes: Int 
    weight: Float 
    sequenceNumber: Int 
    licenseLevel: LicenseLevel
    notes: String 
    howToDoc: [String!]             # HTTP links explaining how to implement the task
    howToVideo: [String!]           # Links to videos explaining how to implement the task
    outcomeIds: [ID!]
    licenseId: ID                   # Single license ID for hierarchical system
    releaseIds: [ID!]               # Release IDs this task should be assigned to
  }

  input TelemetryAttributeInput {
    taskId: ID!
    name: String!
    description: String
    dataType: TelemetryDataType!
    isRequired: Boolean = false
    successCriteria: JSON!
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
  createRelease(input: ReleaseInput!): Release!
  updateRelease(id: ID!, input: ReleaseInput!): Release!
  deleteRelease(id: ID!): Boolean!
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
    createTask(input: TaskCreateInput!): Task!
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
  
  # Telemetry Attribute mutations
  createTelemetryAttribute(input: TelemetryAttributeInput!): TelemetryAttribute!
  updateTelemetryAttribute(id: ID!, input: TelemetryAttributeUpdateInput!): TelemetryAttribute!
  deleteTelemetryAttribute(id: ID!): Boolean!
  
  # Telemetry Value mutations  
  addTelemetryValue(input: TelemetryValueInput!): TelemetryValue!
  addBatchTelemetryValues(input: BatchTelemetryValueInput!): [TelemetryValue!]!
  updateTelemetryValue(id: ID!, value: JSON!, notes: String): TelemetryValue!
  deleteTelemetryValue(id: ID!): Boolean!
  
  queueTaskSoftDelete(id: ID!): Boolean!
  processDeletionQueue(limit: Int = 50): Int!
  
  # Excel Import/Export mutations
  importProductFromExcel(content: String!, mode: ImportMode!): ImportResult!
  exportCustomerAdoptionToExcel(customerId: ID!, customerProductId: ID!): ExcelExportResult!
  importCustomerAdoptionFromExcel(content: String!): CustomerAdoptionImportResult!
  
  # Customer Adoption mutations
  assignProductToCustomer(input: AssignProductToCustomerInput!): CustomerProductWithPlan!
  updateCustomerProduct(id: ID!, input: UpdateCustomerProductInput!): CustomerProductWithPlan!
  removeProductFromCustomerEnhanced(id: ID!): DeleteResult!
  createAdoptionPlan(customerProductId: ID!): AdoptionPlan!
  syncAdoptionPlan(adoptionPlanId: ID!): AdoptionPlan!
  updateCustomerTaskStatus(input: UpdateCustomerTaskStatusInput!): CustomerTask!
  bulkUpdateCustomerTaskStatus(adoptionPlanId: ID!, taskIds: [ID!]!, status: CustomerTaskStatus!, notes: String): [CustomerTask!]!
  addCustomerTelemetryValue(input: AddCustomerTelemetryValueInput!): CustomerTelemetryValue!
  bulkAddCustomerTelemetryValues(inputs: [AddCustomerTelemetryValueInput!]!): [CustomerTelemetryValue!]!
  evaluateTaskTelemetry(customerTaskId: ID!): CustomerTask!
  evaluateAllTasksTelemetry(adoptionPlanId: ID!): AdoptionPlan!
  
  # Telemetry Import/Export
  exportAdoptionPlanTelemetryTemplate(adoptionPlanId: ID!): TelemetryTemplateExport!
  importAdoptionPlanTelemetry(adoptionPlanId: ID!, file: Upload!): TelemetryImportResult!
  }

  # Telemetry Import/Export Types
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

  union SearchResult = Product | Task | Solution | Customer

  # Customer Adoption Types
  type CustomerProductWithPlan {
    id: ID!
    customer: Customer!
    product: Product!
    name: String!
    licenseLevel: LicenseLevel!
    selectedOutcomes: [Outcome!]!
    selectedReleases: [Release!]!
    adoptionPlan: AdoptionPlan
    purchasedAt: String!
    createdAt: String!
    updatedAt: String!
  }

  type AdoptionPlan {
    id: ID!
    customerProduct: CustomerProductWithPlan!
    productId: ID!
    productName: String!
    licenseLevel: LicenseLevel!
    selectedOutcomes: [Outcome!]!
    selectedReleases: [Release!]!
    totalTasks: Int!
    completedTasks: Int!
    totalWeight: Float!
    completedWeight: Float!
    progressPercentage: Float!
    tasks: [CustomerTask!]!
    tasksByStatus(status: CustomerTaskStatus): [CustomerTask!]!
    createdAt: String!
    updatedAt: String!
    lastSyncedAt: String
    needsSync: Boolean!
  }

  type CustomerTask {
    id: ID!
    adoptionPlan: AdoptionPlan!
    originalTaskId: ID!
    name: String!
    description: String
    estMinutes: Int!
    weight: Float!
    sequenceNumber: Int!
    howToDoc: [String!]!
    howToVideo: [String!]!
    notes: String
    licenseLevel: LicenseLevel!
    status: CustomerTaskStatus!
    statusUpdatedAt: String
    statusUpdatedBy: String
    statusUpdateSource: StatusUpdateSource
    statusNotes: String
    isComplete: Boolean!
    completedAt: String
    completedBy: String
    telemetryAttributes: [CustomerTelemetryAttribute!]!
    outcomes: [Outcome!]!
    releases: [Release!]!
    telemetryProgress: TelemetryProgress!
    createdAt: String!
    updatedAt: String!
  }

  type CustomerTelemetryAttribute {
    id: ID!
    customerTask: CustomerTask!
    originalAttributeId: ID
    name: String!
    description: String
    dataType: TelemetryDataType!
    isRequired: Boolean!
    successCriteria: JSON!
    order: Int!
    isActive: Boolean!
    isMet: Boolean!
    lastCheckedAt: String
    values: [CustomerTelemetryValue!]!
    latestValue: CustomerTelemetryValue
    createdAt: String!
    updatedAt: String!
  }

  type CustomerTelemetryValue {
    id: ID!
    customerAttribute: CustomerTelemetryAttribute!
    value: JSON!
    source: String
    batchId: String
    notes: String
    createdAt: String!
  }

  type TelemetryProgress {
    totalAttributes: Int!
    requiredAttributes: Int!
    metAttributes: Int!
    metRequiredAttributes: Int!
    completionPercentage: Float!
    allRequiredMet: Boolean!
  }

  type DeleteResult {
    success: Boolean!
    message: String
  }

  # Customer Adoption Input Types
  input AssignProductToCustomerInput {
    customerId: ID!
    productId: ID!
    name: String!
    licenseLevel: LicenseLevel!
    selectedOutcomeIds: [ID!]!
    selectedReleaseIds: [ID!]!
  }

  input UpdateCustomerProductInput {
    name: String
    licenseLevel: LicenseLevel
    selectedOutcomeIds: [ID!]
    selectedReleaseIds: [ID!]
  }

  input UpdateCustomerTaskStatusInput {
    customerTaskId: ID!
    status: CustomerTaskStatus!
    notes: String
  }

  input AddCustomerTelemetryValueInput {
    customerAttributeId: ID!
    value: JSON!
    source: String
    batchId: String
    notes: String
  }

  type Subscription {
    productUpdated: Product!
    taskUpdated: Task!
  }
`;
