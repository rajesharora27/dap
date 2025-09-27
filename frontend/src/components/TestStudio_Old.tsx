import * as React from 'react';
import { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardHeader,
    Alert,
    Chip,
    Paper,
    Stack,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Science,
    PlayArrow,
    CheckCircle,
    ErrorOutline,
    RestartAlt,
    DataObject
} from '@mui/icons-material';
import { useMutation, useQuery, gql } from '@apollo/client';

// GraphQL Mutations and Queries
const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      description
      customAttrs
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      id
      name
      description
      estMinutes
      weight
      priority
      licenseLevel
      notes
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) {
      id
      name
      description
      estMinutes
      weight
      priority
      licenseLevel
      notes
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) {
      id
      name
      description
    }
  }
`;

const PRODUCTS_QUERY = gql`
  query Products {
    products {
      edges {
        node {
          id
          name
          description
          customAttrs
        }
      }
    }
  }
`;

// Test data
const TEST_PRODUCT_DATA = {
    name: 'Test Product',
    description: 'Complete test product with all attributes',
    customAttrs: JSON.stringify({
        industry: 'Testing',
        department: 'QA',
        priority: 'HIGH',
        budget: 100000,
        owner: 'Test Studio'
    })
};

const TEST_TASK_DATA = {
    name: 'Test Task',
    description: 'Complete test task with all attributes',
    estMinutes: 120,
    weight: 25,
    priority: 'HIGH',
    licenseLevel: 'Signature',
    notes: 'This is a comprehensive test task'
};

const SAMPLE_PRODUCTS = [
    { name: 'Sample CRM', description: 'Customer relationship management system', industry: 'Sales' },
    { name: 'Sample ERP', description: 'Enterprise resource planning system', industry: 'Operations' },
    { name: 'Sample Analytics', description: 'Business analytics platform', industry: 'Analytics' },
    { name: 'Sample HR', description: 'Human resources management system', industry: 'HR' },
    { name: 'Sample Finance', description: 'Financial management system', industry: 'Finance' }
];

interface TestState {
    currentProductId: string;
    currentTaskId: string;
    logs: string[];
    results: { [key: string]: { success: boolean; message: string; timestamp: string } };
}

const TestStudio: React.FC = () => {
    // State
    const [testState, setTestState] = useState<TestState>({
        currentProductId: '',
        currentTaskId: '',
        logs: [],
        results: {}
    });
    const [running, setRunning] = useState<{ [key: string]: boolean }>({});

    // GraphQL mutations
    const [createProduct] = useMutation(CREATE_PRODUCT);
    const [updateProduct] = useMutation(UPDATE_PRODUCT);
    const [deleteProduct] = useMutation(DELETE_PRODUCT);
    const [createTask] = useMutation(CREATE_TASK);
    const [updateTask] = useMutation(UPDATE_TASK);
    const [deleteTask] = useMutation(DELETE_TASK);
    const [createOutcome] = useMutation(CREATE_OUTCOME);

    const { refetch: refetchProducts } = useQuery(PRODUCTS_QUERY);

    // Helper functions
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setTestState(prev => ({
            ...prev,
            logs: [...prev.logs, `${timestamp}: ${message}`]
        }));
    };

    const addResult = (testName: string, success: boolean, message: string) => {
        setTestState(prev => ({
            ...prev,
            results: {
                ...prev.results,
                [testName]: {
                    success,
                    message,
                    timestamp: new Date().toLocaleTimeString()
                }
            }
        }));
    };

    const setTestRunning = (testName: string, isRunning: boolean) => {
        setRunning(prev => ({ ...prev, [testName]: isRunning }));
    };

    // Test Functions

    // 1. Create Test Product with All Attributes
    const runCreateProduct = async () => {
        const testName = 'createProduct';
        setTestRunning(testName, true);
        addLog('🏗️ Creating test product with all attributes...');

        try {
            const result = await createProduct({
                variables: { input: TEST_PRODUCT_DATA }
            });

            const product = result.data.createProduct;
            
            // Create an outcome for the product
            await createOutcome({
                variables: {
                    input: {
                        name: 'Quality Assurance',
                        description: 'Test outcome for quality assurance',
                        productId: product.id
                    }
                }
            });

            setTestState(prev => ({ ...prev, currentProductId: product.id }));
            addLog(`✅ Created product: ${product.name} (ID: ${product.id})`);
            addResult(testName, true, `✅ Product created successfully: ${product.name}`);

        } catch (error: any) {
            addLog(`❌ Error creating product: ${error.message}`);
            addResult(testName, false, `❌ Failed to create product: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // 2. Edit Test Product
    const runEditProduct = async () => {
        const testName = 'editProduct';
        if (!testState.currentProductId) {
            addResult(testName, false, '❌ No test product available. Create a product first.');
            return;
        }

        setTestRunning(testName, true);
        addLog('✏️ Editing test product...');

        try {
            const updatedData = {
                name: `${TEST_PRODUCT_DATA.name} - UPDATED`,
                description: `${TEST_PRODUCT_DATA.description} [EDITED]`,
                customAttrs: JSON.stringify({
                    ...JSON.parse(TEST_PRODUCT_DATA.customAttrs),
                    lastUpdated: new Date().toISOString(),
                    status: 'UPDATED'
                })
            };

            const result = await updateProduct({
                variables: {
                    id: testState.currentProductId,
                    input: updatedData
                }
            });

            addLog(`✅ Updated product: ${result.data.updateProduct.name}`);
            addResult(testName, true, `✅ Product updated successfully`);

        } catch (error: any) {
            addLog(`❌ Error updating product: ${error.message}`);
            addResult(testName, false, `❌ Failed to update product: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // 3. Create Tasks with All Attributes
    const runCreateTasks = async () => {
        const testName = 'createTasks';
        if (!testState.currentProductId) {
            addResult(testName, false, '❌ No test product available. Create a product first.');
            return;
        }

        setTestRunning(testName, true);
        addLog('📋 Creating test tasks...');

        try {
            const result = await createTask({
                variables: {
                    input: {
                        ...TEST_TASK_DATA,
                        productId: testState.currentProductId
                    }
                }
            });

            const task = result.data.createTask;
            setTestState(prev => ({ ...prev, currentTaskId: task.id }));
            addLog(`✅ Created task: ${task.name} (ID: ${task.id})`);
            addResult(testName, true, `✅ Task created successfully: ${task.name}`);

        } catch (error: any) {
            addLog(`❌ Error creating task: ${error.message}`);
            addResult(testName, false, `❌ Failed to create task: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // 4. Edit Tasks
    const runEditTasks = async () => {
        const testName = 'editTasks';
        if (!testState.currentTaskId) {
            addResult(testName, false, '❌ No test task available. Create tasks first.');
            return;
        }

        setTestRunning(testName, true);
        addLog('✏️ Editing test tasks...');

        try {
            const updatedTaskData = {
                name: `${TEST_TASK_DATA.name} - UPDATED`,
                description: `${TEST_TASK_DATA.description} [EDITED]`,
                estMinutes: 180,
                weight: 35,
                priority: 'CRITICAL',
                licenseLevel: 'Signature',
                notes: `${TEST_TASK_DATA.notes} [UPDATED]`
            };

            const result = await updateTask({
                variables: {
                    id: testState.currentTaskId,
                    input: updatedTaskData
                }
            });

            addLog(`✅ Updated task: ${result.data.updateTask.name}`);
            addResult(testName, true, `✅ Task updated successfully`);

        } catch (error: any) {
            addLog(`❌ Error updating task: ${error.message}`);
            addResult(testName, false, `❌ Failed to update task: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // 5. Delete Task
    const runDeleteTask = async () => {
        const testName = 'deleteTask';
        if (!testState.currentTaskId) {
            addResult(testName, false, '❌ No test task available. Create tasks first.');
            return;
        }

        setTestRunning(testName, true);
        addLog('🗑️ Deleting test task...');

        try {
            await deleteTask({
                variables: { id: testState.currentTaskId }
            });

            addLog(`✅ Deleted task: ${testState.currentTaskId}`);
            setTestState(prev => ({ ...prev, currentTaskId: '' }));
            addResult(testName, true, `✅ Task deleted successfully`);

        } catch (error: any) {
            addLog(`❌ Error deleting task: ${error.message}`);
            addResult(testName, false, `❌ Failed to delete task: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // 6. Delete Test Product
    const runDeleteProduct = async () => {
        const testName = 'deleteProduct';
        if (!testState.currentProductId) {
            addResult(testName, false, '❌ No test product available. Create a product first.');
            return;
        }

        setTestRunning(testName, true);
        addLog('🗑️ Deleting test product...');

        try {
            await deleteProduct({
                variables: { id: testState.currentProductId }
            });

            addLog(`✅ Deleted product: ${testState.currentProductId}`);
            setTestState(prev => ({
                ...prev,
                currentProductId: '',
                currentTaskId: ''
            }));
            addResult(testName, true, `✅ Product deleted successfully`);
            await refetchProducts();

        } catch (error: any) {
            addLog(`❌ Error deleting product: ${error.message}`);
            addResult(testName, false, `❌ Failed to delete product: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // 7. Run All Tests
    const runAllTests = async () => {
        addLog('🚀 Starting complete test sequence...');
        
        await runCreateProduct();
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        
        await runEditProduct();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await runCreateTasks();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await runEditTasks();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await runDeleteTask();
        await new Promise(resolve => setTimeout(resolve, 500));

        addLog('🏁 Complete test sequence finished!');
        addResult('allTests', true, '🏁 All tests completed');
    };

    // 8. Reset Test Environment
    const resetEnvironment = async () => {
        setTestRunning('reset', true);
        addLog('🧹 Resetting test environment...');

        try {
            if (testState.currentProductId) {
                await runDeleteProduct();
            }

            setTestState({
                currentProductId: '',
                currentTaskId: '',
                logs: ['✨ Test environment reset'],
                results: {}
            });
            setRunning({});

            addLog('✨ Test environment reset complete');

        } catch (error: any) {
            addLog(`❌ Reset error: ${error.message}`);
        } finally {
            setTestRunning('reset', false);
        }
    };

    // 9. Create 5 Sample Products
    const createSampleData = async () => {
        setTestRunning('sampleData', true);
        addLog('🏭 Creating 5 sample products...');

        let successCount = 0;
        for (const [index, sample] of SAMPLE_PRODUCTS.entries()) {
            try {
                const result = await createProduct({
                    variables: {
                        input: {
                            name: sample.name,
                            description: sample.description,
                            customAttrs: JSON.stringify({
                                industry: sample.industry,
                                sampleData: true
                            })
                        }
                    }
                });

                // Create outcome for each sample product
                await createOutcome({
                    variables: {
                        input: {
                            name: `${sample.industry} Goals`,
                            description: `Key outcomes for ${sample.industry}`,
                            productId: result.data.createProduct.id
                        }
                    }
                });

                successCount++;
                addLog(`✅ Created sample ${index + 1}/5: ${sample.name}`);

            } catch (error: any) {
                addLog(`❌ Failed to create ${sample.name}: ${error.message}`);
            }
        }

        await refetchProducts();
        addResult('sampleData', successCount === 5, 
            successCount === 5 ? 
            '✅ All 5 sample products created' : 
            `⚠️ Created ${successCount}/5 sample products`
        );
        
        setTestRunning('sampleData', false);
    };

    const getButtonColor = (testName: string) => {
        if (running[testName]) return 'info';
        const result = testState.results[testName];
        if (!result) return 'primary';
        return result.success ? 'success' : 'error';
    };

    const isAnyTestRunning = Object.values(running).some(r => r);

    return (
        <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Science color="primary" fontSize="large" />
                    DAP Test Studio
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Complete testing for all DAP functionality - Products, Tasks, and Data Management
                </Typography>
            </Box>

            {/* Current Status */}
            <Card sx={{ mb: 3 }}>
                <CardHeader title="Current Test Session" />
                <CardContent>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                            label={`Product: ${testState.currentProductId ? 'Created' : 'None'}`}
                            color={testState.currentProductId ? 'success' : 'default'}
                            variant="outlined"
                        />
                        <Chip
                            label={`Task: ${testState.currentTaskId ? 'Created' : 'None'}`}
                            color={testState.currentTaskId ? 'success' : 'default'}
                            variant="outlined"
                        />
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Test Controls */}
                <Box sx={{ flex: 1 }}>
                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Individual Tests" subheader="Run tests one by one" />
                        <CardContent>
                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    color={getButtonColor('createProduct')}
                                    startIcon={running.createProduct ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={runCreateProduct}
                                    disabled={running.createProduct}
                                    fullWidth
                                >
                                    1. Create Test Product (with all attributes)
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color={getButtonColor('editProduct')}
                                    startIcon={running.editProduct ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={runEditProduct}
                                    disabled={running.editProduct || !testState.currentProductId}
                                    fullWidth
                                >
                                    2. Edit Test Product (update all attributes)
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color={getButtonColor('createTasks')}
                                    startIcon={running.createTasks ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={runCreateTasks}
                                    disabled={running.createTasks || !testState.currentProductId}
                                    fullWidth
                                >
                                    3. Create Tasks (with all attributes)
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color={getButtonColor('editTasks')}
                                    startIcon={running.editTasks ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={runEditTasks}
                                    disabled={running.editTasks || !testState.currentTaskId}
                                    fullWidth
                                >
                                    4. Edit Tasks (update all attributes)
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color={getButtonColor('deleteTask')}
                                    startIcon={running.deleteTask ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={runDeleteTask}
                                    disabled={running.deleteTask || !testState.currentTaskId}
                                    fullWidth
                                >
                                    5. Delete Task
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color="error"
                                    startIcon={running.deleteProduct ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={runDeleteProduct}
                                    disabled={running.deleteProduct || !testState.currentProductId}
                                    fullWidth
                                >
                                    6. Delete Test Product
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Batch Testing */}
                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Batch Testing" subheader="Run all tests together" />
                        <CardContent>
                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    color="secondary"
                                    startIcon={<PlayArrow />}
                                    onClick={runAllTests}
                                    disabled={isAnyTestRunning}
                                    fullWidth
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    🚀 Run All Tests Sequentially
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    startIcon={running.reset ? <CircularProgress size={20} /> : <RestartAlt />}
                                    onClick={resetEnvironment}
                                    disabled={running.reset}
                                    fullWidth
                                >
                                    🧹 Reset Test Environment
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Data Management */}
                    <Card>
                        <CardHeader title="Data Management Center" subheader="Manage sample data" />
                        <CardContent>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Create 5 sample products with complete data for testing
                            </Alert>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={running.sampleData ? <CircularProgress size={20} /> : <DataObject />}
                                onClick={createSampleData}
                                disabled={running.sampleData}
                                fullWidth
                            >
                                Create 5 Sample Products
                            </Button>
                        </CardContent>
                    </Card>
                </Box>

                {/* Logs and Results */}
                <Box sx={{ flex: 1 }}>
                    {/* Test Results */}
                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Test Results" />
                        <CardContent>
                            {Object.keys(testState.results).length > 0 ? (
                                <Stack spacing={1}>
                                    {Object.entries(testState.results).map(([testName, result]) => (
                                        <Alert
                                            key={testName}
                                            severity={result.success ? 'success' : 'error'}
                                            icon={result.success ? <CheckCircle /> : <ErrorOutline />}
                                        >
                                            <Typography variant="body2">
                                                <strong>{testName}:</strong> {result.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {result.timestamp}
                                            </Typography>
                                        </Alert>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                    No test results yet. Run some tests to see results here.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Live Logs */}
                    <Card>
                        <CardHeader title="Live Logs" />
                        <CardContent>
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: '#1a1a1a',
                                    color: '#00ff00',
                                    fontFamily: 'Monaco, Consolas, monospace',
                                    fontSize: '0.75rem',
                                    height: '300px',
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap'
                                }}
                            >
                                {testState.logs.length > 0 ? 
                                    testState.logs.join('\n') : 
                                    'Ready for testing. Start a test to see live updates...'
                                }
                            </Paper>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default TestStudio;