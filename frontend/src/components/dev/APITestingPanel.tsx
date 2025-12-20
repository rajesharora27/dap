import React, { useState } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Api as ApiIcon,
    PlayArrow as RunIcon,
    Save as SaveIcon,
    Delete as ClearIcon,
    Info as InfoIcon
} from '../../components/common/FAIcon';

export const APITestingPanel: React.FC = () => {
    const [query, setQuery] = useState(`query GetProducts {
  products {
    id
    name
    description
    status
    version
  }
}`);
    const [variables, setVariables] = useState('{}');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const executeQuery = async () => {
        setLoading(true);
        setResponse('');
        try {
            const res = await fetch(`${getDevApiBaseUrl()}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    query,
                    variables: JSON.parse(variables)
                })
            });
            const data = await res.json();
            setResponse(JSON.stringify(data, null, 2));
        } catch (error: any) {
            setResponse(`Error: ${error.message}`);
        } finally {
            setLoading(false);
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
                            API Testing (GraphQL) Overview
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Test GraphQL queries and mutations against the backend API directly from the browser.
                        </Typography>
                        <Typography variant="body2" component="div">
                            <strong>Features:</strong>
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                                <li><strong>Execute Queries:</strong> Run GraphQL queries in real-time</li>
                                <li><strong>Test Mutations:</strong> Test data modifications</li>
                                <li><strong>Pass Variables:</strong> Use JSON variables in queries</li>
                                <li><strong>View Responses:</strong> See formatted JSON output</li>
                            </ul>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Requirements:</strong> Backend server running at localhost:4000/graphql, valid authentication token
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>How to Use:</strong> Write your GraphQL query, add variables if needed, then click Execute to see results.
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ApiIcon /> API Testing (GraphQL)
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle2" gutterBottom>Query</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={12}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            sx={{ fontFamily: 'monospace', mb: 2 }}
                            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                        />

                        <Typography variant="subtitle2" gutterBottom>Variables (JSON)</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={variables}
                            onChange={(e) => setVariables(e.target.value)}
                            sx={{ fontFamily: 'monospace', mb: 2 }}
                            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                        />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Execute the GraphQL query against the backend API and display results" arrow>
                                <span>
                                    <Button
                                        variant="contained"
                                        startIcon={<RunIcon />}
                                        onClick={executeQuery}
                                        disabled={loading}
                                    >
                                        Execute
                                    </Button>
                                </span>
                            </Tooltip>
                            <Tooltip title="Clear query and reset variables to defaults" arrow>
                                <Button
                                    variant="outlined"
                                    startIcon={<ClearIcon />}
                                    onClick={() => { setQuery(''); setVariables('{}'); }}
                                >
                                    Clear
                                </Button>
                            </Tooltip>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%', bgcolor: '#1e1e1e', color: '#fff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">Response</Typography>
                            {loading && <CircularProgress size={20} color="inherit" />}
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={20}
                            value={response}
                            InputProps={{
                                readOnly: true,
                                sx: {
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    color: '#fff',
                                    '& textarea': { color: '#fff' }
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: 'transparent' },
                                    '&.Mui-focused fieldset': { borderColor: 'transparent' }
                                }
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
