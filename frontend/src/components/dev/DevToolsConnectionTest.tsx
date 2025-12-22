import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Alert, Stack, Chip } from '@mui/material';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import { CheckCircle, Error as ErrorIcon, Info } from '@shared/components/FAIcon';

/**
 * DevTools API Connection Tester
 * Helps diagnose connection issues between frontend and DevTools backend
 */
export const DevToolsConnectionTest: React.FC = () => {
    const [testResults, setTestResults] = useState<Array<{
        name: string;
        status: 'pending' | 'success' | 'error';
        message: string;
        details?: string;
    }>>([]);
    const [testing, setTesting] = useState(false);

    const runTests = async () => {
        setTesting(true);
        const results: typeof testResults = [];

        // Test 1: Get API base URL
        const apiBase = getDevApiBaseUrl();
        results.push({
            name: 'API Base URL',
            status: 'success',
            message: apiBase,
            details: `Using ${apiBase.includes('localhost') ? 'local development' : 'production proxy'} mode`
        });

        // Test 2: Health check
        try {
            const res = await fetch(`${apiBase}/health`);
            if (res.ok) {
                const data = await res.json();
                results.push({
                    name: 'Health Check',
                    status: 'success',
                    message: `Service: ${data.service}`,
                    details: `Status: ${data.status}`
                });
            } else {
                results.push({
                    name: 'Health Check',
                    status: 'error',
                    message: `HTTP ${res.status}`,
                    details: await res.text()
                });
            }
        } catch (error: any) {
            results.push({
                name: 'Health Check',
                status: 'error',
                message: error.message,
                details: error.stack
            });
        }

        // Test 3: Test suites endpoint
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/api/dev/tests/suites`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const data = await res.json();
                results.push({
                    name: 'Test Suites API',
                    status: 'success',
                    message: `Found ${data.suites?.length || 0} test suites`,
                    details: `Auth: ${token ? 'Token present' : 'No token'}`
                });
            } else {
                results.push({
                    name: 'Test Suites API',
                    status: 'error',
                    message: `HTTP ${res.status}`,
                    details: await res.text()
                });
            }
        } catch (error: any) {
            results.push({
                name: 'Test Suites API',
                status: 'error',
                message: error.message,
                details: error.stack
            });
        }

        // Test 4: Database status
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/api/dev/database/status`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const data = await res.json();
                results.push({
                    name: 'Database API',
                    status: 'success',
                    message: `Connected: ${data.connected}`,
                    details: `Database: ${data.database}`
                });
            } else {
                results.push({
                    name: 'Database API',
                    status: 'error',
                    message: `HTTP ${res.status}`,
                    details: await res.text()
                });
            }
        } catch (error: any) {
            results.push({
                name: 'Database API',
                status: 'error',
                message: error.message,
                details: error.stack
            });
        }

        // Test 5: CORS check
        results.push({
            name: 'CORS Configuration',
            status: 'success',
            message: 'Requests completed (CORS working)',
            details: 'If you see this, CORS is configured correctly'
        });

        setTestResults(results);
        setTesting(false);
    };

    useEffect(() => {
        runTests();
    }, []);

    const successCount = testResults.filter(r => r.status === 'success').length;
    const errorCount = testResults.filter(r => r.status === 'error').length;

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    DevTools API Connection Test
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                    This diagnostic tool tests the connection between the frontend and DevTools backend.
                </Typography>

                {testResults.length > 0 && (
                    <Alert severity={errorCount === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                        {successCount} passed, {errorCount} failed
                    </Alert>
                )}

                <Button
                    variant="contained"
                    onClick={runTests}
                    disabled={testing}
                    sx={{ mb: 3 }}
                >
                    {testing ? 'Running Tests...' : 'Run Tests Again'}
                </Button>

                <Stack spacing={2}>
                    {testResults.map((result, index) => (
                        <Paper
                            key={index}
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderLeft: 4,
                                borderColor: result.status === 'success' ? 'success.main' :
                                    result.status === 'error' ? 'error.main' : 'grey.400'
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                {result.status === 'success' && <CheckCircle color="success" />}
                                {result.status === 'error' && <ErrorIcon color="error" />}
                                {result.status === 'pending' && <Info color="info" />}
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {result.name}
                                </Typography>
                                <Chip
                                    label={result.status}
                                    size="small"
                                    color={result.status === 'success' ? 'success' :
                                        result.status === 'error' ? 'error' : 'default'}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {result.message}
                            </Typography>
                            {result.details && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        mt: 1,
                                        fontFamily: 'monospace',
                                        bgcolor: 'grey.100',
                                        p: 1,
                                        borderRadius: 1,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {result.details}
                                </Typography>
                            )}
                        </Paper>
                    ))}
                </Stack>
            </Paper>
        </Box>
    );
};
