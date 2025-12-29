import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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

/** Response for AI Agent availability check */
export type AiAgentAvailability = {
  __typename?: 'AIAgentAvailability';
  /** Whether the AI Agent is available (aiuser exists) */
  available: Scalars['Boolean']['output'];
  /** Message explaining the availability status */
  message: Scalars['String']['output'];
};

/** Response from refreshing AI data context */
export type AiDataContextRefreshResult = {
  __typename?: 'AIDataContextRefreshResult';
  /** Error message if refresh failed */
  error?: Maybe<Scalars['String']['output']>;
  /** When the data was last refreshed */
  lastRefreshed?: Maybe<Scalars['DateTime']['output']>;
  /** Statistics about the data */
  statistics?: Maybe<AiDataContextStatistics>;
  /** Whether the refresh was successful */
  success: Scalars['Boolean']['output'];
};

/** Statistics about the AI data context */
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

/** Status of the AI data context */
export type AiDataContextStatus = {
  __typename?: 'AIDataContextStatus';
  /** Whether data context is available */
  hasDataContext: Scalars['Boolean']['output'];
  /** Whether the data context manager is initialized */
  initialized: Scalars['Boolean']['output'];
  /** When the data was last refreshed */
  lastRefreshed?: Maybe<Scalars['DateTime']['output']>;
};

/** Metadata about an AI query execution */
export type AiQueryMetadata = {
  __typename?: 'AIQueryMetadata';
  /** Whether result was cached */
  cached: Scalars['Boolean']['output'];
  /** Time to execute in milliseconds */
  executionTime: Scalars['Int']['output'];
  /** Which AI provider was used (template, openai, gemini, anthropic, cisco, mock) */
  providerUsed?: Maybe<Scalars['String']['output']>;
  /** Number of rows returned */
  rowCount: Scalars['Int']['output'];
  /** Template ID if a template was matched */
  templateUsed?: Maybe<Scalars['String']['output']>;
  /** Whether results were truncated */
  truncated: Scalars['Boolean']['output'];
};

/** Response from the AI Agent */
export type AiQueryResponse = {
  __typename?: 'AIQueryResponse';
  /** Natural language answer */
  answer: Scalars['String']['output'];
  /** Raw data results (JSON string) */
  data?: Maybe<Scalars['JSON']['output']>;
  /** Error message if query failed */
  error?: Maybe<Scalars['String']['output']>;
  /** Query execution metadata */
  metadata?: Maybe<AiQueryMetadata>;
  /** The generated query (for transparency) */
  query?: Maybe<Scalars['String']['output']>;
  /** Suggested follow-up questions */
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
  lastChangeChecksum?: Maybe<Scalars['String']['output']>;
  retentionDays: Scalars['Int']['output'];
  schedule: Scalars['String']['output'];
};

