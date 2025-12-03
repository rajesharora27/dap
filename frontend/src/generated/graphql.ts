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
  updatedAt: Scalars['String']['output'];
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
  addSolutionToCustomer: Scalars['Boolean']['output'];
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
  createRelease: Release;
  /** Create a new role with permissions (admin only) */
  createRole: RoleWithPermissions;
  createSolution: Solution;
  createSolutionAdoptionPlan: SolutionAdoptionPlan;
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
  deleteRelease: Scalars['Boolean']['output'];
  /** Delete role (admin only) */
  deleteRole: Scalars['Boolean']['output'];
  deleteSolution: Scalars['Boolean']['output'];
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
  updateRelease: Release;
  /** Update role and permissions (admin only) */
  updateRole: RoleWithPermissions;
  /**
   * Bulk update role permissions (admin only)
   * Replaces all permissions for a role with the provided set
   */
  updateRolePermissions: RoleWithPermissions;
  updateSolution: Solution;
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


export type MutationAddSolutionToCustomerArgs = {
  customerId: Scalars['ID']['input'];
  solutionId: Scalars['ID']['input'];
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


export type MutationCreateLicenseArgs = {
  input: LicenseInput;
};


export type MutationCreateOutcomeArgs = {
  input: OutcomeInput;
};


export type MutationCreateProductArgs = {
  input: ProductInput;
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


export type MutationDeleteReleaseArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRoleArgs = {
  roleId: Scalars['ID']['input'];
};


export type MutationDeleteSolutionArgs = {
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

export type Query = {
  __typename?: 'Query';
  adoptionPlan?: Maybe<AdoptionPlan>;
  adoptionPlansForCustomer: Array<AdoptionPlan>;
  /** Get auto-backup configuration */
  autoBackupConfig: AutoBackupConfig;
  /** Get available resources for permission assignment (admin only) */
  availableResources: Array<AvailableResource>;
  changeSet?: Maybe<ChangeSet>;
  changeSets: Array<ChangeSet>;
  customer?: Maybe<Customer>;
  customerSolution?: Maybe<CustomerSolutionWithPlan>;
  customerSolutionTask?: Maybe<CustomerSolutionTask>;
  customerSolutionTasksForPlan: Array<CustomerSolutionTask>;
  customerTask?: Maybe<CustomerTask>;
  customerTasksForPlan: Array<CustomerTask>;
  customerTelemetryDatabase: Array<CustomerTelemetryRecord>;
  customers: Array<Customer>;
  exportProductToExcel: ExcelExportResult;
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
  products: ProductConnection;
  releases: Array<Release>;
  /** Get specific role with permissions (admin only) */
  role?: Maybe<RoleWithPermissions>;
  /** Get all roles with permissions (admin only) */
  roles: Array<RoleWithPermissions>;
  search: Array<SearchResult>;
  solutionAdoptionPlan?: Maybe<SolutionAdoptionPlan>;
  solutionAdoptionPlansForCustomer: Array<SolutionAdoptionPlan>;
  solutionAdoptionReport: SolutionAdoptionReport;
  solutionComparisonReport: SolutionComparisonReport;
  solutions: SolutionConnection;
  taskDependencies: Array<TaskDependencyEdge>;
  taskStatuses: Array<TaskStatus>;
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


export type QueryCustomerSolutionArgs = {
  id: Scalars['ID']['input'];
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


export type QuerySolutionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTaskDependenciesArgs = {
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

export type UpdateProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: ProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Product', id: string, name: string, description?: string | null, statusPercent: number, customAttrs?: Record<string, any> | null } };

export type DeleteProductMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteProductMutation = { __typename?: 'Mutation', deleteProduct: boolean };

export type CreateTaskMutationVariables = Exact<{
  input: TaskCreateInput;
}>;


export type CreateTaskMutation = { __typename?: 'Mutation', createTask: { __typename?: 'Task', id: string, name: string, description?: string | null, estMinutes: number, weight: number, sequenceNumber: number, licenseLevel: LicenseLevel, notes?: string | null, howToDoc: Array<string>, howToVideo: Array<string>, license?: { __typename?: 'License', id: string, name: string, level: number } | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, releases: Array<{ __typename?: 'Release', id: string, name: string, level: number }> } };

export type UpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: TaskUpdateInput;
}>;


export type UpdateTaskMutation = { __typename?: 'Mutation', updateTask: { __typename?: 'Task', id: string, name: string, description?: string | null, estMinutes: number, weight: number, sequenceNumber: number, licenseLevel: LicenseLevel, notes?: string | null, howToDoc: Array<string>, howToVideo: Array<string>, license?: { __typename?: 'License', id: string, name: string, level: number } | null, outcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, releases: Array<{ __typename?: 'Release', id: string, name: string, level: number }> } };

export type DeleteTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTaskMutation = { __typename?: 'Mutation', queueTaskSoftDelete: boolean };

export type ReorderTasksMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  order: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type ReorderTasksMutation = { __typename?: 'Mutation', reorderTasks: boolean };

export type ProcessDeletionQueueMutationVariables = Exact<{ [key: string]: never; }>;


export type ProcessDeletionQueueMutation = { __typename?: 'Mutation', processDeletionQueue: number };

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


export type CreateTelemetryAttributeMutation = { __typename?: 'Mutation', createTelemetryAttribute: { __typename?: 'TelemetryAttribute', id: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean } };

export type UpdateTelemetryAttributeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: TelemetryAttributeUpdateInput;
}>;


export type UpdateTelemetryAttributeMutation = { __typename?: 'Mutation', updateTelemetryAttribute: { __typename?: 'TelemetryAttribute', id: string, name: string, description?: string | null, dataType: TelemetryDataType, isRequired: boolean, successCriteria?: Record<string, any> | null, order: number, isActive: boolean } };

export type DeleteTelemetryAttributeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTelemetryAttributeMutation = { __typename?: 'Mutation', deleteTelemetryAttribute: boolean };

export type CreateSolutionMutationVariables = Exact<{
  input: SolutionInput;
}>;


export type CreateSolutionMutation = { __typename?: 'Mutation', createSolution: { __typename?: 'Solution', id: string, name: string, description?: string | null, customAttrs?: Record<string, any> | null } };

export type UpdateSolutionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: SolutionInput;
}>;


export type UpdateSolutionMutation = { __typename?: 'Mutation', updateSolution: { __typename?: 'Solution', id: string, name: string, description?: string | null, customAttrs?: Record<string, any> | null } };

export type DeleteSolutionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSolutionMutation = { __typename?: 'Mutation', deleteSolution: boolean };

export type AddProductToSolutionEnhancedMutationVariables = Exact<{
  solutionId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AddProductToSolutionEnhancedMutation = { __typename?: 'Mutation', addProductToSolutionEnhanced: boolean };

export type RemoveProductFromSolutionEnhancedMutationVariables = Exact<{
  solutionId: Scalars['ID']['input'];
  productId: Scalars['ID']['input'];
}>;


export type RemoveProductFromSolutionEnhancedMutation = { __typename?: 'Mutation', removeProductFromSolutionEnhanced: boolean };

export type ReorderProductsInSolutionMutationVariables = Exact<{
  solutionId: Scalars['ID']['input'];
  productOrders: Array<ProductOrderInput> | ProductOrderInput;
}>;


export type ReorderProductsInSolutionMutation = { __typename?: 'Mutation', reorderProductsInSolution: boolean };

export type AssignSolutionToCustomerMutationVariables = Exact<{
  input: AssignSolutionToCustomerInput;
}>;


export type AssignSolutionToCustomerMutation = { __typename?: 'Mutation', assignSolutionToCustomer: { __typename?: 'CustomerSolutionWithPlan', id: string, name: string, licenseLevel: LicenseLevel, purchasedAt: string, customer: { __typename?: 'Customer', id: string, name: string }, solution: { __typename?: 'Solution', id: string, name: string } } };

export type CreateSolutionAdoptionPlanMutationVariables = Exact<{
  customerSolutionId: Scalars['ID']['input'];
}>;


export type CreateSolutionAdoptionPlanMutation = { __typename?: 'Mutation', createSolutionAdoptionPlan: { __typename?: 'SolutionAdoptionPlan', id: string, solutionName: string, totalTasks: number, completedTasks: number, progressPercentage: number } };

export type UpdateCustomerSolutionTaskStatusMutationVariables = Exact<{
  input: UpdateCustomerSolutionTaskStatusInput;
}>;


export type UpdateCustomerSolutionTaskStatusMutation = { __typename?: 'Mutation', updateCustomerSolutionTaskStatus: { __typename?: 'CustomerSolutionTask', id: string, status: CustomerTaskStatus, isComplete: boolean, completedAt?: string | null } };

export type SyncSolutionAdoptionPlanMutationVariables = Exact<{
  solutionAdoptionPlanId: Scalars['ID']['input'];
}>;


export type SyncSolutionAdoptionPlanMutation = { __typename?: 'Mutation', syncSolutionAdoptionPlan: { __typename?: 'SolutionAdoptionPlan', id: string, progressPercentage: number, totalTasks: number, completedTasks: number } };

export type GetSolutionAdoptionReportQueryVariables = Exact<{
  solutionAdoptionPlanId: Scalars['ID']['input'];
}>;


export type GetSolutionAdoptionReportQuery = { __typename?: 'Query', solutionAdoptionReport: { __typename?: 'SolutionAdoptionReport', solutionAdoptionPlanId: string, customerName: string, solutionName: string, licenseLevel: string, overallProgress: number, taskCompletionPercentage: number, estimatedCompletionDate?: string | null, daysInProgress: number, totalTasks: number, completedTasks: number, inProgressTasks: number, notStartedTasks: number, blockedTasks: number, healthScore: number, telemetryHealthScore: number, riskLevel: RiskLevel, onTrack: boolean, estimatedDaysRemaining?: number | null, recommendations: Array<string>, productProgress: Array<{ __typename?: 'ProductProgressReport', productId: string, productName: string, status: SolutionProductStatus, progress: number, completedTasks: number, totalTasks: number, averageTaskCompletionTime?: number | null, estimatedCompletionDate?: string | null }>, bottlenecks: Array<{ __typename?: 'BottleneckReport', type: BottleneckType, severity: Severity, title: string, description: string, affectedTaskIds: Array<string>, affectedProductIds: Array<string>, suggestedAction: string, estimatedImpactDays?: number | null }> } };

export type GetSolutionComparisonReportQueryVariables = Exact<{
  solutionId: Scalars['ID']['input'];
}>;


export type GetSolutionComparisonReportQuery = { __typename?: 'Query', solutionComparisonReport: { __typename?: 'SolutionComparisonReport', solutionId: string, solutionName: string, totalCustomers: number, averageProgress: number, averageTimeToComplete?: number | null, successRate: number, bestPerformingCustomers: Array<{ __typename?: 'CustomerPerformance', customerId: string, customerName: string, progress: number, daysInProgress: number, healthScore: number }>, strugglingCustomers: Array<{ __typename?: 'CustomerPerformance', customerId: string, customerName: string, progress: number, daysInProgress: number, healthScore: number }>, commonBottlenecks: Array<{ __typename?: 'BottleneckSummary', bottleneckType: string, occurrenceCount: number, averageResolutionTime?: number | null, affectedCustomerPercentage: number }> } };

export type GetSolutionAdoptionPlanQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSolutionAdoptionPlanQuery = { __typename?: 'Query', solutionAdoptionPlan?: { __typename?: 'SolutionAdoptionPlan', id: string, progressPercentage: number, totalTasks: number, completedTasks: number, solutionTasksTotal: number, solutionTasksComplete: number, createdAt: string, updatedAt: string, customerSolution: { __typename?: 'CustomerSolutionWithPlan', id: string, licenseLevel: LicenseLevel, customer: { __typename?: 'Customer', id: string, name: string }, solution: { __typename?: 'Solution', id: string, name: string } }, products: Array<{ __typename?: 'SolutionAdoptionProduct', id: string, productId: string, productName: string, sequenceNumber: number, status: SolutionProductStatus, totalTasks: number, completedTasks: number, progressPercentage: number }>, tasks: Array<{ __typename?: 'CustomerSolutionTask', id: string, name: string, description?: string | null, status: CustomerTaskStatus, isComplete: boolean, sequenceNumber: number, estMinutes: number, weight: number, sourceType: TaskSourceType, licenseLevel: LicenseLevel, completedAt?: string | null }> } | null };

export type GetSolutionAdoptionPlansForCustomerQueryVariables = Exact<{
  customerId: Scalars['ID']['input'];
}>;


export type GetSolutionAdoptionPlansForCustomerQuery = { __typename?: 'Query', solutionAdoptionPlansForCustomer: Array<{ __typename?: 'SolutionAdoptionPlan', id: string, progressPercentage: number, totalTasks: number, completedTasks: number, solutionTasksTotal: number, solutionTasksComplete: number, createdAt: string, updatedAt: string, customerSolution: { __typename?: 'CustomerSolutionWithPlan', id: string, licenseLevel: LicenseLevel, solution: { __typename?: 'Solution', id: string, name: string } } }> };

export type GetAdoptionPlanQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetAdoptionPlanQuery = { __typename?: 'Query', adoptionPlan?: { __typename?: 'AdoptionPlan', id: string, progressPercentage: number, completedTasks: number, totalTasks: number, createdAt: string, updatedAt: string, customerProduct: { __typename?: 'CustomerProductWithPlan', id: string, name: string, licenseLevel: LicenseLevel, customer: { __typename?: 'Customer', id: string, name: string }, product: { __typename?: 'Product', id: string, name: string } }, tasks: Array<{ __typename?: 'CustomerTask', id: string, name: string, description?: string | null, status: CustomerTaskStatus, isComplete: boolean, sequenceNumber: number, estMinutes: number, weight: number, licenseLevel: LicenseLevel, completedAt?: string | null }> } | null };

export type GetAdoptionPlansForCustomerQueryVariables = Exact<{
  customerId: Scalars['ID']['input'];
}>;


export type GetAdoptionPlansForCustomerQuery = { __typename?: 'Query', adoptionPlansForCustomer: Array<{ __typename?: 'AdoptionPlan', id: string, progressPercentage: number, completedTasks: number, totalTasks: number, createdAt: string, updatedAt: string, customerProduct: { __typename?: 'CustomerProductWithPlan', id: string, name: string, licenseLevel: LicenseLevel, product: { __typename?: 'Product', id: string, name: string } } }> };

export type GetCustomerQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetCustomerQuery = { __typename?: 'Query', customer?: { __typename?: 'Customer', id: string, name: string, description?: string | null, customAttrs?: Record<string, any> | null, createdAt: string, updatedAt: string, products: Array<{ __typename?: 'CustomerProductWithPlan', id: string, name: string, licenseLevel: LicenseLevel, product: { __typename?: 'Product', id: string, name: string }, selectedOutcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, selectedReleases: Array<{ __typename?: 'Release', id: string, name: string }>, adoptionPlan?: { __typename?: 'AdoptionPlan', id: string, progressPercentage: number, completedTasks: number, totalTasks: number } | null }>, solutions: Array<{ __typename?: 'CustomerSolutionWithPlan', id: string, name: string, licenseLevel: LicenseLevel, solution: { __typename?: 'Solution', id: string, name: string }, selectedOutcomes: Array<{ __typename?: 'Outcome', id: string, name: string }>, selectedReleases: Array<{ __typename?: 'Release', id: string, name: string }>, adoptionPlan?: { __typename?: 'SolutionAdoptionPlan', id: string, progressPercentage: number, totalTasks: number, completedTasks: number } | null }> } | null };

export type GetCustomersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCustomersQuery = { __typename?: 'Query', customers: Array<{ __typename?: 'Customer', id: string, name: string, description?: string | null, customAttrs?: Record<string, any> | null, createdAt: string, updatedAt: string }> };


export const UpdateProductDocument = gql`
    mutation UpdateProduct($id: ID!, $input: ProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    description
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTaskMutation, DeleteTaskMutationVariables>(DeleteTaskDocument, options);
      }
export type DeleteTaskMutationHookResult = ReturnType<typeof useDeleteTaskMutation>;
export type DeleteTaskMutationResult = Apollo.MutationResult<DeleteTaskMutation>;
export type DeleteTaskMutationOptions = Apollo.BaseMutationOptions<DeleteTaskMutation, DeleteTaskMutationVariables>;
export const ReorderTasksDocument = gql`
    mutation ReorderTasks($productId: ID!, $order: [ID!]!) {
  reorderTasks(productId: $productId, order: $order)
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
 *      order: // value for 'order'
 *   },
 * });
 */
export function useReorderTasksMutation(baseOptions?: Apollo.MutationHookOptions<ReorderTasksMutation, ReorderTasksMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReorderTasksMutation, ReorderTasksMutationVariables>(ReorderTasksDocument, options);
      }
export type ReorderTasksMutationHookResult = ReturnType<typeof useReorderTasksMutation>;
export type ReorderTasksMutationResult = Apollo.MutationResult<ReorderTasksMutation>;
export type ReorderTasksMutationOptions = Apollo.BaseMutationOptions<ReorderTasksMutation, ReorderTasksMutationVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ProcessDeletionQueueMutation, ProcessDeletionQueueMutationVariables>(ProcessDeletionQueueDocument, options);
      }
export type ProcessDeletionQueueMutationHookResult = ReturnType<typeof useProcessDeletionQueueMutation>;
export type ProcessDeletionQueueMutationResult = Apollo.MutationResult<ProcessDeletionQueueMutation>;
export type ProcessDeletionQueueMutationOptions = Apollo.BaseMutationOptions<ProcessDeletionQueueMutation, ProcessDeletionQueueMutationVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteOutcomeMutation, DeleteOutcomeMutationVariables>(DeleteOutcomeDocument, options);
      }
