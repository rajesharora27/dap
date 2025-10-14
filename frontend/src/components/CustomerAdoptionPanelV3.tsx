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
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Business,
  CheckCircle,
  HourglassEmpty,
  NotInterested,
  TrendingUp,
  Refresh,
  Download,
  Upload,
  Sync,
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

const SYNC_ADOPTION_PLAN = gql`
  mutation SyncAdoptionPlan($adoptionPlanId: ID!) {
    syncAdoptionPlan(adoptionPlanId: $adoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
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

export function CustomerAdoptionPanelV3() {
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

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      refetchCustomers();
      setCustomerDialogOpen(false);
      setSuccess('Customer created successfully');
    },
    onError: (err) => setError(err.message),
  });

  const [syncAdoptionPlan] = useMutation(SYNC_ADOPTION_PLAN, {
    onCompleted: () => {
      refetchCustomer();
      setSuccess('Adoption plan synced successfully');
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
      if (content instanceof ArrayBuffer) {
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

  const handleSync = () => {
    if (adoptionPlan) {
      syncAdoptionPlan({ variables: { adoptionPlanId: adoptionPlan.id } });
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left Sidebar - Customer List (Names Only) */}
      <Paper
        elevation={2}
        sx={{
          width: 250,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business fontSize="small" /> Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            fullWidth
            size="small"
            onClick={() => setCustomerDialogOpen(true)}
          >
            New Customer
          </Button>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto', py: 0 }} dense>
          {customersLoading ? (
            <ListItem>
              <ListItemText primary="Loading..." primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ) : customers.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No customers"
                secondary="Click 'New Customer'"
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
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
                    borderLeft: '3px solid',
                    borderLeftColor: selectedCustomerId === cust.id ? 'primary.main' : 'transparent',
                    py: 1,
                  }}
                >
                  <ListItemText
                    primary={cust.name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: selectedCustomerId === cust.id ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              ))
          )}
        </List>
      </Paper>

      {/* Right Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2, mb: 0 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ m: 2, mb: 0 }}>
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
                Select a customer from the left to get started
              </Typography>
            </Box>
          ) : customerLoading ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <LinearProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Loading customer details...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Customer Details - Top Area */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {customer?.name}
                  </Typography>
                  {customer?.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {customer.description}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned Products: {customer?.products?.length || 0}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setAssignProductDialogOpen(true)}
                    >
                      Assign Product
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Product Selector & Actions */}
              {customer?.products && customer.products.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <FormControl sx={{ minWidth: 250, flex: '1 1 auto' }} size="small">
                        <InputLabel>Select Product</InputLabel>
                        <Select
                          value={selectedProductId || ''}
                          onChange={(e) => handleProductChange(e.target.value)}
                          label="Select Product"
                        >
                          {customer.products.map((cp: any) => (
                            <MenuItem key={cp.id} value={cp.product.id}>
                              {cp.product.name} ({cp.licenseLevel})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      {selectedCustomerProduct && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {adoptionPlan?.needsSync && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Sync />}
                              color="warning"
                              onClick={handleSync}
                            >
                              Sync Plan
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Download />}
                            onClick={handleExport}
                          >
                            Export
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Upload />}
                            component="label"
                          >
                            Import
                            <input type="file" hidden accept=".xlsx" onChange={handleImport} />
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Adoption Plan Details - Below Product Selector */}
              {selectedProductId && adoptionPlan ? (
                <Box>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Adoption Plan: {selectedCustomerProduct.product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={selectedCustomerProduct.licenseLevel} color="primary" size="small" />
                          {adoptionPlan.needsSync && (
                            <Chip label="Sync Needed" color="warning" icon={<Refresh />} size="small" />
                          )}
                        </Box>
                      </Box>

                      {/* Progress Overview */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {adoptionPlan.completedTasks} / {adoptionPlan.totalTasks} tasks completed
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {adoptionPlan.progressPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={adoptionPlan.progressPercentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      {/* Task Status Breakdown */}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          icon={<CheckCircle />}
                          label={`Done: ${taskCounts.DONE}`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<HourglassEmpty />}
                          label={`In Progress: ${taskCounts.IN_PROGRESS}`}
                          color="info"
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<TrendingUp />}
                          label={`Not Started: ${taskCounts.NOT_STARTED}`}
                          color="default"
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<NotInterested />}
                          label={`Not Applicable: ${taskCounts.NOT_APPLICABLE}`}
                          color="default"
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      <Button
                        variant="contained"
                        onClick={handleViewAdoptionPlan}
                        fullWidth
                      >
                        View & Manage Tasks
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Additional Info */}
                  {adoptionPlan.lastSyncedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Last synced: {new Date(adoptionPlan.lastSyncedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              ) : selectedProductId && !adoptionPlan ? (
                <Alert severity="info">
                  No adoption plan found for this product. An adoption plan will be created automatically.
                </Alert>
              ) : customer?.products?.length === 0 ? (
                <Alert severity="info">
                  No products assigned yet. Click "Assign Product" to get started.
                </Alert>
              ) : null}
            </>
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      {adoptionPlan && (
        <AdoptionPlanDialog
          open={adoptionPlanDialogOpen}
          onClose={() => {
            setAdoptionPlanDialogOpen(false);
            refetchCustomer();
          }}
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
