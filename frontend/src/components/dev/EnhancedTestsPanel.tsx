import React, { useState, useEffect, useRef } from 'react';
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
    CircularProgress,
    Stack,
    FormControl,
    FormLabel,
    FormGroup,
    FormControlLabel,
    Checkbox,
    LinearProgress,
    Alert,
    Divider,
    Tooltip
} from '@mui/material';
import {
    PlayArrow,
    CheckCircle,
    Error as ErrorIcon,
    Code,
    Science
} from '@mui/icons-material';

interface TestSuite {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e';
    path: string;
    relativePath: string;
}

interface TestResults {
    success: boolean;
    output: string;
    duration: number;
}

interface CoverageMetrics {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}

export const EnhancedTestsPanel: React.FC = () => {
    const [suites, setSuites] = useState<TestSuite[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['unit', 'integration', 'e2e']);
    const [runningTests, setRunningTests] = useState(false);
    const [output, setOutput] = useState<string>('');
    const [results, setResults] = useState<TestResults | null>(null);
    const [coverage, setCoverage] = useState<any>(null);
    const [withCoverage, setWithCoverage] = useState(false);

    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSuites();
    }, []);

    useEffect(() => {
        // Auto-scroll output to bottom
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const fetchSuites = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/tests/suites`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setSuites(data.suites || []);
        } catch (error) {
            console.error('Failed to fetch test suites:', error);
        }
    };

    const fetchCoverage = async () => {
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/api/dev/tests/coverage/summary`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setCoverage(data);
        } catch (error) {
            console.error('Failed to fetch coverage:', error);
        }
    };

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearTimeout(pollIntervalRef.current); // Changed to clearTimeout
            }
        };
    }, []);

    const stopTests = () => {
        if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setRunningTests(false);
        setOutput(prev => {
            const next = prev + '\n🛑 Test execution stopped by user (backend process may still finish).\n';
            if (next.length > 50000) return '... [Truncated for Performance] ...\n' + next.slice(-50000);
            return next;
        });
    };

    const runTests = async () => {
        if (runningTests) {
            stopTests();
            return;
        }

        setRunningTests(true);
        setOutput('🚀 Starting tests...\n\n');
        setResults(null);
        setCoverage(null);

        try {
            // Start the test job
            const startResponse = await fetch(`${getDevApiBaseUrl()}/api/dev/tests/run-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    pattern: '',
                    coverage: withCoverage
                })
            });

            const startData = await startResponse.json();

            if (!startData.jobId) {
                throw new Error('Failed to start test job');
            }

            setOutput(prev => prev + `📋 Job started: ${startData.jobId}\n\n`);

            // Poll for results
            let lastOutputLength = 0;

            // Clear any existing timer
            if (pollIntervalRef.current) {
                clearTimeout(pollIntervalRef.current);
            }

            const poll = async () => {
                // If stopped, don't continue
                if (pollIntervalRef.current === null && lastOutputLength > 0) return;

                try {
                    const statusResponse = await fetch(
                        `${getDevApiBaseUrl()}/api/dev/tests/status/${startData.jobId}?offset=${lastOutputLength}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );

                    if (!statusResponse.ok) {
                        throw new Error('Failed to get job status');
                    }

                    const statusData = await statusResponse.json();

                    // Update output with new content only (Optimized for performance)
                    if (statusData.output && statusData.output.length > 0) {
                        const newOutput = statusData.output;
                        setOutput(prev => {
                            const combined = prev + newOutput;
                            // Truncate to prevent browser freeze on massive logs (keep last 50k chars)
                            if (combined.length > 50000) {
                                return '... [Truncated for Performance] ...\n' + combined.slice(-50000);
                            }
                            return combined;
                        });
                        // Update offset based on server fulllength (if available) or accumulate
                        lastOutputLength = statusData.fullLength !== undefined ? statusData.fullLength : (lastOutputLength + newOutput.length);
                    }

                    // Check if job is complete
                    if (statusData.status === 'completed' || statusData.status === 'error') {
                        pollIntervalRef.current = null; // Stop polling

                        setResults({
                            success: statusData.exitCode === 0,
                            output: statusData.output || '',
                            duration: statusData.duration || 0
                        });

                        const statusIcon = statusData.exitCode === 0 ? '✅' : '❌';
                        const statusText = statusData.exitCode === 0 ? 'PASSED' : 'FAILED';
                        setOutput(prev => prev + `\n${statusIcon} Tests ${statusText}\n`);
                        setOutput(prev => prev + `⏱️ Duration: ${statusData.duration?.toFixed(1)}s\n`);

                        if (withCoverage && statusData.exitCode === 0) {
                            setTimeout(fetchCoverage, 1000);
                        }

                        setRunningTests(false);
                    } else {
                        // Schedule next poll only if not finished and not stopped
                        if (pollIntervalRef.current !== null) {
                            pollIntervalRef.current = setTimeout(poll, 1000);
                        }
                    }
                } catch (pollError: any) {
                    console.error('Poll error:', pollError);
                    // Retry on transient errors
                    if (pollIntervalRef.current !== null) {
                        pollIntervalRef.current = setTimeout(poll, 1000);
                    }
                }
            };

            // Start polling (store ID so we can cancel)
            pollIntervalRef.current = setTimeout(poll, 1000);

            // Timeout after 10 minutes (increased from 5)
            setTimeout(() => {
                if (pollIntervalRef.current) {
                    clearTimeout(pollIntervalRef.current);
                    if (runningTests) {
                        setOutput(prev => prev + '\n⚠️ Test execution timed out after 10 minutes\n');
                        setRunningTests(false);
                        pollIntervalRef.current = null;
                    }
                }
            }, 10 * 60 * 1000);

        } catch (error: any) {
            setOutput(prev => prev + `\n❌ Failed to run tests: ${error.message}\n`);
            setResults({
                success: false,
                output: '',
                duration: 0
            });
            stopTests();
        }
    };

    const handleTypeToggle = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const filteredSuites = suites.filter(s => selectedTypes.includes(s.type));
    const suiteCounts = {
        unit: suites.filter(s => s.type === 'unit').length,
        integration: suites.filter(s => s.type === 'integration').length,
        e2e: suites.filter(s => s.type === 'e2e').length
    };

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
    };

    // Parse test results from output
    const parseResults = (output: string) => {
        const passMatch = output.match(/(\d+) passing/);
        const failMatch = output.match(/(\d+) failing/);
        const passed = passMatch ? parseInt(passMatch[1]) : 0;
        const failed = failMatch ? parseInt(failMatch[1]) : 0;
        const total = passed + failed;
        return { passed, failed, total };
    };

    const testStats = results ? parseResults(results.output) : null;

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Science /> Test Suite Runner
                </Typography>

                {/* Test Type Filters */}
                <Box sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Test Types</FormLabel>
                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedTypes.includes('unit')}
                                        onChange={() => handleTypeToggle('unit')}
                                        disabled={runningTests}
                                    />
                                }
                                label={`Unit Tests (${suiteCounts.unit})`}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedTypes.includes('integration')}
                                        onChange={() => handleTypeToggle('integration')}
                                        disabled={runningTests}
                                    />
                                }
                                label={`Integration Tests (${suiteCounts.integration})`}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedTypes.includes('e2e')}
                                        onChange={() => handleTypeToggle('e2e')}
                                        disabled={runningTests}
                                    />
                                }
                                label={`E2E Tests (${suiteCounts.e2e})`}
                            />
                        </FormGroup>
                    </FormControl>
                </Box>

                {/* Coverage Option */}
                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={withCoverage}
                                onChange={(e) => setWithCoverage(e.target.checked)}
                                disabled={runningTests}
                            />
                        }
                        label="Include Code Coverage"
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Control Buttons */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Tooltip title="Run all backend tests">
                        <Button
                            variant="contained"
                            color={runningTests ? 'error' : 'primary'}
                            startIcon={runningTests ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                            onClick={runTests}
                        >
                            {runningTests ? 'Stop Tests' : 'Run Tests'}
                        </Button>
                    </Tooltip>

                    <Box sx={{ flexGrow: 1 }} />

                    {results && (
                        <Chip
                            icon={results.success ? <CheckCircle /> : <ErrorIcon />}
                            label={`Duration: ${formatDuration(results.duration)}`}
                            color={results.success ? 'success' : 'error'}
                            variant="outlined"
                        />
                    )}
                </Stack>

                {/* Progress */}
                {runningTests && <LinearProgress sx={{ mb: 2 }} />}

                {/* Results Summary */}
                {results && testStats && testStats.total > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Alert severity={results.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={2}>
                                <Chip
                                    icon={<CheckCircle />}
                                    label={`${testStats.passed} Passed`}
                                    color="success"
                                    size="small"
                                />
                                {testStats.failed > 0 && (
                                    <Chip
                                        icon={<ErrorIcon />}
                                        label={`${testStats.failed} Failed`}
                                        color="error"
                                        size="small"
                                    />
                                )}
                                <Chip
                                    label={`${testStats.total} Total`}
                                    variant="outlined"
                                    size="small"
                                />
                            </Stack>
                        </Alert>
                    </Box>
                )}

                {/* Coverage Summary */}
                {coverage && !coverage.error && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Code Coverage</Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 150 }}>
                                <Typography variant="caption" color="text.secondary">Statements</Typography>
                                <Typography variant="h5">{coverage.statements?.pct || 0}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={coverage.statements?.pct || 0}
                                    sx={{ mt: 1 }}
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 150 }}>
                                <Typography variant="caption" color="text.secondary">Branches</Typography>
                                <Typography variant="h5">{coverage.branches?.pct || 0}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={coverage.branches?.pct || 0}
                                    sx={{ mt: 1 }}
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 150 }}>
                                <Typography variant="caption" color="text.secondary">Functions</Typography>
                                <Typography variant="h5">{coverage.functions?.pct || 0}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={coverage.functions?.pct || 0}
                                    sx={{ mt: 1 }}
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 150 }}>
                                <Typography variant="caption" color="text.secondary">Lines</Typography>
                                <Typography variant="h5">{coverage.lines?.pct || 0}%</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={coverage.lines?.pct || 0}
                                    sx={{ mt: 1 }}
                                />
                            </Paper>
                        </Stack>
                    </Box>
                )}

                {/* Test Output */}
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Test Output
                    </Typography>
                    <Paper
                        ref={outputRef}
                        elevation={0}
                        sx={{
                            p: 2,
                            bgcolor: '#1e1e1e',
                            color: '#d4d4d4',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            maxHeight: '500px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}
                    >
                        {output || (
                            <Typography variant="caption" color="text.secondary">
                                Click "Run Tests" to start... {filteredSuites.length} test suite(s) available.
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Available Test Suites */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Available Test Suites ({filteredSuites.length})
                    </Typography>
                    <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
                        {filteredSuites.map((suite) => (
                            <ListItem key={suite.id}>
                                <ListItemText
                                    primary={suite.name}
                                    secondary={suite.relativePath}
                                />
                                <Chip label={suite.type} size="small" variant="outlined" />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Info Alert */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Note:</strong> Tests run in streaming mode. Output appears in real-time.
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};
