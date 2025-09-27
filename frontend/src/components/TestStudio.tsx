import * as React from 'react';
import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardHeader,
    Alert,
    AlertTitle,
    Chip,
    Paper,
    Stack,
    LinearProgress,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    Science,
    PlayArrow,
    CheckCircle,
    ErrorOutline,
    RestartAlt,
    BugReport,
    Delete,
    FileDownload,
    FileUpload
} from '@mui/icons-material';
import { ProductDialog } from '../components/dialogs/ProductDialog';
import { TaskDialog } from '../components/dialogs/TaskDialog';
import { ProductHandlers } from '../utils/sharedHandlers';
import type { Product } from '../types/shared';

interface Task {
    id: string;
    name: string;
    description?: string;
    estMinutes: number;
    weight: number;
    notes?: string;
    priority?: string;
    sequenceNumber?: number;
    licenseLevel?: string;
    customAttrs?: string;
    productId?: string;
};

import { useMutation, useQuery, useApolloClient, gql } from '@apollo/client';

// GraphQL Mutations and Queries
const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) {
      id
      name
      description
      customAttrs
      statusPercent
      licenses {
        id
        name
        description
        level
        isActive
      }
      outcomes {
        id
        name
        description
      }
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
      sequenceNumber
      license {
        id
        name
        level
      }
      outcomes {
        id
        name
      }
      customAttrs
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

const EXPORT_PRODUCTS_CSV = gql`
  mutation ExportProductsCsv {
    exportProductsCsv
  }
`;

const IMPORT_PRODUCTS_CSV = gql`
  mutation ImportProductsCsv($csv: String!) {
    importProductsCsv(csv: $csv) {
      success
      productsCreated
      productsUpdated
      errors
    }
  }
`;

const EXPORT_TASKS_CSV = gql`
  mutation ExportTasksCsv($productId: ID!) {
    exportTasksCsv(productId: $productId)
  }
`;

const IMPORT_TASKS_CSV = gql`
  mutation ImportTasksCsv($productId: ID!, $csv: String!, $mode: TaskImportMode!) {
    importTasksCsv(productId: $productId, csv: $csv, mode: $mode) {
      success
      tasksCreated
      tasksUpdated
      tasksDeleted
      mode
      errors
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
          statusPercent
          customAttrs
          licenses {
            id
            name
            description
            level
            isActive
          }
          outcomes {
            id
            name
            description
          }
        }
      }
    }
  }
`;

// Test data generation functions
const generateTestProduct = (index: number = 0): Omit<Product, 'id'> => ({
    name: `Test Product ${index + 1}`,
    description: `Automated test product ${index + 1}`,
    customAttrs: {
        testId: new Date().toISOString(),
        purpose: 'automated_testing',
        testIndex: index,
        testMode: 'automated',
        testCategory: ['basic', 'extended', 'performance'][index % 3],
        testPriority: ['high', 'medium', 'low'][index % 3],
        testComplexity: Math.floor(index / 3) + 1
    }
});

const generateTestTask = (index: number = 0): Omit<Task, 'id'> => ({
    name: `Test Task ${index + 1}`,
    description: `Automated test task ${index + 1} - ${['Setup', 'Configuration', 'Validation', 'Integration', 'Performance'][index % 5]}`,
    estMinutes: 30 + (index * 15),
    weight: 10 + (index * 5),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][index % 4],
    notes: `Generated test task ${index + 1} - Automated test sequence ${Math.floor(index / 4) + 1}`,
    customAttrs: JSON.stringify({
        testId: new Date().toISOString(),
        testIndex: index,
        testPhase: ['setup', 'execution', 'validation'][index % 3],
        testSuite: Math.floor(index / 3) + 1,
        automationLevel: ['full', 'partial', 'manual'][index % 3],
        testDependencies: index > 0 ? [`task-${index-1}`] : [],
        expectedDuration: 30 + (index * 15)
    })
});

// Initial test data for manual testing
const INITIAL_TEST_PRODUCT: Omit<Product, 'id'> = generateTestProduct();