export type AutoBackupConfigInput = {
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

export type BackupMetadata = {
  __typename?: 'BackupMetadata';
  databaseUrl: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  id: Scalars['String']['output'];
  recordCounts: BackupRecordCounts;
  size: Scalars['Int']['output'];
  timestamp: Scalars['DateTime']['output'];
};

export type BackupRecordCounts = {
  __typename?: 'BackupRecordCounts';
  adoptionPlans: Scalars['Int']['output'];
  customerProducts: Scalars['Int']['output'];
  customerSolutionTasks: Scalars['Int']['output'];
  customerSolutions: Scalars['Int']['output'];
  customerTasks: Scalars['Int']['output'];
  customers: Scalars['Int']['output'];
  products: Scalars['Int']['output'];
  solutionAdoptionPlans: Scalars['Int']['output'];
  solutions: Scalars['Int']['output'];
  tasks: Scalars['Int']['output'];
  users: Scalars['Int']['output'];
};

export type BackupResult = {
  __typename?: 'BackupResult';
  error?: Maybe<Scalars['String']['output']>;
  filename?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<BackupMetadata>;
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

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissions?: InputMaybe<Array<ResourcePermissionInput>>;
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
  username: Scalars['String']['input'];
};

export type Customer = Node & {
  __typename?: 'Customer';
  createdAt: Scalars['DateTime']['output'];
  customAttrs?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  products: Array<CustomerProductWithPlan>;
  solutions: Array<CustomerSolutionWithPlan>;
  updatedAt: Scalars['DateTime']['output'];
};

export type CustomerAdoptionImportResult = {
  __typename?: 'CustomerAdoptionImportResult';
  customerId: Scalars['String']['output'];
  customerName: Scalars['String']['output'];
  customerProductId: Scalars['String']['output'];
  errors: Array<ValidationError>;
  productName: Scalars['String']['output'];
  stats: CustomerAdoptionImportStats;
  success: Scalars['Boolean']['output'];
  warnings: Array<ValidationError>;
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

export type DeleteBackupResult = {
  __typename?: 'DeleteBackupResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteResult = {
  __typename?: 'DeleteResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

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

export type GrantPermissionInput = {
  permissionLevel: Scalars['String']['input'];
  resourceId?: InputMaybe<Scalars['ID']['input']>;
  resourceType: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export enum ImportMode {
  CreateNew = 'CREATE_NEW',
  CreateOrUpdate = 'CREATE_OR_UPDATE',
  UpdateExisting = 'UPDATE_EXISTING'
}

export type ImportResult = {
  __typename?: 'ImportResult';
  errors: Array<ValidationError>;
  productId?: Maybe<Scalars['String']['output']>;
  productName: Scalars['String']['output'];
  stats: ImportStats;
  success: Scalars['Boolean']['output'];
  warnings: Array<ValidationError>;
};

export type ImportStats = {
  __typename?: 'ImportStats';
  customAttributesImported: Scalars['Int']['output'];
  licensesImported: Scalars['Int']['output'];
  outcomesImported: Scalars['Int']['output'];
  releasesImported: Scalars['Int']['output'];
  tasksImported: Scalars['Int']['output'];
  telemetryAttributesImported: Scalars['Int']['output'];
};

export type License = Node & {
  __typename?: 'License';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  product?: Maybe<Product>;
  productId?: Maybe<Scalars['ID']['output']>;
};

export type LicenseInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  level?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
};

export enum LicenseLevel {
  Advantage = 'Advantage',
  Essential = 'Essential',
  Signature = 'Signature'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  tokens: AuthTokens;
  user: UserExtended;
};

export type Mutation = {
  __typename?: 'Mutation';
  acquireLock: Scalars['Boolean']['output'];
  /** Activate user (admin only) */
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
  /** Assign role to user (admin only) */
  assignRoleToUser: Scalars['Boolean']['output'];
  assignSolutionToCustomer: CustomerSolutionWithPlan;
  beginChangeSet: Scalars['ID']['output'];
  bulkAddCustomerTelemetryValues: Array<CustomerTelemetryValue>;
  bulkUpdateCustomerSolutionTaskStatus: Array<CustomerSolutionTask>;
  bulkUpdateCustomerTaskStatus: Array<CustomerTask>;
  /** Change password (self or admin) */
  changePassword: Scalars['Boolean']['output'];
  commitChangeSet: Scalars['Boolean']['output'];
  createAdoptionPlan: AdoptionPlan;
  /** Create a new database backup (snapshot) */
  createBackup: BackupResult;
  createCustomer: Customer;
  createLicense: License;
  createOutcome: Outcome;
  createProduct: Product;
  createProductTag: ProductTag;
  createRelease: Release;
  /** Create a new role with permissions (admin only) */
  createRole: RoleWithPermissions;
  createSolution: Solution;
  createSolutionAdoptionPlan: SolutionAdoptionPlan;
  createSolutionTag: SolutionTag;
  createTask: Task;
  createTaskStatus: TaskStatus;
  createTelemetryAttribute: TelemetryAttribute;
  /** Create a new user (admin only) */
  createUser: UserExtended;
  /** Deactivate user (admin only) */
  deactivateUser: Scalars['Boolean']['output'];
  /** Delete a backup file */
  deleteBackup: DeleteBackupResult;
  deleteCustomer: Scalars['Boolean']['output'];
  deleteLicense: Scalars['Boolean']['output'];
  deleteOutcome: Scalars['Boolean']['output'];
  deleteProduct: Scalars['Boolean']['output'];
  deleteProductTag: Scalars['Boolean']['output'];
  deleteRelease: Scalars['Boolean']['output'];
  /** Delete role (admin only) */
  deleteRole: Scalars['Boolean']['output'];
  deleteSolution: Scalars['Boolean']['output'];
  deleteSolutionTag: Scalars['Boolean']['output'];
  deleteTaskStatus: Scalars['Boolean']['output'];
  deleteTelemetryAttribute: Scalars['Boolean']['output'];
  deleteTelemetryValue: Scalars['Boolean']['output'];
  /** Delete user (admin only) */
  deleteUser: Scalars['Boolean']['output'];
  downloadProductSampleCsv: Scalars['String']['output'];
  downloadTaskSampleCsv: Scalars['String']['output'];
  evaluateSolutionTaskTelemetry: CustomerSolutionTask;
  evaluateTaskTelemetry: CustomerTask;
  exportAdoptionPlanTelemetryTemplate: TelemetryTemplateExport;
  exportCustomerAdoptionToExcel: ExcelExportResult;
  exportProductsCsv: Scalars['String']['output'];
  exportSolutionAdoptionPlanTelemetryTemplate: TelemetryTemplateExport;
  exportTasksCsv: Scalars['String']['output'];
  /** Grant permission to user (admin only) */
  grantPermission: Scalars['Boolean']['output'];
  importAdoptionPlanTelemetry: TelemetryImportResult;
  importCustomerAdoptionFromExcel: CustomerAdoptionImportResult;
  importProductFromExcel: ImportResult;
  importProductsCsv: ProductImportResult;
  importSolutionAdoptionPlanTelemetry: TelemetryImportResult;
  importTasksCsv: TaskImportResult;
  login: Scalars['String']['output'];
  /** Login with username/email and password */
  loginExtended: LoginResponse;
  /** Logout current user */
  logout: Scalars['Boolean']['output'];
  markTaskDone: Task;
  migrateProductNamesToNewFormat: ProductNameMigrationResult;
  processDeletionQueue: Scalars['Int']['output'];
  queueTaskSoftDelete: Scalars['Boolean']['output'];
  /** Refresh the AI agent's data context from the database */
  refreshAIDataContext: AiDataContextRefreshResult;
  /** Refresh authentication token */
  refreshToken: AuthTokens;
  releaseLock: Scalars['Boolean']['output'];
  removeProductFromCustomer: Scalars['Boolean']['output'];
  removeProductFromCustomerEnhanced: DeleteResult;
  removeProductFromSolution: Scalars['Boolean']['output'];
  removeProductFromSolutionEnhanced: Scalars['Boolean']['output'];
  /** Remove role from user (admin only) */
  removeRoleFromUser: Scalars['Boolean']['output'];
  removeSolutionFromCustomer: Scalars['Boolean']['output'];
  removeSolutionFromCustomerEnhanced: DeleteResult;
  removeSolutionTagFromTask: Task;
  removeTagFromTask: Task;
  removeTaskDependency: Scalars['Boolean']['output'];
  reorderProductsInSolution: Scalars['Boolean']['output'];
  reorderTasks: Scalars['Boolean']['output'];
  /** Reset password to default DAP123 (admin only) */
  resetPasswordToDefault: Scalars['Boolean']['output'];
  /** Restore database from a backup file */
  restoreBackup: RestoreResult;
  revertChangeSet: Scalars['Boolean']['output'];
  /** Revoke permission from user (admin only) */
  revokePermission: Scalars['Boolean']['output'];
  setSolutionTaskTags: Task;
  setTaskTags: Task;
  signup: Scalars['String']['output'];
  simpleLogin: Scalars['String']['output'];
  syncAdoptionPlan: AdoptionPlan;
  syncSolutionAdoptionPlan: SolutionAdoptionPlan;
  syncSolutionDefinition: SolutionAdoptionPlan;
  syncSolutionProducts: SolutionAdoptionPlan;
  /** Trigger auto-backup immediately (for testing) */
  triggerAutoBackup: BackupResult;
  undoChangeSet: Scalars['Boolean']['output'];
  /** Update auto-backup configuration */
  updateAutoBackupConfig: AutoBackupConfig;
  updateCustomer: Customer;
  updateCustomerProduct: CustomerProductWithPlan;
  updateCustomerSolution: CustomerSolutionWithPlan;
  updateCustomerSolutionTaskStatus: CustomerSolutionTask;
  updateCustomerTaskStatus: CustomerTask;
  updateLicense: License;
  updateOutcome: Outcome;
  updateProduct: Product;
  updateProductTag: ProductTag;
  updateRelease: Release;
  /** Update role and permissions (admin only) */
  updateRole: RoleWithPermissions;
  /**
   * Bulk update role permissions (admin only)
   * Replaces all permissions for a role with the provided set
   */
  updateRolePermissions: RoleWithPermissions;
  updateSolution: Solution;
  updateSolutionTag: SolutionTag;
  updateTask: Task;
  updateTaskStatus: TaskStatus;
  updateTelemetryAttribute: TelemetryAttribute;
  updateTelemetryValue: TelemetryValue;
  /** Update user information (admin only) */
  updateUser: UserExtended;
};


export type MutationAcquireLockArgs = {
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
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


export type MutationCreateBackupArgs = {
  customName?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateCustomerArgs = {
  input: CustomerInput;
};


export type MutationCreateLicenseArgs = {
  input: LicenseInput;
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


export type MutationExportTasksCsvArgs = {
  productId: Scalars['ID']['input'];
};


export type MutationGrantPermissionArgs = {
  input: GrantPermissionInput;
};


export type MutationImportAdoptionPlanTelemetryArgs = {
  adoptionPlanId: Scalars['ID']['input'];
  file: Scalars['Upload']['input'];
};


export type MutationImportCustomerAdoptionFromExcelArgs = {
  content: Scalars['String']['input'];
};


export type MutationImportProductFromExcelArgs = {
  content: Scalars['String']['input'];
  mode: ImportMode;
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


export type MutationReleaseLockArgs = {
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
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


export type MutationReorderProductsInSolutionArgs = {
  productOrders: Array<ProductOrderInput>;
  solutionId: Scalars['ID']['input'];
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


export type MutationUpdateAutoBackupConfigArgs = {
  input: AutoBackupConfigInput;
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
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  product?: Maybe<Product>;
  productId?: Maybe<Scalars['ID']['output']>;
  solution?: Maybe<Solution>;
  solutionId?: Maybe<Scalars['ID']['output']>;
};

export type OutcomeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
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
  createdAt: Scalars['String']['output'];
  grantedBy?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  permissionLevel: Scalars['String']['output'];
  resourceId?: Maybe<Scalars['ID']['output']>;
  resourceType: Scalars['String']['output'];
  userId: Scalars['ID']['output'];
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
};

export type ProductNameMigrationResult = {
  __typename?: 'ProductNameMigrationResult';
  alreadyCorrectCount: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  migratedCount: Scalars['Int']['output'];
  totalChecked: Scalars['Int']['output'];
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
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  productId: Scalars['ID']['output'];
  taskTags?: Maybe<Array<TaskTag>>;
};

export type ProductTagInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  productId: Scalars['ID']['input'];
};

export type ProductTagUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  adoptionPlan?: Maybe<AdoptionPlan>;
  adoptionPlansForCustomer: Array<AdoptionPlan>;
  /** Get the AI agent's data context status */
  aiDataContextStatus: AiDataContextStatus;
  /** Ask the AI agent a natural language question about the data */
  askAI: AiQueryResponse;
  /** Get auto-backup configuration */
  autoBackupConfig: AutoBackupConfig;
  /** Get available resources for permission assignment (admin only) */
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
  exportProductToExcel: ExcelExportResult;
  /** Check if the AI Agent is available (requires aiuser account to exist) */
  isAIAgentAvailable: AiAgentAvailability;
  licenses: Array<License>;
  /** List all available database backups */
  listBackups: Array<BackupMetadata>;
  /** Get current authenticated user */
  me?: Maybe<UserExtended>;
  /** Get current user's permissions */
  myPermissions: Array<Permission>;
  node?: Maybe<Node>;
  outcomes: Array<Outcome>;
  product?: Maybe<Product>;
  productTag?: Maybe<ProductTag>;
  productTags?: Maybe<Array<ProductTag>>;
  products: ProductConnection;
  releases: Array<Release>;
  /** Get specific role with permissions (admin only) */
  role?: Maybe<RoleWithPermissions>;
  /** Get all roles with permissions (admin only) */
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
  /** Get user by ID with permissions (admin or self only) */
  user?: Maybe<UserWithPermissions>;
  /** Get roles for a specific user */
  userRoles: Array<RoleWithPermissions>;
  /** Get all users (admin only) */
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


export type QueryExportProductToExcelArgs = {
  productName: Scalars['String']['input'];
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

export type Release = Node & {
  __typename?: 'Release';
  description?: Maybe<Scalars['String']['output']>;
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
  description?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  level: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
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
  recordsRestored?: Maybe<BackupRecordCounts>;
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
  User = 'USER'
}

export type RolePermission = {
  __typename?: 'RolePermission';
  id: Scalars['ID']['output'];
  permissionLevel: Scalars['String']['output'];
  resourceId?: Maybe<Scalars['String']['output']>;
  resourceName?: Maybe<Scalars['String']['output']>;
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
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  solutionId: Scalars['ID']['output'];
  taskTags?: Maybe<Array<SolutionTaskTag>>;
};

export type SolutionTagInput = {
  color?: InputMaybe<Scalars['String']['input']>;
  displayOrder?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  solutionId: Scalars['ID']['input'];
};

export type SolutionTagUpdateInput = {
  color?: InputMaybe<Scalars['String']['input']>;
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

export type UpdateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  permissions?: InputMaybe<Array<ResourcePermissionInput>>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  isAdmin?: InputMaybe<Scalars['Boolean']['input']>;
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
  email: Scalars['String']['output'];
  fullName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isAdmin: Scalars['Boolean']['output'];
  mustChangePassword: Scalars['Boolean']['output'];
  roles?: Maybe<Array<Scalars['String']['output']>>;
  username: Scalars['String']['output'];
};

export type UserWithPermissions = {
  __typename?: 'UserWithPermissions';
  permissions: Array<Permission>;
  roles: Array<Scalars['String']['output']>;
  user: UserExtended;
};

export type ValidationError = {
  __typename?: 'ValidationError';
  column?: Maybe<Scalars['String']['output']>;
  field?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  row?: Maybe<Scalars['Int']['output']>;
  severity: Scalars['String']['output'];
  sheet: Scalars['String']['output'];
};

export type IsAiAgentAvailableQueryVariables = Exact<{ [key: string]: never; }>;


export type IsAiAgentAvailableQuery = { __typename?: 'Query', isAIAgentAvailable: { __typename?: 'AIAgentAvailability', available: boolean, message: string } };

export type AskAiQueryVariables = Exact<{
  question: Scalars['String']['input'];
  conversationId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AskAiQuery = { __typename?: 'Query', askAI: { __typename?: 'AIQueryResponse', answer: string, data?: Record<string, any> | null, query?: string | null, suggestions?: Array<string> | null, error?: string | null, metadata?: { __typename?: 'AIQueryMetadata', executionTime: number, rowCount: number, truncated: boolean, cached: boolean, templateUsed?: string | null, providerUsed?: string | null } | null } };

export type ReorderTasksMutationVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
  solutionId?: InputMaybe<Scalars['ID']['input']>;
  order: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderTasksMutation = { __typename?: 'Mutation', reorderTasks: boolean };

export type CreateProductMutationVariables = Exact<{
  input: ProductInput;
}>;


export type CreateProductMutation = { __typename?: 'Mutation', createProduct: { __typename?: 'Product', id: string, name: string, resources?: Array<{ __typename?: 'Resource', label: string, url: string }> | null, statusPercent: number } };

export type UpdateProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Product', id: string, name: string, resources?: Array<{ __typename?: 'Resource', label: string, url: string }> | null, statusPercent: number, customAttrs?: Record<string, any> | null } };

export type DeleteProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProductMutation = { __typename?: 'Mutation', deleteProduct: boolean };

export type CreateTaskMutationVariables = Exact<{
  input: TaskCreateInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'Task', id: string, name: string, description?: string | null, estMinutes: number, weight: number, sequenceNumber: number, licenseLevel: LicenseLevel, notes?: string | null, howToDoc: Array<string>, howToVideo: Array<string>, license?: { __typename?: 'License', id: string, name: string, level: number } | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, releases: Array<{ __typename?: 'Release', id: string, name: string, level: number }>, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }>, telemetryAttributes: Array<{ __typename?: 'TelemetryAttribute', id: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean, isSuccessful: boolean, currentValue?: { __typename?: 'TelemetryValue', id: string, value: Record<string, any>, source?: string | null, createdAt: string } | null }> } };

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: TaskUpdateInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'Task', id: string, name: string, description?: string | null, estMinutes: number, weight: number, sequenceNumber: number, licenseLevel: LicenseLevel, notes?: string | null, howToDoc: Array<string>, howToVideo: Array<string>, license?: { __typename?: 'License', id: string, name: string, level: number } | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, releases: Array<{ __typename?: 'Release', id: string, name: string, level: number }>, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }>, telemetryAttributes: Array<{ __typename?: 'TelemetryAttribute', id: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean, isSuccessful: boolean, currentValue?: { __typename?: 'TelemetryValue', id: string, value: Record<string, any>, source?: string | null, createdAt: string } | null }> } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', queueTaskSoftDelete: boolean };

export type ProcessDeletionQueueMutationVariables = Exact<{ [key: string]: never; }>;


export type ProcessDeletionQueueMutation = { __typename?: 'Mutation', processDeletionQueue: number };

export type DeleteSolutionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSolutionMutation = { __typename?: 'Mutation', deleteSolution: boolean };

export type UpdateSolutionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: SolutionInput;
}>;


export type UpdateSolutionMutation = { __typename?: 'Mutation', updateSolution: { __typename?: 'Solution', id: string, name: string, description?: string | null, customAttrs?: Record<string, any> | null } };

export type CreateLicenseMutationVariables = Exact<{
  input: LicenseInput;
}>;


export type CreateLicenseMutation = { __typename?: 'Mutation', createLicense: { __typename?: 'License', id: string, name: string, description?: string | null, level: number, isActive: boolean } };

export type UpdateLicenseMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: LicenseInput;
}>;


export type UpdateLicenseMutation = { __typename?: 'Mutation', updateLicense: { __typename?: 'License', id: string, name: string, description?: string | null, level: number, isActive: boolean } };

export type DeleteLicenseMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteLicenseMutation = { __typename?: 'Mutation', deleteLicense: boolean };

export type CreateReleaseMutationVariables = Exact<{
  input: ReleaseInput;
}>;


export type CreateReleaseMutation = { __typename?: 'Mutation', createRelease: { __typename?: 'Release', id: string, name: string, description?: string | null, level: number, isActive: boolean } };

export type UpdateReleaseMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ReleaseInput;
}>;


export type UpdateReleaseMutation = { __typename?: 'Mutation', updateRelease: { __typename?: 'Release', id: string, name: string, description?: string | null, level: number, isActive: boolean } };

export type DeleteReleaseMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteReleaseMutation = { __typename?: 'Mutation', deleteRelease: boolean };

export type CreateOutcomeMutationVariables = Exact<{
  input: OutcomeInput;
}>;


export type CreateOutcomeMutation = { __typename?: 'Mutation', createOutcome: { __typename?: 'Outcome', id: string, name: string, description?: string | null } };

export type UpdateOutcomeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: OutcomeInput;
}>;


export type UpdateOutcomeMutation = { __typename?: 'Mutation', updateOutcome: { __typename?: 'Outcome', id: string, name: string, description?: string | null } };

export type DeleteOutcomeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteOutcomeMutation = { __typename?: 'Mutation', deleteOutcome: boolean };

export type CreateTelemetryAttributeMutationVariables = Exact<{
  input: TelemetryAttributeInput;
}>;


export type CreateTelemetryAttributeMutation = { __typename?: 'Mutation', createTelemetryAttribute: { __typename?: 'TelemetryAttribute', id: string, taskId: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean } };

export type UpdateTelemetryAttributeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: TelemetryAttributeUpdateInput;
}>;


export type UpdateTelemetryAttributeMutation = { __typename?: 'Mutation', updateTelemetryAttribute: { __typename?: 'TelemetryAttribute', id: string, taskId: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean } };

export type DeleteTelemetryAttributeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTelemetryAttributeMutation = { __typename?: 'Mutation', deleteTelemetryAttribute: boolean };

export type AddProductToSolutionMutationVariables = Exact<{
  solutionId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AddProductToSolutionMutation = { __typename?: 'Mutation', addProductToSolutionEnhanced: boolean };

export type RemoveProductFromSolutionMutationVariables = Exact<{
  solutionId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
}>;


export type RemoveProductFromSolutionMutation = { __typename?: 'Mutation', removeProductFromSolutionEnhanced: boolean };

export type ReorderProductsInSolutionMutationVariables = Exact<{
  solutionId: Scalars['ID']['input'];
  productOrders: Array<ProductOrderInput> | ProductOrderInput;
}>;


export type ReorderProductsInSolutionMutation = { __typename?: 'Mutation', reorderProductsInSolution: boolean };

export type ImportProductFromExcelMutationVariables = Exact<{
  content: Scalars['String']['input'];
  mode: ImportMode;
}>;


export type ImportProductFromExcelMutation = { __typename?: 'Mutation', importProductFromExcel: { __typename?: 'ImportResult', success: boolean, productId?: string | null, productName: string, stats: { __typename?: 'ImportStats', tasksImported: number, outcomesImported: number, releasesImported: number, licensesImported: number, customAttributesImported: number, telemetryAttributesImported: number }, errors: Array<{ __typename?: 'ValidationError', sheet: string, row?: number | null, column?: string | null, field?: string | null, message: string, severity: string }>, warnings: Array<{ __typename?: 'ValidationError', sheet: string, row?: number | null, column?: string | null, field?: string | null, message: string, severity: string }> } };

export type CreateProductTagMutationVariables = Exact<{
  input: ProductTagInput;
}>;


export type CreateProductTagMutation = { __typename?: 'Mutation', createProductTag: { __typename?: 'ProductTag', id: string, productId: string, name: string, color?: string | null, displayOrder?: number | null } };

export type UpdateProductTagMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProductTagUpdateInput;
}>;


export type UpdateProductTagMutation = { __typename?: 'Mutation', updateProductTag: { __typename?: 'ProductTag', id: string, productId: string, name: string, color?: string | null, displayOrder?: number | null } };

