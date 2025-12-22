
import { getDevApiBaseUrl } from '../../config/frontend.config';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Chip,
    LinearProgress,
    Card,
    CardContent,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Speed as SpeedIcon,
    GitHub as GitHubIcon,
    PlaylistPlay as TaskIcon,
    Memory as MemoryIcon,
    Commit as CommitIcon,
    PlayArrow as RunIcon,
    Info as InfoIcon,
    Refresh as RefreshIcon
} from '@shared/components/FAIcon';

// --- Performance Panel ---
export const PerformancePanel: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${getDevApiBaseUrl()}/api/dev/performance/stats`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                setStats(await res.json());
                setError(null);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    if (error) return <Alert severity="error">Failed to load performance stats: {error}</Alert>;
    if (!stats) return <LinearProgress />;

    const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            System Performance Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Monitor real-time system metrics including memory usage, CPU, and uptime.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Metrics Displayed:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Memory Usage:</strong> RSS, Heap Total, Heap Used in MB</li>
                                <li><strong>System Info:</strong> Node version, platform, uptime</li>
                                <li><strong>Auto-Refresh:</strong> Updates every 2 seconds</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> Backend server must be running
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Metrics update automatically. Monitor for memory leaks or performance issues.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon /> System Performance
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom><MemoryIcon /> Memory Usage</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="RSS" secondary={formatBytes(stats.memory.rss)} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Heap Total" secondary={formatBytes(stats.memory.heapTotal)} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Heap Used" secondary={formatBytes(stats.memory.heapUsed)} />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>System</Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Uptime" secondary={`${Math.floor(stats.uptime / 60)} minutes`} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="CPU User" secondary={`${(stats.cpu.user / 1000000).toFixed(2)} s`} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="CPU System" secondary={`${(stats.cpu.system / 1000000).toFixed(2)} s`} />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// --- Git Integration Panel ---
export const GitIntegrationPanel: React.FC = () => {
    const [gitInfo, setGitInfo] = useState<any>(null);
    const [commitDialogOpen, setCommitDialogOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [error, setError] = useState<string | null>(null);

    const fetchGit = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/git/status`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setGitInfo(await res.json());
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchGit();
    }, []);

    const handleCommit = async () => {
        if (!commitMessage.trim()) {
            setSnackbar({ open: true, message: 'Commit message is required', severity: 'error' });
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
                setSnackbar({ open: true, message: 'Changes committed successfully!', severity: 'success' });
                setCommitDialogOpen(false);
                setCommitMessage('');
                fetchGit(); // Refresh status
            } else {
                setSnackbar({ open: true, message: result.message || 'Commit failed', severity: 'error' });
            }
        } catch (error: any) {
            setSnackbar({ open: true, message: 'Commit failed: ' + error.message, severity: 'error' });
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
                setSnackbar({ open: true, message: result.message || 'Pushed to origin successfully!', severity: 'success' });
                fetchGit(); // Refresh status
            } else {
                setSnackbar({ open: true, message: result.error || 'Push failed', severity: 'error' });
            }
        } catch (error: any) {
            setSnackbar({ open: true, message: 'Push failed: ' + error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (error) return <Alert severity="error">Failed to load git status: {error}</Alert>;
    if (!gitInfo) return <LinearProgress />;

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Git Repository Status Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            View current Git branch, commits, and repository status. Commit and push changes directly from the UI.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Available Actions:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Refresh Status:</strong> Update repository information</li>
                                <li><strong>Commit Changes:</strong> Stage and commit all modified files</li>
                                <li><strong>Push to Origin:</strong> Push commits to remote repository</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> Git repository initialized, changes to commit, SSH key configured for push
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHubIcon /> Git Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh Git status from repository" arrow>
                        <Button variant="outlined" size="small" onClick={fetchGit} disabled={loading}>
                            <RefreshIcon fontSize="small" sx={{ mr: 0.5 }} /> Refresh
                        </Button>
                    </Tooltip>
                    <Tooltip title="Commit all changes with a message (git add -A && git commit)" arrow>
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => setCommitDialogOpen(true)}
                                disabled={loading || gitInfo.changes === 0}
                                color="primary"
                            >
                                <CommitIcon fontSize="small" sx={{ mr: 0.5 }} /> Commit
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip title="Push commits to remote origin (git push origin)" arrow>
                        <span>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handlePush}
                                disabled={loading}
                                color="success"
                            >
                                Push
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
            </Box>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Current Branch</Typography>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CommitIcon fontSize="small" /> {gitInfo.branch}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Latest Commit</Typography>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{gitInfo.commit}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary">Last Commit Message</Typography>
                        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>"{gitInfo.lastMessage}"</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mt: 2 }}>
                            <Chip
                                label={`${gitInfo.changes} changed files`}
                                color={gitInfo.changes > 0 ? "warning" : "success"}
                                variant="outlined"
                            />
                        </Box>
                        {gitInfo.statusOutput && (
                            <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
                                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                                    {gitInfo.statusOutput}
                                </Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Commit Dialog */}
            <Dialog open={commitDialogOpen} onClose={() => setCommitDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Commit Changes</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        This will stage all changes (git add -A) and commit them with your message.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Commit Message"
                        multiline
                        rows={3}
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="e.g., Fixed bug in user authentication"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommitDialogOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCommit}
                        variant="contained"
                        disabled={loading || !commitMessage.trim()}
                    >
                        {loading ? 'Committing...' : 'Commit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// --- Task Runner Panel ---
export const TaskRunnerPanel: React.FC = () => {
    const [scripts, setScripts] = useState<Record<string, string>>({});
    const [running, setRunning] = useState<string | null>(null);
    const [output, setOutput] = useState<string>('');

    useEffect(() => {
        const fetchScripts = async () => {
            try {
                const res = await fetch(`${getDevApiBaseUrl()}/api/dev/tasks/scripts`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                setScripts(data.scripts);
            } catch (err) {
                console.error(err);
            }
        };
        fetchScripts();
    }, []);

    const runScript = async (script: string) => {
        setRunning(script);
        setOutput(`Running ${script}...\n`);
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/tasks/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ script })
            });
            const result = await res.json();
            setOutput(prev => prev + (result.output || result.error));
        } catch (err: any) {
            setOutput(prev => prev + `Error: ${err.message} `);
        } finally {
            setRunning(null);
        }
    };

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Task Runner Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Execute npm scripts defined in package.json directly from the browser interface.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Features:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>List Scripts:</strong> All npm scripts from package.json</li>
                                <li><strong>One-Click Execution:</strong> Run any script with a button</li>
                                <li><strong>Real-Time Output:</strong> View command output as it runs</li>
                                <li><strong>Command Display:</strong> See the actual command being executed</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> package.json with scripts section, npm installed
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Select script from list, click Run, monitor output in right panel.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TaskIcon /> Task Runner
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={3} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                        <List>
                            {Object.entries(scripts).map(([name, cmd]) => (
                                <React.Fragment key={name}>
                                    <ListItem>
                                        <ListItemText
                                            primary={name}
                                            secondary={cmd}
                                            secondaryTypographyProps={{
                                                sx: { fontFamily: 'monospace', fontSize: '0.75rem' }
                                            }}
                                        />
                                        <Tooltip title={`Execute '${name}' script: ${cmd} `} arrow>
                                            <span>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<RunIcon />}
                                                    onClick={() => runScript(name)}
                                                    disabled={!!running}
                                                >
                                                    Run
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={3} sx={{ p: 2, height: '60vh', bgcolor: '#1e1e1e', color: '#fff', overflow: 'auto' }}>
                        <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {output || 'Select a script to run...'}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
