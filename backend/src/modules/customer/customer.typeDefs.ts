import gql from 'graphql-tag';

export const customerTypeDefs = gql`
  type Customer implements Node {
    id: ID!
    name: String!
    description: String
    customAttrs: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    products: [CustomerProductWithPlan!]!
    solutions: [CustomerSolutionWithPlan!]!
    overviewMetrics: CustomerMetrics!
  }

  type CustomerMetrics {
    adoption: Float!
    velocity: Int!
    totalTasks: Int!
    completedTasks: Int!
    productsCount: Int!
    solutionsCount: Int!
    directProductsCount: Int!
    solutionProductsCount: Int!
  }

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
    tags: [CustomerProductTag!]!
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
    filterPreference: AdoptionPlanFilterPreference
  }

  type AdoptionPlanFilterPreference {
    id: ID!
    adoptionPlanId: ID!
    filterReleases: [ID!]!
    filterOutcomes: [ID!]!
    filterTags: [ID!]!
    createdAt: String!
    updatedAt: String!
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
    tags: [CustomerProductTag!]!
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
    criteriaMet: Boolean
  }

  type TelemetryProgress {
    totalAttributes: Int!
    requiredAttributes: Int!
    metAttributes: Int!
    metRequiredAttributes: Int!
    completionPercentage: Float!
    allRequiredMet: Boolean!
  }

  type CustomerSolutionWithPlan {
    id: ID!
    customer: Customer!
    solution: Solution!
    name: String!
    licenseLevel: LicenseLevel!
    selectedOutcomes: [Outcome!]!
    selectedReleases: [Release!]!
    products: [CustomerProductWithPlan!]!
    adoptionPlan: SolutionAdoptionPlan
    purchasedAt: String!
    createdAt: String!
    updatedAt: String!
    tags: [CustomerSolutionTag!]!
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
    tags: [CustomerSolutionTag!]!
  }

  input CustomerInput { name: String! description: String }

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

  input UpdateFilterPreferenceInput {
    adoptionPlanId: ID!
    filterReleases: [ID!]!
    filterOutcomes: [ID!]!
    filterTags: [ID!]!
  }

  input AssignSolutionToCustomerInput {
    customerId: ID!
    solutionId: ID!
    name: String!
    licenseLevel: LicenseLevel!
    selectedOutcomeIds: [ID!]!
    selectedReleaseIds: [ID!]!
    includedProductIds: [ID!]!
  }

  input UpdateCustomerSolutionInput {
    name: String
    licenseLevel: LicenseLevel
    selectedOutcomeIds: [ID!]
    selectedReleaseIds: [ID!]
    includedProductIds: [ID!]
  }

  input UpdateCustomerSolutionTaskStatusInput {
    customerSolutionTaskId: ID!
    status: CustomerTaskStatus!
    notes: String
    updateSource: StatusUpdateSource
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

  enum BottleneckType { TASK PRODUCT DEPENDENCY TELEMETRY }
  enum Severity { LOW MEDIUM HIGH CRITICAL }
  enum RiskLevel { LOW MEDIUM HIGH CRITICAL }

  type DeleteResult {
    success: Boolean!
    message: String
  }


  extend type Query {
    customer(id: ID!): Customer
    customers: [Customer!]!
    adoptionPlan(id: ID!): AdoptionPlan
    adoptionPlansForCustomer(customerId: ID!): [AdoptionPlan!]!
    customerTask(id: ID!): CustomerTask
    customerSolution(id: ID!): CustomerSolutionWithPlan
    customerTasksForPlan(adoptionPlanId: ID!, status: CustomerTaskStatus): [CustomerTask!]!
    customerTelemetryDatabase(customerId: ID, customerProductId: ID): [CustomerTelemetryRecord!]!
    
    solutionAdoptionPlan(id: ID!): SolutionAdoptionPlan
    solutionAdoptionPlansForCustomer(customerId: ID!): [SolutionAdoptionPlan!]!
    customerSolutionTask(id: ID!): CustomerSolutionTask
    customerSolutionTasksForPlan(solutionAdoptionPlanId: ID!, status: CustomerTaskStatus): [CustomerSolutionTask!]!
    
    solutionAdoptionReport(solutionAdoptionPlanId: ID!): SolutionAdoptionReport!
    solutionComparisonReport(solutionId: ID!): SolutionComparisonReport!
  }

  extend type Mutation {
    createCustomer(input: CustomerInput!): Customer!
    updateCustomer(id: ID!, input: CustomerInput!): Customer!
    deleteCustomer(id: ID!): Boolean!
    addProductToCustomer(customerId: ID!, productId: ID!): Boolean!
    removeProductFromCustomer(customerId: ID!, productId: ID!): Boolean!
    addSolutionToCustomer(customerId: ID!, solutionId: ID!): Boolean!
    removeSolutionFromCustomer(customerId: ID!, solutionId: ID!): Boolean!
    
    assignProductToCustomer(input: AssignProductToCustomerInput!): CustomerProductWithPlan!
    updateCustomerProduct(id: ID!, input: UpdateCustomerProductInput!): CustomerProductWithPlan!
    removeProductFromCustomerEnhanced(id: ID!): DeleteResult!
    createAdoptionPlan(customerProductId: ID!): AdoptionPlan!
    syncAdoptionPlan(adoptionPlanId: ID!): AdoptionPlan!
    updateCustomerTaskStatus(input: UpdateCustomerTaskStatusInput!): CustomerTask!
    addCustomerTelemetryValue(input: AddCustomerTelemetryValueInput!): CustomerTelemetryValue!
    bulkAddCustomerTelemetryValues(inputs: [AddCustomerTelemetryValueInput!]!): [CustomerTelemetryValue!]!
    evaluateTaskTelemetry(customerTaskId: ID!): CustomerTask!
    bulkUpdateCustomerTaskStatus(adoptionPlanId: ID!, taskIds: [ID!]!, status: CustomerTaskStatus!, notes: String): [CustomerTask!]!
    
    assignSolutionToCustomer(input: AssignSolutionToCustomerInput!): CustomerSolutionWithPlan!
    updateCustomerSolution(id: ID!, input: UpdateCustomerSolutionInput!): CustomerSolutionWithPlan!
    removeSolutionFromCustomerEnhanced(id: ID!): DeleteResult!
    createSolutionAdoptionPlan(customerSolutionId: ID!): SolutionAdoptionPlan!
    syncSolutionProducts(solutionAdoptionPlanId: ID!): SolutionAdoptionPlan!
    syncSolutionDefinition(solutionAdoptionPlanId: ID!): SolutionAdoptionPlan!
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: ID!): SolutionAdoptionPlan!
    updateCustomerSolutionTaskStatus(input: UpdateCustomerSolutionTaskStatusInput!): CustomerSolutionTask!
    bulkUpdateCustomerSolutionTaskStatus(solutionAdoptionPlanId: ID!, taskIds: [ID!]!, status: CustomerTaskStatus!, notes: String): [CustomerSolutionTask!]!
    evaluateSolutionTaskTelemetry(customerSolutionTaskId: ID!): CustomerSolutionTask!
    updateAdoptionPlanFilterPreference(input: UpdateFilterPreferenceInput!): AdoptionPlanFilterPreference!
  }
`;