export type DeleteOutcomeMutationHookResult = ReturnType<typeof useDeleteOutcomeMutation>;
export type DeleteOutcomeMutationResult = Apollo.MutationResult<DeleteOutcomeMutation>;
export type DeleteOutcomeMutationOptions = Apollo.BaseMutationOptions<DeleteOutcomeMutation, DeleteOutcomeMutationVariables>;
export const CreateTelemetryAttributeDocument = gql`
    mutation CreateTelemetryAttribute($input: TelemetryAttributeInput!) {
  createTelemetryAttribute(input: $input) {
    id
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTelemetryAttributeMutation, CreateTelemetryAttributeMutationVariables>(CreateTelemetryAttributeDocument, options);
      }
export type CreateTelemetryAttributeMutationHookResult = ReturnType<typeof useCreateTelemetryAttributeMutation>;
export type CreateTelemetryAttributeMutationResult = Apollo.MutationResult<CreateTelemetryAttributeMutation>;
export type CreateTelemetryAttributeMutationOptions = Apollo.BaseMutationOptions<CreateTelemetryAttributeMutation, CreateTelemetryAttributeMutationVariables>;
export const UpdateTelemetryAttributeDocument = gql`
    mutation UpdateTelemetryAttribute($id: ID!, $input: TelemetryAttributeUpdateInput!) {
  updateTelemetryAttribute(id: $id, input: $input) {
    id
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
        const options = {...defaultOptions, ...baseOptions}
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteTelemetryAttributeMutation, DeleteTelemetryAttributeMutationVariables>(DeleteTelemetryAttributeDocument, options);
      }
export type DeleteTelemetryAttributeMutationHookResult = ReturnType<typeof useDeleteTelemetryAttributeMutation>;
export type DeleteTelemetryAttributeMutationResult = Apollo.MutationResult<DeleteTelemetryAttributeMutation>;
export type DeleteTelemetryAttributeMutationOptions = Apollo.BaseMutationOptions<DeleteTelemetryAttributeMutation, DeleteTelemetryAttributeMutationVariables>;
export const CreateSolutionDocument = gql`
    mutation CreateSolution($input: SolutionInput!) {
  createSolution(input: $input) {
    id
    name
    description
    customAttrs
  }
}
    `;
export type CreateSolutionMutationFn = Apollo.MutationFunction<CreateSolutionMutation, CreateSolutionMutationVariables>;

/**
 * __useCreateSolutionMutation__
 *
 * To run a mutation, you first call `useCreateSolutionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSolutionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSolutionMutation, { data, loading, error }] = useCreateSolutionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSolutionMutation(baseOptions?: Apollo.MutationHookOptions<CreateSolutionMutation, CreateSolutionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSolutionMutation, CreateSolutionMutationVariables>(CreateSolutionDocument, options);
      }
export type CreateSolutionMutationHookResult = ReturnType<typeof useCreateSolutionMutation>;
export type CreateSolutionMutationResult = Apollo.MutationResult<CreateSolutionMutation>;
export type CreateSolutionMutationOptions = Apollo.BaseMutationOptions<CreateSolutionMutation, CreateSolutionMutationVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSolutionMutation, UpdateSolutionMutationVariables>(UpdateSolutionDocument, options);
      }
export type UpdateSolutionMutationHookResult = ReturnType<typeof useUpdateSolutionMutation>;
export type UpdateSolutionMutationResult = Apollo.MutationResult<UpdateSolutionMutation>;
export type UpdateSolutionMutationOptions = Apollo.BaseMutationOptions<UpdateSolutionMutation, UpdateSolutionMutationVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteSolutionMutation, DeleteSolutionMutationVariables>(DeleteSolutionDocument, options);
      }
export type DeleteSolutionMutationHookResult = ReturnType<typeof useDeleteSolutionMutation>;
export type DeleteSolutionMutationResult = Apollo.MutationResult<DeleteSolutionMutation>;
export type DeleteSolutionMutationOptions = Apollo.BaseMutationOptions<DeleteSolutionMutation, DeleteSolutionMutationVariables>;
export const AddProductToSolutionEnhancedDocument = gql`
    mutation AddProductToSolutionEnhanced($solutionId: ID!, $productId: ID!, $order: Int) {
  addProductToSolutionEnhanced(
    solutionId: $solutionId
    productId: $productId
    order: $order
  )
}
    `;
export type AddProductToSolutionEnhancedMutationFn = Apollo.MutationFunction<AddProductToSolutionEnhancedMutation, AddProductToSolutionEnhancedMutationVariables>;

/**
 * __useAddProductToSolutionEnhancedMutation__
 *
 * To run a mutation, you first call `useAddProductToSolutionEnhancedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddProductToSolutionEnhancedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addProductToSolutionEnhancedMutation, { data, loading, error }] = useAddProductToSolutionEnhancedMutation({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *      productId: // value for 'productId'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useAddProductToSolutionEnhancedMutation(baseOptions?: Apollo.MutationHookOptions<AddProductToSolutionEnhancedMutation, AddProductToSolutionEnhancedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddProductToSolutionEnhancedMutation, AddProductToSolutionEnhancedMutationVariables>(AddProductToSolutionEnhancedDocument, options);
      }
export type AddProductToSolutionEnhancedMutationHookResult = ReturnType<typeof useAddProductToSolutionEnhancedMutation>;
export type AddProductToSolutionEnhancedMutationResult = Apollo.MutationResult<AddProductToSolutionEnhancedMutation>;
export type AddProductToSolutionEnhancedMutationOptions = Apollo.BaseMutationOptions<AddProductToSolutionEnhancedMutation, AddProductToSolutionEnhancedMutationVariables>;
export const RemoveProductFromSolutionEnhancedDocument = gql`
    mutation RemoveProductFromSolutionEnhanced($solutionId: ID!, $productId: ID!) {
  removeProductFromSolutionEnhanced(
    solutionId: $solutionId
    productId: $productId
  )
}
    `;
export type RemoveProductFromSolutionEnhancedMutationFn = Apollo.MutationFunction<RemoveProductFromSolutionEnhancedMutation, RemoveProductFromSolutionEnhancedMutationVariables>;

/**
 * __useRemoveProductFromSolutionEnhancedMutation__
 *
 * To run a mutation, you first call `useRemoveProductFromSolutionEnhancedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveProductFromSolutionEnhancedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeProductFromSolutionEnhancedMutation, { data, loading, error }] = useRemoveProductFromSolutionEnhancedMutation({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *      productId: // value for 'productId'
 *   },
 * });
 */
export function useRemoveProductFromSolutionEnhancedMutation(baseOptions?: Apollo.MutationHookOptions<RemoveProductFromSolutionEnhancedMutation, RemoveProductFromSolutionEnhancedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveProductFromSolutionEnhancedMutation, RemoveProductFromSolutionEnhancedMutationVariables>(RemoveProductFromSolutionEnhancedDocument, options);
      }
export type RemoveProductFromSolutionEnhancedMutationHookResult = ReturnType<typeof useRemoveProductFromSolutionEnhancedMutation>;
export type RemoveProductFromSolutionEnhancedMutationResult = Apollo.MutationResult<RemoveProductFromSolutionEnhancedMutation>;
export type RemoveProductFromSolutionEnhancedMutationOptions = Apollo.BaseMutationOptions<RemoveProductFromSolutionEnhancedMutation, RemoveProductFromSolutionEnhancedMutationVariables>;
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
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReorderProductsInSolutionMutation, ReorderProductsInSolutionMutationVariables>(ReorderProductsInSolutionDocument, options);
      }
