import React, { useState } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
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
    CardActions,
    Tooltip
} from '@mui/material';
import {
    PlayArrow as RunIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Code as CodeIcon,
    BugReport as BugIcon,
    Info as InfoIcon
} from '@mui/icons-material';

interface TestResult {
    name: string;
    status: 'running' | 'success' | 'failed' | 'pending';
    output?: string;
    duration?: number;
}

export const DevelopmentTestsPanel: React.FC = () => {
    const [tests, setTests] = useState<TestResult[]>([
        { name: 'Unit Tests', status: 'pending' },
        { name: 'Integration Tests', status: 'pending' },
        { name: 'Coverage Report', status: 'pending' },
        { name: 'Linting', status: 'pending' }
    ]);
    const [running, setRunning] = useState(false);

    const runTest = async (testName: string, command: string) => {
        setTests(prev => prev.map(t =>
            t.name === testName ? { ...t, status: 'running' as const } : t
        ));

        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/run-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ command })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            setTests(prev => prev.map(t =>
                t.name === testName ? {
                    ...t,
                    status: result.success ? 'success' as const : 'failed' as const,
                    output: result.output,
                    duration: result.duration
                } : t
            ));
        } catch (error: any) {
            setTests(prev => prev.map(t =>
                t.name === testName ? {
                    ...t,
                    status: 'failed' as const,
                    output: `Failed to execute test: ${error.message}`
                } : t
            ));
        }
    };
    const runAllTests = async () => {
        setRunning(true);
        for (const test of tests) {
            const commands: Record<string, string> = {
                'Unit Tests': 'npm test',
                'Integration Tests': 'npm test', // No separate integration tests script
                'Coverage Report': 'npm run test:coverage',
                'Linting': 'npm run lint'
            };
            await runTest(test.name, commands[test.name] || 'npm test');
        }
        setRunning(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <SuccessIcon color="success" />;
            case 'failed':
                return <ErrorIcon color="error" />;
            case 'running':
                return <CircularProgress size={24} />;
            default:
                return <CodeIcon />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'success';
            case 'failed':
                return 'error';
            case 'running':
                return 'info';
            default:
                return 'default';
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
                            Test Suite Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            This panel allows you to run automated tests against your backend code to ensure quality and catch bugs early.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Available Tests:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Unit Tests:</strong> Test individual functions and components in isolation</li>
                                <li><strong>Coverage Report:</strong> Generate detailed code coverage metrics</li>
                                <li><strong>Linting:</strong> Check code quality and style consistency</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> Tests run in the backend environment using Jest. Results appear below each test.
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Click individual "Run" buttons or use "Run All Tests" to execute the entire suite.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BugIcon /> Test Suite
                </Typography>
                <Tooltip title="Execute all available tests sequentially" arrow>
                    <span>
                        <Button
                            variant="contained"
                            startIcon={<RunIcon />}
                            onClick={runAllTests}
                            disabled={running}
                        >
                            Run All Tests
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Development Mode Only:</strong> These tests run directly on the backend server.
                    In production, tests should only run via CI/CD pipelines.
                </Typography>
            </Alert>

            <Paper elevation={3}>
                <List>
                    {tests.map((test, index) => (
                        <React.Fragment key={test.name}>
                            {index > 0 && <Divider />}
                            <ListItem>
                                <ListItemIcon>
                                    {getStatusIcon(test.status)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={test.name}
                                    secondary={
                                        test.duration ? `Completed in ${test.duration}ms` :
                                            test.status === 'running' ? 'Running...' : 'Ready'
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Chip
                                        label={test.status}
                                        color={getStatusColor(test.status) as any}
                                        size="small"
                                    />
                                    <Tooltip title={`Execute ${test.name.toLowerCase()} and display results`} arrow>
                                        <span>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<RunIcon />}
                                                onClick={() => {
                                                    const commands: Record<string, string> = {
                                                        'Unit Tests': 'npm test',
                                                        'Integration Tests': 'npm test',
                                                        'Coverage Report': 'npm run test:coverage',
                                                        'Linting': 'npm run lint'
                                                    };
                                                    runTest(test.name, commands[test.name] || 'npm test');
                                                }}
                                                disabled={test.status === 'running'}
                                            >
                                                Run
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </ListItem>
                            {test.output && (
                                <Box sx={{ px: 2, pb: 2 }}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                        <Typography variant="caption" component="pre" sx={{
                                            whiteSpace: 'pre-wrap',
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem'
                                        }}>
                                            {test.output}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            <Box sx={{ mt: 3 }}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Quick Commands
                        </Typography>
                        <List dense>
                            <ListItem>
                                <ListItemText
                                    primary="npm test"
                                    secondary="Run all unit tests"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="npm run test:watch"
                                    secondary="Run tests in watch mode"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="npm run test:coverage"
                                    secondary="Generate coverage report"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="npm run lint"
                                    secondary="Check code quality"
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};
