import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  scalar DateTime
  scalar Upload

  enum Role { ADMIN USER }
  enum LicenseLevel { Essential Advantage Signature }
  enum CustomerTaskStatus { NOT_STARTED IN_PROGRESS COMPLETED DONE NOT_APPLICABLE NO_LONGER_USING }
  enum StatusUpdateSource { MANUAL TELEMETRY IMPORT SYSTEM }
  enum TaskSourceType { SOLUTION PRODUCT }
  enum SolutionProductStatus { NOT_STARTED IN_PROGRESS COMPLETED BLOCKED SKIPPED }

  interface Node { id: ID! }

  type PageInfo { hasNextPage: Boolean! hasPreviousPage: Boolean! startCursor: String endCursor: String }

  type User implements Node { id: ID! email: String! username: String name: String role: Role! }

  type TaskStatus implements Node { id: ID! code: String! label: String! }

  type Outcome implements Node {
    id: ID!
    name: String!
    description: String
    product: Product
    solution: Solution
    productId: ID
    solutionId: ID
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
    outcomes: [Outcome!]!
  }

  type Customer implements Node {
    id: ID!
    name: String!
    description: String
    products: [CustomerProductWithPlan!]!
    solutions: [CustomerSolutionWithPlan!]!
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
    successCriteria: JSON
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
  type SolutionEdge { cursor: String! node: Solution! }
  type SolutionConnection { edges: [SolutionEdge!]! pageInfo: PageInfo! totalCount: Int! }

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



  # Solution Reporting Types
  type SolutionAdoptionReport {
    solutionAdoptionPlanId: ID!
    customerName: String!
    solutionName: String!
    licenseLevel: String!
    overallProgress: Float!
    taskCompletionPercentage: Float!
    estimatedCompletionDate: String
    daysInProgress: Int!
    totalTasks: Int!
    completedTasks: Int!
    inProgressTasks: Int!
    notStartedTasks: Int!
    blockedTasks: Int!
    productProgress: [ProductProgressReport!]!
    bottlenecks: [BottleneckReport!]!
    healthScore: Float!
    telemetryHealthScore: Float!
    riskLevel: RiskLevel!
    onTrack: Boolean!
    estimatedDaysRemaining: Int
    recommendations: [String!]!
  }

  type ProductProgressReport {
    productId: ID!
    productName: String!
    status: SolutionProductStatus!
    progress: Float!
    completedTasks: Int!
    totalTasks: Int!
    averageTaskCompletionTime: Float
    estimatedCompletionDate: String
  }

  type BottleneckReport {
    type: BottleneckType!
    severity: Severity!
    title: String!
    description: String!
    affectedTaskIds: [ID!]!
    affectedProductIds: [ID!]!
    suggestedAction: String!
    estimatedImpactDays: Int
  }

  type SolutionComparisonReport {
    solutionId: ID!
    solutionName: String!
    totalCustomers: Int!
    averageProgress: Float!
    averageTimeToComplete: Float
    successRate: Float!
    commonBottlenecks: [BottleneckSummary!]!
    bestPerformingCustomers: [CustomerPerformance!]!
    strugglingCustomers: [CustomerPerformance!]!
  }

  type BottleneckSummary {
    bottleneckType: String!
    occurrenceCount: Int!
    averageResolutionTime: Float
    affectedCustomerPercentage: Float!
  }

  type CustomerPerformance {
    customerId: ID!
    customerName: String!
    progress: Float!
    daysInProgress: Int!
    healthScore: Float!
  }

  enum BottleneckType {
    TASK
    PRODUCT
    DEPENDENCY
    TELEMETRY
  }

  enum Severity {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  enum RiskLevel {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type Query {
    node(id: ID!): Node
    product(id: ID!): Product
    products(first: Int, after: String, last: Int, before: String): ProductConnection!
    solutions(first: Int, after: String, last: Int, before: String): SolutionConnection!
    tasks(first: Int, after: String, last: Int, before: String, productId: ID, solutionId: ID): TaskConnection!
    customers: [Customer!]!
    licenses: [License!]!
    releases(productId: ID): [Release!]!
    taskStatuses: [TaskStatus!]!
    outcomes(productId: ID, solutionId: ID): [Outcome!]!
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
    customerSolution(id: ID!): CustomerSolutionWithPlan
    customerTasksForPlan(adoptionPlanId: ID!, status: CustomerTaskStatus): [CustomerTask!]!
    customerTelemetryDatabase(customerId: ID, customerProductId: ID): [CustomerTelemetryRecord!]!
    
    # Solution Adoption queries
    solutionAdoptionPlan(id: ID!): SolutionAdoptionPlan
    solutionAdoptionPlansForCustomer(customerId: ID!): [SolutionAdoptionPlan!]!
    customerSolutionTask(id: ID!): CustomerSolutionTask
    customerSolutionTasksForPlan(solutionAdoptionPlanId: ID!, status: CustomerTaskStatus): [CustomerSolutionTask!]!
    
    # Solution Reporting queries
    solutionAdoptionReport(solutionAdoptionPlanId: ID!): SolutionAdoptionReport!
    solutionComparisonReport(solutionId: ID!): SolutionComparisonReport!
    
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
    productId: ID               # Product this release belongs to (optional - either productId or solutionId)
    solutionId: ID              # Solution this release belongs to (optional - either productId or solutionId)
  }
  input TaskStatusInput { code: String! label: String! }
  input OutcomeInput { name: String! description: String productId: ID solutionId: ID }
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
  reorderTasks(productId: ID, solutionId: ID, order: [ID!]!): Boolean!
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
  
  # Solution Adoption mutations
  assignSolutionToCustomer(input: AssignSolutionToCustomerInput!): CustomerSolutionWithPlan!
  updateCustomerSolution(id: ID!, input: UpdateCustomerSolutionInput!): CustomerSolutionWithPlan!
  removeSolutionFromCustomerEnhanced(id: ID!): DeleteResult!
  createSolutionAdoptionPlan(customerSolutionId: ID!): SolutionAdoptionPlan!
  syncSolutionAdoptionPlan(solutionAdoptionPlanId: ID!): SolutionAdoptionPlan!
  updateCustomerSolutionTaskStatus(input: UpdateCustomerSolutionTaskStatusInput!): CustomerSolutionTask!
  bulkUpdateCustomerSolutionTaskStatus(solutionAdoptionPlanId: ID!, taskIds: [ID!]!, status: CustomerTaskStatus!, notes: String): [CustomerSolutionTask!]!
  evaluateSolutionTaskTelemetry(customerSolutionTaskId: ID!): CustomerSolutionTask!
  evaluateAllSolutionTasksTelemetry(solutionAdoptionPlanId: ID!): SolutionAdoptionPlan!
  
  # Solution product management
  addProductToSolutionEnhanced(solutionId: ID!, productId: ID!, order: Int): Boolean!
  removeProductFromSolutionEnhanced(solutionId: ID!, productId: ID!): Boolean!
  reorderProductsInSolution(solutionId: ID!, productOrders: [ProductOrderInput!]!): Boolean!
  
  # Data Migration
  migrateProductNamesToNewFormat: ProductNameMigrationResult!
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
    customerSolutionId: ID
    customerSolution: CustomerSolutionWithPlan
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
    successCriteria: JSON
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
    criteriaMet: Boolean    # Computed field: whether value meets success criteria
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

  type ProductNameMigrationResult {
    totalChecked: Int!
    migratedCount: Int!
    alreadyCorrectCount: Int!
    message: String!
  }

  # Solution Adoption Types
  type CustomerSolutionWithPlan {
    id: ID!
    customer: Customer!
    solution: Solution!
    name: String!
    licenseLevel: LicenseLevel!
    selectedOutcomes: [Outcome!]!
    selectedReleases: [Release!]!
    adoptionPlan: SolutionAdoptionPlan
    purchasedAt: String!
    createdAt: String!
    updatedAt: String!
  }

  type SolutionAdoptionPlan {
    id: ID!
    customerSolution: CustomerSolutionWithPlan!
    solutionId: ID!
    solutionName: String!
    licenseLevel: LicenseLevel!
    selectedOutcomes: [Outcome!]!
    selectedReleases: [Release!]!
    includedProductIds: [ID!]!
    totalTasks: Int!
    completedTasks: Int!
    totalWeight: Float!
    completedWeight: Float!
    progressPercentage: Float!
    solutionTasksTotal: Int!
    solutionTasksComplete: Int!
    products: [SolutionAdoptionProduct!]!
    tasks: [CustomerSolutionTask!]!
    tasksByStatus(status: CustomerTaskStatus): [CustomerSolutionTask!]!
    createdAt: String!
    updatedAt: String!
    lastSyncedAt: String
    needsSync: Boolean!
  }

  type SolutionAdoptionProduct {
    id: ID!
    solutionAdoptionPlan: SolutionAdoptionPlan!
    productId: ID!
    productName: String!
    sequenceNumber: Int!
    status: SolutionProductStatus!
    totalTasks: Int!
    completedTasks: Int!
    totalWeight: Float!
    completedWeight: Float!
    progressPercentage: Float!
    productAdoptionPlan: AdoptionPlan
    createdAt: String!
    updatedAt: String!
  }

  type CustomerSolutionTask {
    id: ID!
    solutionAdoptionPlan: SolutionAdoptionPlan!
    originalTaskId: ID!
    sourceType: TaskSourceType!
    sourceProductId: ID
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
    updateSource: StatusUpdateSource
  }

  input AddCustomerTelemetryValueInput {
    customerAttributeId: ID!
    value: JSON!
    source: String
    batchId: String
    notes: String
  }

  # Solution Adoption Input Types
  input AssignSolutionToCustomerInput {
    customerId: ID!
    solutionId: ID!
    name: String!
    licenseLevel: LicenseLevel!
    selectedOutcomeIds: [ID!]!
    selectedReleaseIds: [ID!]!
  }

  input UpdateCustomerSolutionInput {
    name: String
    licenseLevel: LicenseLevel
    selectedOutcomeIds: [ID!]
    selectedReleaseIds: [ID!]
  }

  input UpdateCustomerSolutionTaskStatusInput {
    customerSolutionTaskId: ID!
    status: CustomerTaskStatus!
    notes: String
    updateSource: StatusUpdateSource
  }

  input ProductOrderInput {
    productId: ID!
    order: Int!
  }

  type Subscription {
    productUpdated: Product!
    taskUpdated: Task!
  }

  # Backup and Restore Types
  type BackupMetadata {
    id: String!
    filename: String!
    timestamp: DateTime!
    size: Int!
    databaseUrl: String!
    recordCounts: BackupRecordCounts!
  }

  type BackupRecordCounts {
    users: Int!
    products: Int!
    solutions: Int!
    customers: Int!
    customerProducts: Int!
    customerSolutions: Int!
    adoptionPlans: Int!
    solutionAdoptionPlans: Int!
    tasks: Int!
    customerTasks: Int!
    customerSolutionTasks: Int!
  }

  type BackupResult {
    success: Boolean!
    filename: String
    size: Int
    url: String
    metadata: BackupMetadata
    message: String
    error: String
  }

  type RestoreResult {
    success: Boolean!
    message: String!
    recordsRestored: BackupRecordCounts
    error: String
  }

  type DeleteBackupResult {
    success: Boolean!
    message: String!
  }

  extend type Query {
    """
    List all available database backups
    """
    listBackups: [BackupMetadata!]!
  }

  extend type Mutation {
    """
    Create a new database backup (snapshot)
    """
    createBackup: BackupResult!

    """
    Restore database from a backup file
    """
    restoreBackup(filename: String!): RestoreResult!

    """
    Delete a backup file
    """
    deleteBackup(filename: String!): DeleteBackupResult!
  }
`;