export type ReorderProductsInSolutionMutationHookResult = ReturnType<typeof useReorderProductsInSolutionMutation>;
export type ReorderProductsInSolutionMutationResult = Apollo.MutationResult<ReorderProductsInSolutionMutation>;
export type ReorderProductsInSolutionMutationOptions = Apollo.BaseMutationOptions<ReorderProductsInSolutionMutation, ReorderProductsInSolutionMutationVariables>;
export const AssignSolutionToCustomerDocument = gql`
    mutation AssignSolutionToCustomer($input: AssignSolutionToCustomerInput!) {
  assignSolutionToCustomer(input: $input) {
    id
    name
    licenseLevel
    purchasedAt
    customer {
      id
      name
    }
    solution {
      id
      name
    }
  }
}
    `;
export type AssignSolutionToCustomerMutationFn = Apollo.MutationFunction<AssignSolutionToCustomerMutation, AssignSolutionToCustomerMutationVariables>;

/**
 * __useAssignSolutionToCustomerMutation__
 *
 * To run a mutation, you first call `useAssignSolutionToCustomerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAssignSolutionToCustomerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [assignSolutionToCustomerMutation, { data, loading, error }] = useAssignSolutionToCustomerMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAssignSolutionToCustomerMutation(baseOptions?: Apollo.MutationHookOptions<AssignSolutionToCustomerMutation, AssignSolutionToCustomerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AssignSolutionToCustomerMutation, AssignSolutionToCustomerMutationVariables>(AssignSolutionToCustomerDocument, options);
      }
export type AssignSolutionToCustomerMutationHookResult = ReturnType<typeof useAssignSolutionToCustomerMutation>;
export type AssignSolutionToCustomerMutationResult = Apollo.MutationResult<AssignSolutionToCustomerMutation>;
export type AssignSolutionToCustomerMutationOptions = Apollo.BaseMutationOptions<AssignSolutionToCustomerMutation, AssignSolutionToCustomerMutationVariables>;
export const CreateSolutionAdoptionPlanDocument = gql`
    mutation CreateSolutionAdoptionPlan($customerSolutionId: ID!) {
  createSolutionAdoptionPlan(customerSolutionId: $customerSolutionId) {
    id
    solutionName
    totalTasks
    completedTasks
    progressPercentage
  }
}
    `;
export type CreateSolutionAdoptionPlanMutationFn = Apollo.MutationFunction<CreateSolutionAdoptionPlanMutation, CreateSolutionAdoptionPlanMutationVariables>;

/**
 * __useCreateSolutionAdoptionPlanMutation__
 *
 * To run a mutation, you first call `useCreateSolutionAdoptionPlanMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSolutionAdoptionPlanMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSolutionAdoptionPlanMutation, { data, loading, error }] = useCreateSolutionAdoptionPlanMutation({
 *   variables: {
 *      customerSolutionId: // value for 'customerSolutionId'
 *   },
 * });
 */
