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
    Link,
    Grid,
    Tooltip
} from '@mui/material';
import {
    PlayArrow as RunIcon,
    GitHub as GitHubIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Refresh as RefreshIcon,
    OpenInNew as OpenIcon,
    Info as InfoIcon
} from '@shared/components/FAIcon';

interface WorkflowRun {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    createdAt: string;
    htmlUrl: string;
}

export const DevelopmentCICDPanel: React.FC = () => {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
    const [loading, setLoading] = useState(false);

    const availableWorkflows = [
        { name: 'CI - Test & Build', file: 'ci.yml', description: 'Run all tests and build checks' },
        { name: 'CodeQL Security Scan', file: 'codeql.yml', description: 'Security vulnerability scanning' },
        { name: 'Dependency Review', file: 'dependency-review.yml', description: 'Check for vulnerable dependencies' },
        { name: 'Deploy to Production', file: 'deploy.yml', description: 'Deploy to production server' }
    ];

    const loadRecentRuns = async () => {
        setLoading(true);
        try {
            // In a real implementation, this would call GitHub API
            // For now, show static data
            setRecentRuns([
                {
                    id: 1,
                    name: 'CI - Test & Build',
                    status: 'completed',
                    conclusion: 'success',
                    createdAt: new Date().toISOString(),
                    htmlUrl: 'https://github.com/your-repo/actions/runs/1'
                }
            ]);
        } catch (error) {
            console.error('Failed to load workflow runs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecentRuns();
    }, []);

    const getStatusIcon = (status: string, conclusion: string | null) => {
        if (status === 'in_progress' || status === 'queued') {
            return <CircularProgress size={20} />;
        }
        if (conclusion === 'success') {
            return <SuccessIcon color="success" />;
        }
        if (conclusion === 'failure') {
            return <ErrorIcon color="error" />;
        }
        return <PendingIcon />;
    };

    const getStatusColor = (conclusion: string | null) => {
        switch (conclusion) {
            case 'success':
                return 'success';
            case 'failure':
                return 'error';
            default:
                return 'default';
        }
    };

    const triggerWorkflow = (workflowFile: string) => {
        alert(`To trigger "${workflowFile}", use:\n\ngh workflow run ${workflowFile}\n\nor go to GitHub Actions tab and click "Run workflow"`);
    };

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            CI/CD Workflows Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            View and manage GitHub Actions workflows. Monitor automated builds, tests, and deployments.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Features:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>View Workflows:</strong> List all available GitHub Actions workflows</li>
                                <li><strong>Track Status:</strong> Monitor recent workflow runs and their status</li>
                                <li><strong>Trigger Workflows:</strong> Get instructions to manually trigger workflows</li>
                                <li><strong>View Results:</strong> See success/failure status of recent runs</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> GitHub repository with Actions configured, GitHub CLI (gh) or web access
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> View available workflows, check recent runs, use GitHub CLI commands to trigger manually.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHubIcon /> CI/CD Workflows
                </Typography>
                <Tooltip title="Reload recent workflow run status from GitHub" arrow>
                    <span>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={loadRecentRuns}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>GitHub Actions:</strong> Workflows are triggered automatically on push/PR or manually via GitHub.
                    Use the GitHub CLI or web interface to trigger workflows.
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Available Workflows
                        </Typography>
                        <List>
                            {availableWorkflows.map((workflow, index) => (
                                <React.Fragment key={workflow.file}>
                                    {index > 0 && <Divider sx={{ my: 1 }} />}
                                    <ListItem>
                                        <ListItemText
                                            primary={workflow.name}
                                            secondary={workflow.description}
                                        />
                                        <Tooltip title="Show instructions to manually trigger this GitHub Actions workflow" arrow>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<RunIcon />}
                                                onClick={() => triggerWorkflow(workflow.file)}
                                            >
                                                Trigger
                                            </Button>
                                        </Tooltip>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Workflow Runs
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : recentRuns.length === 0 ? (
                            <Alert severity="info">
                                No recent workflow runs. Check GitHub Actions for history.
                            </Alert>
                        ) : (
                            <List>
                                {recentRuns.map((run) => (
                                    <ListItem key={run.id}>
                                        <ListItemIcon>
                                            {getStatusIcon(run.status, run.conclusion)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={run.name}
                                            secondary={new Date(run.createdAt).toLocaleString()}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Chip
                                                label={run.conclusion || run.status}
                                                color={getStatusColor(run.conclusion) as any}
                                                size="small"
                                            />
                                            <Link href={run.htmlUrl} target="_blank" rel="noopener">
                                                <OpenIcon fontSize="small" />
                                            </Link>
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Quick Commands (GitHub CLI)
                        </Typography>
                        <List dense>
                            <ListItem>
                                <ListItemText
                                    primary="gh workflow list"
                                    secondary="List all workflows"
                                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="gh workflow run ci.yml"
                                    secondary="Trigger CI workflow"
                                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="gh run list"
                                    secondary="List recent workflow runs"
                                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="gh run view [run-id]"
                                    secondary="View detailed run information"
                                    primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>

            <Box sx={{ mt: 3 }}>
                <Alert severity="warning">
                    <Typography variant="body2">
                        <strong>Note:</strong> To trigger workflows programmatically, you need:
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>GitHub Personal Access Token with workflow permissions</li>
                            <li>GitHub CLI installed (<code>gh</code> command)</li>
                            <li>Or use the GitHub web interface under Actions tab</li>
                        </ul>
                    </Typography>
                </Alert>
            </Box>
        </Box>
    );
};
