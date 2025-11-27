import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField
} from '@mui/material';
import {
  Backup,
  Restore,
  Delete,
  Download,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Storage,
  Schedule,
  DataObject,
  Upload
} from '@mui/icons-material';

// GraphQL Queries and Mutations
const LIST_BACKUPS = gql`
  query ListBackups {
    listBackups {
      id
      filename
      timestamp
      size
      recordCounts {
        users
        products
        solutions
        customers
        customerProducts
        customerSolutions
        adoptionPlans
        solutionAdoptionPlans
        tasks
        customerTasks
        customerSolutionTasks
      }
    }
  }
`;

const CREATE_BACKUP = gql`
  mutation CreateBackup {
    createBackup {
      success
      filename
      size
      url
      message
      error
      metadata {
        id
        filename
        timestamp
        size
        recordCounts {
          users
          products
          solutions
          customers
          customerProducts
          customerSolutions
          adoptionPlans
          solutionAdoptionPlans
          tasks
          customerTasks
          customerSolutionTasks
        }
      }
    }
  }
`;

const RESTORE_BACKUP = gql`
  mutation RestoreBackup($filename: String!) {
    restoreBackup(filename: $filename) {
      success
      message
      error
      recordsRestored {
        users
        products
        solutions
        customers
        customerProducts
        customerSolutions
        adoptionPlans
        solutionAdoptionPlans
        tasks
        customerTasks
        customerSolutionTasks
      }
    }
  }
`;

const DELETE_BACKUP = gql`
  mutation DeleteBackup($filename: String!) {
    deleteBackup(filename: $filename) {
      success
      message
    }
  }
`;

const GET_AUTO_BACKUP_CONFIG = gql`
  query GetAutoBackupConfig {
    autoBackupConfig {
      enabled
      schedule
      retentionDays
      lastBackupTime
    }
  }
`;

const UPDATE_AUTO_BACKUP_CONFIG = gql`
  mutation UpdateAutoBackupConfig($input: AutoBackupConfigInput!) {
    updateAutoBackupConfig(input: $input) {
      enabled
      schedule
      retentionDays
      lastBackupTime
    }
  }
`;

const TRIGGER_AUTO_BACKUP = gql`
  mutation TriggerAutoBackup {
    triggerAutoBackup {
      success
      filename
      message
      error
    }
  }
`;

interface BackupMetadata {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  recordCounts: {
    users: number;
    products: number;
    solutions: number;
    customers: number;
    customerProducts: number;
    customerSolutions: number;
    adoptionPlans: number;
    solutionAdoptionPlans: number;
    tasks: number;
    customerTasks: number;
    customerSolutionTasks: number;
  };
}

