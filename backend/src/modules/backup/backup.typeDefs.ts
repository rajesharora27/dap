import gql from 'graphql-tag';

export const backupTypeDefs = gql`
  type RecordCounts {
    users: Int
    products: Int
    solutions: Int
    customers: Int
    customerProducts: Int
    customerSolutions: Int
    adoptionPlans: Int
    solutionAdoptionPlans: Int
    tasks: Int
    customerTasks: Int
    customerSolutionTasks: Int
  }

  type BackupFile {
    id: ID!
    filename: String!
    timestamp: DateTime!
    size: Int!
    recordCounts: RecordCounts
    path: String
  }

  type BackupResult {
    success: Boolean!
    filename: String
    size: Int
    url: String
    message: String
    error: String
    metadata: BackupFile
  }

  type RestoreResult {
    success: Boolean!
    message: String!
    error: String
    recordsRestored: RecordCounts
  }

  type AutoBackupConfig {
    enabled: Boolean!
    schedule: String!
    retentionDays: Int!
    lastBackupTime: DateTime
    nextRun: DateTime
  }

  input AutoBackupUpdateInput {
    enabled: Boolean
    schedule: String
    retentionDays: Int
  }

  extend type Query {
    listBackups: [BackupFile!]!
    autoBackupConfig: AutoBackupConfig!
  }

  extend type Mutation {
    createManualBackup(customName: String): BackupResult!
    createBackup: BackupResult!
    restoreBackup(filename: String!): RestoreResult!
    deleteBackup(filename: String!): BackupResult!
    updateAutoBackupConfig(input: AutoBackupUpdateInput!): AutoBackupConfig!
    triggerAutoBackup: BackupResult!
  }
`;
