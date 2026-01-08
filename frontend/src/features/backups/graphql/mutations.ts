import { gql } from '@apollo/client';

export const RESTORE_BACKUP_FROM_FILE = gql`
  mutation RestoreBackupFromFile($file: Upload!) {
    restoreBackupFromFile(file: $file) {
      success
      message
      error
    }
  }
`;
