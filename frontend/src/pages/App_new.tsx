import * as React from 'react';
import { useState } from 'react';
import { 
  Box, 
  CssBaseline, 
  Drawer, 
  Toolbar, 
  Typography, 
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  LinearProgress,
  Button
} from '@mui/material';
import { 
  Inventory2 as ProductIcon,
  Lightbulb as SolutionIcon,
  People as CustomerIcon
} from '@mui/icons-material';
import Grid from '@mui/material/Grid';

// Lazy load components
const TaskDetail = React.lazy(()=>import('../components/TaskDetail').then(m=>({ default: m.TaskDetail })));
const AuditPanel = React.lazy(()=>import('../components/AuditPanel').then(m=>({ default: m.AuditPanel })));
const ChangeSetsPanel = React.lazy(()=>import('../components/ChangeSetsPanel').then(m=>({ default: m.ChangeSetsPanel })));
const TelemetryPanel = React.lazy(()=>import('../components/TelemetryPanel').then(m=>({ default: m.TelemetryPanel })));
const DependenciesPanel = React.lazy(()=>import('../components/DependenciesPanel').then(m=>({ default: m.DependenciesPanel })));
const CsvPanel = React.lazy(()=>import('../components/CsvPanel').then(m=>({ default: m.CsvPanel })));

// Import direct components
import { AuthBar } from '../components/AuthBar';
import { useAuth } from '../components/AuthContext';
import { LoginPage } from '../components/LoginPage';
import { SampleDataSeeder } from '../components/SampleDataSeeder';
import { ProductManagement } from '../components/ProductManagement';
import { SolutionManagement } from '../components/SolutionManagement';
import { CustomerManagement } from '../components/CustomerManagement';
import { TaskList } from '../components/TaskList';
import { gql, useQuery } from '@apollo/client';

// GraphQL queries for fetching data with relationships
const PRODUCTS = gql`
  query Products { 
    products(first:50) { 
      edges { 
        node { 
          id
          name
          description
          status
          tasks(first: 20) {
            edges {
              node {
                id
                name
                description
                status
                completedAt
                createdAt
              }
            }
          }
        } 
      } 
    } 
  }
`;

