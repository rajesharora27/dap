import * as React from 'react';
import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Alert, 
  LinearProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductInput!) {
    createProduct(input: $input) { id name description }
  }
`;

const CREATE_SOLUTION = gql`
  mutation CreateSolution($input: SolutionInput!) {
    createSolution(input: $input) { id name description }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) { id name description }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) { id name description }
  }
`;

const GET_TASK_STATUSES = gql`
  query TaskStatuses { 
    taskStatuses { id code label } 
  }
`;

export const SampleDataSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [createSolution] = useMutation(CREATE_SOLUTION);
  const [createCustomer] = useMutation(CREATE_CUSTOMER);
  const [createTask] = useMutation(CREATE_TASK);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const sampleData = {
    products: [
      {
        name: "E-Commerce Platform",
        description: "Complete online shopping platform with payment integration",
        customAttrs: { 
          category: "Web Application", 
          technology: "React, Node.js", 
          priority: "High",
          status: "active"
        }
      },
      {
        name: "Mobile Banking App",
        description: "Secure mobile banking application with biometric authentication",
        customAttrs: { 
          category: "Mobile Application", 
          technology: "React Native", 
          priority: "Critical",
          status: "active"
        }
      },
      {
        name: "CRM System",
        description: "Customer relationship management system for sales teams",
        customAttrs: { 
          category: "Business Application", 
          technology: "Angular, Spring Boot", 
          priority: "Medium",
          status: "pending"
        }
      },
      {
        name: "Analytics Dashboard",
        description: "Real-time analytics and reporting dashboard",
        customAttrs: { 
          category: "Analytics", 
          technology: "Vue.js, Python", 
          priority: "Medium",
          status: "completed"
        }
      }
    ],

    solutions: [
      {
        name: "Digital Transformation Suite",
        description: "Complete digital transformation solution for enterprises",
        customAttrs: { 
          industry: "Enterprise", 
          deployment: "Cloud", 
          duration: "12 months" 
        }
      },
      {
        name: "Financial Services Package",
        description: "Comprehensive financial services solution",
        customAttrs: { 
          industry: "Finance", 
          compliance: "SOX, PCI-DSS", 
          deployment: "Hybrid" 
        }
      },
      {
        name: "Retail Modernization",
        description: "Modern retail and e-commerce solution",
        customAttrs: { 
          industry: "Retail", 
          features: "Omnichannel, AI", 
          scalability: "Global" 
        }
      }
    ],

    customers: [
      {
        name: "TechCorp Industries",
        description: "Technology company specializing in enterprise solutions",
      },
      {
        name: "Global Bank Ltd",
        description: "International banking and financial services provider",
      },
      {
        name: "Retail Giants Inc",
        description: "Multi-national retail corporation",
      },
      {
        name: "StartUp Innovations",
        description: "Technology startup focused on innovative solutions",
      }
    ],

    tasks: [
      // E-Commerce Platform tasks
      { productIndex: 0, name: "User Authentication System", description: "Implement secure user login and registration", estMinutes: 480, weight: 8, status: "completed" },
      { productIndex: 0, name: "Product Catalog", description: "Build product browsing and search functionality", estMinutes: 720, weight: 12, status: "completed" },
      { productIndex: 0, name: "Shopping Cart", description: "Implement shopping cart and checkout process", estMinutes: 360, weight: 6, status: "active" },
      { productIndex: 0, name: "Payment Integration", description: "Integrate payment gateway (Stripe/PayPal)", estMinutes: 480, weight: 8, status: "pending" },
      { productIndex: 0, name: "Order Management", description: "Build order tracking and management system", estMinutes: 600, weight: 10, status: "pending" },
      
      // Mobile Banking App tasks  
      { productIndex: 1, name: "Biometric Authentication", description: "Implement fingerprint and face recognition", estMinutes: 960, weight: 16, status: "completed" },
      { productIndex: 1, name: "Account Dashboard", description: "Create main account overview screen", estMinutes: 480, weight: 8, status: "completed" },
      { productIndex: 1, name: "Transfer Functionality", description: "Implement money transfer between accounts", estMinutes: 720, weight: 12, status: "active" },
      { productIndex: 1, name: "Transaction History", description: "Build transaction history and filtering", estMinutes: 360, weight: 6, status: "active" },
      { productIndex: 1, name: "Security Features", description: "Advanced security and fraud detection", estMinutes: 840, weight: 14, status: "pending" },
      
      // CRM System tasks
      { productIndex: 2, name: "Contact Management", description: "Build contact database and management", estMinutes: 480, weight: 8, status: "completed" },
      { productIndex: 2, name: "Lead Tracking", description: "Implement lead scoring and tracking system", estMinutes: 600, weight: 10, status: "active" },
      { productIndex: 2, name: "Sales Pipeline", description: "Create visual sales pipeline management", estMinutes: 720, weight: 12, status: "pending" },
      { productIndex: 2, name: "Reporting Module", description: "Build sales reports and analytics", estMinutes: 540, weight: 9, status: "pending" },
      
      // Analytics Dashboard tasks
      { productIndex: 3, name: "Data Connectors", description: "Build connectors to various data sources", estMinutes: 720, weight: 12, status: "completed" },
      { productIndex: 3, name: "Visualization Engine", description: "Implement charts and graphs engine", estMinutes: 600, weight: 10, status: "completed" },
      { productIndex: 3, name: "Real-time Updates", description: "Add real-time data streaming", estMinutes: 480, weight: 8, status: "completed" },
      { productIndex: 3, name: "Custom Dashboards", description: "Allow users to create custom dashboards", estMinutes: 540, weight: 9, status: "completed" }
    ]
  };

  const seedData = async () => {
    setIsSeeding(true);
    setProgress(0);
    setLogs([]);
    
    try {
      addLog("Starting data seeding process...");
      
      // Create products
      setStatus("Creating products...");
      const createdProducts: any[] = [];
      for (let i = 0; i < sampleData.products.length; i++) {
        const product = sampleData.products[i];
        try {
          const result = await createProduct({
            variables: { input: product }
          });
          createdProducts.push(result.data.createProduct);
          addLog(`Created product: ${product.name}`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            addLog(`Product already exists: ${product.name}`);
            // For existing products, we'll use a fallback ID
            createdProducts.push({ id: `existing-product-${i}`, name: product.name });
          } else {
            addLog(`Error creating product ${product.name}: ${error.message}`);
          }
        }
        setProgress((i + 1) / sampleData.products.length * 25);
      }

      // Create solutions
      setStatus("Creating solutions...");
      for (let i = 0; i < sampleData.solutions.length; i++) {
        const solution = sampleData.solutions[i];
        try {
          await createSolution({
            variables: { input: solution }
          });
          addLog(`Created solution: ${solution.name}`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            addLog(`Solution already exists: ${solution.name}`);
          } else {
            addLog(`Error creating solution ${solution.name}: ${error.message}`);
          }
        }
        setProgress(25 + (i + 1) / sampleData.solutions.length * 25);
      }

      // Create customers
      setStatus("Creating customers...");
      for (let i = 0; i < sampleData.customers.length; i++) {
        const customer = sampleData.customers[i];
        try {
          await createCustomer({
            variables: { input: customer }
          });
          addLog(`Created customer: ${customer.name}`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            addLog(`Customer already exists: ${customer.name}`);
          } else {
            addLog(`Error creating customer ${customer.name}: ${error.message}`);
          }
        }
        setProgress(50 + (i + 1) / sampleData.customers.length * 25);
      }

      // Create tasks (this needs task statuses first)
      setStatus("Creating tasks...");
      const taskStatusId = "ts-1"; // Assuming default task status exists
      
      for (let i = 0; i < sampleData.tasks.length; i++) {
        const task = sampleData.tasks[i];
        const productId = createdProducts[task.productIndex]?.id || `p-${task.productIndex + 1}`;
        
        try {
          await createTask({
            variables: {
              input: {
                productId,
                name: task.name,
                description: task.description,
                estMinutes: task.estMinutes,
                weight: task.weight,
                statusId: taskStatusId,
                notes: `Status: ${task.status}`,
                customAttrs: { originalStatus: task.status }
              }
            }
          });
          addLog(`Created task: ${task.name}`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            addLog(`Task already exists: ${task.name}`);
          } else {
            addLog(`Error creating task ${task.name}: ${error.message}`);
          }
        }
        setProgress(75 + (i + 1) / sampleData.tasks.length * 25);
      }

      setStatus("Data seeding completed!");
      addLog("✅ Sample data seeding process completed successfully!");
      setProgress(100);
      
    } catch (error: any) {
      addLog(`❌ Error during seeding: ${error.message}`);
      setStatus("Error occurred during seeding");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Sample Data Seeder
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This will populate the database with sample products, solutions, customers, and tasks for testing.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={seedData} 
          disabled={isSeeding}
          size="large"
        >
          {isSeeding ? 'Seeding Data...' : 'Seed Sample Data'}
        </Button>
      </Box>

      {isSeeding && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            {status}
          </Typography>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}% complete
          </Typography>
        </Box>
      )}

      {logs.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Seeding Log:
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              maxHeight: 200, 
              overflow: 'auto', 
              p: 1, 
              bgcolor: 'grey.50' 
            }}
          >
            <List dense>
              {logs.map((log, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={log} 
                    primaryTypographyProps={{ 
                      variant: 'caption',
                      fontFamily: 'monospace'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};