export function useCreateSolutionAdoptionPlanMutation(baseOptions?: Apollo.MutationHookOptions<CreateSolutionAdoptionPlanMutation, CreateSolutionAdoptionPlanMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSolutionAdoptionPlanMutation, CreateSolutionAdoptionPlanMutationVariables>(CreateSolutionAdoptionPlanDocument, options);
      }
export type CreateSolutionAdoptionPlanMutationHookResult = ReturnType<typeof useCreateSolutionAdoptionPlanMutation>;
export type CreateSolutionAdoptionPlanMutationResult = Apollo.MutationResult<CreateSolutionAdoptionPlanMutation>;
export type CreateSolutionAdoptionPlanMutationOptions = Apollo.BaseMutationOptions<CreateSolutionAdoptionPlanMutation, CreateSolutionAdoptionPlanMutationVariables>;
export const UpdateCustomerSolutionTaskStatusDocument = gql`
    mutation UpdateCustomerSolutionTaskStatus($input: UpdateCustomerSolutionTaskStatusInput!) {
  updateCustomerSolutionTaskStatus(input: $input) {
    id
    status
    isComplete
    completedAt
  }
}
    `;
export type UpdateCustomerSolutionTaskStatusMutationFn = Apollo.MutationFunction<UpdateCustomerSolutionTaskStatusMutation, UpdateCustomerSolutionTaskStatusMutationVariables>;

