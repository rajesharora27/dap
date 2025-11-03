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
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Download,
  Upload,
  Sync,
  CheckCircle,
  HourglassEmpty,
  TrendingUp,
  NotInterested,
} from '@mui/icons-material';
import { AdoptionPlanDialog } from './dialogs/AdoptionPlanDialog';
import { AssignProductDialog } from './dialogs/AssignProductDialog';

// GraphQL Queries
const GET_CUSTOMER_DETAIL = gql`
  query GetCustomerDetail($id: ID!) {
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
      stats {
        telemetryValuesAdded
      }
    }
  }
`;

interface Props {
  customerId: string;
  onBack: () => void;
}

export function CustomerDetailView({ customerId, onBack }: Props) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [adoptionPlanDialogOpen, setAdoptionPlanDialogOpen] = useState(false);
  const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_CUSTOMER_DETAIL, {
    variables: { id: customerId },
  });

  const [syncAdoptionPlan] = useMutation(SYNC_ADOPTION_PLAN, {
    onCompleted: () => {
      refetch();
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
        refetch();
      } else {
        setError(data.importCustomerAdoptionFromExcel.message || 'Import failed');
      }
    },
    onError: (err) => setError(err.message),
  });

  const customer = data?.customer;
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

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleExport = () => {
    if (!customerId || !selectedCustomerProduct) {
      setError('Please select a product');
      return;
    }
    exportCustomerAdoption({
      variables: {
        customerId,
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

  const handleSync = () => {
    if (adoptionPlan) {
      syncAdoptionPlan({ variables: { adoptionPlanId: adoptionPlan.id } });
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading customer details...
        </Typography>
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ mb: 2 }}>
          Back to Customers
        </Button>
        <Alert severity="error">Customer not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          Back to Customers
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {customer.name}
        </Typography>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Customer Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {customer.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {customer.description}
            </Typography>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Assigned Products: {customer.products?.length || 0}
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
      {customer.products && customer.products.length > 0 ? (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 300, flex: '1 1 auto' }} size="small">
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
                        Sync
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

          {/* Adoption Plan Details */}
          {selectedProductId && adoptionPlan ? (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {selectedCustomerProduct.customerSolutionId ? (
                      // For products from solutions: name already has format "Assignment - Solution - Product"
                      selectedCustomerProduct.name
                    ) : (
                      // For standalone products: name is assignment name, append product name
                      `${selectedCustomerProduct.name} - ${selectedCustomerProduct.product.name}`
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={selectedCustomerProduct.licenseLevel} color="primary" size="small" />
                    {adoptionPlan.needsSync && (
                      <Chip label="Sync Needed" color="warning" icon={<Sync />} size="small" />
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
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>

                {/* Task Status Breakdown */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
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
                  onClick={() => setAdoptionPlanDialogOpen(true)}
                  fullWidth
                >
                  View & Manage Tasks
                </Button>

                {adoptionPlan.lastSyncedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Last synced: {new Date(adoptionPlan.lastSyncedAt).toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ) : selectedProductId && !adoptionPlan ? (
            <Alert severity="info">
              No adoption plan found for this product. An adoption plan will be created automatically.
            </Alert>
          ) : null}
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No products assigned yet. Click "Assign Product" to get started with adoption tracking.
        </Alert>
      )}

      {/* Dialogs */}
      {adoptionPlan && (
        <AdoptionPlanDialog
          open={adoptionPlanDialogOpen}
          onClose={() => {
            setAdoptionPlanDialogOpen(false);
            refetch();
          }}
          adoptionPlanId={adoptionPlan.id}
        />
      )}

      <AssignProductDialog
        open={assignProductDialogOpen}
        onClose={() => setAssignProductDialogOpen(false)}
        customerId={customerId}
        onAssigned={() => {
          setAssignProductDialogOpen(false);
          refetch();
          setSuccess('Product assigned successfully');
        }}
      />
    </Box>
  );
}
