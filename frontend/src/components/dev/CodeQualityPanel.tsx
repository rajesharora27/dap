import React, { useState, useEffect } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    LinearProgress,
    Card,
    CardContent,
    Alert,
    Tooltip,
    Button
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    CheckCircle as PassIcon,
    Warning as WarnIcon,
    Error as FailIcon,
    Info as InfoIcon,
    PlayArrow as RunIcon
} from '@mui/icons-material';

interface CoverageMetrics {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}

interface CoverageSummary {
    total: {
        lines: CoverageMetrics;
        statements: CoverageMetrics;
        functions: CoverageMetrics;
        branches: CoverageMetrics;
    };
}

export const CodeQualityPanel: React.FC = () => {
    const [coverage, setCoverage] = useState<CoverageSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [runningCoverage, setRunningCoverage] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadCoverage = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/quality/coverage`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();

            if (data.error) {
                // Don't show error if it's just missing report, let user run it
                if (!data.error.includes('not found')) {
                    setError(data.error);
                }
            } else {
                setCoverage(data);
            }
        } catch (err: any) {
            setError('Failed to load coverage data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoverage();
    }, []);

    const runCoverage = async () => {
        setRunningCoverage(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/quality/coverage/run`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();

            if (result.success) {
                setSuccessMessage('Coverage report generated successfully');
                loadCoverage();
            } else {
                setError(result.error || 'Failed to generate coverage report');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to run coverage command');
        } finally {
            setRunningCoverage(false);
        }
    };

    const getStatusColor = (pct: number) => {
        if (pct >= 80) return 'success';
        if (pct >= 60) return 'warning';
        return 'error';
    };

    const CoverageCard = ({ title, metrics }: { title: string, metrics: CoverageMetrics }) => (
        <Card>
            <CardContent>
                <Typography color="text.secondary" gutterBottom>
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" sx={{ flexGrow: 1 }}>
                        {metrics.pct}%
                    </Typography>
                    {metrics.pct >= 80 ? <PassIcon color="success" /> :
                        metrics.pct >= 60 ? <WarnIcon color="warning" /> : <FailIcon color="error" />}
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={metrics.pct}
                    color={getStatusColor(metrics.pct) as any}
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                    {metrics.covered} / {metrics.total} covered
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Code Quality Metrics Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            View test coverage statistics and code quality metrics for the codebase.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Metrics Tracked:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Statements:</strong> Percentage of code statements tested</li>
                                <li><strong>Branches:</strong> Percentage of code branches covered</li>
                                <li><strong>Functions:</strong> Percentage of functions tested</li>
                                <li><strong>Lines:</strong> Percentage of code lines executed</li>
                            </ul>
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssessmentIcon /> Code Quality
                </Typography>
                <Button
                    variant="contained"
                    startIcon={runningCoverage ? <CircularProgress size={20} color="inherit" /> : <RunIcon />}
                    onClick={runCoverage}
                    disabled={runningCoverage}
                >
                    {runningCoverage ? 'Generating Report...' : 'Generate Coverage Report'}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : coverage ? (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <CoverageCard title="Statements" metrics={coverage.total.statements} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <CoverageCard title="Branches" metrics={coverage.total.branches} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <CoverageCard title="Functions" metrics={coverage.total.functions} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <CoverageCard title="Lines" metrics={coverage.total.lines} />
                    </Grid>
                </Grid>
            ) : (
                <Alert severity="info" action={
                    <Button color="inherit" size="small" onClick={runCoverage}>
                        Generate Now
                    </Button>
                }>
                    Coverage report not found. Click "Generate Coverage Report" to run tests and calculate coverage.
                </Alert>
            )}
        </Box>
    );
};