/**
 * __useUpdateCustomerSolutionTaskStatusMutation__
 *
 * To run a mutation, you first call `useUpdateCustomerSolutionTaskStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCustomerSolutionTaskStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCustomerSolutionTaskStatusMutation, { data, loading, error }] = useUpdateCustomerSolutionTaskStatusMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateCustomerSolutionTaskStatusMutation(baseOptions?: Apollo.MutationHookOptions<UpdateCustomerSolutionTaskStatusMutation, UpdateCustomerSolutionTaskStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateCustomerSolutionTaskStatusMutation, UpdateCustomerSolutionTaskStatusMutationVariables>(UpdateCustomerSolutionTaskStatusDocument, options);
      }
export type UpdateCustomerSolutionTaskStatusMutationHookResult = ReturnType<typeof useUpdateCustomerSolutionTaskStatusMutation>;
export type UpdateCustomerSolutionTaskStatusMutationResult = Apollo.MutationResult<UpdateCustomerSolutionTaskStatusMutation>;
export type UpdateCustomerSolutionTaskStatusMutationOptions = Apollo.BaseMutationOptions<UpdateCustomerSolutionTaskStatusMutation, UpdateCustomerSolutionTaskStatusMutationVariables>;
export const SyncSolutionAdoptionPlanDocument = gql`
    mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
  syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
    id
    progressPercentage
    totalTasks
    completedTasks
  }
}
    `;
export type SyncSolutionAdoptionPlanMutationFn = Apollo.MutationFunction<SyncSolutionAdoptionPlanMutation, SyncSolutionAdoptionPlanMutationVariables>;

/**
 * __useSyncSolutionAdoptionPlanMutation__
 *
 * To run a mutation, you first call `useSyncSolutionAdoptionPlanMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSyncSolutionAdoptionPlanMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [syncSolutionAdoptionPlanMutation, { data, loading, error }] = useSyncSolutionAdoptionPlanMutation({
 *   variables: {
 *      solutionAdoptionPlanId: // value for 'solutionAdoptionPlanId'
 *   },
 * });
 */
