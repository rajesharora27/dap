import React, { useState, Suspense } from 'react';
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
  Collapse
} from '@mui/material';
import {
  Inventory2 as ProductIcon,
  People as CustomerIcon,
  ExpandLess,
  ExpandMore,
  Home as MainIcon
} from '@mui/icons-material';
import { AuthBar } from '../components/AuthBar';
import { useAuth } from '../components/AuthContext';
import { LoginPage } from '../components/LoginPage';

// Lazy load components for better performance
const ProductManagementOptimized = React.lazy(() => import('../components/ProductManagementOptimized').then(m => ({ default: m.ProductManagementOptimized })));
const TaskManagementOptimized = React.lazy(() => import('../components/TaskManagementOptimized').then(m => ({ default: m.TaskManagementOptimized })));
const CustomerAdoptionPanelV4 = React.lazy(() => import('../components/CustomerAdoptionPanelV4').then(m => ({ default: m.CustomerAdoptionPanelV4 })));

// Import hooks
import { useProducts } from '../hooks/useProducts';

const drawerWidth = 240;

type SectionType = 'main' | 'products' | 'tasks' | 'customers';

export function AppOptimized() {
  const { token } = useAuth();
  const isAuthenticated = !!token;
  
  // State management
  const [selectedSection, setSelectedSection] = useState<SectionType>('main');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [productsExpanded, setProductsExpanded] = useState(true);
  const [customersExpanded, setCustomersExpanded] = useState(true);

  // Data hooks
  const { products, loading } = useProducts();

  // Auto-select first product if none selected
  React.useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0].id);
    }
  }, [products, selectedProduct]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Get current product data
  const currentProduct = products.find(p => p.id === selectedProduct);
  const productLicenses = currentProduct?.licenses || [];
  const productOutcomes = currentProduct?.outcomes || [];
  const productReleases = currentProduct?.releases || [];

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    if (selectedSection !== 'tasks' && selectedSection !== 'products') {
      setSelectedSection('products');
    }
  };

  const renderMainContent = () => {
    switch (selectedSection) {
      case 'main':
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome to DAP
            </Typography>
            <Typography variant="body1" paragraph>
              Data Application Platform - Your comprehensive product and task management solution.
            </Typography>
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <Typography>Products: {products.length}</Typography>
              <Typography>
                Total Tasks: {products.reduce((sum, p) => sum + (p.tasks?.edges?.length || 0), 0)}
              </Typography>
            </Box>
          </Paper>
        );

      case 'products':
        return (
          <Suspense fallback={<LinearProgress />}>
            <ProductManagementOptimized
              selectedProduct={selectedProduct}
              onProductSelect={handleProductSelect}
            />
          </Suspense>
        );

      case 'tasks':
        return (
          <Suspense fallback={<LinearProgress />}>
            <TaskManagementOptimized
              productId={selectedProduct}
              productLicenses={productLicenses}
              productOutcomes={productOutcomes}
              productReleases={productReleases}
            />
          </Suspense>
        );

      case 'customers':
        return (
          <Suspense fallback={<LinearProgress />}>
            <CustomerAdoptionPanelV4
              selectedCustomerId={selectedCustomerId}
              onCustomerSelect={setSelectedCustomerId}
            />
          </Suspense>
        );

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top Navigation */}
      <AuthBar />

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {/* Main Section */}
            <ListItemButton
              selected={selectedSection === 'main'}
              onClick={() => setSelectedSection('main')}
            >
              <ListItemIcon>
                <MainIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>

            <Divider />

            {/* Products Section */}
            <ListItemButton onClick={() => setProductsExpanded(!productsExpanded)}>
              <ListItemIcon>
                <ProductIcon />
              </ListItemIcon>
              <ListItemText primary="Products" />
              {productsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={productsExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedSection === 'products'}
                  onClick={() => setSelectedSection('products')}
                >
                  <ListItemText primary="Manage Products" />
                </ListItemButton>

                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedSection === 'tasks'}
                  onClick={() => setSelectedSection('tasks')}
                >
                  <ListItemText primary="Tasks" />
                </ListItemButton>

                {loading ? (
                  <ListItemButton sx={{ pl: 6 }} disabled>
                    <ListItemText primary="Loading..." />
                  </ListItemButton>
                ) : (
                  products.map((product: any) => (
                    <ListItemButton
                      key={product.id}
                      sx={{ pl: 6 }}
                      selected={selectedProduct === product.id && selectedSection === 'tasks'}
                      onClick={() => {
                        handleProductSelect(product.id);
                        setSelectedSection('tasks');
                      }}
                    >
                      <ListItemText 
                        primary={product.name}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            </Collapse>

            <Divider />

            {/* Customers Section */}
            <ListItemButton onClick={() => setCustomersExpanded(!customersExpanded)}>
              <ListItemIcon>
                <CustomerIcon />
              </ListItemIcon>
              <ListItemText primary="Customers" />
              {customersExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={customersExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton
                  sx={{ pl: 4 }}
                  selected={selectedSection === 'customers'}
                  onClick={() => setSelectedSection('customers')}
                >
                  <ListItemText primary="Customer Adoption" />
                </ListItemButton>
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {renderMainContent()}
      </Box>
    </Box>
  );
}