const SOLUTIONS = gql`
  query Solutions {
    solutions(first: 50) {
      edges {
        node {
          id
          name
          description
          products(first: 20) {
            edges {
              node {
                id
                name
                description
                status
                tasks(first: 20) {
                  edges {
                    node {
                      id
                      name
                      description
                      status
                      completedAt
                      createdAt
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CUSTOMERS = gql`
  query Customers {
    customers(first: 50) {
      edges {
        node {
          id
          name
          description
          products(first: 20) {
            edges {
              node {
                id
                name
                description
                status
                tasks(first: 20) {
                  edges {
                    node {
                      id
                      name
                      description
                      status
                      completedAt
                      createdAt
                    }
                  }
                }
              }
            }
          }
          solutions(first: 20) {
            edges {
              node {
                id
                name
                description
                products(first: 20) {
                  edges {
                    node {
                      id
                      name
                      description
                      status
                      tasks(first: 20) {
                        edges {
                          node {
                            id
                            name
                            description
                            status
                            completedAt
                            createdAt
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const drawerWidth = 240;

export default function App() {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  
  // State management
  const [selectedSection, setSelectedSection] = useState<'products' | 'solutions' | 'customers'>('products');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSolution, setSelectedSolution] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerProduct, setSelectedCustomerProduct] = useState('');
  const [selectedCustomerSolution, setSelectedCustomerSolution] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showSeeder, setShowSeeder] = useState(false);

  // GraphQL queries
  const { data: productsData, refetch: refetchProducts } = useQuery(PRODUCTS, {
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });
  
  const { data: solutionsData, refetch: refetchSolutions } = useQuery(SOLUTIONS, {
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });
  
  const { data: customersData, refetch: refetchCustomers } = useQuery(CUSTOMERS, {
    skip: !isAuthenticated,
    errorPolicy: 'all'
  });

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Extract data from GraphQL responses
  const products = productsData?.products?.edges?.map((edge: any) => edge.node) || [];
  const solutions = solutionsData?.solutions?.edges?.map((edge: any) => edge.node) || [];
  const customers = customersData?.customers?.edges?.map((edge: any) => edge.node) || [];

  // Get current entities
  const currentProduct = products.find((p: any) => p.id === selectedProduct);
  const currentSolution = solutions.find((s: any) => s.id === selectedSolution);
  const currentCustomer = customers.find((c: any) => c.id === selectedCustomer);

  // Get current tasks based on selection
  const getCurrentTasks = () => {
    if (selectedCustomerSolution) {
      const customer = customers.find((c: any) => c.id === selectedCustomer);
      const solution = customer?.solutions?.edges?.find((edge: any) => edge.node.id === selectedCustomerSolution)?.node;
      if (solution?.products?.edges) {
        return solution.products.edges.flatMap((edge: any) => 
          edge.node.tasks?.edges?.map((taskEdge: any) => taskEdge.node) || []
        );
      }
    }
    
    if (selectedCustomerProduct) {
      const customer = customers.find((c: any) => c.id === selectedCustomer);
      const product = customer?.products?.edges?.find((edge: any) => edge.node.id === selectedCustomerProduct)?.node;
      return product?.tasks?.edges?.map((edge: any) => edge.node) || [];
    }
    
    if (selectedSolution) {
      const solution = solutions.find((s: any) => s.id === selectedSolution);
      if (solution?.products?.edges) {
        return solution.products.edges.flatMap((edge: any) => 
          edge.node.tasks?.edges?.map((taskEdge: any) => taskEdge.node) || []
        );
      }
    }
    
    if (selectedProduct) {
      const product = products.find((p: any) => p.id === selectedProduct);
      return product?.tasks?.edges?.map((edge: any) => edge.node) || [];
    }
    
    return [];
  };

  const currentTasks = getCurrentTasks();
  const currentTask = currentTasks.find((t: any) => t.id === selectedTask);

  // Navigation handlers
  const handleSectionChange = (section: 'products' | 'solutions' | 'customers') => {
    setSelectedSection(section);
    setSelectedProduct('');
    setSelectedSolution('');
    setSelectedCustomer('');
    setSelectedCustomerProduct('');
    setSelectedCustomerSolution('');
    setSelectedTask('');
    setEditingTask(null);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    setSelectedTask('');
    setEditingTask(null);
  };

  const handleSolutionChange = (solutionId: string) => {
    setSelectedSolution(solutionId);
    setSelectedTask('');
    setEditingTask(null);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedTask('');
    setSelectedCustomerProduct('');
    setSelectedCustomerSolution('');
    setEditingTask(null);
  };

  const handleCustomerProductChange = (productId: string) => {
    setSelectedCustomerProduct(productId);
    setSelectedCustomerSolution('');
    setSelectedTask('');
    setEditingTask(null);
  };

  const handleCustomerSolutionChange = (solutionId: string) => {
    setSelectedCustomerSolution(solutionId);
    setSelectedCustomerProduct('');
    setSelectedTask('');
    setEditingTask(null);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(taskId);
  };

  const handleTaskDoubleClick = (task: any) => {
    setEditingTask(task);
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'paused': return 'default';
      default: return 'default';
    }
  };

  const getProgressLabel = () => {
    if (selectedProduct) {
      const product = products.find((p: any) => p.id === selectedProduct);
      return `Product Progress: ${product?.name || 'Unknown Product'}`;
    }
    if (selectedSolution) {
      const solution = solutions.find((s: any) => s.id === selectedSolution);
      return `Solution Progress: ${solution?.name || 'Unknown Solution'}`;
    }
    if (selectedCustomerProduct) {
      const customer = customers.find((c: any) => c.id === selectedCustomer);
      const product = customer?.products?.edges?.find((edge: any) => edge.node.id === selectedCustomerProduct)?.node;
      return `Customer Product Progress: ${product?.name || 'Unknown Product'}`;
    }
    if (selectedCustomerSolution) {
      const customer = customers.find((c: any) => c.id === selectedCustomer);
      const solution = customer?.solutions?.edges?.find((edge: any) => edge.node.id === selectedCustomerSolution)?.node;
      return `Customer Solution Journey: ${solution?.name || 'Unknown Solution'}`;
    }
    return 'Progress';
  };

  const calculateProgress = (tasks: any[]) => {
    if (!tasks.length) return 0;
    const completed = tasks.filter(t => t.completedAt || t.status?.toLowerCase() === 'completed').length;
    return (completed / tasks.length) * 100;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AuthBar />
      <Toolbar />
      
      {/* Left Sidebar */}
      <Drawer 
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItemButton 
              selected={selectedSection === 'products'}
              onClick={() => handleSectionChange('products')}
            >
              <ListItemIcon>
                <ProductIcon />
              </ListItemIcon>
              <ListItemText primary="Products" />
            </ListItemButton>
            
            <ListItemButton 
              selected={selectedSection === 'solutions'}
              onClick={() => handleSectionChange('solutions')}
            >
              <ListItemIcon>
                <SolutionIcon />
              </ListItemIcon>
              <ListItemText primary="Solutions" />
            </ListItemButton>
            
            <ListItemButton 
              selected={selectedSection === 'customers'}
              onClick={() => handleSectionChange('customers')}
            >
              <ListItemIcon>
                <CustomerIcon />
              </ListItemIcon>
              <ListItemText primary="Customers" />
            </ListItemButton>
          </List>
          <Divider />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {selectedSection === 'products' && 'Product Management'}
            {selectedSection === 'solutions' && 'Solution Management'}  
            {selectedSection === 'customers' && 'Customer Management'}
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setShowSeeder(!showSeeder)}
          >
            {showSeeder ? 'Hide' : 'Show'} Sample Data Seeder
          </Button>
        </Box>

        {showSeeder && <SampleDataSeeder />}

        <Grid container spacing={3}>
          {/* Management Panel */}
          <Grid size={{ xs: 12, md: 4 }}>
            {selectedSection === 'products' && (
              <ProductManagement
                products={products}
                selectedProduct={selectedProduct}
                onProductSelect={handleProductChange}
                onRefetch={refetchProducts}
              />
            )}

            {selectedSection === 'solutions' && (
              <SolutionManagement
                solutions={solutions}
                allProducts={products}
                selectedSolution={selectedSolution}
                onSolutionSelect={handleSolutionChange}
                onRefetch={refetchSolutions}
              />
            )}

            {selectedSection === 'customers' && (
              <CustomerManagement
                customers={customers}
                selectedCustomer={selectedCustomer}
                selectedCustomerProduct={selectedCustomerProduct}
                selectedCustomerSolution={selectedCustomerSolution}
                onCustomerSelect={handleCustomerChange}
                onCustomerProductSelect={handleCustomerProductChange}
                onCustomerSolutionSelect={handleCustomerSolutionChange}
                onRefetch={refetchCustomers}
              />
            )}
          </Grid>

          {/* Progress/Status Bar for Selected Item */}
          {(selectedProduct || selectedSolution || selectedCustomerProduct || selectedCustomerSolution) && (
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {getProgressLabel()}
                </Typography>
                
                {currentTasks.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Task Completion</Typography>
                      <Typography variant="body2">{Math.round(calculateProgress(currentTasks))}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(currentTasks)} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {currentTasks.filter((t: any) => t.completedAt || t.status?.toLowerCase() === 'completed').length} of {currentTasks.length} tasks completed
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Tasks Panel */}
              <TaskList
                tasks={currentTasks}
                selectedTask={selectedTask}
                onTaskSelect={handleTaskSelect}
                onTaskDoubleClick={handleTaskDoubleClick}
                showProductName={selectedSection === 'solutions' || !!selectedCustomerSolution}
                title={
                  selectedSection === 'products' ? 'Product Tasks' :
                  selectedSection === 'solutions' ? 'Solution Tasks' :
                  selectedCustomerSolution ? 'Solution Journey Tasks' : 'Product Tasks'
                }
              />
            </Grid>
          )}

          {/* Task Detail Panel */}
          {selectedTask && currentTask && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Task Details: {currentTask.name}
                </Typography>
                <React.Suspense fallback={<div>Loading task details...</div>}>
                  <TaskDetail taskId={selectedTask} />
                </React.Suspense>
              </Paper>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Telemetry
                    </Typography>
                    <React.Suspense fallback={<div>Loading telemetry...</div>}>
                      <TelemetryPanel taskId={selectedTask} />
                    </React.Suspense>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Dependencies
                    </Typography>
                    <React.Suspense fallback={<div>Loading dependencies...</div>}>
                      <DependenciesPanel taskId={selectedTask} />
                    </React.Suspense>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Additional Panels */}
          {(selectedProduct || selectedSolution || selectedCustomer) && !selectedTask && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>Audit Trail</Typography>
                    <React.Suspense fallback={<div>Loading audit...</div>}>
                      <AuditPanel />
                    </React.Suspense>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>Change Sets</Typography>
                    <React.Suspense fallback={<div>Loading changes...</div>}>
                      <ChangeSetsPanel />
                    </React.Suspense>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" gutterBottom>CSV Export</Typography>
                    <React.Suspense fallback={<div>Loading CSV...</div>}>
                      <CsvPanel productId={selectedProduct || null} />
                    </React.Suspense>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