export function useSyncSolutionAdoptionPlanMutation(baseOptions?: Apollo.MutationHookOptions<SyncSolutionAdoptionPlanMutation, SyncSolutionAdoptionPlanMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SyncSolutionAdoptionPlanMutation, SyncSolutionAdoptionPlanMutationVariables>(SyncSolutionAdoptionPlanDocument, options);
      }
export type SyncSolutionAdoptionPlanMutationHookResult = ReturnType<typeof useSyncSolutionAdoptionPlanMutation>;
export type SyncSolutionAdoptionPlanMutationResult = Apollo.MutationResult<SyncSolutionAdoptionPlanMutation>;
export type SyncSolutionAdoptionPlanMutationOptions = Apollo.BaseMutationOptions<SyncSolutionAdoptionPlanMutation, SyncSolutionAdoptionPlanMutationVariables>;
export const GetSolutionAdoptionReportDocument = gql`
    query GetSolutionAdoptionReport($solutionAdoptionPlanId: ID!) {
  solutionAdoptionReport(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
    solutionAdoptionPlanId
    customerName
    solutionName
    licenseLevel
    overallProgress
    taskCompletionPercentage
    estimatedCompletionDate
    daysInProgress
    totalTasks
    completedTasks
    inProgressTasks
    notStartedTasks
    blockedTasks
    healthScore
    telemetryHealthScore
    riskLevel
    onTrack
    estimatedDaysRemaining
    recommendations
    productProgress {
      productId
      productName
      status
      progress
      completedTasks
      totalTasks
      averageTaskCompletionTime
      estimatedCompletionDate
    }
    bottlenecks {
      type
      severity
      title
      description
      affectedTaskIds
      affectedProductIds
      suggestedAction
      estimatedImpactDays
    }
  }
}
    `;

/**
 * __useGetSolutionAdoptionReportQuery__
 *
 * To run a query within a React component, call `useGetSolutionAdoptionReportQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSolutionAdoptionReportQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSolutionAdoptionReportQuery({
 *   variables: {
 *      solutionAdoptionPlanId: // value for 'solutionAdoptionPlanId'
 *   },
 * });
 */
export function useGetSolutionAdoptionReportQuery(baseOptions: Apollo.QueryHookOptions<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables> & ({ variables: GetSolutionAdoptionReportQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables>(GetSolutionAdoptionReportDocument, options);
      }
export function useGetSolutionAdoptionReportLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables>(GetSolutionAdoptionReportDocument, options);
        }
export function useGetSolutionAdoptionReportSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables>(GetSolutionAdoptionReportDocument, options);
        }
export type GetSolutionAdoptionReportQueryHookResult = ReturnType<typeof useGetSolutionAdoptionReportQuery>;
export type GetSolutionAdoptionReportLazyQueryHookResult = ReturnType<typeof useGetSolutionAdoptionReportLazyQuery>;
export type GetSolutionAdoptionReportSuspenseQueryHookResult = ReturnType<typeof useGetSolutionAdoptionReportSuspenseQuery>;
export type GetSolutionAdoptionReportQueryResult = Apollo.QueryResult<GetSolutionAdoptionReportQuery, GetSolutionAdoptionReportQueryVariables>;
export const GetSolutionComparisonReportDocument = gql`
    query GetSolutionComparisonReport($solutionId: ID!) {
  solutionComparisonReport(solutionId: $solutionId) {
    solutionId
    solutionName
    totalCustomers
    averageProgress
    averageTimeToComplete
    successRate
    bestPerformingCustomers {
      customerId
      customerName
      progress
      daysInProgress
      healthScore
    }
    strugglingCustomers {
      customerId
      customerName
      progress
      daysInProgress
      healthScore
    }
    commonBottlenecks {
      bottleneckType
      occurrenceCount
      averageResolutionTime
      affectedCustomerPercentage
    }
  }
}
    `;

