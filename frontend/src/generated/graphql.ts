export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: Record<string, any>; output: Record<string, any>; }
  Upload: { input: File | Blob; output: File | Blob; }
};

export type AiAgentAvailability = {
  __typename?: 'AIAgentAvailability';
  available: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
};

export type AiDataContextRefreshResult = {
  __typename?: 'AIDataContextRefreshResult';
  error?: Maybe<Scalars['String']['output']>;
  lastRefreshed?: Maybe<Scalars['DateTime']['output']>;
  statistics?: Maybe<AiDataContextStatistics>;
  success: Scalars['Boolean']['output'];
};

export type AiDataContextStatistics = {
  __typename?: 'AIDataContextStatistics';
  totalAdoptionPlans: Scalars['Int']['output'];
  totalCustomers: Scalars['Int']['output'];
  totalProducts: Scalars['Int']['output'];
  totalSolutions: Scalars['Int']['output'];
  totalTasks: Scalars['Int']['output'];
  totalTasksWithTelemetry: Scalars['Int']['output'];
  totalTasksWithoutTelemetry: Scalars['Int']['output'];
};

export type AiDataContextStatus = {
  __typename?: 'AIDataContextStatus';
  hasDataContext: Scalars['Boolean']['output'];
  initialized: Scalars['Boolean']['output'];
  lastRefreshed?: Maybe<Scalars['DateTime']['output']>;
};

export type AiQueryMetadata = {
  __typename?: 'AIQueryMetadata';
  cached: Scalars['Boolean']['output'];
  executionTime: Scalars['Int']['output'];
  providerUsed?: Maybe<Scalars['String']['output']>;
  rowCount: Scalars['Int']['output'];
  templateUsed?: Maybe<Scalars['String']['output']>;
  truncated: Scalars['Boolean']['output'];
};

export type AiQueryResponse = {
  __typename?: 'AIQueryResponse';
  answer: Scalars['String']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<AiQueryMetadata>;
  query?: Maybe<Scalars['String']['output']>;
  suggestions?: Maybe<Array<Scalars['String']['output']>>;
};

export type AddCustomerTelemetryValueInput = {
  batchId?: InputMaybe<Scalars['String']['input']>;
  customerAttributeId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['JSON']['input'];
};

export type AdoptionPlan = {
  __typename?: 'AdoptionPlan';
  completedTasks: Scalars['Int']['output'];
  completedWeight: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  customerProduct: CustomerProductWithPlan;
  filterPreference?: Maybe<AdoptionPlanFilterPreference>;
  id: Scalars['ID']['output'];
  lastSyncedAt?: Maybe<Scalars['String']['output']>;
  licenseLevel: LicenseLevel;
  needsSync: Scalars['Boolean']['output'];
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  progressPercentage: Scalars['Float']['output'];
  selectedOutcomes: Array<Outcome>;
  selectedReleases: Array<Release>;
  tasks: Array<CustomerTask>;
  tasksByStatus: Array<CustomerTask>;
  totalTasks: Scalars['Int']['output'];
  totalWeight: Scalars['Float']['output'];
  updatedAt: Scalars['String']['output'];
};


export type AdoptionPlanTasksByStatusArgs = {
  status?: InputMaybe<CustomerTaskStatus>;
};

export type AdoptionPlanFilterPreference = {
  __typename?: 'AdoptionPlanFilterPreference';
  adoptionPlanId: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  filterOutcomes: Array<Scalars['ID']['output']>;
  filterReleases: Array<Scalars['ID']['output']>;
  filterTags: Array<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
};

export type AssignProductToCustomerInput = {
  customerId: Scalars['ID']['input'];
  licenseLevel: LicenseLevel;
  name: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
  selectedOutcomeIds: Array<Scalars['ID']['input']>;
  selectedReleaseIds: Array<Scalars['ID']['input']>;
};

export type AssignSolutionToCustomerInput = {
  customerId: Scalars['ID']['input'];
  includedProductIds: Array<Scalars['ID']['input']>;
  licenseLevel: LicenseLevel;
  name: Scalars['String']['input'];
  selectedOutcomeIds: Array<Scalars['ID']['input']>;
  selectedReleaseIds: Array<Scalars['ID']['input']>;
  solutionId: Scalars['ID']['input'];
};

export type AuditLog = Node & {
  __typename?: 'AuditLog';
  action: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  details?: Maybe<Scalars['JSON']['output']>;
  entity?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
};

export type AuditLogEntry = {
  __typename?: 'AuditLogEntry';
  action: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  details?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  resourceId?: Maybe<Scalars['ID']['output']>;
  resourceType?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export type AuthTokens = {
  __typename?: 'AuthTokens';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
};

export type AutoBackupConfig = {
  __typename?: 'AutoBackupConfig';
  enabled: Scalars['Boolean']['output'];
  lastBackupTime?: Maybe<Scalars['DateTime']['output']>;
  nextRun?: Maybe<Scalars['DateTime']['output']>;
  retentionDays: Scalars['Int']['output'];
  schedule: Scalars['String']['output'];
};

export type AutoBackupUpdateInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  retentionDays?: InputMaybe<Scalars['Int']['input']>;
  schedule?: InputMaybe<Scalars['String']['input']>;
};

