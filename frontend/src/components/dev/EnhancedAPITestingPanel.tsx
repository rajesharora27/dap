import React, { useState } from 'react';
import { getDevApiBaseUrl } from '../../config/frontend.config';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Tooltip,
    Chip,
    Divider,
    Alert,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from '@mui/material';
import {
    Api,
    PlayArrow,
    Delete,
    Code,
    CheckCircle,
    Error as ErrorIcon
} from '@shared/components/FAIcon';

interface Example {
    name: string;
    description: string;
    query: string;
    variables: string;
}

const EXAMPLE_QUERIES: Example[] = [
    {
        name: 'List All Products',
        description: 'Fetch all products with basic fields',
        query: `query GetProducts {
  products {
    id
    name
    description
    status
    version
    createdAt
  }
}`,
        variables: '{}'
    },
    {
        name: 'Get Product by ID',
        description: 'Fetch a specific product by ID',
        query: `query GetProduct($id: Int!) {
  product(id: $id) {
    id
    name
    description
    status
    version
    tasks {
      id
      title
      description
    }
  }
}`,
        variables: '{\n  "id": 1\n}'
    },
    {
        name: 'List Solutions',
        description: 'Fetch all solutions with related data',
        query: `query GetSolutions {
  solutions {
    id
    name
    description
    status
    version
    products {
      id
      name
    }
  }
}`,
        variables: '{}'
    },
    {
        name: 'Get Current User',
        description: 'Fetch authenticated user info',
        query: `query GetMe {
  me {
    id
    username
    email
    role {
      id
      name
    }
    permissions {
      resource
      action
    }
  }
}`,
        variables: '{}'
    },
    {
        name: 'List Customers',
        description: 'Fetch all customers',
        query: `query GetCustomers {
  customers {
    id
    name
    taxId
    industry
    createdAt
  }
}`,
        variables: '{}'
    },
    {
        name: 'Create Product',
        description: 'Create a new product (mutation)',
        query: `mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    name
    description
    status
  }
}`,
        variables: `{
  "input": {
    "name": "Test Product",
    "description": "Created via API Testing Panel",
    "version": "1.0.0",
    "status": "DRAFT"
  }
}`
    },
    {
        name: 'Login Example',
        description: 'Authenticate and get token',
        query: `mutation Login($username: String!, $password: String!) {
  login(username: $username, password: $password) {
    token
    user {
      id
      username
      role {
        name
      }
    }
  }
}`,
        variables: `{
  "username": "admin",
  "password": "DAP123!!!"
}`
    }
];

export const EnhancedAPITestingPanel: React.FC = () => {
    const [query, setQuery] = useState(EXAMPLE_QUERIES[0].query);
    const [variables, setVariables] = useState(EXAMPLE_QUERIES[0].variables);
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<boolean | null>(null);
    const [duration, setDuration] = useState(0);

    const executeQuery = async () => {
        setLoading(true);
        setResponse('');
        setSuccess(null);
        const startTime = Date.now();

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
            setSuccess(!data.errors);
            setDuration(Date.now() - startTime);
        } catch (error: any) {
            setResponse(`Error: ${error.message}`);
            setSuccess(false);
            setDuration(Date.now() - startTime);
        } finally {
            setLoading(false);
        }
    };

    const loadExample = (example: Example) => {
        setQuery(example.query);
        setVariables(example.variables);
        setResponse('');
        setSuccess(null);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Api /> GraphQL API Tester
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                    Test GraphQL queries and mutations against the backend API. Select an example or write your own.
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Example Queries */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Example Queries
                    </Typography>
                    <List dense sx={{ maxHeight: '200px', overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                        {EXAMPLE_QUERIES.map((example, index) => (
                            <ListItem key={index} disablePadding>
                                <ListItemButton onClick={() => loadExample(example)}>
                                    <ListItemText
                                        primary={example.name}
                                        secondary={example.description}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Query Editor */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        GraphQL Query/Mutation
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        sx={{
                            fontFamily: 'monospace',
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.9rem'
                            }
                        }}
                        placeholder="query { ... }"
                    />
                </Box>

                {/* Variables Editor */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Variables (JSON)
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={variables}
                        onChange={(e) => setVariables(e.target.value)}
                        sx={{
                            fontFamily: 'monospace',
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.9rem'
                            }
                        }}
                        placeholder='{ "key": "value" }'
                    />
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Tooltip title="Execute the GraphQL query">
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                            onClick={executeQuery}
                            disabled={loading}
                        >
                            {loading ? 'Executing...' : 'Execute Query'}
                        </Button>
                    </Tooltip>
                    <Tooltip title="Clear query and variables">
                        <Button
                            variant="outlined"
                            startIcon={<Delete />}
                            onClick={() => {
                                setQuery('');
                                setVariables('{}');
                                setResponse('');
                                setSuccess(null);
                            }}
                        >
                            Clear
                        </Button>
                    </Tooltip>
                    <Box sx={{ flexGrow: 1 }} />
                    {success !== null && (
                        <Chip
                            icon={success ? <CheckCircle /> : <ErrorIcon />}
                            label={success ? `Success (${duration}ms)` : `Failed (${duration}ms)`}
                            color={success ? 'success' : 'error'}
                            variant="outlined"
                        />
                    )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Response Viewer */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Response
                    </Typography>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            bgcolor: '#1e1e1e',
                            color: '#d4d4d4',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            maxHeight: '400px',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}
                    >
                        {response || (
                            <Typography variant="caption" color="text.secondary">
                                Click "Execute Query" to see results...
                            </Typography>
                        )}
                    </Paper>
                </Box>

                {/* Quick Reference */}
                <Alert severity="info" sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Quick Reference:
                    </Typography>
                    <Typography variant="caption" component="div">
                        • <strong>Endpoint:</strong> {getDevApiBaseUrl()}/graphql<br />
                        • <strong>Authentication:</strong> Uses your current session token<br />
                        • <strong>Tip:</strong> Use examples above as starting points<br />
                        • <strong>Documentation:</strong> See GraphQL schema in Development → Docs
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};