/**
 * __useGetSolutionComparisonReportQuery__
 *
 * To run a query within a React component, call `useGetSolutionComparisonReportQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSolutionComparisonReportQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSolutionComparisonReportQuery({
 *   variables: {
 *      solutionId: // value for 'solutionId'
 *   },
 * });
 */
export function useGetSolutionComparisonReportQuery(baseOptions: Apollo.QueryHookOptions<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables> & ({ variables: GetSolutionComparisonReportQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables>(GetSolutionComparisonReportDocument, options);
      }
export function useGetSolutionComparisonReportLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables>(GetSolutionComparisonReportDocument, options);
        }
export function useGetSolutionComparisonReportSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables>(GetSolutionComparisonReportDocument, options);
        }
export type GetSolutionComparisonReportQueryHookResult = ReturnType<typeof useGetSolutionComparisonReportQuery>;
export type GetSolutionComparisonReportLazyQueryHookResult = ReturnType<typeof useGetSolutionComparisonReportLazyQuery>;
export type GetSolutionComparisonReportSuspenseQueryHookResult = ReturnType<typeof useGetSolutionComparisonReportSuspenseQuery>;
export type GetSolutionComparisonReportQueryResult = Apollo.QueryResult<GetSolutionComparisonReportQuery, GetSolutionComparisonReportQueryVariables>;
export const GetSolutionAdoptionPlanDocument = gql`
    query GetSolutionAdoptionPlan($id: ID!) {
  solutionAdoptionPlan(id: $id) {
    id
    customerSolution {
      id
      customer {
        id
        name
      }
      solution {
        id
        name
      }
      licenseLevel
    }
    progressPercentage
    totalTasks
    completedTasks
    solutionTasksTotal
    solutionTasksComplete
    createdAt
    updatedAt
    products {
      id
      productId
      productName
      sequenceNumber
      status
      totalTasks
      completedTasks
      progressPercentage
    }
    tasks {
      id
      name
      description
      status
      isComplete
      sequenceNumber
      estMinutes
      weight
      sourceType
      licenseLevel
      completedAt
    }
  }
}
    `;

/**
 * __useGetSolutionAdoptionPlanQuery__
 *
 * To run a query within a React component, call `useGetSolutionAdoptionPlanQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSolutionAdoptionPlanQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSolutionAdoptionPlanQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSolutionAdoptionPlanQuery(baseOptions: Apollo.QueryHookOptions<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables> & ({ variables: GetSolutionAdoptionPlanQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables>(GetSolutionAdoptionPlanDocument, options);
      }
export function useGetSolutionAdoptionPlanLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables>(GetSolutionAdoptionPlanDocument, options);
        }
export function useGetSolutionAdoptionPlanSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables>(GetSolutionAdoptionPlanDocument, options);
        }
export type GetSolutionAdoptionPlanQueryHookResult = ReturnType<typeof useGetSolutionAdoptionPlanQuery>;
export type GetSolutionAdoptionPlanLazyQueryHookResult = ReturnType<typeof useGetSolutionAdoptionPlanLazyQuery>;
export type GetSolutionAdoptionPlanSuspenseQueryHookResult = ReturnType<typeof useGetSolutionAdoptionPlanSuspenseQuery>;
export type GetSolutionAdoptionPlanQueryResult = Apollo.QueryResult<GetSolutionAdoptionPlanQuery, GetSolutionAdoptionPlanQueryVariables>;
export const GetSolutionAdoptionPlansForCustomerDocument = gql`
    query GetSolutionAdoptionPlansForCustomer($customerId: ID!) {
  solutionAdoptionPlansForCustomer(customerId: $customerId) {
    id
    customerSolution {
      id
      solution {
        id
        name
      }
      licenseLevel
    }
    progressPercentage
    totalTasks
    completedTasks
    solutionTasksTotal
    solutionTasksComplete
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetSolutionAdoptionPlansForCustomerQuery__
 *
 * To run a query within a React component, call `useGetSolutionAdoptionPlansForCustomerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSolutionAdoptionPlansForCustomerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSolutionAdoptionPlansForCustomerQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetSolutionAdoptionPlansForCustomerQuery(baseOptions: Apollo.QueryHookOptions<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables> & ({ variables: GetSolutionAdoptionPlansForCustomerQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables>(GetSolutionAdoptionPlansForCustomerDocument, options);
      }
export function useGetSolutionAdoptionPlansForCustomerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables>(GetSolutionAdoptionPlansForCustomerDocument, options);
        }
export function useGetSolutionAdoptionPlansForCustomerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables>(GetSolutionAdoptionPlansForCustomerDocument, options);
        }
export type GetSolutionAdoptionPlansForCustomerQueryHookResult = ReturnType<typeof useGetSolutionAdoptionPlansForCustomerQuery>;
export type GetSolutionAdoptionPlansForCustomerLazyQueryHookResult = ReturnType<typeof useGetSolutionAdoptionPlansForCustomerLazyQuery>;
export type GetSolutionAdoptionPlansForCustomerSuspenseQueryHookResult = ReturnType<typeof useGetSolutionAdoptionPlansForCustomerSuspenseQuery>;
export type GetSolutionAdoptionPlansForCustomerQueryResult = Apollo.QueryResult<GetSolutionAdoptionPlansForCustomerQuery, GetSolutionAdoptionPlansForCustomerQueryVariables>;
export const GetAdoptionPlanDocument = gql`
    query GetAdoptionPlan($id: ID!) {
  adoptionPlan(id: $id) {
    id
    customerProduct {
      id
      name
      customer {
        id
        name
      }
      product {
        id
        name
      }
      licenseLevel
    }
    progressPercentage
    completedTasks
    totalTasks
    createdAt
    updatedAt
    tasks {
      id
      name
      description
      status
      isComplete
      sequenceNumber
      estMinutes
      weight
      licenseLevel
      completedAt
    }
  }
}
    `;

/**
 * __useGetAdoptionPlanQuery__
 *
 * To run a query within a React component, call `useGetAdoptionPlanQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAdoptionPlanQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAdoptionPlanQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetAdoptionPlanQuery(baseOptions: Apollo.QueryHookOptions<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables> & ({ variables: GetAdoptionPlanQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables>(GetAdoptionPlanDocument, options);
      }
export function useGetAdoptionPlanLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables>(GetAdoptionPlanDocument, options);
        }
export function useGetAdoptionPlanSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables>(GetAdoptionPlanDocument, options);
        }
export type GetAdoptionPlanQueryHookResult = ReturnType<typeof useGetAdoptionPlanQuery>;
export type GetAdoptionPlanLazyQueryHookResult = ReturnType<typeof useGetAdoptionPlanLazyQuery>;
export type GetAdoptionPlanSuspenseQueryHookResult = ReturnType<typeof useGetAdoptionPlanSuspenseQuery>;
export type GetAdoptionPlanQueryResult = Apollo.QueryResult<GetAdoptionPlanQuery, GetAdoptionPlanQueryVariables>;
export const GetAdoptionPlansForCustomerDocument = gql`
    query GetAdoptionPlansForCustomer($customerId: ID!) {
  adoptionPlansForCustomer(customerId: $customerId) {
    id
    customerProduct {
      id
      name
      product {
        id
        name
      }
      licenseLevel
    }
    progressPercentage
    completedTasks
    totalTasks
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetAdoptionPlansForCustomerQuery__
 *
 * To run a query within a React component, call `useGetAdoptionPlansForCustomerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAdoptionPlansForCustomerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAdoptionPlansForCustomerQuery({
 *   variables: {
 *      customerId: // value for 'customerId'
 *   },
 * });
 */
