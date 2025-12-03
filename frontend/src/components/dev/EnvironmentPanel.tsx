import React, { useState, useEffect } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    Tooltip,
    Chip,
    Grid
} from '@mui/material';
import {
    Settings as EnvIcon,
    Visibility,
    VisibilityOff,
    Refresh as RefreshIcon,
    Lock as LockIcon,
    Info as InfoIcon
} from '@mui/icons-material';

interface EnvVar {
    key: string;
    value: string;
    isSecret: boolean;
}

export const EnvironmentPanel: React.FC = () => {
    const [variables, setVariables] = useState<EnvVar[]>([]);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [systemInfo, setSystemInfo] = useState<any>(null);

    const loadEnv = async () => {
        try {
            const response = await fetch(`${getDevApiBaseUrl()}/api/dev/env`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setVariables(data.variables || []);

            const sysResponse = await fetch(`${getDevApiBaseUrl()}/api/dev/env/extended`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setSystemInfo(await sysResponse.json());
        } catch (error) {
            console.error('Failed to load env', error);
        }
    };

    useEffect(() => {
        loadEnv();
    }, []);

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Box>
            {/* Overview Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Environment & System Information
                        </Typography>
                        <Typography variant="body2" paragraph>
                            View current environment variables and system configuration.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Information Displayed:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>System Info:</strong> Node version, platform, CPU, memory usage</li>
                                <li><strong>Environment Variables:</strong> Loaded from .env file</li>
                                <li><strong>Security:</strong> Sensitive values are masked by default</li>
                            </ul>
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {systemInfo && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EnvIcon /> System Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Typography variant="subtitle2" color="text.secondary">Node Version</Typography>
                            <Typography variant="body1">{systemInfo.nodeVersion}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Typography variant="subtitle2" color="text.secondary">Platform</Typography>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{systemInfo.platform} ({systemInfo.arch})</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Typography variant="subtitle2" color="text.secondary">Memory</Typography>
                            <Typography variant="body1">{systemInfo.memory}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12, md: 8 }}>
                            <Typography variant="subtitle2" color="text.secondary">CPU</Typography>
                            <Typography variant="body1">{systemInfo.cpu}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Typography variant="subtitle2" color="text.secondary">Uptime</Typography>
                            <Typography variant="body1">{Math.floor(systemInfo.uptime / 60)} minutes</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon /> Environment Variables
                    </Typography>
                    <Tooltip title="Refresh Variables">
                        <IconButton onClick={loadEnv}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Variable Name</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variables.map((v) => (
                                <TableRow key={v.key}>
                                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{v.key}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                        {v.isSecret && !showSecrets[v.key] ? '••••••••' : v.value}
                                        {v.isSecret && (
                                            <Chip
                                                label="SECRET"
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                sx={{ ml: 1, height: 20, fontSize: '0.625rem' }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {v.isSecret && (
                                            <IconButton size="small" onClick={() => toggleSecret(v.key)}>
                                                {showSecrets[v.key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};
