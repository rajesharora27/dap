import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    Card,
    CardContent,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tooltip,
    Tabs,
    Tab
} from '@mui/material';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Storage as DatabaseIcon,
    PlayArrow as RunIcon,
    Refresh as RefreshIcon,
    DeleteForever as ResetIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    History as HistoryIcon,
    CloudUpload as MigrateIcon,
    Science as SeedIcon,
    Code as CodeIcon
} from '@mui/icons-material';

interface MigrationInfo {
    name: string;
    status: 'applied' | 'pending';
    appliedAt?: string;
}

interface DatabaseStatus {
    connected: boolean;
    database: string;
    pendingMigrations: number;
    appliedMigrations: number;
    migrations: MigrationInfo[];
}

export const DatabaseManagementPanel: React.FC = () => {
    const [status, setStatus] = useState<DatabaseStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetConfirm, setResetConfirm] = useState('');
    const [backupDialogOpen, setBackupDialogOpen] = useState(false);
    const [customBackupName, setCustomBackupName] = useState('');
    const [tabValue, setTabValue] = useState(0);
    const [schema, setSchema] = useState<string>('');

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/database/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setStatus(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchema = async () => {
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/database/schema`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setSchema(data.schema);
        } catch (err: any) {
            console.error('Failed to fetch schema', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchSchema();
    }, []);

    const handleCreateBackup = async () => {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/database/backup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customName: customBackupName })
            });
            const result = await response.json();

            if (result.success) {
                setSuccess(result.message || 'Backup created successfully');
                fetchStatus(); // Refresh list potentially if we showed backups (we don't list them here yet but status has connection info)
            } else {
                setError(result.error || result.message || 'Backup failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
            setBackupDialogOpen(false);
            setCustomBackupName('');
        }
    };

    const handleAction = async (endpoint: string, successMessage: string) => {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/database/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();

            if (result.success) {
                setSuccess(successMessage);
                fetchStatus();
            } else {
                setError(result.output || 'Operation failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
            setResetDialogOpen(false);
            setResetConfirm('');
        }
    };

    if (loading && !status) return <CircularProgress />;

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Database Management Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Manage the application database, view migrations, and inspect the schema.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="Operations & Status" icon={<DatabaseIcon />} iconPosition="start" />
                    <Tab label="Schema Viewer" icon={<CodeIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <Grid container spacing={3}>
                    {/* Status Card */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DatabaseIcon color="primary" /> Database Status
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText primary="Connection" />
                                        <Chip
                                            label={status?.connected ? "Connected" : "Disconnected"}
                                            color={status?.connected ? "success" : "error"}
                                            size="small"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Database Name" />
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {status?.database}
                                        </Typography>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Applied Migrations" />
                                        <Chip label={status?.appliedMigrations} size="small" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="Pending Migrations" />
                                        <Chip
                                            label={status?.pendingMigrations}
                                            color={status?.pendingMigrations ? "warning" : "default"}
                                            size="small"
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Actions Card */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RunIcon color="primary" /> Actions
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6 }}>
                                        <Tooltip title="Run pending migrations (prisma migrate deploy)">
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                startIcon={<MigrateIcon />}
                                                onClick={() => handleAction('migrate', 'Migrations applied successfully')}
                                                disabled={actionLoading || !status?.pendingMigrations}
                                            >
                                                Migrate
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Tooltip title="Create a new database backup">
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                fullWidth
                                                startIcon={<DatabaseIcon />}
                                                onClick={() => setBackupDialogOpen(true)}
                                                disabled={actionLoading}
                                            >
                                                Backup
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Tooltip title="Seed database with development data">
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<SeedIcon />}
                                                onClick={() => handleAction('seed', 'Database seeded successfully')}
                                                disabled={actionLoading}
                                            >
                                                Seed Data
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Tooltip title="Generate Prisma Client">
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<RefreshIcon />}
                                                onClick={() => handleAction('generate', 'Prisma client generated')}
                                                disabled={actionLoading}
                                            >
                                                Generate
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Tooltip title="Reset database (DESTRUCTIVE)">
                                            <Button
                                                variant="contained"
                                                color="error"
                                                fullWidth
                                                startIcon={<ResetIcon />}
                                                onClick={() => setResetDialogOpen(true)}
                                                disabled={actionLoading}
                                            >
                                                Reset DB
                                            </Button>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Migrations List */}
                    <Grid size={{ xs: 12 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HistoryIcon /> Migration History
                            </Typography>
                            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {status?.migrations?.map((migration) => (
                                    <ListItem key={migration.name} divider>
                                        <ListItemIcon>
                                            <SuccessIcon color="success" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={migration.name}
                                            secondary={migration.appliedAt ? new Date(migration.appliedAt).toLocaleString() : 'Pending'}
                                            primaryTypographyProps={{ fontFamily: 'monospace' }}
                                        />
                                    </ListItem>
                                ))}
                                {status?.migrations?.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                        No migrations found.
                                    </Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {tabValue === 1 && (
                <Paper elevation={3} sx={{ p: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>prisma/schema.prisma</Typography>
                        <Button size="small" startIcon={<RefreshIcon />} onClick={fetchSchema}>Refresh</Button>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflow: 'auto', maxHeight: '600px' }}>
                        <pre style={{ margin: 0, fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace', fontSize: '14px' }}>
                            {schema || 'Loading schema...'}
                        </pre>
                    </Box>
                </Paper>
            )}

            {/* Reset Confirmation Dialog */}
            <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
                <DialogTitle>⚠️ Reset Database?</DialogTitle>
                <DialogContent>
                    <Typography color="error" paragraph>
                        This will delete ALL data in the database. This action cannot be undone.
                    </Typography>
                    <Typography variant="body2" paragraph>
                        To confirm, type <strong>reset</strong> below:
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        placeholder="Type 'reset' to confirm"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => handleAction('reset', 'Database reset successfully')}
                        color="error"
                        variant="contained"
                        disabled={resetConfirm !== 'reset' || actionLoading}
                    >
                        {actionLoading ? 'Resetting...' : 'Confirm Reset'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Backup Dialog */}
            <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
                <DialogTitle>Create Backup</DialogTitle>
                <DialogContent>
                    <Typography paragraph>
                        Create a snapshot of the current database.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Custom Name (Optional)"
                        fullWidth
                        variant="outlined"
                        value={customBackupName}
                        onChange={(e) => setCustomBackupName(e.target.value)}
                        helperText="Will be appended to the filename (e.g. dap_backup_NAME_timestamp.sql)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateBackup}
                        variant="contained"
                        disabled={actionLoading}
                    >
                        {actionLoading ? 'Creating...' : 'Create Backup'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