export type DeleteProductTagMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProductTagMutation = { __typename?: 'Mutation', deleteProductTag: boolean };

export type SetTaskTagsMutationVariables = Exact<{
  taskId: Scalars['ID']['input'];
  tagIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type SetTaskTagsMutation = { __typename?: 'Mutation', setTaskTags: { __typename?: 'Task', id: string, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }> } };

export type AddTagToTaskMutationVariables = Exact<{
  taskId: Scalars['ID']['input'];
  tagId: Scalars['ID']['input'];
}>;


export type AddTagToTaskMutation = { __typename?: 'Mutation', addTagToTask: { __typename?: 'Task', id: string, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }> } };

export type RemoveTagFromTaskMutationVariables = Exact<{
  taskId: Scalars['ID']['input'];
  tagId: Scalars['ID']['input'];
}>;


export type RemoveTagFromTaskMutation = { __typename?: 'Mutation', removeTagFromTask: { __typename?: 'Task', id: string, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }> } };

export type CreateSolutionTagMutationVariables = Exact<{
  input: SolutionTagInput;
}>;


export type CreateSolutionTagMutation = { __typename?: 'Mutation', createSolutionTag: { __typename?: 'SolutionTag', id: string, solutionId: string, name: string, color?: string | null, displayOrder?: number | null } };

export type UpdateSolutionTagMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: SolutionTagUpdateInput;
}>;


export type UpdateSolutionTagMutation = { __typename?: 'Mutation', updateSolutionTag: { __typename?: 'SolutionTag', id: string, solutionId: string, name: string, color?: string | null, displayOrder?: number | null } };

export type DeleteSolutionTagMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSolutionTagMutation = { __typename?: 'Mutation', deleteSolutionTag: boolean };

export type SetSolutionTaskTagsMutationVariables = Exact<{
  taskId: Scalars['ID']['input'];
  tagIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type SetSolutionTaskTagsMutation = { __typename?: 'Mutation', setSolutionTaskTags: { __typename?: 'Task', id: string, solutionTags: Array<{ __typename?: 'SolutionTag', id: string, name: string, color?: string | null }> } };

export type AddSolutionTagToTaskMutationVariables = Exact<{
  taskId: Scalars['ID']['input'];
  tagId: Scalars['ID']['input'];
}>;


export type AddSolutionTagToTaskMutation = { __typename?: 'Mutation', addSolutionTagToTask: { __typename?: 'Task', id: string, solutionTags: Array<{ __typename?: 'SolutionTag', id: string, name: string, color?: string | null }> } };

export type RemoveSolutionTagFromTaskMutationVariables = Exact<{
  taskId: Scalars['ID']['input'];
  tagId: Scalars['ID']['input'];
}>;


export type RemoveSolutionTagFromTaskMutation = { __typename?: 'Mutation', removeSolutionTagFromTask: { __typename?: 'Task', id: string, solutionTags: Array<{ __typename?: 'SolutionTag', id: string, name: string, color?: string | null }> } };

export type ProductsQueryVariables = Exact<{ [key: string]: never; }>;


export type ProductsQuery = { __typename?: 'Query', products: { __typename?: 'ProductConnection', edges: Array<{ __typename?: 'ProductEdge', node: { __typename?: 'Product', id: string, name: string, resources?: Array<{ __typename?: 'Resource', label: string, url: string }> | null, statusPercent: number, customAttrs?: Record<string, any> | null, licenses: Array<{ __typename?: 'License', id: string, name: string, description?: string | null, level: number, isActive: boolean }>, releases: Array<{ __typename?: 'Release', id: string, name: string, description?: string | null, level: number, isActive: boolean }>, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string, description?: string | null }> } }> } };

export type SolutionsQueryVariables = Exact<{ [key: string]: never; }>;


export type SolutionsQuery = { __typename?: 'Query', solutions: { __typename?: 'SolutionConnection', edges: Array<{ __typename?: 'SolutionEdge', node: { __typename?: 'Solution', id: string, name: string, resources?: Array<{ __typename?: 'Resource', label: string, url: string }> | null, customAttrs?: Record<string, any> | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string, description?: string | null }>, releases: Array<{ __typename?: 'Release', id: string, name: string, description?: string | null, level: number }>, products: { __typename?: 'ProductConnection', edges: Array<{ __typename?: 'ProductEdge', node: { __typename?: 'Product', id: string, name: string } }> } } }> } };

export type CustomersQueryVariables = Exact<{ [key: string]: never; }>;


export type CustomersQuery = { __typename?: 'Query', customers: Array<{ __typename?: 'Customer', id: string, name: string, description?: string | null, products: Array<{ __typename?: 'CustomerProductWithPlan', id: string, name: string, product: { __typename?: 'Product', id: string, name: string }, adoptionPlan?: { __typename?: 'AdoptionPlan', id: string } | null }>, solutions: Array<{ __typename?: 'CustomerSolutionWithPlan', id: string, name: string, solution: { __typename?: 'Solution', id: string, name: string }, adoptionPlan?: { __typename?: 'SolutionAdoptionPlan', id: string } | null }> }> };

export type TasksForProductQueryVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type TasksForProductQuery = { __typename?: 'Query', tasks: { __typename?: 'TaskConnection', edges: Array<{ __typename?: 'TaskEdge', node: { __typename?: 'Task', id: string, name: string, description?: string | null, estMinutes: number, weight: number, sequenceNumber: number, licenseLevel: LicenseLevel, notes?: string | null, howToDoc: Array<string>, howToVideo: Array<string>, isCompleteBasedOnTelemetry: boolean, telemetryCompletionPercentage: number, license?: { __typename?: 'License', id: string, name: string, level: number } | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, releases: Array<{ __typename?: 'Release', id: string, name: string, level: number, description?: string | null }>, telemetryAttributes: Array<{ __typename?: 'TelemetryAttribute', id: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean, isSuccessful: boolean, currentValue?: { __typename?: 'TelemetryValue', id: string, value: Record<string, any>, source?: string | null, createdAt: string } | null }>, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }> } }> } };

export type TasksForSolutionQueryVariables = Exact<{
  solutionId: Scalars['ID']['input'];
}>;


export type TasksForSolutionQuery = { __typename?: 'Query', tasks: { __typename?: 'TaskConnection', edges: Array<{ __typename?: 'TaskEdge', node: { __typename?: 'Task', id: string, name: string, description?: string | null, estMinutes: number, weight: number, sequenceNumber: number, licenseLevel: LicenseLevel, notes?: string | null, howToDoc: Array<string>, howToVideo: Array<string>, isCompleteBasedOnTelemetry: boolean, telemetryCompletionPercentage: number, license?: { __typename?: 'License', id: string, name: string, level: number } | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, releases: Array<{ __typename?: 'Release', id: string, name: string, level: number, description?: string | null }>, telemetryAttributes: Array<{ __typename?: 'TelemetryAttribute', id: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean, isSuccessful: boolean, currentValue?: { __typename?: 'TelemetryValue', id: string, value: Record<string, any>, source?: string | null, createdAt: string } | null }>, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null }>, solutionTags: Array<{ __typename?: 'SolutionTag', id: string, name: string, color?: string | null }> } }> } };

export type OutcomesQueryVariables = Exact<{
  productId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type OutcomesQuery = { __typename?: 'Query', outcomes: Array<{ __typename?: 'Outcome', id: string, name: string, product?: { __typename?: 'Product', id: string, name: string } | null }> };

export type ProductDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ProductDetailQuery = { __typename?: 'Query', product?: { __typename?: 'Product', id: string, name: string, resources?: Array<{ __typename?: 'Resource', label: string, url: string }> | null, statusPercent: number, customAttrs?: Record<string, any> | null, licenses: Array<{ __typename?: 'License', id: string, name: string, description?: string | null, level: number, isActive: boolean }>, releases: Array<{ __typename?: 'Release', id: string, name: string, description?: string | null, level: number, isActive: boolean }>, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string, description?: string | null }>, tags: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null, displayOrder?: number | null }> } | null };

export type SolutionDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SolutionDetailQuery = { __typename?: 'Query', solution?: { __typename?: 'Solution', id: string, name: string, resources?: Array<{ __typename?: 'Resource', label: string, url: string }> | null, customAttrs?: Record<string, any> | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string, description?: string | null }>, releases: Array<{ __typename?: 'Release', id: string, name: string, description?: string | null, level: number }>, products: { __typename?: 'ProductConnection', edges: Array<{ __typename?: 'ProductEdge', node: { __typename?: 'Product', id: string, name: string } }> }, tags: Array<{ __typename?: 'SolutionTag', id: string, name: string, color?: string | null, displayOrder?: number | null }> } | null };

export type ProductTagsQueryVariables = Exact<{
  productId: Scalars['ID']['input'];
}>;


export type ProductTagsQuery = { __typename?: 'Query', productTags?: Array<{ __typename?: 'ProductTag', id: string, name: string, color?: string | null, displayOrder?: number | null }> | null };

export type TaskTagsQueryVariables = Exact<{
  taskId: Scalars['ID']['input'];
}>;


export type TaskTagsQuery = { __typename?: 'Query', taskTags?: Array<{ __typename?: 'TaskTag', id: string, tag: { __typename?: 'ProductTag', id: string, name: string, color?: string | null } }> | null };

export type CustomerProductTagsQueryVariables = Exact<{
  customerProductId: Scalars['ID']['input'];
}>;


export type CustomerProductTagsQuery = { __typename?: 'Query', customerProductTags?: Array<{ __typename?: 'CustomerProductTag', id: string, name: string, color?: string | null, displayOrder?: number | null }> | null };

export type SolutionTagsQueryVariables = Exact<{
  solutionId: Scalars['ID']['input'];
}>;


export type SolutionTagsQuery = { __typename?: 'Query', solutionTags?: Array<{ __typename?: 'SolutionTag', id: string, name: string, color?: string | null, displayOrder?: number | null }> | null };

export type CustomerSolutionTagsQueryVariables = Exact<{
  customerSolutionId: Scalars['ID']['input'];
}>;


export type CustomerSolutionTagsQuery = { __typename?: 'Query', customerSolutionTags?: Array<{ __typename?: 'CustomerSolutionTag', id: string, name: string, color?: string | null, displayOrder?: number | null }> | null };


export const IsAiAgentAvailableDocument = gql`
    query IsAIAgentAvailable {
  isAIAgentAvailable {
    available
    message
  }
}
    `;

/**
 * __useIsAiAgentAvailableQuery__
 *
 * To run a query within a React component, call `useIsAiAgentAvailableQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsAiAgentAvailableQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsAiAgentAvailableQuery({
 *   variables: {
 *   },
 * });
 */
export function useIsAiAgentAvailableQuery(baseOptions?: Apollo.QueryHookOptions<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>(IsAiAgentAvailableDocument, options);
}
export function useIsAiAgentAvailableLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>(IsAiAgentAvailableDocument, options);
}
export function useIsAiAgentAvailableSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>(IsAiAgentAvailableDocument, options);
}
export type IsAiAgentAvailableQueryHookResult = ReturnType<typeof useIsAiAgentAvailableQuery>;
export type IsAiAgentAvailableLazyQueryHookResult = ReturnType<typeof useIsAiAgentAvailableLazyQuery>;
export type IsAiAgentAvailableSuspenseQueryHookResult = ReturnType<typeof useIsAiAgentAvailableSuspenseQuery>;
export type IsAiAgentAvailableQueryResult = Apollo.QueryResult<IsAiAgentAvailableQuery, IsAiAgentAvailableQueryVariables>;
export const AskAiDocument = gql`
    query AskAI($question: String!, $conversationId: String) {
  askAI(question: $question, conversationId: $conversationId) {
    answer
    data
    query
    suggestions
    error
    metadata {
      executionTime
      rowCount
      truncated
      cached
      templateUsed
      providerUsed
    }
  }
}
    `;

/**
 * __useAskAiQuery__
 *
 * To run a query within a React component, call `useAskAiQuery` and pass it any options that fit your needs.
 * When your component renders, `useAskAiQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAskAiQuery({
 *   variables: {
 *      question: // value for 'question'
 *      conversationId: // value for 'conversationId'
 *   },
 * });
 */
export function useAskAiQuery(baseOptions: Apollo.QueryHookOptions<AskAiQuery, AskAiQueryVariables> & ({ variables: AskAiQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<AskAiQuery, AskAiQueryVariables>(AskAiDocument, options);
}
export function useAskAiLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AskAiQuery, AskAiQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<AskAiQuery, AskAiQueryVariables>(AskAiDocument, options);
}
export function useAskAiSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AskAiQuery, AskAiQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<AskAiQuery, AskAiQueryVariables>(AskAiDocument, options);
}
export type AskAiQueryHookResult = ReturnType<typeof useAskAiQuery>;
export type AskAiLazyQueryHookResult = ReturnType<typeof useAskAiLazyQuery>;
export type AskAiSuspenseQueryHookResult = ReturnType<typeof useAskAiSuspenseQuery>;
export type AskAiQueryResult = Apollo.QueryResult<AskAiQuery, AskAiQueryVariables>;
export const ReorderTasksDocument = gql`
    mutation ReorderTasks($productId: ID, $solutionId: ID, $order: [ID!]!) {
  reorderTasks(productId: $productId, solutionId: $solutionId, order: $order)
}
    `;
