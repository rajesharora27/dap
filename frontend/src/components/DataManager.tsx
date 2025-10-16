import * as React from 'react';
import { useState } from 'react';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import {
    Paper,
    Typography,
    Button,
    Box,
    Alert,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Stack,
    Divider,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Delete, Refresh, Warning, DataObject, Add, RemoveCircleOutline } from '@mui/icons-material';

const DELETE_ALL_TASKS = gql`
  mutation ProcessDeletionQueue {
    processDeletionQueue
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { id name description }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) { id name description }
  }
`;

const CREATE_LICENSE = gql`
  mutation CreateLicense($input: LicenseInput!) {
    createLicense(input: $input) { id name description level isActive }
  }
`;

const CREATE_OUTCOME = gql`
  mutation CreateOutcome($input: OutcomeInput!) {
    createOutcome(input: $input) { id name description }
  }
`;

const QUEUE_TASK_DELETION = gql`
  mutation QueueTaskSoftDelete($id: ID!) {
    queueTaskSoftDelete(id: $id)
  }
`;

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    products(first: 100) {
      edges {
        node {
          id
          name
          description
          tasks(first: 100) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`;

export const DataManager: React.FC = () => {
    const client = useApolloClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [dataStats, setDataStats] = useState<{ products: number; tasks: number }>({ products: 0, tasks: 0 });
    const [addProductDialog, setAddProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [selectedProductForDeletion, setSelectedProductForDeletion] = useState('');
    const [availableProducts, setAvailableProducts] = useState<Array<{ id: string, name: string }>>([]);

    const [deleteProduct] = useMutation(DELETE_PRODUCT);
    const [createProduct] = useMutation(CREATE_PRODUCT);
    const [createTask] = useMutation(CREATE_TASK);
    const [createLicense] = useMutation(CREATE_LICENSE);
    const [createOutcome] = useMutation(CREATE_OUTCOME);
    const [queueTaskDeletion] = useMutation(QUEUE_TASK_DELETION);
    const [processDeletionQueue] = useMutation(DELETE_ALL_TASKS);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Comprehensive sample data with proper structure
    const sampleData = {
        products: [
            { name: "E-Commerce Platform", description: "Complete online shopping solution with advanced features" },
            { name: "Mobile Banking Application", description: "Secure mobile banking app with biometric authentication" },
            { name: "Customer Relationship Management", description: "Comprehensive CRM system for sales and support teams" },
            { name: "Business Intelligence Dashboard", description: "Advanced analytics and reporting platform" },
            { name: "Healthcare Management System", description: "Complete healthcare management solution with compliance features" }
        ],

        // License templates for each product
        licenseTemplates: [
            { name: "Essential License", description: "Basic access tier providing core functionality", level: 1, isActive: true },
            { name: "Advantage License", description: "Enhanced access tier with advanced features", level: 2, isActive: true },
            { name: "Signature License", description: "Premium access tier with full feature set", level: 3, isActive: true }
        ],

        // Comprehensive Outcome Data for each product
        outcomes: [
            // E-Commerce Platform outcomes (Product 0)
            { productIndex: 0, name: "Increased Online Sales", description: "Drive significant revenue growth through improved user experience and conversion optimization" },
            { productIndex: 0, name: "Enhanced Customer Experience", description: "Provide seamless, intuitive shopping experience that increases customer satisfaction and loyalty" },
            { productIndex: 0, name: "Operational Efficiency", description: "Streamline business operations with automated inventory, order processing, and customer management" },
            { productIndex: 0, name: "Market Expansion", description: "Enable business growth into new markets and customer segments through scalable platform architecture" },

            // Mobile Banking outcomes (Product 1)
            { productIndex: 1, name: "Enhanced Security & Trust", description: "Build customer confidence through advanced biometric authentication and fraud prevention" },
            { productIndex: 1, name: "24/7 Banking Access", description: "Provide customers with convenient, round-the-clock access to all banking services" },
            { productIndex: 1, name: "Reduced Operational Costs", description: "Decrease branch visits and support calls through comprehensive self-service capabilities" },
            { productIndex: 1, name: "Digital Financial Inclusion", description: "Extend banking services to underserved populations through mobile accessibility" },

            // CRM System outcomes (Product 2)
            { productIndex: 2, name: "Improved Sales Performance", description: "Increase revenue through better lead management, pipeline visibility, and sales process optimization" },
            { productIndex: 2, name: "Enhanced Customer Relationships", description: "Strengthen customer bonds through personalized interactions and comprehensive relationship tracking" },
            { productIndex: 2, name: "Data-Driven Decisions", description: "Enable informed business decisions through comprehensive analytics and reporting capabilities" },
            { productIndex: 2, name: "Team Productivity Boost", description: "Improve sales team efficiency through automation and streamlined workflows" },

            // Business Intelligence outcomes (Product 3)
            { productIndex: 3, name: "Real-Time Business Insights", description: "Enable immediate access to critical business metrics and performance indicators" },
            { productIndex: 3, name: "Improved Decision Making", description: "Support strategic decisions with comprehensive data analysis and predictive analytics" },
            { productIndex: 3, name: "Operational Visibility", description: "Provide complete transparency into business operations and process performance" },
            { productIndex: 3, name: "Competitive Advantage", description: "Gain market advantage through superior data analysis and business intelligence capabilities" },

            // Healthcare Management outcomes (Product 4)  
            { productIndex: 4, name: "Improved Patient Care", description: "Enhance patient outcomes through comprehensive health records and coordinated care management" },
            { productIndex: 4, name: "Operational Efficiency", description: "Streamline healthcare operations with automated scheduling, billing, and compliance management" },
            { productIndex: 4, name: "Regulatory Compliance", description: "Ensure adherence to healthcare regulations and maintain comprehensive audit trails" },
            { productIndex: 4, name: "Cost Reduction", description: "Reduce operational costs through process automation and improved resource management" }
        ],

        // Comprehensive Task Data mapped to products
        tasks: [
            // E-Commerce Platform tasks (Product 0)
            { productIndex: 0, name: "User Authentication & Authorization", description: "Implement secure user registration, login, and role-based access control", estMinutes: 960, weight: 10 },
            { productIndex: 0, name: "Product Catalog Management", description: "Build comprehensive product management system with categories, attributes, and inventory", estMinutes: 1440, weight: 16 },
            { productIndex: 0, name: "Shopping Cart & Checkout", description: "Develop intuitive shopping cart with multi-step checkout process", estMinutes: 720, weight: 8 },
            { productIndex: 0, name: "Payment Gateway Integration", description: "Integrate multiple payment processors with secure transaction handling", estMinutes: 900, weight: 10 },
            { productIndex: 0, name: "Order Management System", description: "Create comprehensive order tracking and management system", estMinutes: 1080, weight: 12 },
            { productIndex: 0, name: "Inventory Management", description: "Build automated inventory tracking with low-stock alerts", estMinutes: 810, weight: 9 },
            { productIndex: 0, name: "Admin Dashboard", description: "Develop comprehensive administrative interface for store management", estMinutes: 900, weight: 10 },
            { productIndex: 0, name: "Mobile Responsiveness", description: "Ensure full mobile compatibility and responsive design", estMinutes: 540, weight: 6 },
            { productIndex: 0, name: "SEO Optimization", description: "Implement search engine optimization features", estMinutes: 450, weight: 5 },
            { productIndex: 0, name: "Performance Optimization", description: "Optimize application performance and loading speeds", estMinutes: 720, weight: 8 },

            // Mobile Banking tasks (Product 1)
            { productIndex: 1, name: "Biometric Authentication", description: "Implement fingerprint and facial recognition for secure login", estMinutes: 1620, weight: 18 },
            { productIndex: 1, name: "Account Dashboard", description: "Create comprehensive account overview with balance and transaction history", estMinutes: 720, weight: 8 },
            { productIndex: 1, name: "Money Transfer System", description: "Build secure peer-to-peer and bank transfer functionality", estMinutes: 1440, weight: 16 },
            { productIndex: 1, name: "Transaction History", description: "Develop detailed transaction logging and search capabilities", estMinutes: 540, weight: 6 },
            { productIndex: 1, name: "Bill Payment System", description: "Create automated bill payment and scheduling system", estMinutes: 810, weight: 9 },
            { productIndex: 1, name: "Investment Portfolio", description: "Build investment tracking and management features", estMinutes: 1080, weight: 12 },
            { productIndex: 1, name: "Security Center", description: "Implement comprehensive security management and monitoring", estMinutes: 900, weight: 10 },
            { productIndex: 1, name: "Push Notifications", description: "Create intelligent notification system for transactions and alerts", estMinutes: 450, weight: 5 },
            { productIndex: 1, name: "Offline Functionality", description: "Enable core banking functions in offline mode", estMinutes: 720, weight: 8 },
            { productIndex: 1, name: "Accessibility Features", description: "Implement comprehensive accessibility for users with disabilities", estMinutes: 360, weight: 4 },

            // CRM tasks (Product 2)
            { productIndex: 2, name: "Contact Management", description: "Build comprehensive contact database with advanced search", estMinutes: 900, weight: 10 },
            { productIndex: 2, name: "Lead Scoring & Tracking", description: "Implement intelligent lead scoring and progression tracking", estMinutes: 1260, weight: 14 },
            { productIndex: 2, name: "Sales Pipeline Management", description: "Create visual sales pipeline with drag-and-drop functionality", estMinutes: 1080, weight: 12 },
            { productIndex: 2, name: "Email Marketing Integration", description: "Integrate with email marketing platforms for campaign management", estMinutes: 720, weight: 8 },
            { productIndex: 2, name: "Reporting & Analytics", description: "Build comprehensive reporting dashboard with custom metrics", estMinutes: 900, weight: 10 },
            { productIndex: 2, name: "Task & Activity Management", description: "Create task assignment and activity tracking system", estMinutes: 540, weight: 6 },
            { productIndex: 2, name: "Integration Hub", description: "Build API integrations with popular business tools", estMinutes: 810, weight: 9 },
            { productIndex: 2, name: "Mobile CRM App", description: "Develop mobile application for field sales teams", estMinutes: 1080, weight: 12 },
            { productIndex: 2, name: "Customer Support Portal", description: "Create customer-facing support ticket and knowledge base system", estMinutes: 720, weight: 8 },
            { productIndex: 2, name: "Data Import/Export", description: "Build tools for bulk data import and export operations", estMinutes: 540, weight: 6 },
            { productIndex: 2, name: "GDPR Compliance", description: "Implement data privacy and GDPR compliance features", estMinutes: 450, weight: 5 },

            // Business Intelligence tasks (Product 3)
            { productIndex: 3, name: "Data Connector Framework", description: "Build universal data connector for multiple data sources", estMinutes: 1440, weight: 16 },
            { productIndex: 3, name: "Interactive Visualization Engine", description: "Create drag-and-drop dashboard builder with rich visualizations", estMinutes: 1260, weight: 14 },
            { productIndex: 3, name: "Dashboard Builder", description: "Build intuitive dashboard creation and customization tools", estMinutes: 1080, weight: 12 },
            { productIndex: 3, name: "Report Generator", description: "Create automated report generation and scheduling system", estMinutes: 900, weight: 10 },
            { productIndex: 3, name: "Data Processing Pipeline", description: "Build ETL pipeline for data transformation and cleaning", estMinutes: 1170, weight: 13 },
            { productIndex: 3, name: "Real-time Streaming", description: "Implement real-time data streaming and processing capabilities", estMinutes: 810, weight: 9 },
            { productIndex: 3, name: "User Management & Permissions", description: "Create role-based access control for dashboards and data", estMinutes: 540, weight: 6 },
            { productIndex: 3, name: "API Development", description: "Build RESTful APIs for data access and integration", estMinutes: 720, weight: 8 },
            { productIndex: 3, name: "Performance Optimization", description: "Optimize query performance and data loading speeds", estMinutes: 630, weight: 7 },
            { productIndex: 3, name: "Export & Sharing", description: "Build data export and dashboard sharing capabilities", estMinutes: 450, weight: 5 },

            // Healthcare Management tasks (Product 4)
            { productIndex: 4, name: "Patient Registration System", description: "Build comprehensive patient intake and registration system", estMinutes: 900, weight: 10 },
            { productIndex: 4, name: "Electronic Health Records", description: "Create secure EHR system with complete medical history tracking", estMinutes: 1440, weight: 16 },
            { productIndex: 4, name: "Appointment Scheduling", description: "Build intelligent appointment scheduling with conflict resolution", estMinutes: 810, weight: 9 },
            { productIndex: 4, name: "Billing & Insurance", description: "Create comprehensive billing system with insurance claim processing", estMinutes: 1080, weight: 12 },
            { productIndex: 4, name: "Prescription Management", description: "Build prescription writing and medication tracking system", estMinutes: 720, weight: 8 },
            { productIndex: 4, name: "Lab Results Integration", description: "Integrate with laboratory systems for automated result delivery", estMinutes: 630, weight: 7 },
            { productIndex: 4, name: "Telemedicine Platform", description: "Build video consultation and remote care platform", estMinutes: 1260, weight: 14 },
            { productIndex: 4, name: "Inventory Management", description: "Create medical supply and equipment inventory system", estMinutes: 540, weight: 6 },
            { productIndex: 4, name: "Reporting & Compliance", description: "Build regulatory reporting and compliance tracking system", estMinutes: 720, weight: 8 },
            { productIndex: 4, name: "Mobile Patient App", description: "Develop patient-facing mobile application for health management", estMinutes: 900, weight: 10 }
        ]
    };

    const fetchCurrentData = async () => {
        try {
            const result = await client.query({
                query: GET_ALL_PRODUCTS,
                fetchPolicy: 'network-only'
            });

            const products = result.data.products.edges.map((edge: any) => edge.node);
            const totalTasks = products.reduce((sum: number, product: any) =>
                sum + product.tasks.edges.length, 0);

            setDataStats({
                products: products.length,
                tasks: totalTasks
            });

            // Store products for delete dropdown
            setAvailableProducts(products.map((product: any) => ({
                id: product.id,
                name: product.name
            })));
        } catch (error) {
            console.error('Error fetching current data:', error);
        }
    };

    React.useEffect(() => {
        fetchCurrentData();
    }, []);

    const deleteAllData = async () => {
        try {
            setStatus('Deleting all data...');
            addLog('🗑️ Starting comprehensive data cleanup...');

            // First, queue all tasks for deletion
            const result = await client.query({
                query: GET_ALL_PRODUCTS,
                fetchPolicy: 'network-only'
            });

            const products = result.data.products.edges.map((edge: any) => edge.node);
            let taskCount = 0;

            for (const product of products) {
                const tasks = product.tasks?.edges || [];
                for (const taskEdge of tasks) {
                    try {
                        await queueTaskDeletion({ variables: { id: taskEdge.node.id } });
                        taskCount++;
                    } catch (error: any) {
                        addLog(`⚠️ Failed to queue task ${taskEdge.node.name}: ${error.message}`);
                    }
                }
            }

            addLog(`📋 Queued ${taskCount} tasks for deletion`);

            // Process the deletion queue
            addLog('🧹 Processing task deletion queue...');
            await processDeletionQueue();

            // Delete all products
            addLog('🏭 Deleting all products...');
            for (const product of products) {
                try {
                    await deleteProduct({ variables: { id: product.id } });
                    addLog(`✅ Deleted product: ${product.name}`);
                } catch (error: any) {
                    addLog(`❌ Failed to delete product ${product.name}: ${error.message}`);
                }
            }

            addLog('🎉 Data cleanup completed successfully!');

        } catch (error: any) {
            addLog(`❌ Error during data cleanup: ${error.message}`);
            throw error;
        }
    };

    const createSampleData = async () => {
        try {
            setStatus('Creating comprehensive sample data...');
            addLog('Starting comprehensive sample data creation...');

            const createdProducts: any[] = [];
            const createdOutcomes: any[] = [];

            // Step 1: Create Products
            addLog('🏭 Step 1: Creating products...');
            for (let i = 0; i < sampleData.products.length; i++) {
                const product = sampleData.products[i];
                try {
                    const result = await createProduct({
                        variables: { input: product }
                    });
                    createdProducts.push(result.data.createProduct);
                    addLog(`✅ Created product: ${product.name}`);
                    setProgress(((i + 1) / sampleData.products.length) * 25); // First 25% for products
                } catch (error: any) {
                    addLog(`❌ Failed to create product ${product.name}: ${error.message}`);
                }
            }

            // Step 2: Create Licenses for each Product
            addLog('📋 Step 2: Creating licenses for each product...');
            let licenseCount = 0;
            const totalLicenses = createdProducts.length * sampleData.licenseTemplates.length;

            for (const product of createdProducts) {
                for (const template of sampleData.licenseTemplates) {
                    try {
                        const licenseInput = {
                            ...template,
                            name: `${product.name} - ${template.name}`,
                            productId: product.id
                        };

                        const result = await createLicense({
                            variables: { input: licenseInput }
                        });
                        licenseCount++;
                        addLog(`✅ Created license: ${licenseInput.name}`);
                        setProgress(25 + (licenseCount / totalLicenses) * 25); // Next 25% for licenses
                    } catch (error: any) {
                        addLog(`❌ Failed to create license for ${product.name}: ${error.message}`);
                    }
                }
            }

            // Step 3: Create Outcomes for Products
            addLog('🎯 Step 3: Creating outcomes...');
            for (let i = 0; i < sampleData.outcomes.length; i++) {
                const outcome = sampleData.outcomes[i];
                const productId = createdProducts[outcome.productIndex]?.id;

                if (productId) {
                    try {
                        const result = await createOutcome({
                            variables: {
                                input: {
                                    name: outcome.name,
                                    description: outcome.description,
                                    productId: productId
                                }
                            },
                            refetchQueries: ['Products', 'Outcomes'],
                            awaitRefetchQueries: true
                        });
                        createdOutcomes.push(result.data.createOutcome);
                        addLog(`✅ Created outcome: ${outcome.name}`);
                        setProgress(50 + ((i + 1) / sampleData.outcomes.length) * 25); // Next 25% for outcomes
                    } catch (error: any) {
                        addLog(`❌ Failed to create outcome ${outcome.name}: ${error.message}`);
                    }
                } else {
                    addLog(`❌ No product found for outcome: ${outcome.name}`);
                }
            }

            // Step 4: Create Tasks
            addLog('⚙️ Step 4: Creating tasks...');
            let tasksCreated = 0;
            const totalTasks = sampleData.tasks.length;

            for (let i = 0; i < sampleData.tasks.length; i++) {
                const task = sampleData.tasks[i];
                const productId = createdProducts[task.productIndex]?.id;

                if (productId) {
                    // Use license levels that actually exist for this product (Essential, Advantage, Signature)
                    // Since we create 3 licenses per product with levels 1, 2, 3, we can use any of these
                    const availableLicenseLevels = ['Essential', 'Advantage', 'Signature'];
                    const randomLicenseLevel = availableLicenseLevels[Math.floor(Math.random() * availableLicenseLevels.length)];

                    try {
                        await createTask({
                            variables: {
                                input: {
                                    productId,
                                    name: task.name,
                                    description: task.description,
                                    estMinutes: task.estMinutes,
                                    weight: task.weight,
                                    licenseLevel: randomLicenseLevel,
                                    priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
                                }
                            }
                        });
                        tasksCreated++;
                        addLog(`✅ Created task: ${task.name} (License: ${randomLicenseLevel})`);
                        setProgress(75 + ((i + 1) / totalTasks) * 25); // Final 25% for tasks
                    } catch (error: any) {
                        addLog(`❌ Failed to create task ${task.name}: ${error.message}`);
                    }
                } else {
                    addLog(`❌ No product found for task: ${task.name}`);
                }
            }

            addLog(`🎉 Comprehensive sample data creation completed!`);
            addLog(`📊 Summary:`);
            addLog(`   • ${createdProducts.length} products created`);
            addLog(`   • ${licenseCount} licenses created (${sampleData.licenseTemplates.length} per product: Essential, Advantage, Signature)`);
            addLog(`   • ${createdOutcomes.length} outcomes created`);
            addLog(`   • ${tasksCreated} tasks created with valid license levels`);
            addLog(`   • All licenses are product-scoped and validated`);
            addLog(`   • Tasks use randomized license levels from their product's available licenses`);

            // Refresh data stats
            await fetchCurrentData();

        } catch (error: any) {
            addLog(`❌ Error creating sample data: ${error.message}`);
            throw error;
        }
    };

    const handleResetData = async () => {
        setConfirmDialog(false);
        setIsProcessing(true);
        setProgress(0);
        setLogs([]);

        try {
            await deleteAllData();
            await createSampleData();

            setStatus('✅ Data reset completed successfully!');
            setProgress(100);

            // Refresh the Apollo cache
            await client.refetchQueries({
                include: ['Products', 'GetAllProducts']
            });

        } catch (error: any) {
            setStatus('❌ Error occurred during data reset');
            addLog(`Fatal error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddProduct = async () => {
        if (!newProductName.trim()) {
            setStatus('❌ Product name is required');
            return;
        }

        setIsProcessing(true);
        setStatus('Creating new product...');
        setProgress(25);

        try {
            addLog('Creating new product...');
            const result = await createProduct({
                variables: {
                    input: {
                        name: newProductName.trim(),
                        description: newProductDescription.trim() || `Product: ${newProductName.trim()}`,
                        customAttrs: {
                            createdBy: 'Data Manager',
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            });

            setProgress(75);
            addLog(`✅ Product created: ${result.data.createProduct.name} (ID: ${result.data.createProduct.id})`);

            // Refresh data
            await fetchCurrentData();
            setProgress(100);
            setStatus(`✅ Product "${newProductName}" created successfully!`);

            // Clear form and close dialog
            setNewProductName('');
            setNewProductDescription('');
            setAddProductDialog(false);

            // Refresh Apollo cache
            await client.refetchQueries({
                include: ['Products', 'GetAllProducts']
            });

        } catch (error: any) {
            setStatus(`❌ Failed to create product: ${error.message}`);
            addLog(`❌ Product creation failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProductForDeletion) {
            setStatus('❌ No product selected for deletion');
            return;
        }

        setIsProcessing(true);
        setStatus('Deleting product...');
        setProgress(25);

        try {
            addLog(`Deleting product ${selectedProductForDeletion}...`);
            await deleteProduct({
                variables: { id: selectedProductForDeletion }
            });

            setProgress(75);
            addLog(`✅ Product deleted: ${selectedProductForDeletion}`);

            // Refresh data
            await fetchCurrentData();
            setProgress(100);
            setStatus('✅ Product deleted successfully!');

            // Clear selection and close dialog
            setSelectedProductForDeletion('');
            setDeleteProductDialog(false);

            // Refresh Apollo cache
            await client.refetchQueries({
                include: ['Products', 'GetAllProducts']
            });

        } catch (error: any) {
            setStatus(`❌ Failed to delete product: ${error.message}`);
            addLog(`❌ Product deletion failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3, m: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DataObject />
                Sample Data Manager
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Manage comprehensive sample data with products, licenses, outcomes, and tasks.
                    This will create a complete dataset with proper license validation.
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Chip
                        icon={<DataObject />}
                        label={`${dataStats.products} Products`}
                        color="primary"
                        variant="outlined"
                    />
                    <Chip
                        icon={<DataObject />}
                        label={`${dataStats.tasks} Tasks`}
                        color="secondary"
                        variant="outlined"
                    />
                </Stack>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setAddProductDialog(true)}
                    disabled={isProcessing}
                >
                    Add Product
                </Button>

                <Button
                    variant="contained"
                    color="warning"
                    startIcon={<RemoveCircleOutline />}
                    onClick={() => setDeleteProductDialog(true)}
                    disabled={isProcessing}
                >
                    Delete Product
                </Button>

                <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setConfirmDialog(true)}
                    disabled={isProcessing}
                >
                    Reset All Data
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchCurrentData}
                    disabled={isProcessing}
                >
                    Refresh Stats
                </Button>
            </Box>

            {status && (
                <Alert severity={status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'} sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            {isProcessing && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {Math.round(progress)}% complete
                    </Typography>
                </Box>
            )}

            {logs.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>Processing Log:</Typography>
                    <List dense>
                        {logs.map((log, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={log}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        sx: { fontFamily: 'monospace' }
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" />
                    Confirm Data Reset
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        This will permanently delete all existing data and create fresh sample data including:
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                        <li>5 Products with comprehensive descriptions</li>
                        <li>15 Licenses (3 per product: Essential, Advantage, Signature)</li>
                        <li>20 Outcomes mapped to products</li>
                        <li>50 Tasks with proper license validation</li>
                    </Box>
                    <Typography color="error" sx={{ mt: 2 }}>
                        This action cannot be undone!
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleResetData} color="error" variant="contained">
                        Reset Data
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Product Dialog */}
            <Dialog open={addProductDialog} onClose={() => setAddProductDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Add color="primary" />
                    Add New Product
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            autoFocus
                            label="Product Name"
                            fullWidth
                            required
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            sx={{ mb: 2 }}
                            helperText="Enter a unique name for the product"
                        />
                        <TextField
                            label="Product Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newProductDescription}
                            onChange={(e) => setNewProductDescription(e.target.value)}
                            helperText="Optional description of the product"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddProductDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddProduct}
                        color="primary"
                        variant="contained"
                        disabled={!newProductName.trim() || isProcessing}
                    >
                        Add Product
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Product Dialog */}
            <Dialog open={deleteProductDialog} onClose={() => setDeleteProductDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" />
                    Delete Product
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Select a product to delete. This will also delete all associated licenses, outcomes, and tasks.
                    </Typography>
                    <FormControl fullWidth>
                        <InputLabel>Select Product to Delete</InputLabel>
                        <Select
                            value={selectedProductForDeletion}
                            label="Select Product to Delete"
                            onChange={(e) => setSelectedProductForDeletion(e.target.value)}
                        >
                            {availableProducts.length === 0 ? (
                                <MenuItem value=""><em>No products available</em></MenuItem>
                            ) : (
                                availableProducts.map((product) => (
                                    <MenuItem key={product.id} value={product.id}>
                                        {product.name}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>
                    <Typography color="error" sx={{ mt: 2 }}>
                        Warning: This action cannot be undone!
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteProductDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteProduct}
                        color="error"
                        variant="contained"
                        disabled={!selectedProductForDeletion || isProcessing}
                    >
                        Delete Product
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
