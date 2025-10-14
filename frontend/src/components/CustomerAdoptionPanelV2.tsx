import * as React from 'react';
import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Folder,
  FolderOpen,
  Business,
  CheckCircle,
  HourglassEmpty,
  NotInterested,
  TrendingUp,
  Refresh,
  Download,
  Upload,
} from '@mui/icons-material';
import { AdoptionPlanDialog } from './dialogs/AdoptionPlanDialog';
import { AssignProductDialog } from './dialogs/AssignProductDialog';
import { CustomerDialog } from './dialogs/CustomerDialog';

// GraphQL Queries
const GET_ALL_CUSTOMERS = gql`
  query GetAllCustomers {
    customers {
      id
      name
      description
    }
  }
`;

const GET_CUSTOMER_WITH_PRODUCTS = gql`
  query GetCustomerWithProducts($id: ID!) {
    customer(id: $id) {
      id
      name
      description
      products {
        id
        licenseLevel
        product {
          id
          name
          description
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
          totalWeight
          completedWeight
          needsSync
          lastSyncedAt
          tasks {
            id
            status
          }
        }
        purchasedAt
        createdAt
      }
    }
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
          outcomes {
            id
            name
          }
          releases {
            id
            name
          }
        }
      }
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      description
    }
  }
`;

const EXPORT_CUSTOMER_ADOPTION = gql`
  mutation ExportCustomerAdoption($customerId: ID!, $customerProductId: ID!) {
    exportCustomerAdoptionToExcel(customerId: $customerId, customerProductId: $customerProductId) {
      success
      filename
      content
      message
    }
  }
`;

const IMPORT_CUSTOMER_ADOPTION = gql`
  mutation ImportCustomerAdoption($content: String!) {
    importCustomerAdoptionFromExcel(content: $content) {
      success
      message
      errors {
        sheet
        row
        column
        message
      }
      stats {
        totalRows
        successfulRows
        failedRows
        customersProcessed
        productsProcessed
        tasksProcessed
        telemetryValuesAdded
      }
    }
  }
`;

