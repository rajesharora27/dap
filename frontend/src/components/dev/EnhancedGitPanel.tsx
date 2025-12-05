import React, { useState, useEffect } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Chip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    Divider,
    IconButton,
    Tooltip,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import {
    CloudUpload,
    CloudDownload,
    Refresh,
    CreateNewFolder,
    Save,
    History,
    Check,
    Close,
    Code,
    CallSplit
} from '@mui/icons-material';

interface GitStatus {
    branch: string;
    commit: string;
    lastMessage: string;
    changes: number;
    statusOutput: string;
}

interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
    refs: string;
}

export const EnhancedGitPanel: React.FC = () => {
    const [status, setStatus] = useState<GitStatus | null>(null);
    const [commits, setCommits] = useState<GitCommit[]>([]);
    const [branches, setBranches] = useState<{ current: string; local: string[]; remote: string[] } | null>(null);
    const [stashes, setStashes] = useState<string[]>([]);

    const [commitDialogOpen, setCommitDialogOpen] = useState(false);
    const [branchDialogOpen, setBranchDialogOpen] = useState(false);
    const [stashDialogOpen, setStashDialogOpen] = useState(false);

    const [commitMessage, setCommitMessage] = useState('');
    const [branchName, setBranchName] = useState('');
    const [branchAction, setBranchAction] = useState<'create' | 'switch' | 'delete'>('create');
    const [stashMessage, setStashMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

    const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error('Failed to fetch git status:', err);
        }
    };

    const fetchCommits = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/log?limit=10`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setCommits(data.commits || []);
        } catch (err) {
            console.error('Failed to fetch commits:', err);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/branches`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setBranches(data);
        } catch (err) {
            console.error('Failed to fetch branches:', err);
        }
    };

    const fetchStashes = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/stash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action: 'list' })
            });
            const data = await res.json();
            setStashes(data.stashes || []);
        } catch (err) {
            console.error('Failed to fetch stashes:', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchCommits();
        fetchBranches();
        fetchStashes();
        const interval = setInterval(fetchStatus, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const handleCommit = async () => {
        if (!commitMessage.trim()) {
            showSnackbar('Commit message is required', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/commit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message: commitMessage })
            });

            const result = await res.json();
            if (result.success) {
                showSnackbar('Changes committed successfully!');
                setCommitDialogOpen(false);
                setCommitMessage('');
                fetchStatus();
                fetchCommits();
            } else {
                showSnackbar(result.message || 'Commit failed', 'error');
            }
        } catch (error: any) {
            showSnackbar(`Commit failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePush = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await res.json();
            if (result.success) {
                showSnackbar(result.message || 'Pushed successfully!');
                fetchStatus();
            } else {
                showSnackbar(result.error || 'Push failed', 'error');
            }
        } catch (error: any) {
            showSnackbar(`Push failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePull = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/pull`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await res.json();
            if (result.success) {
                showSnackbar(result.message || 'Pulled successfully!');
                fetchStatus();
                fetchCommits();
            } else {
                showSnackbar(result.error || 'Pull failed', 'error');
            }
        } catch (error: any) {
            showSnackbar(`Pull failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBranch = async () => {
        if (!branchName.trim()) {
            showSnackbar('Branch name is required', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/branch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action: branchAction, name: branchName })
            });

            const result = await res.json();
            if (result.success) {
                showSnackbar(result.message);
                setBranchDialogOpen(false);
                setBranchName('');
                fetchStatus();
                fetchBranches();
            } else {
                showSnackbar(result.error || 'Branch operation failed', 'error');
            }
        } catch (error: any) {
            showSnackbar(`Branch operation failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStash = async (action: 'save' | 'pop' | 'apply' | 'drop', index?: number) => {
        setLoading(true);
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/stash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    action,
                    message: action === 'save' ? stashMessage : undefined,
                    index
                })
            });

            const result = await res.json();
            if (result.success) {
                showSnackbar(result.message);
                setStashDialogOpen(false);
                setStashMessage('');
                fetchStatus();
                fetchStashes();
            } else {
                showSnackbar(result.error || 'Stash operation failed', 'error');
            }
        } catch (error: any) {
            showSnackbar(`Stash operation failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!status) return <Box sx={{ p: 3 }}><Typography>Loading git status...</Typography></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5">Git Repository</Typography>
                    <IconButton onClick={fetchStatus} size="small">
                        <Refresh />
                    </IconButton>
                </Stack>

                {/* Current Status */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip label={`Branch: ${status.branch}`} color="primary" />
                        <Chip label={`Commit: ${status.commit}`} variant="outlined" />
                        <Chip
                            label={`${status.changes} changes`}
                            color={status.changes > 0 ? 'warning' : 'success'}
                        />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        Last commit: "{status.lastMessage}"
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Quick Actions */}
                <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
                    <Tooltip title="Commit and push all changes to remote">
                        <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={handlePush}
                            disabled={loading}
                        >
                            Push
                        </Button>
                    </Tooltip>
                    <Tooltip title="Pull latest changes from remote">
                        <Button
                            variant="outlined"
                            startIcon={<CloudDownload />}
                            onClick={handlePull}
                            disabled={loading}
                        >
                            Pull
                        </Button>
                    </Tooltip>
                    <Tooltip title="Commit changes with message">
                        <span>
                            <Button
                                variant="outlined"
                                startIcon={<Check />}
                                onClick={() => setCommitDialogOpen(true)}
                                disabled={loading || status.changes === 0}
                            >
                                Commit
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Manage branches">
                        <Button
                            variant="outlined"
                            startIcon={<CallSplit />}
                            onClick={() => setBranchDialogOpen(true)}
                        >
                            Branches
                        </Button>
                    </Tooltip>
                    <Tooltip title="Stash/unstash changes">
                        <Button
                            variant="outlined"
                            startIcon={<Save />}
                            onClick={() => setStashDialogOpen(true)}
                        >
                            Stash
                        </Button>
                    </Tooltip>
                </Stack>

                {/* Tabs for Details */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                        <Tab label="Changes" />
                        <Tab label="Commits" />
                        <Tab label="Branches" />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                {tabValue === 0 && (
                    <Box sx={{ mt: 2 }}>
                        {status.statusOutput ? (
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                                    {status.statusOutput}
                                </Typography>
                            </Paper>
                        ) : (
                            <Alert severity="success">No changes to commit</Alert>
                        )}
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <List>
                            {commits.map((commit) => (
                                <ListItem key={commit.hash} divider>
                                    <ListItemText
                                        primary={commit.message}
                                        secondary={
                                            <>
                                                <Typography component="span" variant="caption" display="block">
                                                    {commit.author} • {new Date(commit.date).toLocaleString()}
                                                </Typography>
                                                <Typography component="span" variant="caption" fontFamily="monospace">
                                                    {commit.shortHash}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {tabValue === 2 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Local Branches</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                            {branches?.local.map((branch) => (
                                <Chip
                                    key={branch}
                                    label={branch}
                                    color={branch === branches.current ? 'primary' : 'default'}
                                    onDelete={branch !== branches.current ? () => {
                                        setBranchAction('delete');
                                        setBranchName(branch);
                                        handleBranch();
                                    } : undefined}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Commit Dialog */}
            <Dialog open={commitDialogOpen} onClose={() => setCommitDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Commit Changes</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Commit Message"
                        multiline
                        rows={3}
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommitDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCommit} variant="contained" disabled={loading || !commitMessage.trim()}>
                        Commit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Branch Dialog */}
            <Dialog open={branchDialogOpen} onClose={() => setBranchDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Branch Management</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                        <InputLabel>Action</InputLabel>
                        <Select
                            value={branchAction}
                            label="Action"
                            onChange={(e) => {
                                setBranchAction(e.target.value as any);
                                setBranchName('');
                            }}
                        >
                            <MenuItem value="create">Create New Branch</MenuItem>
                            <MenuItem value="switch">Switch Branch</MenuItem>
                            <MenuItem value="delete">Delete Branch</MenuItem>
                        </Select>
                    </FormControl>

                    {branchAction === 'create' ? (
                        <TextField
                            fullWidth
                            label="New Branch Name"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="e.g., feature/my-new-feature"
                        />
                    ) : (
                        <FormControl fullWidth>
                            <InputLabel>Select Branch</InputLabel>
                            <Select
                                value={branchName}
                                label="Select Branch"
                                onChange={(e) => setBranchName(e.target.value)}
                            >
                                {branches?.local
                                    .filter(b => branchAction === 'delete' ? b !== branches.current : b !== branches.current)
                                    .map((branch) => (
                                        <MenuItem key={branch} value={branch}>
                                            {branch} {branch === branches?.current && '(current)'}
                                        </MenuItem>
                                    ))
                                }
                                {branchAction === 'switch' && branches?.remote
                                    .filter(r => !branches.local.includes(r.replace('origin/', '')))
                                    .map((branch) => (
                                        <MenuItem key={branch} value={branch}>
                                            {branch} (remote)
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    )}

                    {/* Show current branch info */}
                    {branches && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Current branch: <strong>{branches.current}</strong>
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleBranch} variant="contained" disabled={loading || !branchName.trim()}>
                        {branchAction === 'create' ? 'Create' : branchAction === 'switch' ? 'Switch' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Stash Dialog */}
            <Dialog open={stashDialogOpen} onClose={() => setStashDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Stash Management</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Stash Message (optional)"
                            value={stashMessage}
                            onChange={(e) => setStashMessage(e.target.value)}
                        />
                        <Button variant="contained" onClick={() => handleStash('save')}>
                            Save Stash
                        </Button>
                        <Divider />
                        <Typography variant="subtitle2">Existing Stashes ({stashes.length})</Typography>
                        <List dense>
                            {stashes.map((stash, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={stash} />
                                    <Button size="small" onClick={() => handleStash('pop', index)}>Pop</Button>
                                    <Button size="small" onClick={() => handleStash('apply', index)}>Apply</Button>
                                </ListItem>
                            ))}
                        </List>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStashDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