export type ReorderTasksMutationFn = Apollo.MutationFunction<ReorderTasksMutation, ReorderTasksMutationVariables>;

/**
 * __useReorderTasksMutation__
 *
 * To run a mutation, you first call `useReorderTasksMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReorderTasksMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reorderTasksMutation, { data, loading, error }] = useReorderTasksMutation({
 *   variables: {
 *      productId: // value for 'productId'
 *      solutionId: // value for 'solutionId'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useReorderTasksMutation(baseOptions?: Apollo.MutationHookOptions<ReorderTasksMutation, ReorderTasksMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<ReorderTasksMutation, ReorderTasksMutationVariables>(ReorderTasksDocument, options);
}
export type ReorderTasksMutationHookResult = ReturnType<typeof useReorderTasksMutation>;
export type ReorderTasksMutationResult = Apollo.MutationResult<ReorderTasksMutation>;
export type ReorderTasksMutationOptions = Apollo.BaseMutationOptions<ReorderTasksMutation, ReorderTasksMutationVariables>;
export const CreateProductDocument = gql`
    mutation CreateProduct($input: ProductInput!) {
  createProduct(input: $input) {
    id
    name
    resources { label url }
    statusPercent
  }
}
    `;
export type CreateProductMutationFn = Apollo.MutationFunction<CreateProductMutation, CreateProductMutationVariables>;

/**
 * __useCreateProductMutation__
 *
 * To run a mutation, you first call `useCreateProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProductMutation, { data, loading, error }] = useCreateProductMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProductMutation(baseOptions?: Apollo.MutationHookOptions<CreateProductMutation, CreateProductMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateProductMutation, CreateProductMutationVariables>(CreateProductDocument, options);
}
export type CreateProductMutationHookResult = ReturnType<typeof useCreateProductMutation>;
export type CreateProductMutationResult = Apollo.MutationResult<CreateProductMutation>;
export type CreateProductMutationOptions = Apollo.BaseMutationOptions<CreateProductMutation, CreateProductMutationVariables>;
export const UpdateProductDocument = gql`
    mutation UpdateProduct($id: ID!, $input: ProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    resources { label url }
    statusPercent
    customAttrs
  }
}
    `;
export type UpdateProductMutationFn = Apollo.MutationFunction<UpdateProductMutation, UpdateProductMutationVariables>;

/**
 * __useUpdateProductMutation__
 *
 * To run a mutation, you first call `useUpdateProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProductMutation, { data, loading, error }] = useUpdateProductMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProductMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProductMutation, UpdateProductMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateProductMutation, UpdateProductMutationVariables>(UpdateProductDocument, options);
}
export type UpdateProductMutationHookResult = ReturnType<typeof useUpdateProductMutation>;
export type UpdateProductMutationResult = Apollo.MutationResult<UpdateProductMutation>;
export type UpdateProductMutationOptions = Apollo.BaseMutationOptions<UpdateProductMutation, UpdateProductMutationVariables>;
export const DeleteProductDocument = gql`
    mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id)
}
    `;
export type DeleteProductMutationFn = Apollo.MutationFunction<DeleteProductMutation, DeleteProductMutationVariables>;

/**
 * __useDeleteProductMutation__
 *
 * To run a mutation, you first call `useDeleteProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProductMutation, { data, loading, error }] = useDeleteProductMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteProductMutation(baseOptions?: Apollo.MutationHookOptions<DeleteProductMutation, DeleteProductMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteProductMutation, DeleteProductMutationVariables>(DeleteProductDocument, options);
}
export type DeleteProductMutationHookResult = ReturnType<typeof useDeleteProductMutation>;
export type DeleteProductMutationResult = Apollo.MutationResult<DeleteProductMutation>;
export type DeleteProductMutationOptions = Apollo.BaseMutationOptions<DeleteProductMutation, DeleteProductMutationVariables>;
export const CreateTaskDocument = gql`
    mutation CreateTask($input: TaskCreateInput!) {
  createTask(input: $input) {
    id
    name
    description
    estMinutes
    weight
    sequenceNumber
    licenseLevel
    notes
    howToDoc
    howToVideo
    license {
      id
      name
      level
    }
    outcomes {
      id
      name
    }
    releases {
      id
      name
      level
    }
    tags {
      id
      name
      color
    }
    telemetryAttributes {
      id
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
      isSuccessful
      currentValue {
        id
        value
        source
        createdAt
      }
    }
  }
}
    `;
export type CreateTaskMutationFn = Apollo.MutationFunction<CreateTaskMutation, CreateTaskMutationVariables>;

/**
 * __useCreateTaskMutation__
 *
 * To run a mutation, you first call `useCreateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTaskMutation, { data, loading, error }] = useCreateTaskMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateTaskMutation(baseOptions?: Apollo.MutationHookOptions<CreateTaskMutation, CreateTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateTaskMutation, CreateTaskMutationVariables>(CreateTaskDocument, options);
}
export type CreateTaskMutationHookResult = ReturnType<typeof useCreateTaskMutation>;
export type CreateTaskMutationResult = Apollo.MutationResult<CreateTaskMutation>;
export type CreateTaskMutationOptions = Apollo.BaseMutationOptions<CreateTaskMutation, CreateTaskMutationVariables>;
export const UpdateTaskDocument = gql`
    mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
  updateTask(id: $id, input: $input) {
    id
    name
    description
    estMinutes
    weight
    sequenceNumber
    licenseLevel
    notes
    howToDoc
    howToVideo
    license {
      id
      name
      level
    }
    outcomes {
      id
      name
    }
    releases {
      id
      name
      level
    }
    tags {
      id
      name
      color
    }
    telemetryAttributes {
      id
      name
      description
      dataType
      isRequired
      successCriteria
      order
      isActive
      isSuccessful
      currentValue {
        id
        value
        source
        createdAt
      }
    }
  }
}
    `;
export type UpdateTaskMutationFn = Apollo.MutationFunction<UpdateTaskMutation, UpdateTaskMutationVariables>;

/**
 * __useUpdateTaskMutation__
 *
 * To run a mutation, you first call `useUpdateTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTaskMutation, { data, loading, error }] = useUpdateTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTaskMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTaskMutation, UpdateTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateTaskMutation, UpdateTaskMutationVariables>(UpdateTaskDocument, options);
}
export type UpdateTaskMutationHookResult = ReturnType<typeof useUpdateTaskMutation>;
export type UpdateTaskMutationResult = Apollo.MutationResult<UpdateTaskMutation>;
export type UpdateTaskMutationOptions = Apollo.BaseMutationOptions<UpdateTaskMutation, UpdateTaskMutationVariables>;
export const DeleteTaskDocument = gql`
    mutation DeleteTask($id: ID!) {
  queueTaskSoftDelete(id: $id)
}
    `;
export type DeleteTaskMutationFn = Apollo.MutationFunction<DeleteTaskMutation, DeleteTaskMutationVariables>;

/**
 * __useDeleteTaskMutation__
 *
 * To run a mutation, you first call `useDeleteTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTaskMutation, { data, loading, error }] = useDeleteTaskMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTaskMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTaskMutation, DeleteTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
}
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const ProcessDeletionQueueDocument = gql`
    mutation ProcessDeletionQueue {
  processDeletionQueue
}
    `;
export type ProcessDeletionQueueMutationFn = Apollo.MutationFunction<ProcessDeletionQueueMutation, ProcessDeletionQueueMutationVariables>;

/**
 * __useProcessDeletionQueueMutation__
 *
 * To run a mutation, you first call `useProcessDeletionQueueMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useProcessDeletionQueueMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [processDeletionQueueMutation, { data, loading, error }] = useProcessDeletionQueueMutation({
 *   variables: {
 *   },
 * });
 */
export function useProcessDeletionQueueMutation(baseOptions?: Apollo.MutationHookOptions<ProcessDeletionQueueMutation, ProcessDeletionQueueMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<ProcessDeletionQueueMutation, ProcessDeletionQueueMutationVariables>(ProcessDeletionQueueDocument, options);
}
export type ProcessDeletionQueueMutationHookResult = ReturnType<typeof useProcessDeletionQueueMutation>;
export type ProcessDeletionQueueMutationResult = Apollo.MutationResult<ProcessDeletionQueueMutation>;
export type ProcessDeletionQueueMutationOptions = Apollo.BaseMutationOptions<ProcessDeletionQueueMutation, ProcessDeletionQueueMutationVariables>;
export const DeleteSolutionDocument = gql`
    mutation DeleteSolution($id: ID!) {
  deleteSolution(id: $id)
}
    `;
export type DeleteSolutionMutationFn = Apollo.MutationFunction<DeleteSolutionMutation, DeleteSolutionMutationVariables>;