export type AvailableResource = {
  __typename?: 'AvailableResource';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type BackupFile = {
  __typename?: 'BackupFile';
  filename: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  path?: Maybe<Scalars['String']['output']>;
  recordCounts?: Maybe<RecordCounts>;
  size: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type BackupResult = {
  __typename?: 'BackupResult';
  error?: Maybe<Scalars['String']['output']>;
  filename?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<BackupFile>;
  size?: Maybe<Scalars['Int']['output']>;
  success: Scalars['Boolean']['output'];
  url?: Maybe<Scalars['String']['output']>;
};

export type BatchTelemetryValueInput = {
  batchId: Scalars['String']['input'];
  values: Array<TelemetryValueInput>;
};

export type BottleneckReport = {
  __typename?: 'BottleneckReport';
  affectedProductIds: Array<Scalars['ID']['output']>;
  affectedTaskIds: Array<Scalars['ID']['output']>;
  description: Scalars['String']['output'];
  estimatedImpactDays?: Maybe<Scalars['Int']['output']>;
  severity: Severity;
  suggestedAction: Scalars['String']['output'];
  title: Scalars['String']['output'];
  type: BottleneckType;
};

export type BottleneckSummary = {
  __typename?: 'BottleneckSummary';
  affectedCustomerPercentage: Scalars['Float']['output'];
  averageResolutionTime?: Maybe<Scalars['Float']['output']>;
  bottleneckType: Scalars['String']['output'];
  occurrenceCount: Scalars['Int']['output'];
};

export enum BottleneckType {
  Dependency = 'DEPENDENCY',
  Product = 'PRODUCT',
  Task = 'TASK',
  Telemetry = 'TELEMETRY'
}

export type ChangeItem = Node & {
  __typename?: 'ChangeItem';
  after?: Maybe<Scalars['JSON']['output']>;
  before?: Maybe<Scalars['JSON']['output']>;
  entityId: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type ChangePasswordInput = {
  newPassword: Scalars['String']['input'];
  oldPassword?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};

export type ChangeSet = Node & {
  __typename?: 'ChangeSet';
  committedAt?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  items: Array<ChangeItem>;
};

export type CreateDiaryBookmarkInput = {
  title: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type CreateDiaryTodoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  task: Scalars['String']['input'];
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissions?: InputMaybe<Array<ResourcePermissionInput>>;
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  fullName?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  role?: InputMaybe<Role>;
  username: Scalars['String']['input'];
};

export type Customer = Node & {
  __typename?: 'Customer';
  createdAt: Scalars['DateTime']['output'];
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  overviewMetrics: CustomerMetrics;
  products: Array<CustomerProductWithPlan>;
  solutions: Array<CustomerSolutionWithPlan>;
  updatedAt: Scalars['DateTime']['output'];
};

export type CustomerAdoptionImportResult = {
  __typename?: 'CustomerAdoptionImportResult';
  customerId: Scalars['String']['output'];
  customerName: Scalars['String']['output'];
  customerProductId: Scalars['String']['output'];
  errors: Array<ImportValidationError>;
  productName: Scalars['String']['output'];
  stats: CustomerAdoptionImportStats;
  success: Scalars['Boolean']['output'];
  warnings: Array<ImportValidationError>;
};

export type CustomerAdoptionImportStats = {
  __typename?: 'CustomerAdoptionImportStats';
  attributesCreated: Scalars['Int']['output'];
  taskStatusesUpdated: Scalars['Int']['output'];
  telemetryValuesImported: Scalars['Int']['output'];
};

export type CustomerInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CustomerMetrics = {
  __typename?: 'CustomerMetrics';
  adoption: Scalars['Float']['output'];
  completedTasks: Scalars['Int']['output'];
  directProductsCount: Scalars['Int']['output'];
  productsCount: Scalars['Int']['output'];
  solutionProductsCount: Scalars['Int']['output'];
  solutionsCount: Scalars['Int']['output'];
  totalTasks: Scalars['Int']['output'];
  velocity: Scalars['Int']['output'];
};

export type CustomerPerformance = {
  __typename?: 'CustomerPerformance';
  customerId: Scalars['ID']['output'];
  customerName: Scalars['String']['output'];
  daysInProgress: Scalars['Int']['output'];
  healthScore: Scalars['Float']['output'];
  progress: Scalars['Float']['output'];
};

export type CustomerProductTag = {
  __typename?: 'CustomerProductTag';
  color?: Maybe<Scalars['String']['output']>;
  customerProductId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  sourceTagId?: Maybe<Scalars['ID']['output']>;
};

export type CustomerProductWithPlan = {
  __typename?: 'CustomerProductWithPlan';
  adoptionPlan?: Maybe<AdoptionPlan>;
  createdAt: Scalars['String']['output'];
  customer: Customer;
  customerSolution?: Maybe<CustomerSolutionWithPlan>;
  customerSolutionId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  licenseLevel: LicenseLevel;
  name: Scalars['String']['output'];
  product: Product;
  purchasedAt: Scalars['String']['output'];
  selectedOutcomes: Array<Outcome>;
  selectedReleases: Array<Release>;
  tags: Array<CustomerProductTag>;
  updatedAt: Scalars['String']['output'];
};

export type CustomerSolutionTag = {
  __typename?: 'CustomerSolutionTag';
  color?: Maybe<Scalars['String']['output']>;
  customerSolutionId: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  sourceTagId?: Maybe<Scalars['ID']['output']>;
};

export type CustomerSolutionTask = {
  __typename?: 'CustomerSolutionTask';
  completedAt?: Maybe<Scalars['String']['output']>;
  completedBy?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  estMinutes: Scalars['Int']['output'];
  howToDoc: Array<Scalars['String']['output']>;
  howToVideo: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isComplete: Scalars['Boolean']['output'];
  licenseLevel: LicenseLevel;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  originalTaskId: Scalars['ID']['output'];
  outcomes: Array<Outcome>;
  releases: Array<Release>;
  sequenceNumber: Scalars['Int']['output'];
  solutionAdoptionPlan: SolutionAdoptionPlan;
  sourceProductId?: Maybe<Scalars['ID']['output']>;
  sourceType: TaskSourceType;
  status: CustomerTaskStatus;
  statusNotes?: Maybe<Scalars['String']['output']>;
  statusUpdateSource?: Maybe<StatusUpdateSource>;
  statusUpdatedAt?: Maybe<Scalars['String']['output']>;
  statusUpdatedBy?: Maybe<Scalars['String']['output']>;
  tags: Array<CustomerSolutionTag>;
  telemetryAttributes: Array<CustomerTelemetryAttribute>;
  telemetryProgress: TelemetryProgress;
  updatedAt: Scalars['String']['output'];
  weight: Scalars['Float']['output'];
};

export type CustomerSolutionTaskTag = {
  __typename?: 'CustomerSolutionTaskTag';
  customerSolutionTaskId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  tag: CustomerSolutionTag;
};

export type CustomerSolutionWithPlan = {
  __typename?: 'CustomerSolutionWithPlan';
  adoptionPlan?: Maybe<SolutionAdoptionPlan>;
  createdAt: Scalars['String']['output'];
  customer: Customer;
  id: Scalars['ID']['output'];
  licenseLevel: LicenseLevel;
  name: Scalars['String']['output'];
  products: Array<CustomerProductWithPlan>;
  purchasedAt: Scalars['String']['output'];
  selectedOutcomes: Array<Outcome>;
  selectedReleases: Array<Release>;
  solution: Solution;
  tags: Array<CustomerSolutionTag>;
  updatedAt: Scalars['String']['output'];
};

export type CustomerTask = {
  __typename?: 'CustomerTask';
  adoptionPlan: AdoptionPlan;
  completedAt?: Maybe<Scalars['String']['output']>;
  completedBy?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  estMinutes: Scalars['Int']['output'];
  howToDoc: Array<Scalars['String']['output']>;
  howToVideo: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isComplete: Scalars['Boolean']['output'];
  licenseLevel: LicenseLevel;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  originalTaskId: Scalars['ID']['output'];
  outcomes: Array<Outcome>;
  releases: Array<Release>;
  sequenceNumber: Scalars['Int']['output'];
  status: CustomerTaskStatus;
  statusNotes?: Maybe<Scalars['String']['output']>;
  statusUpdateSource?: Maybe<StatusUpdateSource>;
  statusUpdatedAt?: Maybe<Scalars['String']['output']>;
  statusUpdatedBy?: Maybe<Scalars['String']['output']>;
  tags: Array<CustomerProductTag>;
  telemetryAttributes: Array<CustomerTelemetryAttribute>;
  telemetryProgress: TelemetryProgress;
  updatedAt: Scalars['String']['output'];
  weight: Scalars['Float']['output'];
};

export enum CustomerTaskStatus {
  Completed = 'COMPLETED',
  Done = 'DONE',
  InProgress = 'IN_PROGRESS',
  NotApplicable = 'NOT_APPLICABLE',
  NotStarted = 'NOT_STARTED',
  NoLongerUsing = 'NO_LONGER_USING'
}

export type CustomerTaskTag = {
  __typename?: 'CustomerTaskTag';
  customerTaskId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  tag: CustomerProductTag;
};

export type CustomerTelemetryAttribute = {
  __typename?: 'CustomerTelemetryAttribute';
  createdAt: Scalars['String']['output'];
  customerTask: CustomerTask;
  dataType: TelemetryDataType;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isMet: Scalars['Boolean']['output'];
  isRequired: Scalars['Boolean']['output'];
  lastCheckedAt?: Maybe<Scalars['String']['output']>;
  latestValue?: Maybe<CustomerTelemetryValue>;
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  originalAttributeId?: Maybe<Scalars['ID']['output']>;
  successCriteria?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['String']['output'];
  values: Array<CustomerTelemetryValue>;
};

export type CustomerTelemetryRecord = {
  __typename?: 'CustomerTelemetryRecord';
  adoptionPlanId: Scalars['ID']['output'];
  attributeCriteria?: Maybe<Scalars['JSON']['output']>;
  attributeId: Scalars['ID']['output'];
  attributeName: Scalars['String']['output'];
  attributeRequired: Scalars['Boolean']['output'];
  attributeType: Scalars['String']['output'];
  criteriaMet?: Maybe<Scalars['Boolean']['output']>;
  customerId: Scalars['ID']['output'];
  customerName: Scalars['String']['output'];
  customerProductId: Scalars['ID']['output'];
  latestValue?: Maybe<Scalars['JSON']['output']>;
  latestValueDate?: Maybe<Scalars['DateTime']['output']>;
  licenseLevel: Scalars['String']['output'];
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  taskId: Scalars['ID']['output'];
  taskName: Scalars['String']['output'];
  taskSequenceNumber: Scalars['Int']['output'];
  taskStatus: Scalars['String']['output'];
};

export type CustomerTelemetryValue = {
  __typename?: 'CustomerTelemetryValue';
  batchId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  criteriaMet?: Maybe<Scalars['Boolean']['output']>;
  customerAttribute: CustomerTelemetryAttribute;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  value: Scalars['JSON']['output'];
};

export type DeleteResult = {
  __typename?: 'DeleteResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type DiaryBookmark = {
  __typename?: 'DiaryBookmark';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  sequenceNumber: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
};

export type DiaryTodo = {
  __typename?: 'DiaryTodo';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isCompleted: Scalars['Boolean']['output'];
  sequenceNumber: Scalars['Int']['output'];
  task: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type EntitySummary = {
  __typename?: 'EntitySummary';
  action: Scalars['String']['output'];
  existingId?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export enum EntityType {
  Product = 'PRODUCT',
  Solution = 'SOLUTION'
}

export type ExcelExportResult = {
  __typename?: 'ExcelExportResult';
  content: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  mimeType: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  stats: ExcelExportStats;
};

export type ExcelExportStats = {
  __typename?: 'ExcelExportStats';
  customAttributesExported: Scalars['Int']['output'];
  licensesExported: Scalars['Int']['output'];
  outcomesExported: Scalars['Int']['output'];
  releasesExported: Scalars['Int']['output'];
  tasksExported: Scalars['Int']['output'];
  telemetryAttributesExported: Scalars['Int']['output'];
};

export type FieldDiff = {
  __typename?: 'FieldDiff';
  displayNew: Scalars['String']['output'];
  displayOld: Scalars['String']['output'];
  field: Scalars['String']['output'];
  newValue?: Maybe<Scalars['JSON']['output']>;
  oldValue?: Maybe<Scalars['JSON']['output']>;
};

export type GrantPermissionInput = {
  permissionLevel: Scalars['String']['input'];
  resourceId?: InputMaybe<Scalars['ID']['input']>;
  resourceType: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type ImportCommitResult = {
  __typename?: 'ImportCommitResult';
  entityId?: Maybe<Scalars['String']['output']>;
  entityName: Scalars['String']['output'];
  errors: Array<ImportValidationError>;
  message: Scalars['String']['output'];
  stats?: Maybe<ImportStats>;
  success: Scalars['Boolean']['output'];
};

export type ImportDryRunResult = {
  __typename?: 'ImportDryRunResult';
  entitySummary: EntitySummary;
  entityType: EntityType;
  errors: Array<ImportValidationError>;
  isValid: Scalars['Boolean']['output'];
  records: RecordsSummary;
  sessionId: Scalars['String']['output'];
  summary: ImportSummary;
  warnings: Array<ImportValidationError>;
};

export type ImportStats = {
  __typename?: 'ImportStats';
  customAttributesCreated: Scalars['Int']['output'];
  customAttributesDeleted: Scalars['Int']['output'];
  customAttributesUpdated: Scalars['Int']['output'];
  licensesCreated: Scalars['Int']['output'];
  licensesDeleted: Scalars['Int']['output'];
  licensesUpdated: Scalars['Int']['output'];
  outcomesCreated: Scalars['Int']['output'];
  outcomesDeleted: Scalars['Int']['output'];
  outcomesUpdated: Scalars['Int']['output'];
  productLinksCreated: Scalars['Int']['output'];
  productLinksDeleted: Scalars['Int']['output'];
  productLinksUpdated: Scalars['Int']['output'];
  releasesCreated: Scalars['Int']['output'];
  releasesDeleted: Scalars['Int']['output'];
  releasesUpdated: Scalars['Int']['output'];
  tagsCreated: Scalars['Int']['output'];
  tagsDeleted: Scalars['Int']['output'];
  tagsUpdated: Scalars['Int']['output'];
  tasksCreated: Scalars['Int']['output'];
  tasksDeleted: Scalars['Int']['output'];
  tasksSkipped: Scalars['Int']['output'];
  tasksUpdated: Scalars['Int']['output'];
  telemetryAttributesCreated: Scalars['Int']['output'];
  telemetryAttributesDeleted: Scalars['Int']['output'];
  telemetryAttributesUpdated: Scalars['Int']['output'];
};

export type ImportSummary = {
  __typename?: 'ImportSummary';
  errorCount: Scalars['Int']['output'];
  toCreate: Scalars['Int']['output'];
  toDelete: Scalars['Int']['output'];
  toSkip: Scalars['Int']['output'];
  toUpdate: Scalars['Int']['output'];
  totalRecords: Scalars['Int']['output'];
  warningCount: Scalars['Int']['output'];
};

export type ImportValidationError = {
  __typename?: 'ImportValidationError';
  code: Scalars['String']['output'];
  column?: Maybe<Scalars['String']['output']>;
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  row: Scalars['Int']['output'];
  severity: Scalars['String']['output'];
  sheet: Scalars['String']['output'];
  value?: Maybe<Scalars['JSON']['output']>;
};

export type License = Node & {
  __typename?: 'License';
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayOrder: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  product?: Maybe<Product>;
  productId?: Maybe<Scalars['ID']['output']>;
  solution?: Maybe<Solution>;
  solutionId?: Maybe<Scalars['ID']['output']>;
};

export type LicenseInput = {
  customAttrs?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};

export enum LicenseLevel {
  Advantage = 'Advantage',
  Essential = 'Essential',
  Signature = 'Signature'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
  user: UserExtended;
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  activateUser: Scalars['Boolean']['output'];
  addBatchTelemetryValues: Array<TelemetryValue>;
  addCustomerTelemetryValue: CustomerTelemetryValue;
  addProductToCustomer: Scalars['Boolean']['output'];
  addProductToSolution: Scalars['Boolean']['output'];
  addProductToSolutionEnhanced: Scalars['Boolean']['output'];
  addSolutionTagToTask: Task;
  addSolutionToCustomer: Scalars['Boolean']['output'];
  addTagToTask: Task;
  addTaskDependency: Scalars['Boolean']['output'];
  addTelemetry: Scalars['Boolean']['output'];
  addTelemetryValue: TelemetryValue;
  assignProductToCustomer: CustomerProductWithPlan;
  assignRoleToUser: Scalars['Boolean']['output'];
  assignSolutionToCustomer: CustomerSolutionWithPlan;
  beginChangeSet: Scalars['ID']['output'];
  bulkAddCustomerTelemetryValues: Array<CustomerTelemetryValue>;
  bulkUpdateCustomerSolutionTaskStatus: Array<CustomerSolutionTask>;
  bulkUpdateCustomerTaskStatus: Array<CustomerTask>;
  changePassword: Scalars['Boolean']['output'];
  commitChangeSet: Scalars['Boolean']['output'];
  createAdoptionPlan: AdoptionPlan;
  createBackup: BackupResult;
  createCustomer: Customer;
  createDiaryBookmark: DiaryBookmark;
  createDiaryTodo: DiaryTodo;
  createLicense: License;
  createManualBackup: BackupResult;
  createOutcome: Outcome;
  createProduct: Product;
  createProductTag: ProductTag;
  createRelease: Release;
  createRole: RoleWithPermissions;
  createSolution: Solution;
  createSolutionAdoptionPlan: SolutionAdoptionPlan;
  createSolutionTag: SolutionTag;
  createTask: Task;
  createTaskStatus: TaskStatus;
  createTelemetryAttribute: TelemetryAttribute;
  createUser: UserExtended;
  deactivateUser: Scalars['Boolean']['output'];
  deleteBackup: BackupResult;
  deleteCustomer: Scalars['Boolean']['output'];
  deleteDiaryBookmark: Scalars['Boolean']['output'];
  deleteDiaryTodo: Scalars['Boolean']['output'];
  deleteLicense: Scalars['Boolean']['output'];
  deleteOutcome: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deleteProductTag: Scalars['Boolean']['output'];
  deleteRelease: Scalars['Boolean']['output'];
  deleteRole: Scalars['Boolean']['output'];
  deleteSolution: Scalars['Boolean']['output'];
  deleteSolutionTag: Scalars['Boolean']['output'];
  deleteTask: Scalars['Boolean']['output'];
  deleteTaskStatus: Scalars['Boolean']['output'];
  deleteTelemetryAttribute: Scalars['Boolean']['output'];
  deleteTelemetryValue: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  evaluateSolutionTaskTelemetry: CustomerSolutionTask;
  evaluateTaskTelemetry: CustomerTask;
  exportAdoptionPlanTelemetryTemplate: TelemetryTemplateExport;
  exportCustomerAdoptionToExcel: ExcelExportResult;
  exportSolutionAdoptionPlanTelemetryTemplate: TelemetryTemplateExport;
  grantPermission: Scalars['Boolean']['output'];
  importAdoptionPlanTelemetry: TelemetryImportResult;
  importCancelSession: Scalars['Boolean']['output'];
  importCommit: ImportCommitResult;
  importCustomerAdoptionFromExcel: CustomerAdoptionImportResult;
  importDryRun: ImportDryRunResult;
  importExtendSession: Scalars['Boolean']['output'];
  importProductsCsv: ProductImportResult;
  importSolutionAdoptionPlanTelemetry: TelemetryImportResult;
  importTasksCsv: TaskImportResult;
  login: Scalars['String']['output'];
  loginExtended: LoginResponse;
  logout: Scalars['Boolean']['output'];
  markTaskDone: Task;
  migrateProductNamesToNewFormat: Scalars['Boolean']['output'];
  processDeletionQueue: Scalars['Int']['output'];
  queueTaskSoftDelete: Task;
  refreshAIDataContext: AiDataContextRefreshResult;
  refreshToken: AuthTokens;
  removeProductFromCustomer: Scalars['Boolean']['output'];
  removeProductFromCustomerEnhanced: DeleteResult;
  removeProductFromSolution: Scalars['Boolean']['output'];
  removeProductFromSolutionEnhanced: Scalars['Boolean']['output'];
  removeRoleFromUser: Scalars['Boolean']['output'];
  removeSolutionFromCustomer: Scalars['Boolean']['output'];
  removeSolutionFromCustomerEnhanced: DeleteResult;
  removeSolutionTagFromTask: Task;
  removeTagFromTask: Task;
  removeTaskDependency: Scalars['Boolean']['output'];
  reorderDiaryBookmarks: Array<DiaryBookmark>;
  reorderDiaryTodos: Array<DiaryTodo>;
  reorderLicenses: Array<License>;
  reorderOutcomes: Array<Outcome>;
  reorderProductTags: Array<ProductTag>;
  reorderProductsInSolution: Scalars['Boolean']['output'];
  reorderReleases: Array<Release>;
  reorderSolutionTags: Array<SolutionTag>;
  reorderTasks: Scalars['Boolean']['output'];
  resetPasswordToDefault: Scalars['Boolean']['output'];
  restoreBackup: RestoreResult;
  revertChangeSet: Scalars['Boolean']['output'];
  revokePermission: Scalars['Boolean']['output'];
  setSolutionTaskTags: Task;
  setTaskTags: Task;
  signup: Scalars['String']['output'];
  simpleLogin: Scalars['String']['output'];
  syncAdoptionPlan: AdoptionPlan;
  syncSolutionAdoptionPlan: SolutionAdoptionPlan;
  syncSolutionDefinition: SolutionAdoptionPlan;
  syncSolutionProducts: SolutionAdoptionPlan;
  triggerAutoBackup: BackupResult;
  undoChangeSet: Scalars['Boolean']['output'];
  updateAdoptionPlanFilterPreference: AdoptionPlanFilterPreference;
  updateAutoBackupConfig: AutoBackupConfig;
  updateCustomer: Customer;
  updateCustomerProduct: CustomerProductWithPlan;
  updateCustomerSolution: CustomerSolutionWithPlan;
  updateCustomerSolutionTaskStatus: CustomerSolutionTask;
  updateCustomerTaskStatus: CustomerTask;
  updateDiaryBookmark: DiaryBookmark;
  updateDiaryTodo: DiaryTodo;
  updateLicense: License;
  updateOutcome: Outcome;
  updateProduct: Product;
  updateProductTag: ProductTag;
  updateRelease: Release;
  updateRole: RoleWithPermissions;
  updateRolePermissions: RoleWithPermissions;
  updateSolution: Solution;
  updateSolutionTag: SolutionTag;
  updateTask: Task;
  updateTaskStatus: TaskStatus;
  updateTelemetryAttribute: TelemetryAttribute;
  updateTelemetryValue: TelemetryValue;
  updateUser: UserExtended;
};


export type MutationActivateUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationAddBatchTelemetryValuesArgs = {
  input: BatchTelemetryValueInput;
};


export type MutationAddCustomerTelemetryValueArgs = {
  input: AddCustomerTelemetryValueInput;
};


export type MutationAddProductToCustomerArgs = {
  customerId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
};


export type MutationAddProductToSolutionArgs = {
  productId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
};


export type MutationAddProductToSolutionEnhancedArgs = {
  order?: InputMaybe<Scalars['Int']['input']>;
  productId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
};


export type MutationAddSolutionTagToTaskArgs = {
  tagId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationAddSolutionToCustomerArgs = {
  customerId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
};


export type MutationAddTagToTaskArgs = {
  tagId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationAddTaskDependencyArgs = {
  dependsOnId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationAddTelemetryArgs = {
  data: Scalars['JSON']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationAddTelemetryValueArgs = {
  input: TelemetryValueInput;
};


export type MutationAssignProductToCustomerArgs = {
  input: AssignProductToCustomerInput;
};


export type MutationAssignRoleToUserArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAssignSolutionToCustomerArgs = {
  input: AssignSolutionToCustomerInput;
};


export type MutationBulkAddCustomerTelemetryValuesArgs = {
  inputs: Array<AddCustomerTelemetryValueInput>;
};


export type MutationBulkUpdateCustomerSolutionTaskStatusArgs = {
  notes?: InputMaybe<Scalars['String']['input']>;
  solutionAdoptionPlanId: Scalars['ID']['input'];
  status: CustomerTaskStatus;
  taskIds: Array<Scalars['ID']['input']>;
};


export type MutationBulkUpdateCustomerTaskStatusArgs = {
  adoptionPlanId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status: CustomerTaskStatus;
  taskIds: Array<Scalars['ID']['input']>;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationCommitChangeSetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateAdoptionPlanArgs = {
  customerProductId: Scalars['ID']['input'];
};


export type MutationCreateCustomerArgs = {
  input: CustomerInput;
};


export type MutationCreateDiaryBookmarkArgs = {
  input: CreateDiaryBookmarkInput;
};


export type MutationCreateDiaryTodoArgs = {
  input: CreateDiaryTodoInput;
};


export type MutationCreateLicenseArgs = {
  input: LicenseInput;
};


export type MutationCreateManualBackupArgs = {
  customName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateOutcomeArgs = {
  input: OutcomeInput;
};


export type MutationCreateProductArgs = {
  input: ProductInput;
};


export type MutationCreateProductTagArgs = {
  input: ProductTagInput;
};


export type MutationCreateReleaseArgs = {
  input: ReleaseInput;
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateSolutionArgs = {
  input: SolutionInput;
};


export type MutationCreateSolutionAdoptionPlanArgs = {
  customerSolutionId: Scalars['ID']['input'];
};


export type MutationCreateSolutionTagArgs = {
  input: SolutionTagInput;
};


export type MutationCreateTaskArgs = {
  input: TaskCreateInput;
};


export type MutationCreateTaskStatusArgs = {
  input: TaskStatusInput;
};


export type MutationCreateTelemetryAttributeArgs = {
  input: TelemetryAttributeInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeactivateUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationDeleteBackupArgs = {
  filename: Scalars['String']['input'];
};


export type MutationDeleteCustomerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDiaryBookmarkArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDiaryTodoArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLicenseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOutcomeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProductArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProductTagArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteReleaseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRoleArgs = {
  roleId: Scalars['ID']['input'];
};


export type MutationDeleteSolutionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSolutionTagArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaskStatusArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTelemetryAttributeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTelemetryValueArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationEvaluateSolutionTaskTelemetryArgs = {
  customerSolutionTaskId: Scalars['ID']['input'];
};


export type MutationEvaluateTaskTelemetryArgs = {
  customerTaskId: Scalars['ID']['input'];
};


export type MutationExportAdoptionPlanTelemetryTemplateArgs = {
  adoptionPlanId: Scalars['ID']['input'];
};


export type MutationExportCustomerAdoptionToExcelArgs = {
  customerId: Scalars['ID']['input'];
  customerProductId: Scalars['ID']['input'];
};


export type MutationExportSolutionAdoptionPlanTelemetryTemplateArgs = {
  solutionAdoptionPlanId: Scalars['ID']['input'];
};


export type MutationGrantPermissionArgs = {
  input: GrantPermissionInput;
};


export type MutationImportAdoptionPlanTelemetryArgs = {
  adoptionPlanId: Scalars['ID']['input'];
  file: Scalars['Upload']['input'];
};


export type MutationImportCancelSessionArgs = {
  sessionId: Scalars['String']['input'];
};


export type MutationImportCommitArgs = {
  sessionId: Scalars['String']['input'];
};


export type MutationImportCustomerAdoptionFromExcelArgs = {
  content: Scalars['String']['input'];
};


export type MutationImportDryRunArgs = {
  content: Scalars['String']['input'];
  entityType?: InputMaybe<EntityType>;
};


export type MutationImportExtendSessionArgs = {
  sessionId: Scalars['String']['input'];
};


export type MutationImportProductsCsvArgs = {
  csv: Scalars['String']['input'];
};


export type MutationImportSolutionAdoptionPlanTelemetryArgs = {
  file: Scalars['Upload']['input'];
  solutionAdoptionPlanId: Scalars['ID']['input'];
};


export type MutationImportTasksCsvArgs = {
  csv: Scalars['String']['input'];
  mode: TaskImportMode;
  productId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationLoginExtendedArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationMarkTaskDoneArgs = {
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationProcessDeletionQueueArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationQueueTaskSoftDeleteArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRemoveProductFromCustomerArgs = {
  customerId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
};


export type MutationRemoveProductFromCustomerEnhancedArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveProductFromSolutionArgs = {
  productId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
};


export type MutationRemoveProductFromSolutionEnhancedArgs = {
  productId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
};


export type MutationRemoveRoleFromUserArgs = {
  roleId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRemoveSolutionFromCustomerArgs = {
  customerId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
};


export type MutationRemoveSolutionFromCustomerEnhancedArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveSolutionTagFromTaskArgs = {
  tagId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationRemoveTagFromTaskArgs = {
  tagId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationRemoveTaskDependencyArgs = {
  dependsOnId: Scalars['ID']['input'];
  taskId: Scalars['ID']['input'];
};


export type MutationReorderDiaryBookmarksArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationReorderDiaryTodosArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationReorderLicensesArgs = {
  licenseIds: Array<Scalars['ID']['input']>;
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationReorderOutcomesArgs = {
  outcomeIds: Array<Scalars['ID']['input']>;
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationReorderProductTagsArgs = {
  productId: Scalars['ID']['input'];
  tagIds: Array<Scalars['ID']['input']>;
};


export type MutationReorderProductsInSolutionArgs = {
  productOrders: Array<ProductOrderInput>;
  solutionId: Scalars['ID']['input'];
};


export type MutationReorderReleasesArgs = {
  productId?: InputMaybe<Scalars['ID']['input']>;
  releaseIds: Array<Scalars['ID']['input']>;
};


export type MutationReorderSolutionTagsArgs = {
  solutionId: Scalars['ID']['input'];
  tagIds: Array<Scalars['ID']['input']>;
};


export type MutationReorderTasksArgs = {
  order: Array<Scalars['ID']['input']>;
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationResetPasswordToDefaultArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationRestoreBackupArgs = {
  filename: Scalars['String']['input'];
};


export type MutationRevertChangeSetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRevokePermissionArgs = {
  resourceId?: InputMaybe<Scalars['ID']['input']>;
  resourceType: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSetSolutionTaskTagsArgs = {
  tagIds: Array<Scalars['ID']['input']>;
  taskId: Scalars['ID']['input'];
};


export type MutationSetTaskTagsArgs = {
  tagIds: Array<Scalars['ID']['input']>;
  taskId: Scalars['ID']['input'];
};


export type MutationSignupArgs = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  role?: InputMaybe<Role>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSimpleLoginArgs = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};


export type MutationSyncAdoptionPlanArgs = {
  adoptionPlanId: Scalars['ID']['input'];
};


export type MutationSyncSolutionAdoptionPlanArgs = {
  solutionAdoptionPlanId: Scalars['ID']['input'];
};


export type MutationSyncSolutionDefinitionArgs = {
  solutionAdoptionPlanId: Scalars['ID']['input'];
};


export type MutationSyncSolutionProductsArgs = {
  solutionAdoptionPlanId: Scalars['ID']['input'];
};


export type MutationUndoChangeSetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAdoptionPlanFilterPreferenceArgs = {
  input: UpdateFilterPreferenceInput;
};


export type MutationUpdateAutoBackupConfigArgs = {
  input: AutoBackupUpdateInput;
};


export type MutationUpdateCustomerArgs = {
  id: Scalars['ID']['input'];
  input: CustomerInput;
};


export type MutationUpdateCustomerProductArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCustomerProductInput;
};


export type MutationUpdateCustomerSolutionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCustomerSolutionInput;
};


export type MutationUpdateCustomerSolutionTaskStatusArgs = {
  input: UpdateCustomerSolutionTaskStatusInput;
};


export type MutationUpdateCustomerTaskStatusArgs = {
  input: UpdateCustomerTaskStatusInput;
};


export type MutationUpdateDiaryBookmarkArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDiaryBookmarkInput;
};


export type MutationUpdateDiaryTodoArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDiaryTodoInput;
};


export type MutationUpdateLicenseArgs = {
  id: Scalars['ID']['input'];
  input: LicenseInput;
};


export type MutationUpdateOutcomeArgs = {
  id: Scalars['ID']['input'];
  input: OutcomeInput;
};


export type MutationUpdateProductArgs = {
  id: Scalars['ID']['input'];
  input: ProductInput;
};


export type MutationUpdateProductTagArgs = {
  id: Scalars['ID']['input'];
  input: ProductTagUpdateInput;
};


export type MutationUpdateReleaseArgs = {
  id: Scalars['ID']['input'];
  input: ReleaseInput;
};


export type MutationUpdateRoleArgs = {
  input: UpdateRoleInput;
  roleId: Scalars['ID']['input'];
};


export type MutationUpdateRolePermissionsArgs = {
  permissions: Array<ResourcePermissionInput>;
  roleId?: InputMaybe<Scalars['ID']['input']>;
  roleName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateSolutionArgs = {
  id: Scalars['ID']['input'];
  input: SolutionInput;
};


export type MutationUpdateSolutionTagArgs = {
  id: Scalars['ID']['input'];
  input: SolutionTagUpdateInput;
};


export type MutationUpdateTaskArgs = {
  id: Scalars['ID']['input'];
  input: TaskUpdateInput;
};


export type MutationUpdateTaskStatusArgs = {
  id: Scalars['ID']['input'];
  input: TaskStatusInput;
};


export type MutationUpdateTelemetryAttributeArgs = {
  id: Scalars['ID']['input'];
  input: TelemetryAttributeUpdateInput;
};


export type MutationUpdateTelemetryValueArgs = {
  id: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['JSON']['input'];
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
  userId: Scalars['ID']['input'];
};

export type Node = {
  id: Scalars['ID']['output'];
};

export type Outcome = Node & {
  __typename?: 'Outcome';
  description?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  product?: Maybe<Product>;
  productId?: Maybe<Scalars['ID']['output']>;
  solution?: Maybe<Solution>;
  solutionId?: Maybe<Scalars['ID']['output']>;
};

export type OutcomeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Permission = {
  __typename?: 'Permission';
  id: Scalars['ID']['output'];
  permissionLevel: Scalars['String']['output'];
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType: Scalars['String']['output'];
};

export type Product = Node & {
  __typename?: 'Product';
  completionPercentage: Scalars['Int']['output'];
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  customers: Array<Customer>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  licenses: Array<License>;
  name: Scalars['String']['output'];
  outcomes: Array<Outcome>;
  releases: Array<Release>;
  resources?: Maybe<Array<Resource>>;
  solutions: Array<Solution>;
  statusPercent: Scalars['Int']['output'];
  tags: Array<ProductTag>;
  tasks: TaskConnection;
};


export type ProductTasksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ProductConnection = {
  __typename?: 'ProductConnection';
  edges: Array<ProductEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ProductEdge = {
  __typename?: 'ProductEdge';
  cursor: Scalars['String']['output'];
  node: Product;
};

export type ProductImportResult = {
  __typename?: 'ProductImportResult';
  errors: Array<Scalars['String']['output']>;
  productsCreated: Scalars['Int']['output'];
  productsUpdated: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
  warnings: Array<Scalars['String']['output']>;
};

export type ProductInput = {
  customAttrs?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  licenseIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  name: Scalars['String']['input'];
  resources?: InputMaybe<Array<ResourceInput>>;
};

export type ProductOrderInput = {
  order: Scalars['Int']['input'];
  productId: Scalars['ID']['input'];
};

export type ProductProgressReport = {
  __typename?: 'ProductProgressReport';
  averageTaskCompletionTime?: Maybe<Scalars['Float']['output']>;
  completedTasks: Scalars['Int']['output'];
  estimatedCompletionDate?: Maybe<Scalars['String']['output']>;
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  progress: Scalars['Float']['output'];
  status: SolutionProductStatus;
  totalTasks: Scalars['Int']['output'];
};

export type ProductTag = {
  __typename?: 'ProductTag';
  color?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  productId: Scalars['ID']['output'];
  taskTags?: Maybe<Array<TaskTag>>;
};

export type ProductTagInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
};

export type ProductTagUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  adoptionPlan?: Maybe<AdoptionPlan>;
  adoptionPlansForCustomer: Array<AdoptionPlan>;
  aiDataContextStatus: AiDataContextStatus;
  askAI: AiQueryResponse;
  auditLogs: Array<AuditLog>;
  autoBackupConfig: AutoBackupConfig;
  availableResources: Array<AvailableResource>;
  changeSet?: Maybe<ChangeSet>;
  changeSets: Array<ChangeSet>;
  customer?: Maybe<Customer>;
  customerProductTags?: Maybe<Array<CustomerProductTag>>;
  customerSolution?: Maybe<CustomerSolutionWithPlan>;
  customerSolutionTags?: Maybe<Array<CustomerSolutionTag>>;
  customerSolutionTask?: Maybe<CustomerSolutionTask>;
  customerSolutionTasksForPlan: Array<CustomerSolutionTask>;
  customerTask?: Maybe<CustomerTask>;
  customerTasksForPlan: Array<CustomerTask>;
  customerTelemetryDatabase: Array<CustomerTelemetryRecord>;
  customers: Array<Customer>;
  downloadProductSampleCsv: Scalars['String']['output'];
  downloadTaskSampleCsv: Scalars['String']['output'];
  exportProduct: ExcelExportResult;
  exportProductsCsv: Scalars['String']['output'];
  exportSolution: ExcelExportResult;
  exportTasksCsv: Scalars['String']['output'];
  isAIAgentAvailable: AiAgentAvailability;
  licenses: Array<License>;
  listBackups: Array<BackupFile>;
  me?: Maybe<UserExtended>;
  myBookmarks: Array<DiaryBookmark>;
  myPermissions: Array<Permission>;
  myTodos: Array<DiaryTodo>;
  node?: Maybe<Node>;
  outcomes: Array<Outcome>;
  product?: Maybe<Product>;
  productTag?: Maybe<ProductTag>;
  productTags?: Maybe<Array<ProductTag>>;
  products: ProductConnection;
  releases: Array<Release>;
  role?: Maybe<RoleWithPermissions>;
  roles: Array<RoleWithPermissions>;
  search: Array<SearchResult>;
  solution?: Maybe<Solution>;
  solutionAdoptionPlan?: Maybe<SolutionAdoptionPlan>;
  solutionAdoptionPlansForCustomer: Array<SolutionAdoptionPlan>;
  solutionAdoptionReport: SolutionAdoptionReport;
  solutionComparisonReport: SolutionComparisonReport;
  solutionTags?: Maybe<Array<SolutionTag>>;
  solutions: SolutionConnection;
  task?: Maybe<Task>;
  taskDependencies: Array<TaskDependencyEdge>;
  taskStatuses: Array<TaskStatus>;
  taskTag?: Maybe<TaskTag>;
  taskTags?: Maybe<Array<TaskTag>>;
  tasks: TaskConnection;
  telemetry: Array<TelemetryEdge>;
  telemetryAttribute?: Maybe<TelemetryAttribute>;
  telemetryAttributes: Array<TelemetryAttribute>;
  telemetryValue?: Maybe<TelemetryValue>;
  telemetryValues: Array<TelemetryValue>;
  telemetryValuesByBatch: Array<TelemetryValue>;
  user?: Maybe<UserWithPermissions>;
  userRoles: Array<RoleWithPermissions>;
  users: Array<UserExtended>;
};


export type QueryAdoptionPlanArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdoptionPlansForCustomerArgs = {
  customerId: Scalars['ID']['input'];
};


export type QueryAskAiArgs = {
  conversationId?: InputMaybe<Scalars['String']['input']>;
  question: Scalars['String']['input'];
};


export type QueryAvailableResourcesArgs = {
  resourceType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryChangeSetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryChangeSetsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCustomerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCustomerProductTagsArgs = {
  customerProductId: Scalars['ID']['input'];
};


export type QueryCustomerSolutionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCustomerSolutionTagsArgs = {
  customerSolutionId: Scalars['ID']['input'];
};


export type QueryCustomerSolutionTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCustomerSolutionTasksForPlanArgs = {
  solutionAdoptionPlanId: Scalars['ID']['input'];
  status?: InputMaybe<CustomerTaskStatus>;
};


export type QueryCustomerTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCustomerTasksForPlanArgs = {
  adoptionPlanId: Scalars['ID']['input'];
  status?: InputMaybe<CustomerTaskStatus>;
};


export type QueryCustomerTelemetryDatabaseArgs = {
  customerId?: InputMaybe<Scalars['ID']['input']>;
  customerProductId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryExportProductArgs = {
  productId: Scalars['ID']['input'];
};


export type QueryExportSolutionArgs = {
  solutionId: Scalars['ID']['input'];
};


export type QueryExportTasksCsvArgs = {
  productId: Scalars['ID']['input'];
};


export type QueryLicensesArgs = {
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOutcomesArgs = {
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProductTagArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProductTagsArgs = {
  productId: Scalars['ID']['input'];
};


export type QueryProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryReleasesArgs = {
  productId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRoleArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySearchArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySolutionArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySolutionAdoptionPlanArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySolutionAdoptionPlansForCustomerArgs = {
  customerId: Scalars['ID']['input'];
};


export type QuerySolutionAdoptionReportArgs = {
  solutionAdoptionPlanId: Scalars['ID']['input'];
};


export type QuerySolutionComparisonReportArgs = {
  solutionId: Scalars['ID']['input'];
};


export type QuerySolutionTagsArgs = {
  solutionId: Scalars['ID']['input'];
};


export type QuerySolutionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskDependenciesArgs = {
  taskId: Scalars['ID']['input'];
};


export type QueryTaskTagArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTaskTagsArgs = {
  taskId: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryTelemetryArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  taskId: Scalars['ID']['input'];
};


export type QueryTelemetryAttributeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTelemetryAttributesArgs = {
  taskId: Scalars['ID']['input'];
};


export type QueryTelemetryValueArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTelemetryValuesArgs = {
  attributeId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTelemetryValuesByBatchArgs = {
  batchId: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserRolesArgs = {
  userId: Scalars['ID']['input'];
};

export type RecordCounts = {
  __typename?: 'RecordCounts';
  adoptionPlans?: Maybe<Scalars['Int']['output']>;
  customerProducts?: Maybe<Scalars['Int']['output']>;
  customerSolutionTasks?: Maybe<Scalars['Int']['output']>;
  customerSolutions?: Maybe<Scalars['Int']['output']>;
  customerTasks?: Maybe<Scalars['Int']['output']>;
  customers?: Maybe<Scalars['Int']['output']>;
  diaryBookmarks?: Maybe<Scalars['Int']['output']>;
  diaryTodos?: Maybe<Scalars['Int']['output']>;
  products?: Maybe<Scalars['Int']['output']>;
  solutionAdoptionPlans?: Maybe<Scalars['Int']['output']>;
  solutions?: Maybe<Scalars['Int']['output']>;
  tasks?: Maybe<Scalars['Int']['output']>;
  users?: Maybe<Scalars['Int']['output']>;
};

export type RecordPreview = {
  __typename?: 'RecordPreview';
  action: Scalars['String']['output'];
  changes?: Maybe<Array<FieldDiff>>;
  data: Scalars['JSON']['output'];
  existingData?: Maybe<Scalars['JSON']['output']>;
  existingId?: Maybe<Scalars['String']['output']>;
  rowNumber: Scalars['Int']['output'];
};

export type RecordsSummary = {
  __typename?: 'RecordsSummary';
  customAttributes: Array<RecordPreview>;
  licenses: Array<RecordPreview>;
  outcomes: Array<RecordPreview>;
  productRefs: Array<RecordPreview>;
  releases: Array<RecordPreview>;
  resources: Array<RecordPreview>;
  tags: Array<RecordPreview>;
  tasks: Array<RecordPreview>;
  telemetryAttributes: Array<RecordPreview>;
};

export type Release = Node & {
  __typename?: 'Release';
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayOrder: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  inheritedTasks: Array<Task>;
  isActive: Scalars['Boolean']['output'];
  level: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  product?: Maybe<Product>;
  productId?: Maybe<Scalars['ID']['output']>;
  tasks: Array<Task>;
};

export type ReleaseInput = {
  customAttrs?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  level: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
};

export type Resource = {
  __typename?: 'Resource';
  label: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type ResourceInput = {
  label: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type ResourcePermissionInput = {
  permissionLevel: Scalars['String']['input'];
  resourceId?: InputMaybe<Scalars['String']['input']>;
  resourceType: Scalars['String']['input'];
};

export type RestoreResult = {
  __typename?: 'RestoreResult';
  error?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  recordsRestored?: Maybe<RecordCounts>;
  success: Scalars['Boolean']['output'];
};

export enum RiskLevel {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export enum Role {
  Admin = 'ADMIN',
  Css = 'CSS',
  Sme = 'SME',
  User = 'USER',
  Viewer = 'VIEWER'
}

export type RolePermission = {
  __typename?: 'RolePermission';
  permissionLevel: Scalars['String']['output'];
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceType: Scalars['String']['output'];
};

export type RoleWithPermissions = {
  __typename?: 'RoleWithPermissions';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<RolePermission>;
  userCount?: Maybe<Scalars['Int']['output']>;
  users?: Maybe<Array<UserBasic>>;
};

export type SearchResult = Customer | Product | Solution | Task;

export enum Severity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type Solution = Node & {
  __typename?: 'Solution';
  completionPercentage: Scalars['Int']['output'];
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  customers: Array<Customer>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  licenses: Array<License>;
  name: Scalars['String']['output'];
  outcomes: Array<Outcome>;
  products: ProductConnection;
  releases: Array<Release>;
  resources?: Maybe<Array<Resource>>;
  tags: Array<SolutionTag>;
  tasks: TaskConnection;
};


export type SolutionProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type SolutionTasksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type SolutionAdoptionPlan = {
  __typename?: 'SolutionAdoptionPlan';
  completedTasks: Scalars['Int']['output'];
  completedWeight: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  customerSolution: CustomerSolutionWithPlan;
  id: Scalars['ID']['output'];
  includedProductIds: Array<Scalars['ID']['output']>;
  lastSyncedAt?: Maybe<Scalars['String']['output']>;
  licenseLevel: LicenseLevel;
  needsSync: Scalars['Boolean']['output'];
  products: Array<SolutionAdoptionProduct>;
  progressPercentage: Scalars['Float']['output'];
  selectedOutcomes: Array<Outcome>;
  selectedReleases: Array<Release>;
  solutionId: Scalars['ID']['output'];
  solutionName: Scalars['String']['output'];
  solutionTasksComplete: Scalars['Int']['output'];
  solutionTasksTotal: Scalars['Int']['output'];
  tasks: Array<CustomerSolutionTask>;
  tasksByStatus: Array<CustomerSolutionTask>;
  totalTasks: Scalars['Int']['output'];
  totalWeight: Scalars['Float']['output'];
  updatedAt: Scalars['String']['output'];
};


export type SolutionAdoptionPlanTasksByStatusArgs = {
  status?: InputMaybe<CustomerTaskStatus>;
};

export type SolutionAdoptionProduct = {
  __typename?: 'SolutionAdoptionProduct';
  completedTasks: Scalars['Int']['output'];
  completedWeight: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  productAdoptionPlan?: Maybe<AdoptionPlan>;
  productId: Scalars['ID']['output'];
  productName: Scalars['String']['output'];
  progressPercentage: Scalars['Float']['output'];
  sequenceNumber: Scalars['Int']['output'];
  solutionAdoptionPlan: SolutionAdoptionPlan;
  status: SolutionProductStatus;
  totalTasks: Scalars['Int']['output'];
  totalWeight: Scalars['Float']['output'];
  updatedAt: Scalars['String']['output'];
};

export type SolutionAdoptionReport = {
  __typename?: 'SolutionAdoptionReport';
  blockedTasks: Scalars['Int']['output'];
  bottlenecks: Array<BottleneckReport>;
  completedTasks: Scalars['Int']['output'];
  customerName: Scalars['String']['output'];
  daysInProgress: Scalars['Int']['output'];
  estimatedCompletionDate?: Maybe<Scalars['String']['output']>;
  estimatedDaysRemaining?: Maybe<Scalars['Int']['output']>;
  healthScore: Scalars['Float']['output'];
  inProgressTasks: Scalars['Int']['output'];
  licenseLevel: Scalars['String']['output'];
  notStartedTasks: Scalars['Int']['output'];
  onTrack: Scalars['Boolean']['output'];
  overallProgress: Scalars['Float']['output'];
  productProgress: Array<ProductProgressReport>;
  recommendations: Array<Scalars['String']['output']>;
  riskLevel: RiskLevel;
  solutionAdoptionPlanId: Scalars['ID']['output'];
  solutionName: Scalars['String']['output'];
  taskCompletionPercentage: Scalars['Float']['output'];
  telemetryHealthScore: Scalars['Float']['output'];
  totalTasks: Scalars['Int']['output'];
};

export type SolutionComparisonReport = {
  __typename?: 'SolutionComparisonReport';
  averageProgress: Scalars['Float']['output'];
  averageTimeToComplete?: Maybe<Scalars['Float']['output']>;
  bestPerformingCustomers: Array<CustomerPerformance>;
  commonBottlenecks: Array<BottleneckSummary>;
  solutionId: Scalars['ID']['output'];
  solutionName: Scalars['String']['output'];
  strugglingCustomers: Array<CustomerPerformance>;
  successRate: Scalars['Float']['output'];
  totalCustomers: Scalars['Int']['output'];
};

export type SolutionConnection = {
  __typename?: 'SolutionConnection';
  edges: Array<SolutionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type SolutionEdge = {
  __typename?: 'SolutionEdge';
  cursor: Scalars['String']['output'];
  node: Solution;
};

export type SolutionInput = {
  customAttrs?: InputMaybe<Scalars['JSON']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  resources?: InputMaybe<Array<ResourceInput>>;
};

export enum SolutionProductStatus {
  Blocked = 'BLOCKED',
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
  Skipped = 'SKIPPED'
}

export type SolutionTag = {
  __typename?: 'SolutionTag';
  color?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  solutionId: Scalars['ID']['output'];
  taskTags?: Maybe<Array<SolutionTaskTag>>;
};

export type SolutionTagInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  solutionId: Scalars['ID']['input'];
};

export type SolutionTagUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type SolutionTaskTag = {
  __typename?: 'SolutionTaskTag';
  id: Scalars['ID']['output'];
  tag: SolutionTag;
  taskId: Scalars['ID']['output'];
};

export enum StatusUpdateSource {
  Import = 'IMPORT',
  Manual = 'MANUAL',
  System = 'SYSTEM',
  Telemetry = 'TELEMETRY'
}

export type Subscription = {
  __typename?: 'Subscription';
  productUpdated: Product;
  taskUpdated: Task;
};

export type Task = Node & {
  __typename?: 'Task';
  availableInReleases: Array<Release>;
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  deletedAt?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  estMinutes: Scalars['Int']['output'];
  howToDoc: Array<Scalars['String']['output']>;
  howToVideo: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isCompleteBasedOnTelemetry: Scalars['Boolean']['output'];
  license?: Maybe<License>;
  licenseLevel: LicenseLevel;
  name: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  outcomes: Array<Outcome>;
  product?: Maybe<Product>;
  releases: Array<Release>;
  sequenceNumber: Scalars['Int']['output'];
  solution?: Maybe<Solution>;
  solutionTags: Array<SolutionTag>;
  tags: Array<ProductTag>;
  telemetryAttributes: Array<TelemetryAttribute>;
  telemetryCompletionPercentage: Scalars['Float']['output'];
  weight: Scalars['Float']['output'];
};

export type TaskConnection = {
  __typename?: 'TaskConnection';
  edges: Array<TaskEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TaskCreateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  estMinutes: Scalars['Int']['input'];
  howToDoc?: InputMaybe<Array<Scalars['String']['input']>>;
  howToVideo?: InputMaybe<Array<Scalars['String']['input']>>;
  licenseId?: InputMaybe<Scalars['ID']['input']>;
  licenseLevel?: InputMaybe<LicenseLevel>;
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  outcomeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  productId?: InputMaybe<Scalars['ID']['input']>;
  releaseIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  sequenceNumber?: InputMaybe<Scalars['Int']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
  tagIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  telemetryAttributes?: InputMaybe<Array<TelemetryAttributeNestedInput>>;
  weight: Scalars['Float']['input'];
};

export type TaskDependencyEdge = {
  __typename?: 'TaskDependencyEdge';
  dependsOn: Task;
  dependsOnId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  task: Task;
  taskId: Scalars['ID']['output'];
};

export type TaskEdge = {
  __typename?: 'TaskEdge';
  cursor: Scalars['String']['output'];
  node: Task;
};

export enum TaskImportMode {
  Append = 'APPEND',
  Overwrite = 'OVERWRITE'
}

export type TaskImportResult = {
  __typename?: 'TaskImportResult';
  errors: Array<Scalars['String']['output']>;
  mode: TaskImportMode;
  productId: Scalars['ID']['output'];
  success: Scalars['Boolean']['output'];
  tasksCreated: Scalars['Int']['output'];
  tasksDeleted?: Maybe<Scalars['Int']['output']>;
  tasksUpdated: Scalars['Int']['output'];
  warnings: Array<Scalars['String']['output']>;
};

export enum TaskSourceType {
  Product = 'PRODUCT',
  Solution = 'SOLUTION'
}

export type TaskStatus = Node & {
  __typename?: 'TaskStatus';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
};

export type TaskStatusInput = {
  code: Scalars['String']['input'];
  label: Scalars['String']['input'];
};

export type TaskTag = {
  __typename?: 'TaskTag';
  id: Scalars['ID']['output'];
  tag: ProductTag;
  taskId: Scalars['ID']['output'];
};

export type TaskTelemetryResult = {
  __typename?: 'TaskTelemetryResult';
  attributesUpdated: Scalars['Int']['output'];
  completionPercentage: Scalars['Float']['output'];
  criteriaMet: Scalars['Int']['output'];
  criteriaTotal: Scalars['Int']['output'];
  errors: Array<Scalars['String']['output']>;
  taskId: Scalars['ID']['output'];
  taskName: Scalars['String']['output'];
};

export type TaskUpdateInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  estMinutes?: InputMaybe<Scalars['Int']['input']>;
  howToDoc?: InputMaybe<Array<Scalars['String']['input']>>;
  howToVideo?: InputMaybe<Array<Scalars['String']['input']>>;
  licenseId?: InputMaybe<Scalars['ID']['input']>;
  licenseLevel?: InputMaybe<LicenseLevel>;
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  outcomeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  releaseIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  sequenceNumber?: InputMaybe<Scalars['Int']['input']>;
  tagIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  telemetryAttributes?: InputMaybe<Array<TelemetryAttributeNestedInput>>;
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type Telemetry = Node & {
  __typename?: 'Telemetry';
  createdAt: Scalars['String']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type TelemetryAttribute = Node & {
  __typename?: 'TelemetryAttribute';
  createdAt: Scalars['String']['output'];
  currentValue?: Maybe<TelemetryValue>;
  dataType: TelemetryDataType;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isRequired: Scalars['Boolean']['output'];
  isSuccessful: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  successCriteria?: Maybe<Scalars['JSON']['output']>;
  task: Task;
  taskId: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
  values: Array<TelemetryValue>;
};


export type TelemetryAttributeValuesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type TelemetryAttributeInput = {
  dataType: TelemetryDataType;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isRequired?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  successCriteria?: InputMaybe<Scalars['JSON']['input']>;
  taskId: Scalars['ID']['input'];
};

export type TelemetryAttributeNestedInput = {
  dataType: TelemetryDataType;
  description?: InputMaybe<Scalars['String']['input']>;
  isRequired?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  successCriteria?: InputMaybe<Scalars['JSON']['input']>;
};

export type TelemetryAttributeUpdateInput = {
  dataType?: InputMaybe<TelemetryDataType>;
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isRequired?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  successCriteria?: InputMaybe<Scalars['JSON']['input']>;
};

export enum TelemetryDataType {
  Boolean = 'BOOLEAN',
  Json = 'JSON',
  Number = 'NUMBER',
  String = 'STRING',
  Timestamp = 'TIMESTAMP'
}

export type TelemetryEdge = {
  __typename?: 'TelemetryEdge';
  createdAt: Scalars['String']['output'];
  data?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type TelemetryImportResult = {
  __typename?: 'TelemetryImportResult';
  batchId: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  summary: TelemetryImportSummary;
  taskResults: Array<TaskTelemetryResult>;
};

export type TelemetryImportSummary = {
  __typename?: 'TelemetryImportSummary';
  attributesUpdated: Scalars['Int']['output'];
  criteriaEvaluated: Scalars['Int']['output'];
  errors: Array<Scalars['String']['output']>;
  tasksProcessed: Scalars['Int']['output'];
};

export type TelemetryProgress = {
  __typename?: 'TelemetryProgress';
  allRequiredMet: Scalars['Boolean']['output'];
  completionPercentage: Scalars['Float']['output'];
  metAttributes: Scalars['Int']['output'];
  metRequiredAttributes: Scalars['Int']['output'];
  requiredAttributes: Scalars['Int']['output'];
  totalAttributes: Scalars['Int']['output'];
};

export type TelemetryTemplateExport = {
  __typename?: 'TelemetryTemplateExport';
  assignmentName: Scalars['String']['output'];
  attributeCount: Scalars['Int']['output'];
  customerName: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  taskCount: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

export type TelemetryValue = Node & {
  __typename?: 'TelemetryValue';
  attribute: TelemetryAttribute;
  attributeId: Scalars['ID']['output'];
  batchId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
  value: Scalars['JSON']['output'];
};

export type TelemetryValueInput = {
  attributeId: Scalars['ID']['input'];
  batchId?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['JSON']['input'];
};

export type UpdateCustomerProductInput = {
  licenseLevel?: InputMaybe<LicenseLevel>;
  name?: InputMaybe<Scalars['String']['input']>;
  selectedOutcomeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  selectedReleaseIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type UpdateCustomerSolutionInput = {
  includedProductIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  licenseLevel?: InputMaybe<LicenseLevel>;
  name?: InputMaybe<Scalars['String']['input']>;
  selectedOutcomeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  selectedReleaseIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type UpdateCustomerSolutionTaskStatusInput = {
  customerSolutionTaskId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status: CustomerTaskStatus;
  updateSource?: InputMaybe<StatusUpdateSource>;
};

export type UpdateCustomerTaskStatusInput = {
  customerTaskId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  status: CustomerTaskStatus;
  updateSource?: InputMaybe<StatusUpdateSource>;
};

export type UpdateDiaryBookmarkInput = {
  title?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDiaryTodoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  task?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFilterPreferenceInput = {
  adoptionPlanId: Scalars['ID']['input'];
  filterOutcomes: Array<Scalars['ID']['input']>;
  filterReleases: Array<Scalars['ID']['input']>;
  filterTags: Array<Scalars['ID']['input']>;
};

export type UpdateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<ResourcePermissionInput>>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Role>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type User = Node & {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  role: Role;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserBasic = {
  __typename?: 'UserBasic';
  email: Scalars['String']['output'];
  fullName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  username: Scalars['String']['output'];
};

export type UserExtended = {
  __typename?: 'UserExtended';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  fullName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isAdmin: Scalars['Boolean']['output'];
  mustChangePassword: Scalars['Boolean']['output'];
  permissions: Array<Permission>;
  role: Role;
  roles: Array<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  username: Scalars['String']['output'];
};

export type UserWithPermissions = {
  __typename?: 'UserWithPermissions';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  fullName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  permissions: Array<Permission>;
  role: Role;
  roles: Array<RoleWithPermissions>;
  updatedAt: Scalars['DateTime']['output'];
  username: Scalars['String']['output'];
};