export const BackupManagementPanel: React.FC = () => {
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'restore' | 'delete' | 'restoreFromFile' | null;
    filename: string | null;
  }>({ open: false, type: null, filename: null });
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupRetentionDays, setAutoBackupRetentionDays] = useState(7);

  // GraphQL Queries and Mutations
  const { data, loading, error, refetch } = useQuery(LIST_BACKUPS, {
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const { data: autoBackupData, refetch: refetchAutoBackupConfig } = useQuery(GET_AUTO_BACKUP_CONFIG);

  React.useEffect(() => {
    if (autoBackupData?.autoBackupConfig) {
      setAutoBackupEnabled(autoBackupData.autoBackupConfig.enabled);
      setAutoBackupRetentionDays(autoBackupData.autoBackupConfig.retentionDays);
    }
  }, [autoBackupData]);

  const [createBackup, { loading: creating }] = useMutation(CREATE_BACKUP, {
    onCompleted: (data) => {
      if (data.createBackup.success) {
        setStatusMessage({
          type: 'success',
          message: data.createBackup.message || 'Backup created successfully!',
        });
        refetch();
      } else {
        setStatusMessage({
          type: 'error',
          message: data.createBackup.error || 'Failed to create backup',
        });
      }
    },
    onError: (error) => {
      setStatusMessage({
        type: 'error',
        message: `Error creating backup: ${error.message}`,
      });
    },
  });

  const [restoreBackup, { loading: restoring }] = useMutation(RESTORE_BACKUP, {
    onCompleted: (data) => {
      if (data.restoreBackup.success) {
        setStatusMessage({
          type: 'success',
          message: data.restoreBackup.message || 'Database restored successfully!',
        });
        // Reload the page to refresh all data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setStatusMessage({
          type: 'error',
          message: data.restoreBackup.error || 'Failed to restore backup',
        });
      }
      setConfirmDialog({ open: false, type: null, filename: null });
    },
    onError: (error) => {
      setStatusMessage({
        type: 'error',
        message: `Error restoring backup: ${error.message}`,
      });
      setConfirmDialog({ open: false, type: null, filename: null });
    },
  });

  const [deleteBackup, { loading: deleting }] = useMutation(DELETE_BACKUP, {
    onCompleted: (data) => {
      if (data.deleteBackup.success) {
        setStatusMessage({
          type: 'success',
          message: data.deleteBackup.message || 'Backup deleted successfully!',
        });
        refetch();
        setSelectedBackup(null);
      } else {
        setStatusMessage({
          type: 'error',
          message: data.deleteBackup.message || 'Failed to delete backup',
        });
      }
      setConfirmDialog({ open: false, type: null, filename: null });
    },
    onError: (error) => {
      setStatusMessage({
        type: 'error',
        message: `Error deleting backup: ${error.message}`,
      });
      setConfirmDialog({ open: false, type: null, filename: null });
    },
  });

  const [updateAutoBackupConfig, { loading: updatingConfig }] = useMutation(UPDATE_AUTO_BACKUP_CONFIG, {
    onCompleted: () => {
      setStatusMessage({
        type: 'success',
        message: 'Auto-backup settings updated successfully!',
      });
      refetchAutoBackupConfig();
    },
    onError: (error) => {
      setStatusMessage({
        type: 'error',
        message: `Error updating auto-backup settings: ${error.message}`,
      });
    },
  });

  const [triggerAutoBackup, { loading: triggeringBackup }] = useMutation(TRIGGER_AUTO_BACKUP, {
    onCompleted: (data) => {
      if (data.triggerAutoBackup.success) {
        setStatusMessage({
          type: 'success',
          message: data.triggerAutoBackup.message || 'Auto-backup triggered successfully!',
        });
        refetch();
      } else {
        setStatusMessage({
          type: 'error',
          message: data.triggerAutoBackup.error || 'Failed to trigger auto-backup',
        });
      }
    },
    onError: (error) => {
      setStatusMessage({
        type: 'error',
        message: `Error triggering auto-backup: ${error.message}`,
      });
    },
  });

  const handleCreateBackup = () => {
    setStatusMessage({ type: null, message: '' });
    createBackup();
  };

  const handleRestoreConfirm = (filename: string) => {
    setConfirmDialog({ open: true, type: 'restore', filename });
  };

  const handleDeleteConfirm = (filename: string) => {
    setConfirmDialog({ open: true, type: 'delete', filename });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'restore' && confirmDialog.filename) {
      restoreBackup({ variables: { filename: confirmDialog.filename } });
    } else if (confirmDialog.type === 'delete' && confirmDialog.filename) {
      deleteBackup({ variables: { filename: confirmDialog.filename } });
    } else if (confirmDialog.type === 'restoreFromFile') {
      handleRestoreFromFile();
    }
  };

  const handleDownload = (filename: string) => {
    const url = `${window.location.origin}/api/downloads/backups/${encodeURIComponent(filename)}`;
    window.open(url, '_blank');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        setStatusMessage({
          type: 'error',
          message: 'Invalid file type. Please select a .sql file.',
        });
        return;
      }
      setSelectedFile(file);
      setConfirmDialog({ open: true, type: 'restoreFromFile', filename: file.name });
    }
  };

  const handleRestoreFromFile = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    setStatusMessage({ type: 'info', message: 'Uploading and restoring backup...' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Use BASE_URL for subpath deployment support
      const basePath = import.meta.env.BASE_URL || '/';
      const restoreUrl = basePath === '/'
        ? '/api/backup/restore-from-file'
        : `${basePath.replace(/\/$/, '')}/api/backup/restore-from-file`;

      const response = await fetch(restoreUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: result.message || 'Database restored successfully from uploaded file!',
        });
        // Reload the page to refresh all data
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setStatusMessage({
          type: 'error',
          message: result.error || result.message || 'Failed to restore from uploaded file',
        });
      }
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        message: `Error restoring from file: ${error.message}`,
      });
    } finally {
      setUploadingFile(false);
      setSelectedFile(null);
      setConfirmDialog({ open: false, type: null, filename: null });
    }
  };

  const handleToggleAutoBackup = () => {
    const newEnabled = !autoBackupEnabled;
    setAutoBackupEnabled(newEnabled);
    updateAutoBackupConfig({
      variables: {
        input: {
          enabled: newEnabled,
          retentionDays: autoBackupRetentionDays,
        },
      },
    });
  };

  const handleRetentionDaysChange = (days: number) => {
    setAutoBackupRetentionDays(days);
    updateAutoBackupConfig({
      variables: {
        input: {
          enabled: autoBackupEnabled,
          retentionDays: days,
        },
      },
    });
  };

  const handleTriggerAutoBackup = () => {
    triggerAutoBackup();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const backups: BackupMetadata[] = data?.listBackups || [];
  const selectedBackupData = backups.find((b) => b.filename === selectedBackup);

  const isProcessing = creating || restoring || deleting || uploadingFile || updatingConfig || triggeringBackup;

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" gutterBottom display="flex" alignItems="center">
                <Backup sx={{ mr: 1 }} />
                Backup & Restore
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create database snapshots and restore from previous backups
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Backup />}
                onClick={handleCreateBackup}
                disabled={isProcessing || loading}
              >
                Create Backup
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                component="label"
                startIcon={<Upload />}
                disabled={isProcessing || loading}
              >
                Restore from File
                <input
                  type="file"
                  hidden
                  accept=".sql"
                  onChange={handleFileSelect}
                />
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Status Message */}
          {statusMessage.type && (
            <Alert severity={statusMessage.type} onClose={() => setStatusMessage({ type: null, message: '' })}>
              {statusMessage.message}
            </Alert>
          )}

          {/* Loading State */}
          {(loading || isProcessing) && <LinearProgress />}

          {/* Error State */}
          {error && (
            <Alert severity="error">
              Error loading backups: {error.message}
            </Alert>
          )}

          {/* Auto-Backup Configuration */}
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule color="primary" />
                  <Typography variant="h6">Automated Backup</Typography>
                </Box>
                <Chip
                  label={autoBackupEnabled ? 'Enabled' : 'Disabled'}
                  color={autoBackupEnabled ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Automatically create backups daily at 1:00 AM. Backups are only created if changes are detected.
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoBackupEnabled}
                      onChange={handleToggleAutoBackup}
                      disabled={isProcessing}
                    />
                  }
                  label="Enable Auto-Backup"
                />

                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">Retention:</Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={autoBackupRetentionDays}
                    onChange={(e) => handleRetentionDaysChange(Number(e.target.value))}
                    disabled={isProcessing}
                    inputProps={{ min: 1, max: 90 }}
                    sx={{ width: '80px' }}
                  />
                  <Typography variant="body2">days</Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Backup />}
                  onClick={handleTriggerAutoBackup}
                  disabled={isProcessing}
                >
                  Test Now
                </Button>
              </Stack>

              {autoBackupData?.autoBackupConfig?.lastBackupTime && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Last auto-backup: {formatDate(autoBackupData.autoBackupConfig.lastBackupTime)}
                </Alert>
              )}
            </CardContent>
          </Card>

          <Divider />

          {/* Backup List */}
          {!loading && !error && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>
                  Available Backups
                </Typography>
                {backups.length === 0 ? (
                  <Alert severity="info">
                    No backups available. Create your first backup to get started.
                  </Alert>
                ) : (
                  <List>
                    {backups.map((backup) => (
                      <ListItem
                        key={backup.id}
                        disablePadding
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      >
                        <ListItemButton
                          selected={selectedBackup === backup.filename}
                          onClick={() => setSelectedBackup(backup.filename)}
                        >
                          <Storage sx={{ mr: 2, color: 'primary.main' }} />
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" noWrap>
                                {backup.filename}
                              </Typography>
                            }
                            secondary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Schedule fontSize="small" />
                                <Typography variant="caption">
                                  {formatDate(backup.timestamp)}
                                </Typography>
                                <Chip label={formatSize(backup.size)} size="small" />
                              </Stack>
                            }
                          />
                        </ListItemButton>
                        <ListItemSecondaryAction>
                          <Tooltip title="Download">
                            <IconButton
                              edge="end"
                              onClick={() => handleDownload(backup.filename)}
                              disabled={isProcessing}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>

              {/* Backup Details */}
              <Grid size={{ xs: 12, md: 6 }}>
                {selectedBackupData ? (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Backup Details
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Filename
                          </Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {selectedBackupData.filename}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Created
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(selectedBackupData.timestamp)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Size
                          </Typography>
                          <Typography variant="body2">
                            {formatSize(selectedBackupData.size)}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Record Counts
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" display="block">
                                Users: {selectedBackupData.recordCounts.users}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" display="block">
                                Products: {selectedBackupData.recordCounts.products}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" display="block">
                                Solutions: {selectedBackupData.recordCounts.solutions}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" display="block">
                                Customers: {selectedBackupData.recordCounts.customers}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" display="block">
                                Tasks: {selectedBackupData.recordCounts.tasks}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" display="block">
                                Adoption Plans: {selectedBackupData.recordCounts.adoptionPlans}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        <Divider />

                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Restore />}
                            onClick={() => handleRestoreConfirm(selectedBackupData.filename)}
                            disabled={isProcessing}
                            fullWidth
                          >
                            Restore
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteConfirm(selectedBackupData.filename)}
                            disabled={isProcessing}
                            fullWidth
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="info">
                    Select a backup to view details and perform actions
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </Stack>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !isProcessing && setConfirmDialog({ open: false, type: null, filename: null })}
      >
        <DialogTitle>
          {confirmDialog.type === 'restore' || confirmDialog.type === 'restoreFromFile' ? (
            <Box display="flex" alignItems="center">
              <Warning color="warning" sx={{ mr: 1 }} />
              {confirmDialog.type === 'restoreFromFile' ? 'Confirm Restore from File' : 'Confirm Restore'}
            </Box>
          ) : (
            <Box display="flex" alignItems="center">
              <ErrorIcon color="error" sx={{ mr: 1 }} />
              Confirm Delete
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.type === 'restore' || confirmDialog.type === 'restoreFromFile' ? (
              <>
                Are you sure you want to restore from this {confirmDialog.type === 'restoreFromFile' ? 'uploaded file' : 'backup'}?
                <br />
                <strong>This will replace all current data with the backup data.</strong>
                <br />
                <br />
                The application will reload after restoration completes.
              </>
            ) : (
              <>
                Are you sure you want to delete this backup?
                <br />
                <strong>This action cannot be undone.</strong>
              </>
            )}
          </DialogContentText>
          {confirmDialog.filename && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="caption" display="block">
                <strong>File:</strong> {confirmDialog.filename}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDialog({ open: false, type: null, filename: null });
              setSelectedFile(null);
            }}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.type === 'restore' || confirmDialog.type === 'restoreFromFile' ? 'primary' : 'error'}
            variant="contained"
            disabled={isProcessing}
            autoFocus
          >
            {confirmDialog.type === 'restore' || confirmDialog.type === 'restoreFromFile' ? 'Restore' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