/**
 * __useDeleteSolutionMutation__
 *
 * To run a mutation, you first call `useDeleteSolutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSolutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSolutionMutation, { data, loading, error }] = useDeleteSolutionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteSolutionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteSolutionMutation, DeleteSolutionMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteSolutionMutation, DeleteSolutionMutationVariables>(DeleteSolutionDocument, options);
}
export type DeleteSolutionMutationHookResult = ReturnType<typeof useDeleteSolutionMutation>;
export type DeleteSolutionMutationResult = Apollo.MutationResult<DeleteSolutionMutation>;
export type DeleteSolutionMutationOptions = Apollo.BaseMutationOptions<DeleteSolutionMutation, DeleteSolutionMutationVariables>;
export const UpdateSolutionDocument = gql`
    mutation UpdateSolution($id: ID!, $input: SolutionInput!) {
  updateSolution(id: $id, input: $input) {
    id
    name
    description
    customAttrs
  }
}
    `;
export type UpdateSolutionMutationFn = Apollo.MutationFunction<UpdateSolutionMutation, UpdateSolutionMutationVariables>;

/**
 * __useUpdateSolutionMutation__
 *
 * To run a mutation, you first call `useUpdateSolutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSolutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSolutionMutation, { data, loading, error }] = useUpdateSolutionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSolutionMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSolutionMutation, UpdateSolutionMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateSolutionMutation, UpdateSolutionMutationVariables>(UpdateSolutionDocument, options);
}
export type UpdateSolutionMutationHookResult = ReturnType<typeof useUpdateSolutionMutation>;
export type UpdateSolutionMutationResult = Apollo.MutationResult<UpdateSolutionMutation>;
export type UpdateSolutionMutationOptions = Apollo.BaseMutationOptions<UpdateSolutionMutation, UpdateSolutionMutationVariables>;
export const CreateLicenseDocument = gql`
    mutation CreateLicense($input: LicenseInput!) {
  createLicense(input: $input) {
    id
    name
    description
    level
    isActive
  }
}
    `;
export type CreateLicenseMutationFn = Apollo.MutationFunction<CreateLicenseMutation, CreateLicenseMutationVariables>;

/**
 * __useCreateLicenseMutation__
 *
 * To run a mutation, you first call `useCreateLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createLicenseMutation, { data, loading, error }] = useCreateLicenseMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateLicenseMutation(baseOptions?: Apollo.MutationHookOptions<CreateLicenseMutation, CreateLicenseMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateLicenseMutation, CreateLicenseMutationVariables>(CreateLicenseDocument, options);
}
export type CreateLicenseMutationHookResult = ReturnType<typeof useCreateLicenseMutation>;
export type CreateLicenseMutationResult = Apollo.MutationResult<CreateLicenseMutation>;
export type CreateLicenseMutationOptions = Apollo.BaseMutationOptions<CreateLicenseMutation, CreateLicenseMutationVariables>;
export const UpdateLicenseDocument = gql`
    mutation UpdateLicense($id: ID!, $input: LicenseInput!) {
  updateLicense(id: $id, input: $input) {
    id
    name
    description
    level
    isActive
  }
}
    `;
export type UpdateLicenseMutationFn = Apollo.MutationFunction<UpdateLicenseMutation, UpdateLicenseMutationVariables>;

/**
 * __useUpdateLicenseMutation__
 *
 * To run a mutation, you first call `useUpdateLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateLicenseMutation, { data, loading, error }] = useUpdateLicenseMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateLicenseMutation(baseOptions?: Apollo.MutationHookOptions<UpdateLicenseMutation, UpdateLicenseMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateLicenseMutation, UpdateLicenseMutationVariables>(UpdateLicenseDocument, options);
}
export type UpdateLicenseMutationHookResult = ReturnType<typeof useUpdateLicenseMutation>;
export type UpdateLicenseMutationResult = Apollo.MutationResult<UpdateLicenseMutation>;
export type UpdateLicenseMutationOptions = Apollo.BaseMutationOptions<UpdateLicenseMutation, UpdateLicenseMutationVariables>;
export const DeleteLicenseDocument = gql`
    mutation DeleteLicense($id: ID!) {
  deleteLicense(id: $id)
}
    `;
export type DeleteLicenseMutationFn = Apollo.MutationFunction<DeleteLicenseMutation, DeleteLicenseMutationVariables>;

/**
 * __useDeleteLicenseMutation__
 *
 * To run a mutation, you first call `useDeleteLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteLicenseMutation, { data, loading, error }] = useDeleteLicenseMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteLicenseMutation(baseOptions?: Apollo.MutationHookOptions<DeleteLicenseMutation, DeleteLicenseMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteLicenseMutation, DeleteLicenseMutationVariables>(DeleteLicenseDocument, options);
}
export type DeleteLicenseMutationHookResult = ReturnType<typeof useDeleteLicenseMutation>;
export type DeleteLicenseMutationResult = Apollo.MutationResult<DeleteLicenseMutation>;
export type DeleteLicenseMutationOptions = Apollo.BaseMutationOptions<DeleteLicenseMutation, DeleteLicenseMutationVariables>;
export const CreateReleaseDocument = gql`
    mutation CreateRelease($input: ReleaseInput!) {
  createRelease(input: $input) {
    id
    name
    description
    level
    isActive
  }
}
    `;
export type CreateReleaseMutationFn = Apollo.MutationFunction<CreateReleaseMutation, CreateReleaseMutationVariables>;

/**
 * __useCreateReleaseMutation__
 *
 * To run a mutation, you first call `useCreateReleaseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateReleaseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createReleaseMutation, { data, loading, error }] = useCreateReleaseMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateReleaseMutation(baseOptions?: Apollo.MutationHookOptions<CreateReleaseMutation, CreateReleaseMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateReleaseMutation, CreateReleaseMutationVariables>(CreateReleaseDocument, options);
}
export type CreateReleaseMutationHookResult = ReturnType<typeof useCreateReleaseMutation>;
export type CreateReleaseMutationResult = Apollo.MutationResult<CreateReleaseMutation>;
export type CreateReleaseMutationOptions = Apollo.BaseMutationOptions<CreateReleaseMutation, CreateReleaseMutationVariables>;
export const UpdateReleaseDocument = gql`
    mutation UpdateRelease($id: ID!, $input: ReleaseInput!) {
  updateRelease(id: $id, input: $input) {
    id
    name
    description
    level
    isActive
  }
}
    `;
export type UpdateReleaseMutationFn = Apollo.MutationFunction<UpdateReleaseMutation, UpdateReleaseMutationVariables>;

/**
 * __useUpdateReleaseMutation__
 *
 * To run a mutation, you first call `useUpdateReleaseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateReleaseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateReleaseMutation, { data, loading, error }] = useUpdateReleaseMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateReleaseMutation(baseOptions?: Apollo.MutationHookOptions<UpdateReleaseMutation, UpdateReleaseMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateReleaseMutation, UpdateReleaseMutationVariables>(UpdateReleaseDocument, options);
}
export type UpdateReleaseMutationHookResult = ReturnType<typeof useUpdateReleaseMutation>;
export type UpdateReleaseMutationResult = Apollo.MutationResult<UpdateReleaseMutation>;
export type UpdateReleaseMutationOptions = Apollo.BaseMutationOptions<UpdateReleaseMutation, UpdateReleaseMutationVariables>;
export const DeleteReleaseDocument = gql`
    mutation DeleteRelease($id: ID!) {
  deleteRelease(id: $id)
}
    `;
export type DeleteReleaseMutationFn = Apollo.MutationFunction<DeleteReleaseMutation, DeleteReleaseMutationVariables>;

/**
 * __useDeleteReleaseMutation__
 *
 * To run a mutation, you first call `useDeleteReleaseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteReleaseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteReleaseMutation, { data, loading, error }] = useDeleteReleaseMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteReleaseMutation(baseOptions?: Apollo.MutationHookOptions<DeleteReleaseMutation, DeleteReleaseMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteReleaseMutation, DeleteReleaseMutationVariables>(DeleteReleaseDocument, options);
}
export type DeleteReleaseMutationHookResult = ReturnType<typeof useDeleteReleaseMutation>;
export type DeleteReleaseMutationResult = Apollo.MutationResult<DeleteReleaseMutation>;
export type DeleteReleaseMutationOptions = Apollo.BaseMutationOptions<DeleteReleaseMutation, DeleteReleaseMutationVariables>;
export const CreateOutcomeDocument = gql`
    mutation CreateOutcome($input: OutcomeInput!) {
  createOutcome(input: $input) {
    id
    name
    description
  }
}
    `;
export type CreateOutcomeMutationFn = Apollo.MutationFunction<CreateOutcomeMutation, CreateOutcomeMutationVariables>;

/**
 * __useCreateOutcomeMutation__
 *
 * To run a mutation, you first call `useCreateOutcomeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOutcomeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOutcomeMutation, { data, loading, error }] = useCreateOutcomeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOutcomeMutation(baseOptions?: Apollo.MutationHookOptions<CreateOutcomeMutation, CreateOutcomeMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateOutcomeMutation, CreateOutcomeMutationVariables>(CreateOutcomeDocument, options);
}
export type CreateOutcomeMutationHookResult = ReturnType<typeof useCreateOutcomeMutation>;
export type CreateOutcomeMutationResult = Apollo.MutationResult<CreateOutcomeMutation>;
export type CreateOutcomeMutationOptions = Apollo.BaseMutationOptions<CreateOutcomeMutation, CreateOutcomeMutationVariables>;
export const UpdateOutcomeDocument = gql`
    mutation UpdateOutcome($id: ID!, $input: OutcomeInput!) {
  updateOutcome(id: $id, input: $input) {
    id
    name
    description
  }
}
    `;
export type UpdateOutcomeMutationFn = Apollo.MutationFunction<UpdateOutcomeMutation, UpdateOutcomeMutationVariables>;

/**
 * __useUpdateOutcomeMutation__
 *
 * To run a mutation, you first call `useUpdateOutcomeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOutcomeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOutcomeMutation, { data, loading, error }] = useUpdateOutcomeMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateOutcomeMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOutcomeMutation, UpdateOutcomeMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateOutcomeMutation, UpdateOutcomeMutationVariables>(UpdateOutcomeDocument, options);
}
export type UpdateOutcomeMutationHookResult = ReturnType<typeof useUpdateOutcomeMutation>;
export type UpdateOutcomeMutationResult = Apollo.MutationResult<UpdateOutcomeMutation>;
export type UpdateOutcomeMutationOptions = Apollo.BaseMutationOptions<UpdateOutcomeMutation, UpdateOutcomeMutationVariables>;
export const DeleteOutcomeDocument = gql`
    mutation DeleteOutcome($id: ID!) {
  deleteOutcome(id: $id)
}
    `;
export type DeleteOutcomeMutationFn = Apollo.MutationFunction<DeleteOutcomeMutation, DeleteOutcomeMutationVariables>;

/**
 * __useDeleteOutcomeMutation__
 *
 * To run a mutation, you first call `useDeleteOutcomeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteOutcomeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteOutcomeMutation, { data, loading, error }] = useDeleteOutcomeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteOutcomeMutation(baseOptions?: Apollo.MutationHookOptions<DeleteOutcomeMutation, DeleteOutcomeMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteOutcomeMutation, DeleteOutcomeMutationVariables>(DeleteOutcomeDocument, options);
}
export type DeleteOutcomeMutationHookResult = ReturnType<typeof useDeleteOutcomeMutation>;
export type DeleteOutcomeMutationResult = Apollo.MutationResult<DeleteOutcomeMutation>;
export type DeleteOutcomeMutationOptions = Apollo.BaseMutationOptions<DeleteOutcomeMutation, DeleteOutcomeMutationVariables>;
export const CreateTelemetryAttributeDocument = gql`
    mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
  createTelemetryAttribute(input: $input) {
    id
    taskId
    name
    description
    dataType
    isRequired
    successCriteria
    order
    isActive
  }
}
    `;
export type CreateTelemetryAttributeMutationFn = Apollo.MutationFunction<CreateTelemetryAttributeMutation, CreateTelemetryAttributeMutationVariables>;

/**
 * __useCreateTelemetryAttributeMutation__
 *
 * To run a mutation, you first call `useCreateTelemetryAttributeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTelemetryAttributeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTelemetryAttributeMutation, { data, loading, error }] = useCreateTelemetryAttributeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateTelemetryAttributeMutation(baseOptions?: Apollo.MutationHookOptions<CreateTelemetryAttributeMutation, CreateTelemetryAttributeMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateTelemetryAttributeMutation, CreateTelemetryAttributeMutationVariables>(CreateTelemetryAttributeDocument, options);
}
export type CreateTelemetryAttributeMutationHookResult = ReturnType<typeof useCreateTelemetryAttributeMutation>;
export type CreateTelemetryAttributeMutationResult = Apollo.MutationResult<CreateTelemetryAttributeMutation>;
export type CreateTelemetryAttributeMutationOptions = Apollo.BaseMutationOptions<CreateTelemetryAttributeMutation, CreateTelemetryAttributeMutationVariables>;
export const UpdateTelemetryAttributeDocument = gql`
    mutation UpdateTelemetryAttribute($id: ID!, $input: TelemetryAttributeUpdateInput!) {
  updateTelemetryAttribute(id: $id, input: $input) {
    id
    taskId
    name
    description
    dataType
    isRequired
    successCriteria
    order
    isActive
  }
}
    `;
export type UpdateTelemetryAttributeMutationFn = Apollo.MutationFunction<UpdateTelemetryAttributeMutation, UpdateTelemetryAttributeMutationVariables>;

/**
 * __useUpdateTelemetryAttributeMutation__
 *
 * To run a mutation, you first call `useUpdateTelemetryAttributeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateTelemetryAttributeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateTelemetryAttributeMutation, { data, loading, error }] = useUpdateTelemetryAttributeMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateTelemetryAttributeMutation(baseOptions?: Apollo.MutationHookOptions<UpdateTelemetryAttributeMutation, UpdateTelemetryAttributeMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateTelemetryAttributeMutation, UpdateTelemetryAttributeMutationVariables>(UpdateTelemetryAttributeDocument, options);
}
export type UpdateTelemetryAttributeMutationHookResult = ReturnType<typeof useUpdateTelemetryAttributeMutation>;
export type UpdateTelemetryAttributeMutationResult = Apollo.MutationResult<UpdateTelemetryAttributeMutation>;
export type UpdateTelemetryAttributeMutationOptions = Apollo.BaseMutationOptions<UpdateTelemetryAttributeMutation, UpdateTelemetryAttributeMutationVariables>;
export const DeleteTelemetryAttributeDocument = gql`
    mutation DeleteTelemetryAttribute($id: ID!) {
  deleteTelemetryAttribute(id: $id)
}
    `;
export type DeleteTelemetryAttributeMutationFn = Apollo.MutationFunction<DeleteTelemetryAttributeMutation, DeleteTelemetryAttributeMutationVariables>;

/**
 * __useDeleteTelemetryAttributeMutation__
 *
 * To run a mutation, you first call `useDeleteTelemetryAttributeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTelemetryAttributeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTelemetryAttributeMutation, { data, loading, error }] = useDeleteTelemetryAttributeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTelemetryAttributeMutation(baseOptions?: Apollo.MutationHookOptions<DeleteTelemetryAttributeMutation, DeleteTelemetryAttributeMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteTelemetryAttributeMutation, DeleteTelemetryAttributeMutationVariables>(DeleteTelemetryAttributeDocument, options);
}
export type DeleteTelemetryAttributeMutationHookResult = ReturnType<typeof useDeleteTelemetryAttributeMutation>;
export type DeleteTelemetryAttributeMutationResult = Apollo.MutationResult<DeleteTelemetryAttributeMutation>;
export type DeleteTelemetryAttributeMutationOptions = Apollo.BaseMutationOptions<DeleteTelemetryAttributeMutation, DeleteTelemetryAttributeMutationVariables>;
export const AddProductToSolutionDocument = gql`
    mutation AddProductToSolution($solutionId: ID!, $productId: ID!, $order: Int) {
  addProductToSolutionEnhanced(
    solutionId: $solutionId
    productId: $productId
    order: $order
  )
}
    `;
export type AddProductToSolutionMutationFn = Apollo.MutationFunction<AddProductToSolutionMutation, AddProductToSolutionMutationVariables>;

/**
 * __useAddProductToSolutionMutation__
 *
 * To run a mutation, you first call `useAddProductToSolutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddProductToSolutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addProductToSolutionMutation, { data, loading, error }] = useAddProductToSolutionMutation({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *      productId: // value for 'productId'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useAddProductToSolutionMutation(baseOptions?: Apollo.MutationHookOptions<AddProductToSolutionMutation, AddProductToSolutionMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<AddProductToSolutionMutation, AddProductToSolutionMutationVariables>(AddProductToSolutionDocument, options);
}
export type AddProductToSolutionMutationHookResult = ReturnType<typeof useAddProductToSolutionMutation>;
export type AddProductToSolutionMutationResult = Apollo.MutationResult<AddProductToSolutionMutation>;
export type AddProductToSolutionMutationOptions = Apollo.BaseMutationOptions<AddProductToSolutionMutation, AddProductToSolutionMutationVariables>;
export const RemoveProductFromSolutionDocument = gql`
    mutation RemoveProductFromSolution($solutionId: ID!, $productId: ID!) {
  removeProductFromSolutionEnhanced(
    solutionId: $solutionId
    productId: $productId
  )
}
    `;
export type RemoveProductFromSolutionMutationFn = Apollo.MutationFunction<RemoveProductFromSolutionMutation, RemoveProductFromSolutionMutationVariables>;

/**
 * __useRemoveProductFromSolutionMutation__
 *
 * To run a mutation, you first call `useRemoveProductFromSolutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveProductFromSolutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeProductFromSolutionMutation, { data, loading, error }] = useRemoveProductFromSolutionMutation({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *      productId: // value for 'productId'
 *   },
 * });
 */
