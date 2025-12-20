/**
 * Test Panel - Reimplemented from scratch
 * 
 * Features:
 * - Organized tests by category (Unit, Integration, E2E)
 * - Individual test selection or run all
 * - Command preview before execution
 * - Shadow database execution (dap_test) to protect dev data
 * - Real-time streaming output
 * - Results summary with pass/fail counts
 * - Identical behavior to CLI execution
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Button,
    Checkbox,
    LinearProgress,
    Alert,
    Divider,
    Tooltip,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControlLabel,
    IconButton,
    Collapse,
    Stack,
    Switch,
    Card,
    CardContent
} from '@mui/material';
import {
    PlayArrow,
    Stop,
    CheckCircle,
    Error as ErrorIcon,
    Warning as WarningIcon,
    ExpandMore,
    Refresh,
    Terminal,
    ContentCopy,
    Science,
    Code,
    BugReport,
    Speed,
    Storage
} from '../../components/common/FAIcon';

// ==================== Types ====================

interface TestFile {
    id: string;
    name: string;
    path: string;
    relativePath: string;
}

interface TestCategory {
    id: 'unit' | 'integration' | 'e2e';
    name: string;
    description: string;
    icon: React.ReactNode;
    tests: TestFile[];
    selectedTests: Set<string>;
    color: 'success' | 'info' | 'warning';
    slowWarning?: boolean;
}

interface TestResults {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: number;
    exitCode: number | null;
}

interface TestJob {
    id: string;
    status: 'running' | 'completed' | 'error';
    startTime: Date;
    command: string;
}

// ==================== Main Component ====================

export const TestPanelNew: React.FC = () => {
    // State
    const [categories, setCategories] = useState<TestCategory[]>([
        {
            id: 'unit',
            name: 'Unit Tests',
            description: 'Fast tests for individual functions and services (services/)',
            icon: <Code fontSize="small" />,
            tests: [],
            selectedTests: new Set(),
            color: 'success'
        },
        {
            id: 'integration',
            name: 'Integration Tests',
            description: 'Tests for GraphQL API endpoints (integration/)',
            icon: <BugReport fontSize="small" />,
            tests: [],
            selectedTests: new Set(),
            color: 'info'
        },
        {
            id: 'e2e',
            name: 'E2E Tests',
            description: 'End-to-end comprehensive tests (e2e/)',
            icon: <Science fontSize="small" />,
            tests: [],
            selectedTests: new Set(),
            color: 'warning',
            slowWarning: true
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [runningJob, setRunningJob] = useState<TestJob | null>(null);
    const [output, setOutput] = useState<string>('');
    const [results, setResults] = useState<TestResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [withCoverage, setWithCoverage] = useState(false);
    const [showCommandPreview, setShowCommandPreview] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['unit', 'integration']));

    const outputRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    // ==================== Effects ====================

    // Fetch test suites on mount
    useEffect(() => {
        fetchTestSuites();
        return () => {
            if (pollRef.current) clearTimeout(pollRef.current);
        };
    }, []);

    // Auto-scroll output
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    // ==================== API Functions ====================

    const fetchTestSuites = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/tests/suites`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const suites: TestFile[] = data.suites || [];

            // Categorize tests
            const categorizedTests: Record<string, TestFile[]> = {
                unit: [],
                integration: [],
                e2e: []
            };

            suites.forEach((test: any) => {
                const file: TestFile = {
                    id: test.id || test.path,
                    name: test.name,
                    path: test.path,
                    relativePath: test.relativePath
                };

                // Categorize based on path
                if (test.relativePath?.includes('services/') || test.type === 'unit') {
                    categorizedTests.unit.push(file);
                } else if (test.relativePath?.includes('integration/') || test.type === 'integration') {
                    categorizedTests.integration.push(file);
                } else if (test.relativePath?.includes('e2e/') || test.type === 'e2e') {
                    categorizedTests.e2e.push(file);
                } else {
                    // Default to unit
                    categorizedTests.unit.push(file);
                }
            });

            setCategories(prev => prev.map(cat => ({
                ...cat,
                tests: categorizedTests[cat.id] || [],
                selectedTests: new Set(categorizedTests[cat.id]?.map(t => t.id) || [])
            })));

        } catch (err: any) {
            setError(`Failed to load test suites: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ==================== Test Selection ====================

    const toggleTestSelection = (categoryId: string, testId: string) => {
        setCategories(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;
            const newSelected = new Set(cat.selectedTests);
            if (newSelected.has(testId)) {
                newSelected.delete(testId);
            } else {
                newSelected.add(testId);
            }
            return { ...cat, selectedTests: newSelected };
        }));
    };

    const toggleCategorySelection = (categoryId: string, selected: boolean) => {
        setCategories(prev => prev.map(cat => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                selectedTests: selected ? new Set(cat.tests.map(t => t.id)) : new Set()
            };
        }));
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    // ==================== Command Generation ====================

    const getSelectedTests = useCallback((): TestFile[] => {
        const selected: TestFile[] = [];
        categories.forEach(cat => {
            cat.tests.forEach(test => {
                if (cat.selectedTests.has(test.id)) {
                    selected.push(test);
                }
            });
        });
        return selected;
    }, [categories]);

    const getTestPattern = useCallback((): string => {
        const selected = getSelectedTests();
        const totalTests = categories.reduce((sum, cat) => sum + cat.tests.length, 0);

        if (selected.length === 0) return '';
        if (selected.length === totalTests) return ''; // Run all

        // Generate pattern for selected tests
        const patterns = selected.map(t => t.name);
        return patterns.join('|');
    }, [categories, getSelectedTests]);

    const generateCommand = useCallback((): string => {
        const pattern = getTestPattern();
        let cmd = 'npm test -- --runInBand';

        if (withCoverage) {
            cmd = 'npm test -- --coverage --runInBand';
        }

        if (pattern) {
            cmd += ` --testPathPattern="${pattern}"`;
        }

        return cmd;
    }, [getTestPattern, withCoverage]);

    // ==================== Test Execution ====================

    const runTests = async () => {
        const selectedTests = getSelectedTests();
        if (selectedTests.length === 0) {
            setError('Please select at least one test to run');
            return;
        }

        setRunningJob({
            id: `test-${Date.now()}`,
            status: 'running',
            startTime: new Date(),
            command: generateCommand()
        });
        setOutput('🚀 Starting tests...\n\n');
        setOutput(prev => prev + `📋 Command: ${generateCommand()}\n`);
        setOutput(prev => prev + `🗃️ Database: dap_test (shadow copy)\n`);
        setOutput(prev => prev + `📁 Selected tests: ${selectedTests.length}\n\n`);
        setResults(null);
        setError(null);

        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/tests/run-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    pattern: getTestPattern(),
                    coverage: withCoverage,
                    tests: selectedTests.map(t => t.relativePath)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            if (!data.jobId) {
                throw new Error('Failed to start test job');
            }

            setRunningJob(prev => prev ? { ...prev, id: data.jobId } : null);
            setOutput(prev => prev + `✅ Job started: ${data.jobId}\n\n`);

            // Start polling for results
            pollForResults(data.jobId);

        } catch (err: any) {
            setError(err.message);
            setRunningJob(null);
        }
    };

    const pollForResults = (jobId: string, offset: number = 0) => {
        if (pollRef.current) clearTimeout(pollRef.current);

        const poll = async () => {
            try {
                const response = await fetch(
                    `${getDevApiBaseUrl()}/api/dev/tests/status/${jobId}?offset=${offset}`,
                    {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    }
                );

                if (!response.ok) throw new Error('Failed to get status');

                const data = await response.json();

                // Append new output
                if (data.output && data.output.length > 0) {
                    setOutput(prev => {
                        const combined = prev + data.output;
                        // Truncate for performance
                        return combined.length > 100000
                            ? '... [Truncated] ...\n' + combined.slice(-100000)
                            : combined;
                    });
                }

                // Check completion
                if (data.status === 'completed' || data.status === 'error') {
                    setRunningJob(null);
                    setResults({
                        passed: data.passed || 0,
                        failed: data.failed || 0,
                        skipped: 0,
                        total: data.total || 0,
                        duration: data.duration || 0,
                        exitCode: data.exitCode
                    });

                    // Parse results from output if not provided
                    if (!data.passed && !data.failed) {
                        const passMatch = data.output?.match(/(\d+) passed/);
                        const failMatch = data.output?.match(/(\d+) failed/);
                        if (passMatch || failMatch) {
                            setResults({
                                passed: passMatch ? parseInt(passMatch[1]) : 0,
                                failed: failMatch ? parseInt(failMatch[1]) : 0,
                                skipped: 0,
                                total: (passMatch ? parseInt(passMatch[1]) : 0) + (failMatch ? parseInt(failMatch[1]) : 0),
                                duration: data.duration || 0,
                                exitCode: data.exitCode
                            });
                        }
                    }
                } else {
                    // Continue polling
                    const newOffset = data.fullLength || (offset + (data.output?.length || 0));
                    pollRef.current = setTimeout(() => pollForResults(jobId, newOffset), 1000);
                }
            } catch (err) {
                // Retry on transient errors
                pollRef.current = setTimeout(() => pollForResults(jobId, offset), 2000);
            }
        };

        pollRef.current = setTimeout(poll, 500);
    };

    const stopTests = () => {
        if (pollRef.current) {
            clearTimeout(pollRef.current);
            pollRef.current = null;
        }
        setRunningJob(null);
        setOutput(prev => prev + '\n🛑 Test execution stopped by user\n');
    };

    const copyCommand = () => {
        navigator.clipboard.writeText(generateCommand());
    };

    // ==================== Render Helpers ====================

    const getSelectedCount = (categoryId: string): number => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.selectedTests.size || 0;
    };

    const getTotalSelectedCount = (): number => {
        return categories.reduce((sum, cat) => sum + cat.selectedTests.size, 0);
    };

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    // ==================== Render ====================

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Science />
                        Test Panel
                    </Typography>
                    <Tooltip title="Refresh test suites">
                        <IconButton onClick={fetchTestSuites} disabled={loading || !!runningJob}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Database Info Alert */}
                <Alert severity="info" icon={<Storage />} sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        <strong>Shadow Database:</strong> All tests run on <code>dap_test</code> database (a copy of dev data).
                        Your development database and user accounts are <strong>never impacted</strong>.
                    </Typography>
                </Alert>

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Test Categories */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Select Tests ({getTotalSelectedCount()} selected)
                    </Typography>

                    {categories.map((category) => (
                        <Accordion
                            key={category.id}
                            expanded={expandedCategories.has(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            sx={{ mb: 1 }}
                        >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                    <Checkbox
                                        checked={category.selectedTests.size === category.tests.length && category.tests.length > 0}
                                        indeterminate={category.selectedTests.size > 0 && category.selectedTests.size < category.tests.length}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleCategorySelection(category.id, e.target.checked);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={!!runningJob}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {category.icon}
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {category.name}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size="small"
                                        label={`${getSelectedCount(category.id)}/${category.tests.length}`}
                                        color={category.color}
                                        variant="outlined"
                                    />
                                    {category.slowWarning && (
                                        <Chip
                                            size="small"
                                            icon={<Speed />}
                                            label="SLOW"
                                            color="warning"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                        />
                                    )}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                    {category.description}
                                </Typography>
                                {category.tests.length === 0 ? (
                                    <Typography color="text.secondary" variant="body2">
                                        No tests found in this category
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {category.tests.map((test) => (
                                            <FormControlLabel
                                                key={test.id}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={category.selectedTests.has(test.id)}
                                                        onChange={() => toggleTestSelection(category.id, test.id)}
                                                        disabled={!!runningJob}
                                                    />
                                                }
                                                label={
                                                    <Tooltip title={test.relativePath}>
                                                        <Typography variant="body2">{test.name}</Typography>
                                                    </Tooltip>
                                                }
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    px: 1,
                                                    py: 0.5,
                                                    m: 0,
                                                    bgcolor: category.selectedTests.has(test.id) ? 'action.selected' : 'transparent'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                {/* Options */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={withCoverage}
                                onChange={(e) => setWithCoverage(e.target.checked)}
                                disabled={!!runningJob}
                            />
                        }
                        label="Include Code Coverage"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showCommandPreview}
                                onChange={(e) => setShowCommandPreview(e.target.checked)}
                            />
                        }
                        label="Show Command Preview"
                    />
                </Box>

                {/* Command Preview */}
                <Collapse in={showCommandPreview}>
                    <Card variant="outlined" sx={{ mb: 3, bgcolor: '#1e1e1e' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="grey.400" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Terminal fontSize="small" />
                                    Command to be executed:
                                </Typography>
                                <Tooltip title="Copy command">
                                    <IconButton size="small" onClick={copyCommand} sx={{ color: 'grey.400' }}>
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Typography
                                component="code"
                                sx={{
                                    color: '#4fc3f7',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    wordBreak: 'break-all'
                                }}
                            >
                                cd /data/dap/backend && DATABASE_URL=postgres://postgres:postgres@localhost:5432/dap_test {generateCommand()}
                            </Typography>
                        </CardContent>
                    </Card>
                </Collapse>

                <Divider sx={{ my: 2 }} />

                {/* Control Buttons */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        color={runningJob ? 'error' : 'primary'}
                        startIcon={runningJob ? <Stop /> : <PlayArrow />}
                        onClick={runningJob ? stopTests : runTests}
                        disabled={loading || (!runningJob && getTotalSelectedCount() === 0)}
                        size="large"
                    >
                        {runningJob ? 'Stop Tests' : `Run ${getTotalSelectedCount()} Test${getTotalSelectedCount() !== 1 ? 's' : ''}`}
                    </Button>
                </Stack>

                {/* Progress */}
                {runningJob && <LinearProgress sx={{ mb: 2 }} />}

                {/* Results Summary */}
                {results && (
                    <Alert
                        severity={results.exitCode === 0 ? 'success' : 'error'}
                        icon={results.exitCode === 0 ? <CheckCircle /> : <ErrorIcon />}
                        sx={{ mb: 3 }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Typography variant="body1" fontWeight="bold">
                                {results.exitCode === 0 ? 'Tests Passed!' : 'Tests Failed'}
                            </Typography>
                            <Chip icon={<CheckCircle />} label={`${results.passed} Passed`} color="success" size="small" />
                            {results.failed > 0 && (
                                <Chip icon={<ErrorIcon />} label={`${results.failed} Failed`} color="error" size="small" />
                            )}
                            <Chip label={`${results.total} Total`} variant="outlined" size="small" />
                            <Chip icon={<Speed />} label={`Duration: ${formatDuration(results.duration)}`} variant="outlined" size="small" />
                        </Stack>
                    </Alert>
                )}

                {/* Test Output */}
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Terminal />
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
                            minHeight: '200px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            borderRadius: 1
                        }}
                    >
                        {output || (
                            <Typography variant="body2" color="grey.500">
                                Click "Run Tests" to start... {getTotalSelectedCount()} test(s) selected.
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Help Text */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="body2">
                        <strong>Tip:</strong> Tests can also be run from CLI with the same command shown in the preview.
                        The output and behavior will be identical.
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};

export default TestPanelNew;