export function CustomerAdoptionPanelV2() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adoptionPlanDialogOpen, setAdoptionPlanDialogOpen] = useState(false);
  const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: customersData, loading: customersLoading, refetch: refetchCustomers } = useQuery(GET_ALL_CUSTOMERS);
  const { data: customerData, loading: customerLoading, refetch: refetchCustomer } = useQuery(
    GET_CUSTOMER_WITH_PRODUCTS,
    {
      variables: { id: selectedCustomerId },
      skip: !selectedCustomerId,
    }
  );
  const { data: productsData } = useQuery(GET_ALL_PRODUCTS);

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomers();
      setCustomerDialogOpen(false);
      setSuccess('Customer created successfully');
    },
    onError: (err) => setError(err.message),
  });

  const [exportCustomerAdoption] = useMutation(EXPORT_CUSTOMER_ADOPTION, {
    onCompleted: (data) => {
      if (data.exportCustomerAdoptionToExcel.success) {
        const { content, filename } = data.exportCustomerAdoptionToExcel;
        const blob = new Blob([Uint8Array.from(atob(content), c => c.charCodeAt(0))], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess('Export completed successfully');
      } else {
        setError(data.exportCustomerAdoptionToExcel.message || 'Export failed');
      }
    },
    onError: (err) => setError(err.message),
  });

  const [importCustomerAdoption] = useMutation(IMPORT_CUSTOMER_ADOPTION, {
    onCompleted: (data) => {
      if (data.importCustomerAdoptionFromExcel.success) {
        setSuccess(`Import successful: ${data.importCustomerAdoptionFromExcel.stats.telemetryValuesAdded} telemetry values added`);
        refetchCustomer();
      } else {
        setError(data.importCustomerAdoptionFromExcel.message || 'Import failed');
      }
    },
    onError: (err) => setError(err.message),
  });

  const customers = customersData?.customers || [];
  const customer = customerData?.customer;
  const products = productsData?.products?.edges?.map((e: any) => e.node) || [];

  // Get selected customer product
  const selectedCustomerProduct = customer?.products?.find((cp: any) => cp.product.id === selectedProductId);
  const adoptionPlan = selectedCustomerProduct?.adoptionPlan;

  // Calculate task status counts
  const taskCounts = adoptionPlan?.tasks?.reduce(
    (acc: any, task: any) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { DONE: 0, IN_PROGRESS: 0, NOT_STARTED: 0, NOT_APPLICABLE: 0 }
  ) || { DONE: 0, IN_PROGRESS: 0, NOT_STARTED: 0, NOT_APPLICABLE: 0 };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedProductId(null); // Reset product selection
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleExport = () => {
    if (!selectedCustomerId || !selectedCustomerProduct) {
      setError('Please select a customer and product');
      return;
    }
    exportCustomerAdoption({
      variables: {
        customerId: selectedCustomerId,
        customerProductId: selectedCustomerProduct.id,
      },
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        const base64 = btoa(content);
        importCustomerAdoption({ variables: { content: base64 } });
      } else if (content instanceof ArrayBuffer) {
        const bytes = new Uint8Array(content);
        const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        const base64 = btoa(binary);
        importCustomerAdoption({ variables: { content: base64 } });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleViewAdoptionPlan = () => {
    if (adoptionPlan) {
      setAdoptionPlanDialogOpen(true);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Sidebar - Customer Directory */}
      <Paper
        elevation={2}
        sx={{
          width: 300,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business /> Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            fullWidth
            onClick={() => setCustomerDialogOpen(true)}
          >
            New Customer
          </Button>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {customersLoading ? (
            <ListItem>
              <ListItemText primary="Loading customers..." />
            </ListItem>
          ) : customers.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No customers"
                secondary="Click 'New Customer' to add one"
              />
            </ListItem>
          ) : (
            customers
              .slice()
              .sort((a: any, b: any) => a.name.localeCompare(b.name))
              .map((cust: any) => (
                <ListItemButton
                  key={cust.id}
                  selected={selectedCustomerId === cust.id}
                  onClick={() => handleCustomerSelect(cust.id)}
                  sx={{
                    borderLeft: selectedCustomerId === cust.id ? '4px solid' : '4px solid transparent',
                    borderColor: 'primary.main',
                  }}
                >
                  {selectedCustomerId === cust.id ? (
                    <FolderOpen sx={{ mr: 2, color: 'primary.main' }} />
                  ) : (
                    <Folder sx={{ mr: 2, color: 'action.active' }} />
                  )}
                  <ListItemText
                    primary={cust.name}
                    secondary={cust.description?.substring(0, 60) + (cust.description?.length > 60 ? '...' : '')}
                    primaryTypographyProps={{ fontWeight: selectedCustomerId === cust.id ? 600 : 400 }}
                  />
                </ListItemButton>
              ))
          )}
        </List>
      </Paper>

      {/* Right Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar with Product Selector */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {selectedCustomerId ? (
            <>
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Select Product for Adoption Plan</InputLabel>
                <Select
                  value={selectedProductId || ''}
                  onChange={(e) => handleProductChange(e.target.value)}
                  label="Select Product for Adoption Plan"
                  disabled={!customer?.products || customer.products.length === 0}
                >
                  {customer?.products?.map((cp: any) => (
                    <MenuItem key={cp.id} value={cp.product.id}>
                      {cp.product.name} ({cp.licenseLevel})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setAssignProductDialogOpen(true)}
              >
                Assign Product
              </Button>

              {selectedCustomerProduct && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    component="label"
                  >
                    Import
                    <input type="file" hidden accept=".xlsx" onChange={handleImport} />
                  </Button>
                </>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Select a customer from the left to view their adoption plans
            </Typography>
          )}
        </Paper>

        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 2 }}>
            {success}
          </Alert>
        )}

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {!selectedCustomerId ? (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Business sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="text.secondary">
                Customer Adoption Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a customer from the directory on the left to get started
              </Typography>
            </Box>
          ) : customerLoading ? (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <LinearProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading customer details...
              </Typography>
            </Box>
          ) : !selectedProductId ? (
            <Box>
              <Typography variant="h5" gutterBottom>
                {customer?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {customer?.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Assigned Products ({customer?.products?.length || 0})
              </Typography>

              {customer?.products?.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No products assigned yet. Click "Assign Product" to get started.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  {customer?.products?.map((cp: any) => (
                    <Card
                      key={cp.id}
                      sx={{
                        width: 300,
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 },
                        border: selectedProductId === cp.product.id ? '2px solid' : '1px solid',
                        borderColor: selectedProductId === cp.product.id ? 'primary.main' : 'divider',
                      }}
                      onClick={() => handleProductChange(cp.product.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {cp.product.name}
                        </Typography>
                        <Chip
                          label={cp.licenseLevel}
                          size="small"
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        {cp.adoptionPlan && (
                          <>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Progress: {cp.adoptionPlan.progressPercentage.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={cp.adoptionPlan.progressPercentage}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {cp.adoptionPlan.completedTasks} / {cp.adoptionPlan.totalTasks} tasks completed
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          ) : adoptionPlan ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">
                  {selectedCustomerProduct.product.name} - Adoption Plan
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={selectedCustomerProduct.licenseLevel} color="primary" />
                  {adoptionPlan.needsSync && (
                    <Chip label="Sync Needed" color="warning" icon={<Refresh />} />
                  )}
                </Box>
              </Box>

              {/* Progress Overview */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overall Progress
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {adoptionPlan.completedTasks} / {adoptionPlan.totalTasks} tasks completed
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {adoptionPlan.progressPercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={adoptionPlan.progressPercentage}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CheckCircle />}
                      label={`Done: ${taskCounts.DONE}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<HourglassEmpty />}
                      label={`In Progress: ${taskCounts.IN_PROGRESS}`}
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      icon={<TrendingUp />}
                      label={`Not Started: ${taskCounts.NOT_STARTED}`}
                      color="default"
                      variant="outlined"
                    />
                    <Chip
                      icon={<NotInterested />}
                      label={`Not Applicable: ${taskCounts.NOT_APPLICABLE}`}
                      color="default"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                size="large"
                onClick={handleViewAdoptionPlan}
              >
                View Detailed Adoption Plan
              </Button>
            </Box>
          ) : (
            <Alert severity="info">
              No adoption plan found for this product. An adoption plan will be created automatically when a product is assigned.
            </Alert>
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      {adoptionPlan && (
        <AdoptionPlanDialog
          open={adoptionPlanDialogOpen}
          onClose={() => setAdoptionPlanDialogOpen(false)}
          adoptionPlanId={adoptionPlan.id}
        />
      )}

      {selectedCustomerId && (
        <AssignProductDialog
          open={assignProductDialogOpen}
          onClose={() => setAssignProductDialogOpen(false)}
          customerId={selectedCustomerId}
          onAssigned={() => {
            setAssignProductDialogOpen(false);
            refetchCustomer();
            setSuccess('Product assigned successfully');
          }}
        />
      )}

      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        title="Create New Customer"
        onSave={async (data) => {
          await createCustomer({ variables: { input: data } });
        }}
      />
    </Box>
  );
}