export function useRemoveProductFromSolutionMutation(baseOptions?: Apollo.MutationHookOptions<RemoveProductFromSolutionMutation, RemoveProductFromSolutionMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<RemoveProductFromSolutionMutation, RemoveProductFromSolutionMutationVariables>(RemoveProductFromSolutionDocument, options);
}
export type RemoveProductFromSolutionMutationHookResult = ReturnType<typeof useRemoveProductFromSolutionMutation>;
export type RemoveProductFromSolutionMutationResult = Apollo.MutationResult<RemoveProductFromSolutionMutation>;
export type RemoveProductFromSolutionMutationOptions = Apollo.BaseMutationOptions<RemoveProductFromSolutionMutation, RemoveProductFromSolutionMutationVariables>;
export const ReorderProductsInSolutionDocument = gql`
    mutation ReorderProductsInSolution($solutionId: ID!, $productOrders: [ProductOrderInput!]!) {
  reorderProductsInSolution(
    solutionId: $solutionId
    productOrders: $productOrders
  )
}
    `;
export type ReorderProductsInSolutionMutationFn = Apollo.MutationFunction<ReorderProductsInSolutionMutation, ReorderProductsInSolutionMutationVariables>;

/**
 * __useReorderProductsInSolutionMutation__
 *
 * To run a mutation, you first call `useReorderProductsInSolutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReorderProductsInSolutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reorderProductsInSolutionMutation, { data, loading, error }] = useReorderProductsInSolutionMutation({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *      productOrders: // value for 'productOrders'
 *   },
 * });
 */
export function useReorderProductsInSolutionMutation(baseOptions?: Apollo.MutationHookOptions<ReorderProductsInSolutionMutation, ReorderProductsInSolutionMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<ReorderProductsInSolutionMutation, ReorderProductsInSolutionMutationVariables>(ReorderProductsInSolutionDocument, options);
}
export type ReorderProductsInSolutionMutationHookResult = ReturnType<typeof useReorderProductsInSolutionMutation>;
export type ReorderProductsInSolutionMutationResult = Apollo.MutationResult<ReorderProductsInSolutionMutation>;
export type ReorderProductsInSolutionMutationOptions = Apollo.BaseMutationOptions<ReorderProductsInSolutionMutation, ReorderProductsInSolutionMutationVariables>;
export const ImportProductFromExcelDocument = gql`
    mutation ImportProductFromExcel($content: String!, $mode: ImportMode!) {
  importProductFromExcel(content: $content, mode: $mode) {
    success
    productId
    productName
    stats {
      tasksImported
      outcomesImported
      releasesImported
      licensesImported
      customAttributesImported
      telemetryAttributesImported
    }
    errors {
      sheet
      row
      column
      field
      message
      severity
    }
    warnings {
      sheet
      row
      column
      field
      message
      severity
    }
  }
}
    `;
export type ImportProductFromExcelMutationFn = Apollo.MutationFunction<ImportProductFromExcelMutation, ImportProductFromExcelMutationVariables>;

/**
 * __useImportProductFromExcelMutation__
 *
 * To run a mutation, you first call `useImportProductFromExcelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useImportProductFromExcelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [importProductFromExcelMutation, { data, loading, error }] = useImportProductFromExcelMutation({
 *   variables: {
 *      content: // value for 'content'
 *      mode: // value for 'mode'
 *   },
 * });
 */
export function useImportProductFromExcelMutation(baseOptions?: Apollo.MutationHookOptions<ImportProductFromExcelMutation, ImportProductFromExcelMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<ImportProductFromExcelMutation, ImportProductFromExcelMutationVariables>(ImportProductFromExcelDocument, options);
}
export type ImportProductFromExcelMutationHookResult = ReturnType<typeof useImportProductFromExcelMutation>;
export type ImportProductFromExcelMutationResult = Apollo.MutationResult<ImportProductFromExcelMutation>;
export type ImportProductFromExcelMutationOptions = Apollo.BaseMutationOptions<ImportProductFromExcelMutation, ImportProductFromExcelMutationVariables>;
export const CreateProductTagDocument = gql`
    mutation CreateProductTag($input: ProductTagInput!) {
  createProductTag(input: $input) {
    id
    productId
    name
    color
    displayOrder
  }
}
    `;
export type CreateProductTagMutationFn = Apollo.MutationFunction<CreateProductTagMutation, CreateProductTagMutationVariables>;

/**
 * __useCreateProductTagMutation__
 *
 * To run a mutation, you first call `useCreateProductTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProductTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProductTagMutation, { data, loading, error }] = useCreateProductTagMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProductTagMutation(baseOptions?: Apollo.MutationHookOptions<CreateProductTagMutation, CreateProductTagMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateProductTagMutation, CreateProductTagMutationVariables>(CreateProductTagDocument, options);
}
export type CreateProductTagMutationHookResult = ReturnType<typeof useCreateProductTagMutation>;
export type CreateProductTagMutationResult = Apollo.MutationResult<CreateProductTagMutation>;
export type CreateProductTagMutationOptions = Apollo.BaseMutationOptions<CreateProductTagMutation, CreateProductTagMutationVariables>;
export const UpdateProductTagDocument = gql`
    mutation UpdateProductTag($id: ID!, $input: ProductTagUpdateInput!) {
  updateProductTag(id: $id, input: $input) {
    id
    productId
    name
    color
    displayOrder
  }
}
    `;
export type UpdateProductTagMutationFn = Apollo.MutationFunction<UpdateProductTagMutation, UpdateProductTagMutationVariables>;

/**
 * __useUpdateProductTagMutation__
 *
 * To run a mutation, you first call `useUpdateProductTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProductTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProductTagMutation, { data, loading, error }] = useUpdateProductTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProductTagMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProductTagMutation, UpdateProductTagMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateProductTagMutation, UpdateProductTagMutationVariables>(UpdateProductTagDocument, options);
}
export type UpdateProductTagMutationHookResult = ReturnType<typeof useUpdateProductTagMutation>;
export type UpdateProductTagMutationResult = Apollo.MutationResult<UpdateProductTagMutation>;
export type UpdateProductTagMutationOptions = Apollo.BaseMutationOptions<UpdateProductTagMutation, UpdateProductTagMutationVariables>;
export const DeleteProductTagDocument = gql`
    mutation DeleteProductTag($id: ID!) {
  deleteProductTag(id: $id)
}
    `;
export type DeleteProductTagMutationFn = Apollo.MutationFunction<DeleteProductTagMutation, DeleteProductTagMutationVariables>;

/**
 * __useDeleteProductTagMutation__
 *
 * To run a mutation, you first call `useDeleteProductTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProductTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProductTagMutation, { data, loading, error }] = useDeleteProductTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteProductTagMutation(baseOptions?: Apollo.MutationHookOptions<DeleteProductTagMutation, DeleteProductTagMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteProductTagMutation, DeleteProductTagMutationVariables>(DeleteProductTagDocument, options);
}
export type DeleteProductTagMutationHookResult = ReturnType<typeof useDeleteProductTagMutation>;
export type DeleteProductTagMutationResult = Apollo.MutationResult<DeleteProductTagMutation>;
export type DeleteProductTagMutationOptions = Apollo.BaseMutationOptions<DeleteProductTagMutation, DeleteProductTagMutationVariables>;
export const SetTaskTagsDocument = gql`
    mutation SetTaskTags($taskId: ID!, $tagIds: [ID!]!) {
  setTaskTags(taskId: $taskId, tagIds: $tagIds) {
    id
    tags {
      id
      name
      color
    }
  }
}
    `;
export type SetTaskTagsMutationFn = Apollo.MutationFunction<SetTaskTagsMutation, SetTaskTagsMutationVariables>;

/**
 * __useSetTaskTagsMutation__
 *
 * To run a mutation, you first call `useSetTaskTagsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetTaskTagsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setTaskTagsMutation, { data, loading, error }] = useSetTaskTagsMutation({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      tagIds: // value for 'tagIds'
 *   },
 * });
 */
export function useSetTaskTagsMutation(baseOptions?: Apollo.MutationHookOptions<SetTaskTagsMutation, SetTaskTagsMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<SetTaskTagsMutation, SetTaskTagsMutationVariables>(SetTaskTagsDocument, options);
}
export type SetTaskTagsMutationHookResult = ReturnType<typeof useSetTaskTagsMutation>;
export type SetTaskTagsMutationResult = Apollo.MutationResult<SetTaskTagsMutation>;
export type SetTaskTagsMutationOptions = Apollo.BaseMutationOptions<SetTaskTagsMutation, SetTaskTagsMutationVariables>;
export const AddTagToTaskDocument = gql`
    mutation AddTagToTask($taskId: ID!, $tagId: ID!) {
  addTagToTask(taskId: $taskId, tagId: $tagId) {
    id
    tags {
      id
      name
      color
    }
  }
}
    `;
export type AddTagToTaskMutationFn = Apollo.MutationFunction<AddTagToTaskMutation, AddTagToTaskMutationVariables>;

/**
 * __useAddTagToTaskMutation__
 *
 * To run a mutation, you first call `useAddTagToTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddTagToTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addTagToTaskMutation, { data, loading, error }] = useAddTagToTaskMutation({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      tagId: // value for 'tagId'
 *   },
 * });
 */
export function useAddTagToTaskMutation(baseOptions?: Apollo.MutationHookOptions<AddTagToTaskMutation, AddTagToTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<AddTagToTaskMutation, AddTagToTaskMutationVariables>(AddTagToTaskDocument, options);
}
export type AddTagToTaskMutationHookResult = ReturnType<typeof useAddTagToTaskMutation>;
export type AddTagToTaskMutationResult = Apollo.MutationResult<AddTagToTaskMutation>;
export type AddTagToTaskMutationOptions = Apollo.BaseMutationOptions<AddTagToTaskMutation, AddTagToTaskMutationVariables>;
export const RemoveTagFromTaskDocument = gql`
    mutation RemoveTagFromTask($taskId: ID!, $tagId: ID!) {
  removeTagFromTask(taskId: $taskId, tagId: $tagId) {
    id
    tags {
      id
      name
      color
    }
  }
}
    `;
export type RemoveTagFromTaskMutationFn = Apollo.MutationFunction<RemoveTagFromTaskMutation, RemoveTagFromTaskMutationVariables>;

/**
 * __useRemoveTagFromTaskMutation__
 *
 * To run a mutation, you first call `useRemoveTagFromTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveTagFromTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeTagFromTaskMutation, { data, loading, error }] = useRemoveTagFromTaskMutation({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      tagId: // value for 'tagId'
 *   },
 * });
 */
export function useRemoveTagFromTaskMutation(baseOptions?: Apollo.MutationHookOptions<RemoveTagFromTaskMutation, RemoveTagFromTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<RemoveTagFromTaskMutation, RemoveTagFromTaskMutationVariables>(RemoveTagFromTaskDocument, options);
}
export type RemoveTagFromTaskMutationHookResult = ReturnType<typeof useRemoveTagFromTaskMutation>;
export type RemoveTagFromTaskMutationResult = Apollo.MutationResult<RemoveTagFromTaskMutation>;
export type RemoveTagFromTaskMutationOptions = Apollo.BaseMutationOptions<RemoveTagFromTaskMutation, RemoveTagFromTaskMutationVariables>;
export const CreateSolutionTagDocument = gql`
    mutation CreateSolutionTag($input: SolutionTagInput!) {
  createSolutionTag(input: $input) {
    id
    solutionId
    name
    color
    displayOrder
  }
}
    `;
export type CreateSolutionTagMutationFn = Apollo.MutationFunction<CreateSolutionTagMutation, CreateSolutionTagMutationVariables>;

