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
  Stack,
  Tabs,
  Tab,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress as MuiCircularProgress
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
  AssignmentTurnedIn,
  Business,
  CloudDownload,
  CloudUpload,
  BoxIcon,
  Link,
} from '@shared/components/FAIcon';
import { AdoptionPlanDialog } from './AdoptionPlanDialog';
import { AssignProductDialog } from '@features/products';

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
        customerSolutionId
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
            updatedAt
          }
        }
        purchasedAt
        createdAt
      }
      solutions {
        id
        solution {
           name
        }
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
  const [currentTab, setCurrentTab] = useState<'overview' | 'adoption'>('overview');
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

  // Calculate Status Counts (Existing Logic)
  const taskCounts = adoptionPlan?.tasks?.reduce(
    (acc: any, task: any) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { DONE: 0, IN_PROGRESS: 0, NOT_STARTED: 0, NOT_APPLICABLE: 0 }
  ) || { DONE: 0, IN_PROGRESS: 0, NOT_STARTED: 0, NOT_APPLICABLE: 0 };

  // Calculate Overview Metrics
  const overviewMetrics = React.useMemo(() => {
    if (!customer?.products) return { adoption: 0, velocity: 0, productsCount: 0, solutionsCount: 0 };

    // Adoption Health: Weighted Average based on total tasks? Or average of progress %?
    // Let's use average of progress % for simplicity as per request "34% filled"
    const totalProgress = customer.products.reduce((acc: number, p: any) => acc + (p.adoptionPlan?.progressPercentage || 0), 0);
    const avgAdoption = customer.products.length > 0 ? totalProgress / customer.products.length : 0;

    // Velocity: Tasks completed in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let velocity = 0;
    customer.products.forEach((p: any) => {
      p.adoptionPlan?.tasks?.forEach((t: any) => {
        if (t.status === 'DONE' && t.updatedAt && new Date(t.updatedAt) >= thirtyDaysAgo) {
          velocity++;
        }
      });
    });

    // Portfolio
    const productsCount = customer.products.length;
    const solutionsCount = customer.solutions?.length || 0;

    return {
      adoption: avgAdoption,
      velocity,
      productsCount,
      solutionsCount
    };
  }, [customer]);

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
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Compact Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        pb: 2,
        borderBottom: '2px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} size="small" sx={{ bgcolor: 'action.hover' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {customer.name}
            </Typography>
            {customer.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {customer.description}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setAssignProductDialogOpen(true)}
          size="medium"
          disableElevation
        >
          Assign Product
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Overview" value="overview" />
          <Tab label="Adoption Plans" value="adoption" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {currentTab === 'overview' && (
        <Box>
          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Adoption Health */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 3 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                    <MuiCircularProgress
                      variant="determinate"
                      value={100}
                      size={120}
                      sx={{ color: 'grey.200', position: 'absolute' }}
                    />
                    <MuiCircularProgress
                      variant="determinate"
                      value={overviewMetrics.adoption}
                      size={120}
                      color="success"
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" component="div" color="text.primary" fontWeight={700}>
                        {Math.round(overviewMetrics.adoption)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    Overall Adoption
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Velocity */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 3 }}>
                  <Typography variant="h2" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                    {overviewMetrics.velocity}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Tasks Completed
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: 'success.50', px: 1, py: 0.5, borderRadius: 1 }}>
                    <TrendingUp fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      Last 30 Days
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Portfolio */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 3 }}>
                  <Stack direction="row" justifyContent="space-around" divider={<Divider orientation="vertical" flexItem />}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" fontWeight={700} color="text.primary">
                        {overviewMetrics.productsCount}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                        <BoxIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Products
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" fontWeight={700} color="text.primary">
                        {overviewMetrics.solutionsCount}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                        <Link fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Solution
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Product List */}
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Product Assignments
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <List disablePadding>
              {customer.products && customer.products.length > 0 ? (
                customer.products.map((cp: any, index: number) => {
                  const isSolution = !!cp.customerSolutionId;
                  const progress = cp.adoptionPlan?.progressPercentage || 0;

                  // Format synched time
                  let syncedText = 'Never synced';
                  if (cp.adoptionPlan?.lastSyncedAt) {
                    const diff = new Date().getTime() - new Date(cp.adoptionPlan.lastSyncedAt).getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    if (days > 0) syncedText = `Synced ${days}d ago`;
                    else if (hours > 0) syncedText = `Synced ${hours}h ago`;
                    else syncedText = 'Synced just now';
                  }

                  return (
                    <React.Fragment key={cp.id}>
                      {index > 0 && <Divider />}
                      <ListItemButton
                        onClick={() => {
                          setSelectedProductId(cp.product.id);
                          setCurrentTab('adoption');
                        }}
                        sx={{ py: 2 }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: isSolution ? 'primary.50' : 'grey.100', color: isSolution ? 'primary.main' : 'text.secondary' }}>
                            {isSolution ? <Link /> : <BoxIcon />}
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {cp.product.name}
                              </Typography>
                              {isSolution && (
                                <Chip label={cp.customerSolutionId ? "Solution" : "Solution"} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.625rem' }} />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{
                                    flex: 1,
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'grey.100',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                                      borderRadius: 4
                                    }
                                  }}
                                />
                                <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ minWidth: 35 }}>
                                  {Math.round(progress)}%
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100, textAlign: 'right' }}>
                                {syncedText}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItemButton>
                    </React.Fragment>
                  );
                })
              ) : (
                <ListItem>
                  <ListItemText primary="No products assigned" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      )}

      {currentTab === 'adoption' && (
        <>
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

          {customer.products && customer.products.length > 0 ? (
            <>
              {/* Product Selector Bar */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2,
                  alignItems: { xs: 'stretch', md: 'center' }
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Product to View Details</InputLabel>
                      <Select
                        value={selectedProductId || ''}
                        onChange={(e) => handleProductChange(e.target.value)}
                        label="Select Product to View Details"
                        sx={{ bgcolor: 'white' }}
                      >
                        {customer.products.map((cp: any) => (
                          <MenuItem key={cp.id} value={cp.product.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <AssignmentTurnedIn fontSize="small" color="action" />
                              <span style={{ flex: 1 }}>{cp.product.name}</span>
                              <Chip label={cp.licenseLevel} size="small" variant="outlined" />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {selectedCustomerProduct && (
                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
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
                        startIcon={<CloudDownload />}
                        onClick={handleExport}
                      >
                        Export
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloudUpload />}
                        component="label"
                      >
                        Import
                        <input type="file" hidden accept=".xlsx" onChange={handleImport} />
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Paper>

              {/* Adoption Plan Details */}
              {selectedProductId && adoptionPlan ? (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
                  {/* Progress Card */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              Adoption Progress
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {selectedCustomerProduct.customerSolutionId ? (
                                selectedCustomerProduct.name
                              ) : (
                                `${selectedCustomerProduct.name} - ${selectedCustomerProduct.product.name}`
                              )}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={selectedCustomerProduct.licenseLevel}
                              color="primary"
                              size="small"
                              variant="filled"
                            />
                            {adoptionPlan.needsSync && (
                              <Chip
                                label="Sync Needed"
                                color="warning"
                                icon={<Sync />}
                                size="small"
                              />
                            )}
                          </Stack>
                        </Box>

                        {/* Compact Progress Display */}
                        <Box sx={{ mb: 3, bgcolor: 'grey.50', p: 2.5, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
                            <Typography variant="h3" fontWeight={700} color="primary.main">
                              {adoptionPlan.progressPercentage.toFixed(0)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                              {adoptionPlan.completedTasks} of {adoptionPlan.totalTasks} tasks
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={adoptionPlan.progressPercentage}
                            sx={{
                              height: 12,
                              borderRadius: 6,
                              bgcolor: 'grey.300',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 6
                              }
                            }}
                          />
                        </Box>

                        {/* Task Status Grid */}
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                          gap: 1.5
                        }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              bgcolor: 'success.50',
                              border: '1px solid',
                              borderColor: 'success.200',
                              borderRadius: 1.5
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                              <Typography variant="caption" fontWeight={600} color="success.dark">
                                DONE
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={700} color="success.dark">
                              {taskCounts.DONE}
                            </Typography>
                          </Paper>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              bgcolor: 'info.50',
                              border: '1px solid',
                              borderColor: 'info.200',
                              borderRadius: 1.5
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <HourglassEmpty fontSize="small" sx={{ color: 'info.main' }} />
                              <Typography variant="caption" fontWeight={600} color="info.dark">
                                IN PROGRESS
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={700} color="info.dark">
                              {taskCounts.IN_PROGRESS}
                            </Typography>
                          </Paper>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              bgcolor: 'grey.100',
                              border: '1px solid',
                              borderColor: 'grey.300',
                              borderRadius: 1.5
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <TrendingUp fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                NOT STARTED
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={700} color="text.primary">
                              {taskCounts.NOT_STARTED}
                            </Typography>
                          </Paper>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              bgcolor: 'grey.50',
                              border: '1px solid',
                              borderColor: 'grey.300',
                              borderRadius: 1.5
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <NotInterested fontSize="small" sx={{ color: 'text.disabled' }} />
                              <Typography variant="caption" fontWeight={600} color="text.disabled">
                                N/A
                              </Typography>
                            </Box>
                            <Typography variant="h6" fontWeight={700} color="text.secondary">
                              {taskCounts.NOT_APPLICABLE}
                            </Typography>
                          </Paper>
                        </Box>

                        {adoptionPlan.lastSyncedAt && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 2, display: 'block', textAlign: 'center' }}
                          >
                            Last synced: {new Date(adoptionPlan.lastSyncedAt).toLocaleString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Actions Card */}
                  <Box sx={{ width: { xs: '100%', lg: '360px' }, flexShrink: 0 }}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Quick Actions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Manage tasks and track adoption progress
                        </Typography>

                        <Stack spacing={2} sx={{ flex: 1 }}>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={() => setAdoptionPlanDialogOpen(true)}
                            fullWidth
                            disableElevation
                            sx={{ py: 1.5 }}
                          >
                            View & Manage Tasks
                          </Button>

                          <Divider />

                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                              TASK SUMMARY
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Total Tasks
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {adoptionPlan.totalTasks}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Completed
                                </Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">
                                  {adoptionPlan.completedTasks}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Remaining
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {adoptionPlan.totalTasks - adoptionPlan.completedTasks}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>

                          {adoptionPlan.needsSync && (
                            <>
                              <Divider />
                              <Alert severity="warning" sx={{ p: 1 }}>
                                <Typography variant="caption">
                                  This plan needs to be synchronized with the latest product changes.
                                </Typography>
                              </Alert>
                            </>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              ) : selectedProductId && !adoptionPlan ? (
                <Alert severity="info" icon={<AssignmentTurnedIn />}>
                  No adoption plan found for this product. An adoption plan will be created automatically.
                </Alert>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}
                >
                  <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Select a Product
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a product from the dropdown above to view its adoption plan and manage tasks
                  </Typography>
                </Paper>
              )}
            </>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
                No Products Assigned
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Get started by assigning a product to track adoption progress
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => setAssignProductDialogOpen(true)}
                disableElevation
              >
                Assign Your First Product
              </Button>
            </Paper>
          )}

        </>
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
