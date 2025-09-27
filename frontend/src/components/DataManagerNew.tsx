import React from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack
} from '@mui/material';
import { DataObject, DeleteForever, RestartAlt } from '@mui/icons-material';
import { useMutation, gql } from '@apollo/client';

const DELETE_ALL_DATA = gql`
  mutation DeleteAllData {
    deleteAllData {
      success
      message
      itemsDeleted
    }
  }
`;

const CREATE_SAMPLE_DATA = gql`
  mutation CreateSampleData {
    createSampleData {
      success
      message
      productsCreated
    }
  }
`;

const RESET_SAMPLE_DATA = gql`
  mutation ResetSampleData {
    resetSampleData {
      success
      message
      productsAffected
    }
  }
`;

export const DataManagerNew: React.FC = () => {
    const [confirmDialog, setConfirmDialog] = React.useState<{
        open: boolean;
        title: string;
        message: string;
        action: () => Promise<void>;
    }>({
        open: false,
        title: '',
        message: '',
        action: async () => { }
    });

    const [status, setStatus] = React.useState<{
        message: string;
        type: 'success' | 'error' | 'info';
        timestamp: string;
    } | null>(null);

    const [loading, setLoading] = React.useState<{
        create: boolean;
        reset: boolean;
        delete: boolean;
    }>({
        create: false,
        reset: false,
        delete: false
    });

    const [createSampleData] = useMutation(CREATE_SAMPLE_DATA);
    const [resetSampleData] = useMutation(RESET_SAMPLE_DATA);
    const [deleteAllData] = useMutation(DELETE_ALL_DATA);

    const handleCreateSampleData = async () => {
        setLoading(prev => ({ ...prev, create: true }));
        try {
            const result = await createSampleData();
            setStatus({
                message: `Created ${result.data.createSampleData.productsCreated} sample products successfully`,
                type: 'success',
                timestamp: new Date().toLocaleTimeString()
            });
        } catch (error: any) {
            setStatus({
                message: `Failed to create sample data: ${error.message}`,
                type: 'error',
                timestamp: new Date().toLocaleTimeString()
            });
        } finally {
            setLoading(prev => ({ ...prev, create: false }));
        }
    };

    const handleResetSampleData = async () => {
        setConfirmDialog({
            open: true,
            title: 'Reset Sample Data',
            message: 'This will delete and recreate all sample products. Any changes made to them will be lost. Are you sure?',
            action: async () => {
                setLoading(prev => ({ ...prev, reset: true }));
                try {
                    const result = await resetSampleData();
                    setStatus({
                        message: `Reset ${result.data.resetSampleData.productsAffected} sample products successfully`,
                        type: 'success',
                        timestamp: new Date().toLocaleTimeString()
                    });
                } catch (error: any) {
                    setStatus({
                        message: `Failed to reset sample data: ${error.message}`,
                        type: 'error',
                        timestamp: new Date().toLocaleTimeString()
                    });
                } finally {
                    setLoading(prev => ({ ...prev, reset: false }));
                }
            }
        });
    };

    const handleDeleteAllData = async () => {
        setConfirmDialog({
            open: true,
            title: '⚠️ Delete All Data',
            message: 'WARNING: This will permanently delete ALL data from the database. This action cannot be undone. Are you absolutely sure?',
            action: async () => {
                setLoading(prev => ({ ...prev, delete: true }));
                try {
                    const result = await deleteAllData();
                    setStatus({
                        message: `Deleted ${result.data.deleteAllData.itemsDeleted} items from the database`,
                        type: 'success',
                        timestamp: new Date().toLocaleTimeString()
                    });
                } catch (error: any) {
                    setStatus({
                        message: `Failed to delete data: ${error.message}`,
                        type: 'error',
                        timestamp: new Date().toLocaleTimeString()
                    });
                } finally {
                    setLoading(prev => ({ ...prev, delete: false }));
                }
            }
        });
    };

    const handleConfirmAction = async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        await confirmDialog.action();
    };

    return (
        <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 3 }}>
            <Card>
                <CardHeader
                    title="Data Management Center"
                    subheader="Manage sample and test data"
                />
                <CardContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        This section allows you to manage sample data for manual testing.
                        Use these tools carefully as they affect the database.
                    </Alert>

                    <Stack spacing={3}>
                        {/* Create Sample Data */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Create Sample Data
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Creates five sample products with predefined attributes for manual testing.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={loading.create ? <CircularProgress size={20} /> : <DataObject />}
                                onClick={handleCreateSampleData}
                                disabled={loading.create}
                                fullWidth
                            >
                                Create Sample Data (5 Products)
                            </Button>
                        </Paper>

                        {/* Reset Sample Data */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Reset Sample Data
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Deletes and recreates all sample products, reverting them to their original state.
                            </Typography>
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={loading.reset ? <CircularProgress size={20} /> : <RestartAlt />}
                                onClick={handleResetSampleData}
                                disabled={loading.reset}
                                fullWidth
                            >
                                Reset Sample Data
                            </Button>
                        </Paper>

                        {/* Delete All Data */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Delete All Data
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                ⚠️ WARNING: This will permanently delete all data from the database.
                            </Typography>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={loading.delete ? <CircularProgress size={20} /> : <DeleteForever />}
                                onClick={handleDeleteAllData}
                                disabled={loading.delete}
                                fullWidth
                            >
                                Delete All Data
                            </Button>
                        </Paper>
                    </Stack>

                    {/* Status Messages */}
                    {status && (
                        <Box sx={{ mt: 3 }}>
                            <Alert
                                severity={status.type}
                                onClose={() => setStatus(null)}
                            >
                                <Typography variant="body2">
                                    {status.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {status.timestamp}
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            >
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmAction}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};