/**
 * __useCreateSolutionTagMutation__
 *
 * To run a mutation, you first call `useCreateSolutionTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSolutionTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSolutionTagMutation, { data, loading, error }] = useCreateSolutionTagMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSolutionTagMutation(baseOptions?: Apollo.MutationHookOptions<CreateSolutionTagMutation, CreateSolutionTagMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<CreateSolutionTagMutation, CreateSolutionTagMutationVariables>(CreateSolutionTagDocument, options);
}
export type CreateSolutionTagMutationHookResult = ReturnType<typeof useCreateSolutionTagMutation>;
export type CreateSolutionTagMutationResult = Apollo.MutationResult<CreateSolutionTagMutation>;
export type CreateSolutionTagMutationOptions = Apollo.BaseMutationOptions<CreateSolutionTagMutation, CreateSolutionTagMutationVariables>;
export const UpdateSolutionTagDocument = gql`
    mutation UpdateSolutionTag($id: ID!, $input: SolutionTagUpdateInput!) {
  updateSolutionTag(id: $id, input: $input) {
    id
    solutionId
    name
    color
    displayOrder
  }
}
    `;
export type UpdateSolutionTagMutationFn = Apollo.MutationFunction<UpdateSolutionTagMutation, UpdateSolutionTagMutationVariables>;

/**
 * __useUpdateSolutionTagMutation__
 *
 * To run a mutation, you first call `useUpdateSolutionTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSolutionTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSolutionTagMutation, { data, loading, error }] = useUpdateSolutionTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSolutionTagMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSolutionTagMutation, UpdateSolutionTagMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<UpdateSolutionTagMutation, UpdateSolutionTagMutationVariables>(UpdateSolutionTagDocument, options);
}
export type UpdateSolutionTagMutationHookResult = ReturnType<typeof useUpdateSolutionTagMutation>;
export type UpdateSolutionTagMutationResult = Apollo.MutationResult<UpdateSolutionTagMutation>;
export type UpdateSolutionTagMutationOptions = Apollo.BaseMutationOptions<UpdateSolutionTagMutation, UpdateSolutionTagMutationVariables>;
export const DeleteSolutionTagDocument = gql`
    mutation DeleteSolutionTag($id: ID!) {
  deleteSolutionTag(id: $id)
}
    `;
export type DeleteSolutionTagMutationFn = Apollo.MutationFunction<DeleteSolutionTagMutation, DeleteSolutionTagMutationVariables>;

/**
 * __useDeleteSolutionTagMutation__
 *
 * To run a mutation, you first call `useDeleteSolutionTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSolutionTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSolutionTagMutation, { data, loading, error }] = useDeleteSolutionTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteSolutionTagMutation(baseOptions?: Apollo.MutationHookOptions<DeleteSolutionTagMutation, DeleteSolutionTagMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<DeleteSolutionTagMutation, DeleteSolutionTagMutationVariables>(DeleteSolutionTagDocument, options);
}
export type DeleteSolutionTagMutationHookResult = ReturnType<typeof useDeleteSolutionTagMutation>;
export type DeleteSolutionTagMutationResult = Apollo.MutationResult<DeleteSolutionTagMutation>;
export type DeleteSolutionTagMutationOptions = Apollo.BaseMutationOptions<DeleteSolutionTagMutation, DeleteSolutionTagMutationVariables>;
export const SetSolutionTaskTagsDocument = gql`
    mutation SetSolutionTaskTags($taskId: ID!, $tagIds: [ID!]!) {
  setSolutionTaskTags(taskId: $taskId, tagIds: $tagIds) {
    id
    solutionTags {
      id
      name
      color
    }
  }
}
    `;
export type SetSolutionTaskTagsMutationFn = Apollo.MutationFunction<SetSolutionTaskTagsMutation, SetSolutionTaskTagsMutationVariables>;

/**
 * __useSetSolutionTaskTagsMutation__
 *
 * To run a mutation, you first call `useSetSolutionTaskTagsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetSolutionTaskTagsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setSolutionTaskTagsMutation, { data, loading, error }] = useSetSolutionTaskTagsMutation({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      tagIds: // value for 'tagIds'
 *   },
 * });
 */
export function useSetSolutionTaskTagsMutation(baseOptions?: Apollo.MutationHookOptions<SetSolutionTaskTagsMutation, SetSolutionTaskTagsMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<SetSolutionTaskTagsMutation, SetSolutionTaskTagsMutationVariables>(SetSolutionTaskTagsDocument, options);
}
export type SetSolutionTaskTagsMutationHookResult = ReturnType<typeof useSetSolutionTaskTagsMutation>;
export type SetSolutionTaskTagsMutationResult = Apollo.MutationResult<SetSolutionTaskTagsMutation>;
export type SetSolutionTaskTagsMutationOptions = Apollo.BaseMutationOptions<SetSolutionTaskTagsMutation, SetSolutionTaskTagsMutationVariables>;
export const AddSolutionTagToTaskDocument = gql`
    mutation AddSolutionTagToTask($taskId: ID!, $tagId: ID!) {
  addSolutionTagToTask(taskId: $taskId, tagId: $tagId) {
    id
    solutionTags {
      id
      name
      color
    }
  }
}
    `;
export type AddSolutionTagToTaskMutationFn = Apollo.MutationFunction<AddSolutionTagToTaskMutation, AddSolutionTagToTaskMutationVariables>;

/**
 * __useAddSolutionTagToTaskMutation__
 *
 * To run a mutation, you first call `useAddSolutionTagToTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddSolutionTagToTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addSolutionTagToTaskMutation, { data, loading, error }] = useAddSolutionTagToTaskMutation({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      tagId: // value for 'tagId'
 *   },
 * });
 */
export function useAddSolutionTagToTaskMutation(baseOptions?: Apollo.MutationHookOptions<AddSolutionTagToTaskMutation, AddSolutionTagToTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<AddSolutionTagToTaskMutation, AddSolutionTagToTaskMutationVariables>(AddSolutionTagToTaskDocument, options);
}
export type AddSolutionTagToTaskMutationHookResult = ReturnType<typeof useAddSolutionTagToTaskMutation>;
export type AddSolutionTagToTaskMutationResult = Apollo.MutationResult<AddSolutionTagToTaskMutation>;
export type AddSolutionTagToTaskMutationOptions = Apollo.BaseMutationOptions<AddSolutionTagToTaskMutation, AddSolutionTagToTaskMutationVariables>;
export const RemoveSolutionTagFromTaskDocument = gql`
    mutation RemoveSolutionTagFromTask($taskId: ID!, $tagId: ID!) {
  removeSolutionTagFromTask(taskId: $taskId, tagId: $tagId) {
    id
    solutionTags {
      id
      name
      color
    }
  }
}
    `;
export type RemoveSolutionTagFromTaskMutationFn = Apollo.MutationFunction<RemoveSolutionTagFromTaskMutation, RemoveSolutionTagFromTaskMutationVariables>;

/**
 * __useRemoveSolutionTagFromTaskMutation__
 *
 * To run a mutation, you first call `useRemoveSolutionTagFromTaskMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveSolutionTagFromTaskMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeSolutionTagFromTaskMutation, { data, loading, error }] = useRemoveSolutionTagFromTaskMutation({
 *   variables: {
 *      taskId: // value for 'taskId'
 *      tagId: // value for 'tagId'
 *   },
 * });
 */
export function useRemoveSolutionTagFromTaskMutation(baseOptions?: Apollo.MutationHookOptions<RemoveSolutionTagFromTaskMutation, RemoveSolutionTagFromTaskMutationVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<RemoveSolutionTagFromTaskMutation, RemoveSolutionTagFromTaskMutationVariables>(RemoveSolutionTagFromTaskDocument, options);
}
export type RemoveSolutionTagFromTaskMutationHookResult = ReturnType<typeof useRemoveSolutionTagFromTaskMutation>;
export type RemoveSolutionTagFromTaskMutationResult = Apollo.MutationResult<RemoveSolutionTagFromTaskMutation>;
export type RemoveSolutionTagFromTaskMutationOptions = Apollo.BaseMutationOptions<RemoveSolutionTagFromTaskMutation, RemoveSolutionTagFromTaskMutationVariables>;
export const ProductsDocument = gql`
    query Products {
  products {
    edges {
      node {
        id
        name
        resources { label url }
        statusPercent
        customAttrs
        licenses {
          id
          name
          description
          level
          isActive
        }
        releases {
          id
          name
          description
          level
          isActive
        }
        outcomes {
          id
          name
          description
        }
      }
    }
  }
}
    `;

/**
 * __useProductsQuery__
 *
 * To run a query within a React component, call `useProductsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProductsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProductsQuery({
 *   variables: {
 *   },
 * });
 */
export function useProductsQuery(baseOptions?: Apollo.QueryHookOptions<ProductsQuery, ProductsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<ProductsQuery, ProductsQueryVariables>(ProductsDocument, options);
}
export function useProductsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProductsQuery, ProductsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<ProductsQuery, ProductsQueryVariables>(ProductsDocument, options);
}
export function useProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProductsQuery, ProductsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<ProductsQuery, ProductsQueryVariables>(ProductsDocument, options);
}
export type ProductsQueryHookResult = ReturnType<typeof useProductsQuery>;
export type ProductsLazyQueryHookResult = ReturnType<typeof useProductsLazyQuery>;
export type ProductsSuspenseQueryHookResult = ReturnType<typeof useProductsSuspenseQuery>;
export type ProductsQueryResult = Apollo.QueryResult<ProductsQuery, ProductsQueryVariables>;
export const SolutionsDocument = gql`
    query Solutions {
  solutions {
    edges {
      node {
        id
        name
        resources { label url }
        customAttrs
        outcomes {
          id
          name
          description
        }
        releases {
          id
          name
          description
          level
        }
        products {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  }
}
    `;

/**
 * __useSolutionsQuery__
 *
 * To run a query within a React component, call `useSolutionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSolutionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSolutionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSolutionsQuery(baseOptions?: Apollo.QueryHookOptions<SolutionsQuery, SolutionsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SolutionsQuery, SolutionsQueryVariables>(SolutionsDocument, options);
}
export function useSolutionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SolutionsQuery, SolutionsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SolutionsQuery, SolutionsQueryVariables>(SolutionsDocument, options);
}
export function useSolutionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SolutionsQuery, SolutionsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SolutionsQuery, SolutionsQueryVariables>(SolutionsDocument, options);
}
export type SolutionsQueryHookResult = ReturnType<typeof useSolutionsQuery>;
export type SolutionsLazyQueryHookResult = ReturnType<typeof useSolutionsLazyQuery>;
export type SolutionsSuspenseQueryHookResult = ReturnType<typeof useSolutionsSuspenseQuery>;
export type SolutionsQueryResult = Apollo.QueryResult<SolutionsQuery, SolutionsQueryVariables>;
export const CustomersDocument = gql`
    query Customers {
  customers {
    id
    name
    description
    products {
      id
      name
      product {
        id
        name
      }
      adoptionPlan {
        id
      }
    }
    solutions {
      id
      name
      solution {
        id
        name
      }
      adoptionPlan {
        id
      }
    }
  }
}
    `;

/**
 * __useCustomersQuery__
 *
 * To run a query within a React component, call `useCustomersQuery` and pass it any options that fit your needs.
 * When your component renders, `useCustomersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCustomersQuery({
 *   variables: {
 *   },
 * });
 */
export function useCustomersQuery(baseOptions?: Apollo.QueryHookOptions<CustomersQuery, CustomersQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<CustomersQuery, CustomersQueryVariables>(CustomersDocument, options);
}
export function useCustomersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CustomersQuery, CustomersQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<CustomersQuery, CustomersQueryVariables>(CustomersDocument, options);
}
export function useCustomersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CustomersQuery, CustomersQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<CustomersQuery, CustomersQueryVariables>(CustomersDocument, options);
}
export type CustomersQueryHookResult = ReturnType<typeof useCustomersQuery>;
export type CustomersLazyQueryHookResult = ReturnType<typeof useCustomersLazyQuery>;
export type CustomersSuspenseQueryHookResult = ReturnType<typeof useCustomersSuspenseQuery>;
export type CustomersQueryResult = Apollo.QueryResult<CustomersQuery, CustomersQueryVariables>;
export const TasksForProductDocument = gql`
    query TasksForProduct($productId: ID!) {
  tasks(productId: $productId, first: 100) {
    edges {
      node {
        id
        name
        description
        estMinutes
        weight
        sequenceNumber
        licenseLevel
        notes
        howToDoc
        howToVideo
        license {
          id
          name
          level
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
          description
        }
        telemetryAttributes {
          id
          name
          description
          dataType
          isRequired
          successCriteria
          order
          isActive
          isSuccessful
          currentValue {
            id
            value
            source
            createdAt
          }
        }
        tags {
          id
          name
          color
        }
        isCompleteBasedOnTelemetry
        telemetryCompletionPercentage
      }
    }
  }
}
    `;

/**
 * __useTasksForProductQuery__
 *
 * To run a query within a React component, call `useTasksForProductQuery` and pass it any options that fit your needs.
 * When your component renders, `useTasksForProductQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTasksForProductQuery({
 *   variables: {
 *      productId: // value for 'productId'
 *   },
 * });
 */
export function useTasksForProductQuery(baseOptions: Apollo.QueryHookOptions<TasksForProductQuery, TasksForProductQueryVariables> & ({ variables: TasksForProductQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<TasksForProductQuery, TasksForProductQueryVariables>(TasksForProductDocument, options);
}
export function useTasksForProductLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TasksForProductQuery, TasksForProductQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<TasksForProductQuery, TasksForProductQueryVariables>(TasksForProductDocument, options);
}
export function useTasksForProductSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TasksForProductQuery, TasksForProductQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<TasksForProductQuery, TasksForProductQueryVariables>(TasksForProductDocument, options);
}
export type TasksForProductQueryHookResult = ReturnType<typeof useTasksForProductQuery>;
export type TasksForProductLazyQueryHookResult = ReturnType<typeof useTasksForProductLazyQuery>;
export type TasksForProductSuspenseQueryHookResult = ReturnType<typeof useTasksForProductSuspenseQuery>;
export type TasksForProductQueryResult = Apollo.QueryResult<TasksForProductQuery, TasksForProductQueryVariables>;
export const TasksForSolutionDocument = gql`
    query TasksForSolution($solutionId: ID!) {
  tasks(solutionId: $solutionId, first: 100) {
    edges {
      node {
        id
        name
        description
        estMinutes
        weight
        sequenceNumber
        licenseLevel
        notes
        howToDoc
        howToVideo
        license {
          id
          name
          level
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
          description
        }
        telemetryAttributes {
          id
          name
          description
          dataType
          isRequired
          successCriteria
          order
          isActive
          isSuccessful
          currentValue {
            id
            value
            source
            createdAt
          }
        }
        tags {
          id
          name
          color
        }
        solutionTags {
          id
          name
          color
        }
        isCompleteBasedOnTelemetry
        telemetryCompletionPercentage
      }
    }
  }
}
    `;

/**
 * __useTasksForSolutionQuery__
 *
 * To run a query within a React component, call `useTasksForSolutionQuery` and pass it any options that fit your needs.
 * When your component renders, `useTasksForSolutionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTasksForSolutionQuery({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *   },
 * });
 */
