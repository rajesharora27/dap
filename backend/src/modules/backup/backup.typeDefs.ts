import gql from 'graphql-tag';

export const backupTypeDefs = gql`
  type BackupFile {
    filename: String!
    size: Int!
    createdAt: DateTime!
    path: String!
  }

  type BackupResult {
    success: Boolean!
    filename: String
    message: String!
    error: String
  }

  type RestoreResult {
    success: Boolean!
    message: String!
    error: String
  }

  type AutoBackupConfig {
    enabled: Boolean!
    schedule: String!
    retentionDays: Int!
    lastRun: DateTime
    nextRun: DateTime
  }

  input AutoBackupUpdateInput {
    enabled: Boolean
    schedule: String
    retentionDays: Int
  }

  extend type Query {
    listBackups: [BackupFile!]!
    getAutoBackupConfig: AutoBackupConfig!
  }

  extend type Mutation {
    createManualBackup: BackupResult!
    restoreBackup(filename: String!): RestoreResult!
    deleteBackup(filename: String!): Boolean!
    updateAutoBackupConfig(input: AutoBackupUpdateInput!): AutoBackupConfig!
  }
`;