const INITIAL_TEST_TASK: Omit<Task, 'id'> = {
    name: 'Test Task',
    description: 'Task for automated testing',
    estMinutes: 60,
    weight: 10,
    priority: 'MEDIUM',
    notes: 'Created by test automation',
    customAttrs: JSON.stringify({
        testId: new Date().toISOString()
    })
};

// Interface definitions
interface TestState {
    currentProductId: string;
    currentTaskId: string;
    logs: string[];
    results: { [key: string]: { success: boolean; message: string; timestamp: string } };
}

interface TestDialogState {
    product: boolean;
    task: boolean;
}

interface TestResult {
    success: boolean;
    message: string;
    timestamp: string;
}

class TestErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Test Studio Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <AlertTitle>Test Studio Error</AlertTitle>
                        Something went wrong in the test execution.
                        Please reset the test environment and try again.
                    </Alert>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.reload()}
                    >
                        Reload Test Studio
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

const TestStudio: React.FC<{}> = () => {
    const client = useApolloClient();
    const productHandlers = new ProductHandlers(client);
    
    // Dialog states
    const [showDialog, setShowDialog] = useState<TestDialogState>({
        product: false,
        task: false
    });
    // State
    const [testState, setTestState] = useState<TestState>({
        currentProductId: '',
        currentTaskId: '',
        logs: [],
        results: {}
    });
    const [running, setRunning] = useState<{ [key: string]: boolean }>({});

    // GraphQL mutations
    const [createProduct] = useMutation(CREATE_PRODUCT, {
        onError: (error) => {
            console.error('Create product error:', error);
            addLog(`❌ Failed to create product: ${error.message}`, 'error');
            setTestRunning('createProduct', false);
        },
        onCompleted: (data) => {
            addLog(`✅ Product created successfully: ${data.createProduct.name}`, 'success');
        }
    });

    const { refetch: refetchProducts, loading: productsLoading, error: productsError } = useQuery(PRODUCTS_QUERY, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
        onError: (error) => {
            console.error('Products query error:', error);
            addLog(`❌ Failed to fetch products: ${error.message}`, 'error');
        }
    });
    const [updateProduct] = useMutation(UPDATE_PRODUCT);
    const [deleteProduct] = useMutation(DELETE_PRODUCT);
    const [createTask] = useMutation(CREATE_TASK);
    const [updateTask] = useMutation(UPDATE_TASK);
    const [deleteTask] = useMutation(DELETE_TASK);
    const [createOutcome] = useMutation(CREATE_OUTCOME);

    // Data management mutations
    const [exportProductsCsv] = useMutation(EXPORT_PRODUCTS_CSV);
    const [importProductsCsv] = useMutation(IMPORT_PRODUCTS_CSV);
    const [exportTasksCsv] = useMutation(EXPORT_TASKS_CSV);
    const [importTasksCsv] = useMutation(IMPORT_TASKS_CSV);

    // Data management functions
    const handleExportTestData = () => {
        try {
            if (isAnyTestRunning) {
                addLog('⚠️ Cannot export while tests are running', 'warning');
                return;
            }

            const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            testConfiguration: {
                state: testState,
                testProduct: INITIAL_TEST_PRODUCT,
                testTask: INITIAL_TEST_TASK,
                customSettings: {
                    automationMode: 'full',
                    enabledFeatures: ['products', 'tasks', 'automation']
                }
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-studio-config-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addLog('Test configuration exported successfully', 'success');
        } catch (error: any) {
            addLog(`❌ Failed to export test configuration: ${error.message}`, 'error');
            console.error('Export error:', error);
        }
    };

    const handleImportTestData = () => {
        if (isAnyTestRunning) {
            addLog('⚠️ Cannot import while tests are running', 'warning');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement)?.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (!importData.version || !importData.testConfiguration) {
                    throw new Error('Invalid configuration file format');
                }

                setTestState(prev => ({
                    ...prev,
                    ...importData.testConfiguration.state
                }));

                addLog('Test configuration imported successfully', 'success');
            } catch (error: any) {
                addLog(`Failed to import configuration: ${error.message}`, 'error');
            }
        };

        input.click();
    };

    const handleExportProducts = async () => {
        try {
            const result = await exportProductsCsv();
            if (result.data?.exportProductsCsv) {
                // Create download link
                const blob = new Blob([result.data.exportProductsCsv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products-export-${new Date().toISOString()}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                addLog('✅ Products exported successfully');
            }
        } catch (error: any) {
            addLog(`❌ Error exporting products: ${error.message}`);
        }
    };

    const handleExportTasks = async () => {
        if (!testState.currentProductId) {
            addLog('❌ No product selected for task export');
            return;
        }

        try {
            const result = await exportTasksCsv({
                variables: { productId: testState.currentProductId }
            });
            if (result.data?.exportTasksCsv) {
                const blob = new Blob([result.data.exportTasksCsv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tasks-export-${testState.currentProductId}-${new Date().toISOString()}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                addLog('✅ Tasks exported successfully');
            }
        } catch (error: any) {
            addLog(`❌ Error exporting tasks: ${error.message}`);
        }
    };

    // Helper functions
    const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `<span class="timestamp">[${timestamp}]</span> <span class="${type}">${message}</span>`;
        setTestState(prev => {
            const newLogs = [...prev.logs, logEntry];
            // Auto-scroll after state update
            setTimeout(() => {
                const logElement = document.querySelector('.log-viewer');
                if (logElement) {
                    logElement.scrollTop = logElement.scrollHeight;
                }
            }, 0);
            return {
                ...prev,
                logs: newLogs
            };
        });
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

    // Create Test Product using ProductDialog
    const handleCreateProduct = async () => {
        const testName = 'createProduct';
        setTestRunning(testName, true);
        addLog('🏗️ Creating test product...', 'info');

        if (running.createProduct) {
            addLog('⚠️ Product creation already in progress', 'warning');
            return;
        }

        try {
            const result = await productHandlers.createProduct(INITIAL_TEST_PRODUCT);
            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Failed to create product');
            }
            setTestState(prev => ({ ...prev, currentProductId: result.data?.id || '' }));
            addLog(`✅ Created product: ${result.data.name} (ID: ${result.data.id})`);
            addResult(testName, true, `✅ Product created successfully: ${result.data.name}`);
            setShowDialog({ ...showDialog, product: false });
        } catch (error: any) {
            addLog(`❌ Error creating product: ${error.message}`);
            addResult(testName, false, `❌ Failed to create product: ${error.message}`);
        } finally {
            setTestRunning(testName, false);
        }
    };

    // Task mutation hooks
    const [createTaskMutation] = useMutation(CREATE_TASK);
    const [deleteTaskMutation] = useMutation(DELETE_TASK);

    // Task handling functions
    const handleCreateTask = async (taskData: Partial<Task>) => {
        const testName = 'createTask';
        setTestRunning(testName, true);
        addLog('📋 Creating test task...', 'info');

        if (!testState.currentProductId) {
            addLog('❌ No product selected. Please create a product first.', 'error');
            setTestRunning(testName, false);
            return;
        }

        if (running.createTask) {
            addLog('⚠️ Task creation already in progress', 'warning');
            return;
        }

        try {
            const result = await createTaskMutation({
                variables: {
                    input: {
                        ...INITIAL_TEST_TASK,
                        ...taskData,
                        productId: testState.currentProductId
                    }
                }
            });

            const task = result.data.createTask;
            setTestState(prev => ({ ...prev, currentTaskId: task.id }));
            addLog(`✅ Created task: ${task.name}`);
            addResult(testName, true, `✅ Task created successfully`);
            setShowDialog({ ...showDialog, task: false });
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
                name: `${INITIAL_TEST_TASK.name} - UPDATED`,
                description: `${INITIAL_TEST_TASK.description} [EDITED]`,
                estMinutes: 180,
                weight: 35,
                priority: 'CRITICAL',
                licenseLevel: 'Signature',
                notes: `${INITIAL_TEST_TASK.notes} [UPDATED]`
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

    // Run automated tests with generated data
    const runAutomatedTests = async (productCount: number = 3, tasksPerProduct: number = 2) => {
        if (isAnyTestRunning) {
            addLog('⚠️ Cannot start automated tests while other tests are running', 'warning');
            return;
        }

        const testName = 'automatedTests';
        setTestRunning(testName, true);
        addLog('🤖 Starting automated test sequence...', 'info');
        addLog(`📊 Configuration: ${productCount} products, ${tasksPerProduct} tasks per product`, 'info');
        const results: { productId: string; tasks: string[] }[] = [];

        try {
            // Create multiple products
            for (let i = 0; i < productCount; i++) {
                const productData = generateTestProduct(i);
                const result = await productHandlers.createProduct(productData);
                if (!result.success || !result.data) {
                    throw new Error(`Failed to create product ${i + 1}`);
                }
                const productId = result.data.id;
                addLog(`✅ Created product ${i + 1}: ${result.data.name}`);
                
                const taskIds: string[] = [];
                // Create multiple tasks for each product
                for (let j = 0; j < tasksPerProduct; j++) {
                    const taskData = {
                        ...generateTestTask(j),
                        productId
                    };
                    const taskResult = await createTaskMutation({
                        variables: { input: taskData }
                    });
                    const taskId = taskResult.data.createTask.id;
                    taskIds.push(taskId);
                    addLog(`✅ Created task ${j + 1} for product ${i + 1}`);
                }
                
                if (typeof productId === 'string') {
                    results.push({ productId, tasks: taskIds });
                } else {
                    addLog(`❌ Error: productId is undefined for product ${i + 1}`);
                }
            }

            // Test update operations
            for (const { productId, tasks } of results) {
                for (const taskId of tasks) {
                    await updateTask({
                        variables: {
                            id: taskId,
                            input: {
                                name: `Updated Task ${taskId}`,
                                description: 'Updated in automated test',
                                priority: 'HIGH'
                            }
                        }
                    });
                    addLog(`✅ Updated task ${taskId}`);
                }
            }

            // Test deletion
            for (const { productId, tasks } of results) {
                // Delete tasks first
                for (const taskId of tasks) {
                    await deleteTask({
                        variables: { id: taskId }
                    });
                    addLog(`✅ Deleted task ${taskId}`);
                }
                
                // Then delete product
                await deleteProduct({
                    variables: { id: productId }
                });
                addLog(`✅ Deleted product ${productId}`);
            }

            addLog('🎉 Automated test sequence completed successfully!');
            addResult('automatedTests', true, '✅ All automated tests passed');
        } catch (error: any) {
            addLog(`❌ Automated test sequence failed: ${error.message}`);
            addResult('automatedTests', false, `❌ Automated test sequence failed: ${error.message}`);
        }
    };

    // Run all tests sequentially
    const runAllTests = async () => {
        if (isAnyTestRunning) {
            addLog('⚠️ Cannot start test sequence while other tests are running', 'warning');
            return;
        }

        const testName = 'allTests';
        setTestRunning(testName, true);
        addLog('🚀 Starting complete test sequence...', 'info');

        let testsCompleted = 0;
        const totalTests = 3; // Number of tests in sequence

        try {
            // Create test product
            await handleCreateProduct();
            await new Promise(resolve => setTimeout(resolve, 500));

            // Create test task
            if (testState.currentProductId) {
                await handleCreateTask({
                    ...INITIAL_TEST_TASK,
                    productId: testState.currentProductId
                });
                await new Promise(resolve => setTimeout(resolve, 500));

                // Delete test task if created
                if (testState.currentTaskId) {
                    await runDeleteTask();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            testsCompleted++;
            addLog(`✨ Test sequence progress: ${testsCompleted}/${totalTests}`, 'info');
            addLog('🏁 Complete test sequence finished!', 'success');
            addResult('allTests', true, '🏁 All tests completed');
        } catch (error: any) {
            addLog(`❌ Test sequence failed: ${error.message}`);
            addResult('allTests', false, `❌ Test sequence failed: ${error.message}`);
        }
    };

    // 8. Reset Test Environment
    // Add cleanup on unmount
    React.useEffect(() => {
        return () => {
            // Cleanup any pending operations
            Object.keys(running).forEach(key => {
                if (running[key]) {
                    setRunning(prev => ({ ...prev, [key]: false }));
                }
            });
        };
    }, []);

    const resetEnvironment = async () => {
        if (isAnyTestRunning) {
            addLog('⚠️ Cannot reset while tests are running', 'warning');
            return;
        }

        setTestRunning('reset', true);
        addLog('🧹 Resetting test environment...', 'info');

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


    const getButtonColor = (testName: string) => {
        if (running[testName]) return 'info';
        const result = testState.results[testName];
        if (!result) return 'primary';
        return result.success ? 'success' : 'error';
    };

    const isAnyTestRunning = Object.values(running).some(r => r);

    return (
        <Box sx={{ 
            p: 3, 
            maxWidth: '1600px', 
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '350px 1fr', lg: '400px 1fr' },
            gap: 3,
            alignItems: 'start',
            '& > *': { height: 'fit-content' }
        }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <BugReport color="primary" fontSize="large" />
                    Test Studio
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Automated testing for product and task functionality
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

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '400px 1fr' },
                gap: 3
            }}>
                {/* Test Controls */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}>
                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Test Actions" subheader="Product and task testing" />
                        <CardContent>
                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<PlayArrow />}
                                    onClick={() => setShowDialog({ ...showDialog, product: true })}
                                    disabled={running.createProduct}
                                    fullWidth
                                >
                                    Create Test Product
                                </Button>

                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<PlayArrow />}
                                    onClick={() => setShowDialog({ ...showDialog, task: true })}
                                    disabled={!testState.currentProductId || running.createTask}
                                    fullWidth
                                >
                                    Create Test Task
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color="error"
                                    startIcon={<Delete />}
                                    onClick={runDeleteTask}
                                    disabled={!testState.currentTaskId || running.deleteTask}
                                    fullWidth
                                >
                                    Delete Test Task
                                </Button>

                                {/* Product Dialog */}
                                <ProductDialog
                                    open={showDialog.product}
                                    onClose={() => setShowDialog({ ...showDialog, product: false })}
                                    onSave={handleCreateProduct}
                                    product={null}
                                    title="Create Test Product"
                                />

                                <Button
                                    variant="outlined"
                                    size="large"
                                    color={getButtonColor('editProduct')}
                                    startIcon={running.editProduct ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={handleCreateProduct}
                                    disabled={running.editProduct || !testState.currentProductId}
                                    fullWidth
                                >
                                    2. Edit Test Product (update all attributes)
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

                    {/* Data Management */}
                    <Card sx={{ mb: 3 }}>
                        <CardHeader 
                            title="Data Management"
                            subheader="Import/Export test data and configurations"
                            action={
                                <Button
                                    size="small"
                                    startIcon={<RestartAlt />}
                                    onClick={() => setTestState(prev => ({ ...prev, exportData: null }))}
                                >
                                    Clear
                                </Button>
                            }
                        />
                        <CardContent>
                            <Stack spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<FileDownload />}
                                    onClick={handleExportTestData}
                                    fullWidth
                                >
                                    Export Test Configuration
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<FileUpload />}
                                    onClick={handleImportTestData}
                                    fullWidth
                                >
                                    Import Test Configuration
                                </Button>
                                <Divider />
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
                                    🚀 Run Manual Tests
                                </Button>
                                <Button
                                    variant="contained"
                                    size="large"
                                    color="primary"
                                    startIcon={<Science />}
                                    onClick={() => runAutomatedTests()}
                                    disabled={isAnyTestRunning}
                                    fullWidth
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    🤖 Run Automated Tests
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
                        <CardHeader title="Data Management" subheader="Import/Export test data" />
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Product Management
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<FileDownload />}
                                    onClick={handleExportProducts}
                                    fullWidth
                                >
                                    Export Products
                                </Button>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Task Management
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<FileDownload />}
                                    onClick={handleExportTasks}
                                    disabled={!testState.currentProductId}
                                    fullWidth
                                >
                                    Export Tasks
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Reset Test Environment */}
                    <Card>
                        <CardHeader title="Test Environment" subheader="Reset testing state" />
                        <CardContent>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Reset test environment to start fresh
                            </Alert>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<RestartAlt />}
                                onClick={resetEnvironment}
                                disabled={running.reset}
                                fullWidth
                            >
                                Reset Test Environment
                            </Button>
                        </CardContent>
                    </Card>
                </Box>

                {/* Logs and Results */}
                <Box sx={{ flex: 1 }}>
                    {/* Test Status and Results */}
                    <Card sx={{ mb: 3 }}>
                        <CardHeader
                            title="Test Status"
                            subheader={
                                testState.currentProductId ? 
                                `Test Product ID: ${testState.currentProductId}` : 
                                'No test product created'
                            }
                        />
                        <CardContent>
                            <Stack spacing={2}>
                                {/* Current Test State */}
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Chip
                                            label={`Test Product: ${testState.currentProductId ? 'Active' : 'None'}`}
                                            color={testState.currentProductId ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                        <Chip
                                            label={`Test Task: ${testState.currentTaskId ? 'Created' : 'None'}`}
                                            color={testState.currentTaskId ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                    </Stack>
                                </Paper>

                                {/* Test Results */}
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Test Results
                                    </Typography>
                                    {Object.keys(testState.results).length > 0 ? (
                                        <Stack spacing={1}>
                                            {Object.entries(testState.results).map(([testName, result]) => (
                                                <Alert
                                                    key={testName}
                                                    severity={result.success ? 'success' : 'error'}
                                                    icon={result.success ? <CheckCircle /> : <ErrorOutline />}
                                                    variant="outlined"
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2">
                                                            <strong>{testName}:</strong> {result.message}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {result.timestamp}
                                                        </Typography>
                                                    </Stack>
                                                </Alert>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                            No test results yet. Create a test product to begin testing.
                                        </Typography>
                                    )}
                                </Paper>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Task Dialog */}
                    <TaskDialog
                        open={showDialog.task}
                        onClose={() => setShowDialog({ ...showDialog, task: false })}
                        onSave={handleCreateTask}
                        task={null}
                        title="Create Test Task"
                        productId={testState.currentProductId}
                        outcomes={[]}
                        availableLicenses={[]}
                        existingTasks={[]}
                    />

                    {/* Live Logs */}
                    <Card sx={{
                        position: 'sticky',
                        top: 16,
                        maxHeight: 'calc(100vh - 32px)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <CardHeader 
                            title="Live Logs"
                            action={
                                <Button
                                    size="small"
                                    onClick={() => setTestState(prev => ({ ...prev, logs: [] }))}
                                >
                                    Clear Logs
                                </Button>
                            }
                        />
                        <CardContent>
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: '#1a1a1a',
                                    color: '#00ff00',
                                    fontFamily: 'Monaco, Consolas, monospace',
                                    fontSize: '0.875rem',
                                    height: '500px',
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap',
                                    position: 'relative',
                                    borderRadius: 2,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    '& .timestamp': { color: '#888' },
                                    '& .success': { color: '#4caf50' },
                                    '& .error': { color: '#f44336' },
                                    '& .warning': { color: '#ff9800' },
                                    '& .info': { color: '#2196f3' },
                                    '&::-webkit-scrollbar': {
                                        width: '10px',
                                        height: '10px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: 'rgba(0,255,0,0.3)',
                                        borderRadius: '5px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0,255,0,0.5)'
                                        }
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        borderRadius: '5px'
                                    }
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

const TestStudioWithErrorBoundary: React.FC = () => (
    <TestErrorBoundary>
        <TestStudio />
    </TestErrorBoundary>
);

export default TestStudioWithErrorBoundary;