export function useTasksForSolutionQuery(baseOptions: Apollo.QueryHookOptions<TasksForSolutionQuery, TasksForSolutionQueryVariables> & ({ variables: TasksForSolutionQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<TasksForSolutionQuery, TasksForSolutionQueryVariables>(TasksForSolutionDocument, options);
}
export function useTasksForSolutionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TasksForSolutionQuery, TasksForSolutionQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<TasksForSolutionQuery, TasksForSolutionQueryVariables>(TasksForSolutionDocument, options);
}
export function useTasksForSolutionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TasksForSolutionQuery, TasksForSolutionQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<TasksForSolutionQuery, TasksForSolutionQueryVariables>(TasksForSolutionDocument, options);
}
export type TasksForSolutionQueryHookResult = ReturnType<typeof useTasksForSolutionQuery>;
export type TasksForSolutionLazyQueryHookResult = ReturnType<typeof useTasksForSolutionLazyQuery>;
export type TasksForSolutionSuspenseQueryHookResult = ReturnType<typeof useTasksForSolutionSuspenseQuery>;
export type TasksForSolutionQueryResult = Apollo.QueryResult<TasksForSolutionQuery, TasksForSolutionQueryVariables>;
export const OutcomesDocument = gql`
    query Outcomes($productId: ID) {
  outcomes(productId: $productId) {
    id
    name
    product {
      id
      name
    }
  }
}
    `;

/**
 * __useOutcomesQuery__
 *
 * To run a query within a React component, call `useOutcomesQuery` and pass it any options that fit your needs.
 * When your component renders, `useOutcomesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOutcomesQuery({
 *   variables: {
 *      productId: // value for 'productId'
 *   },
 * });
 */
export function useOutcomesQuery(baseOptions?: Apollo.QueryHookOptions<OutcomesQuery, OutcomesQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<OutcomesQuery, OutcomesQueryVariables>(OutcomesDocument, options);
}
export function useOutcomesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OutcomesQuery, OutcomesQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<OutcomesQuery, OutcomesQueryVariables>(OutcomesDocument, options);
}
export function useOutcomesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OutcomesQuery, OutcomesQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<OutcomesQuery, OutcomesQueryVariables>(OutcomesDocument, options);
}
export type OutcomesQueryHookResult = ReturnType<typeof useOutcomesQuery>;
export type OutcomesLazyQueryHookResult = ReturnType<typeof useOutcomesLazyQuery>;
export type OutcomesSuspenseQueryHookResult = ReturnType<typeof useOutcomesSuspenseQuery>;
export type OutcomesQueryResult = Apollo.QueryResult<OutcomesQuery, OutcomesQueryVariables>;
export const ProductDetailDocument = gql`
    query ProductDetail($id: ID!) {
  product(id: $id) {
    id
    name
    resources { label url }
    statusPercent
    customAttrs
    licenses {
      id
      name
      description
      level
      isActive
    }
    releases {
      id
      name
      description
      level
      isActive
    }
    outcomes {
      id
      name
      description
    }
    tags {
      id
      name
      color
      displayOrder
    }
  }
}
    `;

/**
 * __useProductDetailQuery__
 *
 * To run a query within a React component, call `useProductDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useProductDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProductDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useProductDetailQuery(baseOptions: Apollo.QueryHookOptions<ProductDetailQuery, ProductDetailQueryVariables> & ({ variables: ProductDetailQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<ProductDetailQuery, ProductDetailQueryVariables>(ProductDetailDocument, options);
}
export function useProductDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProductDetailQuery, ProductDetailQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<ProductDetailQuery, ProductDetailQueryVariables>(ProductDetailDocument, options);
}
export function useProductDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProductDetailQuery, ProductDetailQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<ProductDetailQuery, ProductDetailQueryVariables>(ProductDetailDocument, options);
}
export type ProductDetailQueryHookResult = ReturnType<typeof useProductDetailQuery>;
export type ProductDetailLazyQueryHookResult = ReturnType<typeof useProductDetailLazyQuery>;
export type ProductDetailSuspenseQueryHookResult = ReturnType<typeof useProductDetailSuspenseQuery>;
export type ProductDetailQueryResult = Apollo.QueryResult<ProductDetailQuery, ProductDetailQueryVariables>;
export const SolutionDetailDocument = gql`
    query SolutionDetail($id: ID!) {
  solution(id: $id) {
    id
    name
    resources { label url }
    customAttrs
    outcomes {
      id
      name
      description
    }
    releases {
      id
      name
      description
      level
    }
    products {
      edges {
        node {
          id
          name
        }
      }
    }
    tags {
      id
      name
      color
      displayOrder
    }
  }
}
    `;

/**
 * __useSolutionDetailQuery__
 *
 * To run a query within a React component, call `useSolutionDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useSolutionDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSolutionDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSolutionDetailQuery(baseOptions: Apollo.QueryHookOptions<SolutionDetailQuery, SolutionDetailQueryVariables> & ({ variables: SolutionDetailQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SolutionDetailQuery, SolutionDetailQueryVariables>(SolutionDetailDocument, options);
}
export function useSolutionDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SolutionDetailQuery, SolutionDetailQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SolutionDetailQuery, SolutionDetailQueryVariables>(SolutionDetailDocument, options);
}
export function useSolutionDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SolutionDetailQuery, SolutionDetailQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SolutionDetailQuery, SolutionDetailQueryVariables>(SolutionDetailDocument, options);
}
export type SolutionDetailQueryHookResult = ReturnType<typeof useSolutionDetailQuery>;
export type SolutionDetailLazyQueryHookResult = ReturnType<typeof useSolutionDetailLazyQuery>;
export type SolutionDetailSuspenseQueryHookResult = ReturnType<typeof useSolutionDetailSuspenseQuery>;
export type SolutionDetailQueryResult = Apollo.QueryResult<SolutionDetailQuery, SolutionDetailQueryVariables>;
export const ProductTagsDocument = gql`
    query ProductTags($productId: ID!) {
  productTags(productId: $productId) {
    id
    name
    color
    displayOrder
  }
}
    `;

/**
 * __useProductTagsQuery__
 *
 * To run a query within a React component, call `useProductTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProductTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProductTagsQuery({
 *   variables: {
 *      productId: // value for 'productId'
 *   },
 * });
 */
export function useProductTagsQuery(baseOptions: Apollo.QueryHookOptions<ProductTagsQuery, ProductTagsQueryVariables> & ({ variables: ProductTagsQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<ProductTagsQuery, ProductTagsQueryVariables>(ProductTagsDocument, options);
}
export function useProductTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProductTagsQuery, ProductTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<ProductTagsQuery, ProductTagsQueryVariables>(ProductTagsDocument, options);
}
export function useProductTagsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ProductTagsQuery, ProductTagsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<ProductTagsQuery, ProductTagsQueryVariables>(ProductTagsDocument, options);
}
export type ProductTagsQueryHookResult = ReturnType<typeof useProductTagsQuery>;
export type ProductTagsLazyQueryHookResult = ReturnType<typeof useProductTagsLazyQuery>;
export type ProductTagsSuspenseQueryHookResult = ReturnType<typeof useProductTagsSuspenseQuery>;
export type ProductTagsQueryResult = Apollo.QueryResult<ProductTagsQuery, ProductTagsQueryVariables>;
export const TaskTagsDocument = gql`
    query TaskTags($taskId: ID!) {
  taskTags(taskId: $taskId) {
    id
    tag {
      id
      name
      color
    }
  }
}
    `;

/**
 * __useTaskTagsQuery__
 *
 * To run a query within a React component, call `useTaskTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTaskTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTaskTagsQuery({
 *   variables: {
 *      taskId: // value for 'taskId'
 *   },
 * });
 */
export function useTaskTagsQuery(baseOptions: Apollo.QueryHookOptions<TaskTagsQuery, TaskTagsQueryVariables> & ({ variables: TaskTagsQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<TaskTagsQuery, TaskTagsQueryVariables>(TaskTagsDocument, options);
}
export function useTaskTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TaskTagsQuery, TaskTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<TaskTagsQuery, TaskTagsQueryVariables>(TaskTagsDocument, options);
}
export function useTaskTagsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TaskTagsQuery, TaskTagsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<TaskTagsQuery, TaskTagsQueryVariables>(TaskTagsDocument, options);
}
export type TaskTagsQueryHookResult = ReturnType<typeof useTaskTagsQuery>;
export type TaskTagsLazyQueryHookResult = ReturnType<typeof useTaskTagsLazyQuery>;
export type TaskTagsSuspenseQueryHookResult = ReturnType<typeof useTaskTagsSuspenseQuery>;
export type TaskTagsQueryResult = Apollo.QueryResult<TaskTagsQuery, TaskTagsQueryVariables>;
export const CustomerProductTagsDocument = gql`
    query CustomerProductTags($customerProductId: ID!) {
  customerProductTags(customerProductId: $customerProductId) {
    id
    name
    color
    displayOrder
  }
}
    `;

/**
 * __useCustomerProductTagsQuery__
 *
 * To run a query within a React component, call `useCustomerProductTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCustomerProductTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCustomerProductTagsQuery({
 *   variables: {
 *      customerProductId: // value for 'customerProductId'
 *   },
 * });
 */
export function useCustomerProductTagsQuery(baseOptions: Apollo.QueryHookOptions<CustomerProductTagsQuery, CustomerProductTagsQueryVariables> & ({ variables: CustomerProductTagsQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<CustomerProductTagsQuery, CustomerProductTagsQueryVariables>(CustomerProductTagsDocument, options);
}
export function useCustomerProductTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CustomerProductTagsQuery, CustomerProductTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<CustomerProductTagsQuery, CustomerProductTagsQueryVariables>(CustomerProductTagsDocument, options);
}
export function useCustomerProductTagsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CustomerProductTagsQuery, CustomerProductTagsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<CustomerProductTagsQuery, CustomerProductTagsQueryVariables>(CustomerProductTagsDocument, options);
}
export type CustomerProductTagsQueryHookResult = ReturnType<typeof useCustomerProductTagsQuery>;
export type CustomerProductTagsLazyQueryHookResult = ReturnType<typeof useCustomerProductTagsLazyQuery>;
export type CustomerProductTagsSuspenseQueryHookResult = ReturnType<typeof useCustomerProductTagsSuspenseQuery>;
export type CustomerProductTagsQueryResult = Apollo.QueryResult<CustomerProductTagsQuery, CustomerProductTagsQueryVariables>;
export const SolutionTagsDocument = gql`
    query SolutionTags($solutionId: ID!) {
  solutionTags(solutionId: $solutionId) {
    id
    name
    color
    displayOrder
  }
}
    `;

/**
 * __useSolutionTagsQuery__
 *
 * To run a query within a React component, call `useSolutionTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSolutionTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSolutionTagsQuery({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *   },
 * });
 */
export function useSolutionTagsQuery(baseOptions: Apollo.QueryHookOptions<SolutionTagsQuery, SolutionTagsQueryVariables> & ({ variables: SolutionTagsQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SolutionTagsQuery, SolutionTagsQueryVariables>(SolutionTagsDocument, options);
}
export function useSolutionTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SolutionTagsQuery, SolutionTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SolutionTagsQuery, SolutionTagsQueryVariables>(SolutionTagsDocument, options);
}
export function useSolutionTagsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SolutionTagsQuery, SolutionTagsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SolutionTagsQuery, SolutionTagsQueryVariables>(SolutionTagsDocument, options);
}
export type SolutionTagsQueryHookResult = ReturnType<typeof useSolutionTagsQuery>;
export type SolutionTagsLazyQueryHookResult = ReturnType<typeof useSolutionTagsLazyQuery>;
export type SolutionTagsSuspenseQueryHookResult = ReturnType<typeof useSolutionTagsSuspenseQuery>;
export type SolutionTagsQueryResult = Apollo.QueryResult<SolutionTagsQuery, SolutionTagsQueryVariables>;
export const CustomerSolutionTagsDocument = gql`
    query CustomerSolutionTags($customerSolutionId: ID!) {
  customerSolutionTags(customerSolutionId: $customerSolutionId) {
    id
    name
    color
    displayOrder
  }
}
    `;

/**
 * __useCustomerSolutionTagsQuery__
 *
 * To run a query within a React component, call `useCustomerSolutionTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCustomerSolutionTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCustomerSolutionTagsQuery({
 *   variables: {
 *      customerSolutionId: // value for 'customerSolutionId'
 *   },
 * });
 */
export function useCustomerSolutionTagsQuery(baseOptions: Apollo.QueryHookOptions<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables> & ({ variables: CustomerSolutionTagsQueryVariables; skip?: boolean; } | { skip: boolean; })) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables>(CustomerSolutionTagsDocument, options);
}
export function useCustomerSolutionTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables>(CustomerSolutionTagsDocument, options);
}
export function useCustomerSolutionTagsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables>) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables>(CustomerSolutionTagsDocument, options);
}
export type CustomerSolutionTagsQueryHookResult = ReturnType<typeof useCustomerSolutionTagsQuery>;
export type CustomerSolutionTagsLazyQueryHookResult = ReturnType<typeof useCustomerSolutionTagsLazyQuery>;
export type CustomerSolutionTagsSuspenseQueryHookResult = ReturnType<typeof useCustomerSolutionTagsSuspenseQuery>;
export type CustomerSolutionTagsQueryResult = Apollo.QueryResult<CustomerSolutionTagsQuery, CustomerSolutionTagsQueryVariables>;