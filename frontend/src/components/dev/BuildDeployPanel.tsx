import React, { useState } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Card,
    CardContent,
    Tooltip
} from '@mui/material';
import {
    Build as BuildIcon,
    CloudUpload as DeployIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Web as WebIcon,
    Storage as StorageIcon,
    Info as InfoIcon
} from '@mui/icons-material';

export const BuildDeployPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState('');
    const [activeStep, setActiveStep] = useState(0);
    const [status, setStatus] = useState<'idle' | 'building' | 'deploying' | 'success' | 'error'>('idle');

    const executeBuild = async (type: 'frontend' | 'backend') => {
        setLoading(true);
        setStatus('building');
        setOutput(`Starting ${type} build...\n`);

        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/build/${type}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const result = await response.json();

            setOutput(prev => prev + result.output + '\n');

            if (result.success) {
                setOutput(prev => prev + `\n${type} build completed successfully!`);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error: any) {
            setOutput(prev => prev + `\nError: ${error.message}`);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const simulateDeploy = async () => {
        setLoading(true);
        setStatus('deploying');
        setActiveStep(1);
        setOutput(prev => prev + '\nStarting deployment sequence...\n');

        // Simulate deployment steps
        const steps = [
            'Verifying build artifacts...',
            'Connecting to deployment server...',
            'Uploading assets...',
            'Restarting services...',
            'Running health checks...'
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setOutput(prev => prev + `> ${step}\n`);
        }

        setOutput(prev => prev + '\nDeployment successful! Application is live.');
        setStatus('success');
        setActiveStep(2);
        setLoading(false);
    };

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Build & Deploy Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Compile and deploy frontend and backend applications. Run builds before deploying to production.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Available Operations:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Build Frontend:</strong> Compile React app to static files (Vite)</li>
                                <li><strong>Build Backend:</strong> Transpile TypeScript to JavaScript</li>
                                <li><strong>Deploy:</strong> Simulate deployment sequence to production</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> npm installed, write access to dist directories, sufficient disk space
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Build both frontend and backend before deploying. Monitor output for errors.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeployIcon /> Build & Deploy
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WebIcon /> Frontend
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Build the React frontend application. Generates static assets in /dist.
                            </Typography>
                            <Tooltip title="Compile React application to static assets for production using Vite" arrow>
                                <span style={{ width: '100%' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<BuildIcon />}
                                        onClick={() => executeBuild('frontend')}
                                        disabled={loading}
                                        fullWidth
                                    >
                                        Build Frontend
                                    </Button>
                                </span>
                            </Tooltip>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StorageIcon /> Backend
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Build the Node.js backend. Compiles TypeScript to JavaScript in /dist.
                            </Typography>
                            <Tooltip title="Transpile TypeScript backend code to JavaScript for production" arrow>
                                <span style={{ width: '100%' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<BuildIcon />}
                                        onClick={() => executeBuild('backend')}
                                        disabled={loading}
                                        fullWidth
                                    >
                                        Build Backend
                                    </Button>
                                </span>
                            </Tooltip>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Deployment Pipeline
                </Typography>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    <Step>
                        <StepLabel>Build</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Deploy</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Verify</StepLabel>
                    </Step>
                </Stepper>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Alert severity="warning" sx={{ maxWidth: 600 }}>
                        <strong>Note:</strong> This deployment pipeline is a simulation for demonstration purposes.
                        To perform a real deployment, please run <code>./dap rebuild</code> in the terminal.
                    </Alert>
                    <Tooltip title="Simulate production deployment sequence (demonstration only)" arrow>
                        <span>
                            <Button
                                variant="contained"
                                color="warning"
                                size="large"
                                startIcon={<DeployIcon />}
                                onClick={simulateDeploy}
                                disabled={loading || status === 'building'}
                            >
                                Simulate Production Deploy
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>

            {output && (
                <Paper elevation={3} sx={{ p: 2, bgcolor: '#1e1e1e', color: '#fff' }}>
                    <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {output}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};