export function useGetAdoptionPlansForCustomerQuery(baseOptions: Apollo.QueryHookOptions<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables> & ({ variables: GetAdoptionPlansForCustomerQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables>(GetAdoptionPlansForCustomerDocument, options);
      }
export function useGetAdoptionPlansForCustomerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables>(GetAdoptionPlansForCustomerDocument, options);
        }
export function useGetAdoptionPlansForCustomerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables>(GetAdoptionPlansForCustomerDocument, options);
        }
export type GetAdoptionPlansForCustomerQueryHookResult = ReturnType<typeof useGetAdoptionPlansForCustomerQuery>;
export type GetAdoptionPlansForCustomerLazyQueryHookResult = ReturnType<typeof useGetAdoptionPlansForCustomerLazyQuery>;
export type GetAdoptionPlansForCustomerSuspenseQueryHookResult = ReturnType<typeof useGetAdoptionPlansForCustomerSuspenseQuery>;
export type GetAdoptionPlansForCustomerQueryResult = Apollo.QueryResult<GetAdoptionPlansForCustomerQuery, GetAdoptionPlansForCustomerQueryVariables>;
export const GetCustomerDocument = gql`
    query GetCustomer($id: ID!) {
  customer(id: $id) {
    id
    name
    description
    customAttrs
    createdAt
    updatedAt
    products {
      id
      name
      licenseLevel
      product {
        id
        name
      }
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
      }
      adoptionPlan {
        id
        progressPercentage
        completedTasks
        totalTasks
      }
    }
    solutions {
      id
      name
      licenseLevel
      solution {
        id
        name
      }
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
      }
      adoptionPlan {
        id
        progressPercentage
        totalTasks
        completedTasks
      }
    }
  }
}
    `;

/**
 * __useGetCustomerQuery__
 *
 * To run a query within a React component, call `useGetCustomerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomerQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetCustomerQuery(baseOptions: Apollo.QueryHookOptions<GetCustomerQuery, GetCustomerQueryVariables> & ({ variables: GetCustomerQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomerQuery, GetCustomerQueryVariables>(GetCustomerDocument, options);
      }
export function useGetCustomerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomerQuery, GetCustomerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomerQuery, GetCustomerQueryVariables>(GetCustomerDocument, options);
        }
export function useGetCustomerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCustomerQuery, GetCustomerQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCustomerQuery, GetCustomerQueryVariables>(GetCustomerDocument, options);
        }
export type GetCustomerQueryHookResult = ReturnType<typeof useGetCustomerQuery>;
export type GetCustomerLazyQueryHookResult = ReturnType<typeof useGetCustomerLazyQuery>;
export type GetCustomerSuspenseQueryHookResult = ReturnType<typeof useGetCustomerSuspenseQuery>;
export type GetCustomerQueryResult = Apollo.QueryResult<GetCustomerQuery, GetCustomerQueryVariables>;
export const GetCustomersDocument = gql`
    query GetCustomers {
  customers {
    id
    name
    description
    customAttrs
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetCustomersQuery__
 *
 * To run a query within a React component, call `useGetCustomersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCustomersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCustomersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCustomersQuery(baseOptions?: Apollo.QueryHookOptions<GetCustomersQuery, GetCustomersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCustomersQuery, GetCustomersQueryVariables>(GetCustomersDocument, options);
      }
export function useGetCustomersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCustomersQuery, GetCustomersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCustomersQuery, GetCustomersQueryVariables>(GetCustomersDocument, options);
        }
export function useGetCustomersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCustomersQuery, GetCustomersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCustomersQuery, GetCustomersQueryVariables>(GetCustomersDocument, options);
        }
export type GetCustomersQueryHookResult = ReturnType<typeof useGetCustomersQuery>;
export type GetCustomersLazyQueryHookResult = ReturnType<typeof useGetCustomersLazyQuery>;
export type GetCustomersSuspenseQueryHookResult = ReturnType<typeof useGetCustomersSuspenseQuery>;
export type GetCustomersQueryResult = Apollo.QueryResult<GetCustomersQuery, GetCustomersQueryVariables>;