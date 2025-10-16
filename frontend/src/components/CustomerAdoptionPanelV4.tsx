import * as React from 'react';
import { useState, useEffect } from 'react';
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
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Checkbox,
  OutlinedInput,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Download,
  Upload,
  Sync,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  HourglassEmpty,
  TrendingUp,
  NotInterested,
} from '@mui/icons-material';
import { CustomerDialog } from './dialogs/CustomerDialog';
import { AssignProductDialog } from './dialogs/AssignProductDialog';
import { EditEntitlementsDialog } from './dialogs/EditEntitlementsDialog';

// GraphQL Queries
const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      description
      products {
        id
        product {
          id
          name
        }
        licenseLevel
        selectedOutcomes {
          id
          name
        }
        selectedReleases {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          totalTasks
          completedTasks
        }
      }
    }
  }
`;

const GET_ADOPTION_PLAN = gql`
  query GetAdoptionPlan($id: ID!) {
    adoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      totalWeight
      completedWeight
      needsSync
      lastSyncedAt
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      tasks {
        id
        name
        description
        status
        weight
        sequenceNumber
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        statusNotes
        licenseLevel
        telemetryAttributes {
          id
          name
        }
        outcomes {
          id
          name
        }
        releases {
        id
        name
        level
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

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($input: UpdateCustomerTaskStatusInput!) {
    updateCustomerTaskStatus(input: $input) {
      id
      status
      statusUpdatedAt
      statusUpdatedBy
      statusUpdateSource
      statusNotes
      adoptionPlan {
        id
        totalTasks
        completedTasks
        progressPercentage
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
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
        level
      }
      tasks {
        id
        name
        description
        status
        weight
        sequenceNumber
        licenseLevel
        telemetryAttributes {
          id
          name
        }
        outcomes {
          id
          name
        }
        releases {
          id
          name
          level
        }
      }
    }
  }
`;

const UPDATE_CUSTOMER_PRODUCT = gql`
  mutation UpdateCustomerProduct($id: ID!, $input: UpdateCustomerProductInput!) {
    updateCustomerProduct(id: $id, input: $input) {
      id
      licenseLevel
      selectedOutcomes {
        id
        name
      }
      selectedReleases {
        id
        name
      }
      adoptionPlan {
        id
        needsSync
      }
    }
  }
`;

const REMOVE_PRODUCT_FROM_CUSTOMER = gql`
  mutation RemoveProductFromCustomer($id: ID!) {
    removeProductFromCustomerEnhanced(id: $id) {
      success
      message
    }
  }
`;

const EXPORT_CUSTOMER_ADOPTION = gql`
  mutation ExportCustomerAdoption($customerId: ID!, $customerProductId: ID!) {
    exportCustomerAdoptionToExcel(customerId: $customerId, customerProductId: $customerProductId) {
      filename
      content
      mimeType
      size
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

interface StatusDialogState {
  open: boolean;
  taskId: string;
  taskName: string;
  currentStatus: string;
}

interface CustomerAdoptionPanelV4Props {
  selectedCustomerId: string | null;
}

export function CustomerAdoptionPanelV4({ selectedCustomerId }: CustomerAdoptionPanelV4Props) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [assignProductDialogOpen, setAssignProductDialogOpen] = useState(false);
  const [editEntitlementsDialogOpen, setEditEntitlementsDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Filter states - releases and outcomes support multiple selections
  // Note: License filter removed - tasks are pre-filtered by assigned license level
  const [filterReleases, setFilterReleases] = useState<string[]>([]);
  const [filterOutcomes, setFilterOutcomes] = useState<string[]>([]);
  
  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    taskId: '',
    taskName: '',
    currentStatus: 'NOT_STARTED',
  });
  const [statusNotes, setStatusNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_CUSTOMERS, {
    fetchPolicy: 'cache-and-network',
  });

  const selectedCustomer = data?.customers?.find((c: any) => c.id === selectedCustomerId);
  const selectedCustomerProduct = selectedCustomer?.products?.find((cp: any) => cp.product.id === selectedProductId);
  const adoptionPlanId = selectedCustomerProduct?.adoptionPlan?.id;

  // Debug logging
  console.log('[CustomerAdoptionPanelV4] Debug:', {
    selectedCustomerId,
    selectedProductId,
    selectedCustomer: selectedCustomer?.name,
    productsCount: selectedCustomer?.products?.length,
    selectedCustomerProduct: selectedCustomerProduct?.product?.name,
    adoptionPlanId,
    hasAdoptionPlan: !!selectedCustomerProduct?.adoptionPlan,
  });

  const { data: planData, refetch: refetchPlan } = useQuery(GET_ADOPTION_PLAN, {
    variables: { id: adoptionPlanId },
    skip: !adoptionPlanId,
    fetchPolicy: 'cache-and-network',
  });

  // Auto-select first product when customer is selected or products change
  useEffect(() => {
    if (selectedCustomer?.products?.length > 0 && !selectedProductId) {
      console.log('[CustomerAdoptionPanelV4] Auto-selecting first product:', selectedCustomer.products[0].product.name);
      setSelectedProductId(selectedCustomer.products[0].product.id);
    }
  }, [selectedCustomer, selectedProductId]);

  // Filter tasks based on release and outcome
  // Note: Tasks are already pre-filtered by license level (based on product assignment)
  const filteredTasks = React.useMemo(() => {
    if (!planData?.adoptionPlan?.tasks) return [];
    
    return planData.adoptionPlan.tasks.filter((task: any) => {
      // Filter by releases (multiple selection - task must have at least one selected release)
      if (filterReleases.length > 0) {
        const hasSelectedRelease = task.releases?.some((release: any) => 
          filterReleases.includes(release.id)
        );
        if (!hasSelectedRelease) return false;
      }
      
      // Filter by outcomes (multiple selection - task must have at least one selected outcome)
      if (filterOutcomes.length > 0) {
        const hasSelectedOutcome = task.outcomes?.some((outcome: any) => 
          filterOutcomes.includes(outcome.id)
        );
        if (!hasSelectedOutcome) return false;
      }
      
      return true;
    });
  }, [planData?.adoptionPlan?.tasks, filterReleases, filterOutcomes]);

  // Get unique releases, licenses, and outcomes for filter dropdowns
  const availableReleases = React.useMemo(() => {
    if (!planData?.adoptionPlan?.tasks) return [];
    const releases = new Map();
    planData.adoptionPlan.tasks.forEach((task: any) => {
      task.releases?.forEach((release: any) => {
        if (!releases.has(release.id)) {
          releases.set(release.id, release);
        }
      });
    });
    return Array.from(releases.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.tasks]);

  const availableOutcomes = React.useMemo(() => {
    if (!planData?.adoptionPlan?.tasks) return [];
    const outcomes = new Map();
    planData.adoptionPlan.tasks.forEach((task: any) => {
      task.outcomes?.forEach((outcome: any) => {
        if (!outcomes.has(outcome.id)) {
          outcomes.set(outcome.id, outcome);
        }
      });
    });
    return Array.from(outcomes.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [planData?.adoptionPlan?.tasks]);

  // Calculate progress based on filtered tasks (excluding NOT_APPLICABLE)
  const filteredProgress = React.useMemo(() => {
    // Filter out NOT_APPLICABLE tasks - they should not count towards progress
    const applicableTasks = filteredTasks.filter((task: any) => task.status !== 'NOT_APPLICABLE');
    
    if (!applicableTasks.length) return { totalTasks: 0, completedTasks: 0, percentage: 0 };
    
    const completedTasks = applicableTasks.filter((task: any) => 
      task.status === 'COMPLETED' || task.status === 'DONE'
    ).length;
    const percentage = (completedTasks / applicableTasks.length) * 100;
    
    return {
      totalTasks: applicableTasks.length,
      completedTasks,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    };
  }, [filteredTasks]);

  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer created successfully');
      setCustomerDialogOpen(false);
    },
    onError: (err) => setError(err.message),
  });

  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer updated successfully');
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: (err) => setError(err.message),
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => {
      refetch();
      setSuccess('Customer deleted successfully');
      // Note: Customer will be deselected in the parent App component
      setSelectedProductId(null);
    },
    onError: (err) => setError(err.message),
  });

  const [updateTaskStatus] = useMutation(UPDATE_TASK_STATUS, {
    refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetchPlan();
      refetch(); // Refresh to update progress in customer list
      setSuccess('Task status updated successfully');
      setStatusDialog({ ...statusDialog, open: false });
      setStatusNotes('');
    },
    onError: (err) => setError(err.message),
  });

  const [syncAdoptionPlan, { loading: syncLoading }] = useMutation(SYNC_ADOPTION_PLAN, {
    refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetchPlan();
      refetch();
      setSuccess('Adoption plan synced successfully');
    },
    onError: (err) => {
      console.error('Sync error:', err);
      setError(`Failed to sync: ${err.message}`);
    },
  });

  const [updateCustomerProduct] = useMutation(UPDATE_CUSTOMER_PRODUCT, {
    refetchQueries: ['GetAdoptionPlan', 'GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setEditEntitlementsDialogOpen(false);
      refetchPlan();
      refetch();
      setSuccess('Product entitlements updated successfully. Use the Sync button to update tasks.');
    },
    onError: (err) => setError(err.message),
  });

  const [removeProduct, { loading: removeLoading }] = useMutation(REMOVE_PRODUCT_FROM_CUSTOMER, {
    refetchQueries: ['GetCustomers'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setSelectedProductId(null);
      refetch();
      setSuccess('Product removed from customer successfully');
    },
    onError: (err) => {
      console.error('Remove product error:', err);
      setError(`Failed to remove product: ${err.message}`);
    },
  });

  const [exportCustomerAdoption] = useMutation(EXPORT_CUSTOMER_ADOPTION, {
    onCompleted: (data) => {
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
    },
    onError: (err) => setError(err.message),
  });

  const [importCustomerAdoption] = useMutation(IMPORT_CUSTOMER_ADOPTION, {
    onCompleted: (data) => {
      if (data.importCustomerAdoptionFromExcel.success) {
        setSuccess(`Import successful: ${data.importCustomerAdoptionFromExcel.message}`);
        refetchPlan();
        refetch();
      } else {
        setError(data.importCustomerAdoptionFromExcel.message || 'Import failed');
      }
    },
    onError: (err) => setError(err.message),
  });

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerDialogOpen(true);
  };

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setCustomerDialogOpen(true);
    }
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer && confirm(`Delete customer "${selectedCustomer.name}"?`)) {
      deleteCustomer({ variables: { id: selectedCustomer.id } });
    }
  };

  const handleSaveCustomer = async (input: any) => {
    if (editingCustomer) {
      await updateCustomer({ variables: { id: editingCustomer.id, input } });
    } else {
      await createCustomer({ variables: { input } });
    }
  };

  const handleStatusChange = (taskId: string, taskName: string, newStatus: string) => {
    setStatusDialog({
      open: true,
      taskId,
      taskName,
      currentStatus: newStatus,
    });
  };

  const handleStatusSave = (newStatus: string) => {
    updateTaskStatus({
      variables: {
        input: {
          customerTaskId: statusDialog.taskId,
          status: newStatus,
          notes: statusNotes || undefined,
        },
      },
    });
  };

  const handleExport = () => {
    if (!selectedCustomerId || !selectedCustomerProduct) {
      setError('Please select a product');
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

  const handleSync = () => {
    if (adoptionPlanId) {
      syncAdoptionPlan({ variables: { adoptionPlanId } });
    }
  };

  const handleRemoveProduct = () => {
    if (selectedCustomerProduct) {
      removeProduct({ variables: { id: selectedCustomerProduct.id } });
      setDeleteProductDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'NOT_APPLICABLE': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle fontSize="small" />;
      case 'IN_PROGRESS': return <HourglassEmpty fontSize="small" />;
      case 'NOT_STARTED': return <TrendingUp fontSize="small" />;
      case 'NOT_APPLICABLE': return <NotInterested fontSize="small" />;
      default: return undefined;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          {success}
        </Alert>
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedCustomer ? (
          <>
            {/* Header with Customer Info and Actions */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h5">{selectedCustomer.name}</Typography>
                  {selectedCustomer.description && (
                    <Typography variant="body2" color="text.secondary">{selectedCustomer.description}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<Add />} variant="outlined" size="small" onClick={handleAddCustomer}>
                    Add
                  </Button>
                  <Button startIcon={<Edit />} variant="outlined" size="small" onClick={handleEditCustomer}>
                    Edit
                  </Button>
                  <Button startIcon={<Delete />} variant="outlined" size="small" color="error" onClick={handleDeleteCustomer}>
                    Delete
                  </Button>
                  <Button startIcon={<Download />} variant="outlined" size="small" onClick={handleExport} disabled={!selectedProductId}>
                    Export
                  </Button>
                  <Button startIcon={<Upload />} variant="outlined" size="small" component="label" disabled={!selectedProductId}>
                    Import
                    <input type="file" hidden accept=".xlsx" onChange={handleImport} />
                  </Button>
                </Box>
              </Box>

              {/* Product Selection */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 300 }} size="small">
                  <InputLabel>Select Product</InputLabel>
                  <Select
                    value={selectedProductId || ''}
                    onChange={(e) => handleProductChange(e.target.value)}
                    label="Select Product"
                  >
                    {selectedCustomer.products?.map((cp: any) => (
                      <MenuItem key={cp.id} value={cp.product.id}>
                        {cp.product.name} ({cp.licenseLevel})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setAssignProductDialogOpen(true)}
                >
                  Assign Product
                </Button>
                {selectedProductId && planData?.adoptionPlan && (
                  <>
                    <Tooltip title="Edit license and outcomes">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => setEditEntitlementsDialogOpen(true)}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                    <Tooltip title="Sync with latest product tasks (outcomes, licenses, releases)">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Sync />}
                        color={planData.adoptionPlan.needsSync ? 'warning' : 'primary'}
                        onClick={handleSync}
                        disabled={syncLoading}
                      >
                        {syncLoading ? 'Syncing...' : `Sync ${planData.adoptionPlan.needsSync ? '⚠️' : ''}`}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Remove this product from customer">
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteProductDialogOpen(true)}
                        disabled={removeLoading}
                      >
                        Delete
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>

            {/* Progress and Tasks */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {selectedProductId && planData?.adoptionPlan ? (
                <>
                  {/* Progress Card */}
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Adoption Progress</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={selectedCustomerProduct.licenseLevel} 
                            color="primary" 
                            size="small" 
                          />
                          <Tooltip title="Edit license and outcomes">
                            <IconButton
                              size="small"
                              onClick={() => setEditEntitlementsDialogOpen(true)}
                              sx={{ ml: -0.5 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {planData.adoptionPlan.needsSync && (
                            <Chip label="Sync Needed" color="warning" icon={<Sync />} size="small" />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {filteredProgress.completedTasks} / {filteredProgress.totalTasks} tasks completed
                            {(filterReleases.length > 0 || filterOutcomes.length > 0) && (
                              <Chip 
                                label="Filtered" 
                                size="small" 
                                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} 
                                color="info"
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {filteredProgress.percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={filteredProgress.percentage}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>

                      {planData.adoptionPlan.lastSyncedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Last synced: {new Date(planData.adoptionPlan.lastSyncedAt).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tasks Table */}
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Tasks</Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {/* Releases - Multi-select */}
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Releases</InputLabel>
                            <Select
                              multiple
                              value={filterReleases}
                              onChange={(e) => setFilterReleases(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
                              input={<OutlinedInput label="Releases" />}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.length === 0 ? (
                                    <em>All Releases</em>
                                  ) : (
                                    selected.map((id) => {
                                      const release = availableReleases.find((r: any) => r.id === id);
                                      return (
                                        <Chip 
                                          key={id} 
                                          label={release?.name || id} 
                                          size="small" 
                                        />
                                      );
                                    })
                                  )}
                                </Box>
                              )}
                            >
                              {availableReleases.map((release: any) => (
                                <MenuItem key={release.id} value={release.id}>
                                  <Checkbox checked={filterReleases.includes(release.id)} />
                                  <ListItemText primary={`${release.name}${release.version ? ` (${release.version})` : ''}`} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Outcomes - Multi-select */}
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Outcomes</InputLabel>
                            <Select
                              multiple
                              value={filterOutcomes}
                              onChange={(e) => setFilterOutcomes(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
                              input={<OutlinedInput label="Outcomes" />}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.length === 0 ? (
                                    <em>All Outcomes</em>
                                  ) : (
                                    selected.map((id) => {
                                      const outcome = availableOutcomes.find((o: any) => o.id === id);
                                      return (
                                        <Chip 
                                          key={id} 
                                          label={outcome?.name || id} 
                                          size="small" 
                                        />
                                      );
                                    })
                                  )}
                                </Box>
                              )}
                            >
                              {availableOutcomes.map((outcome: any) => (
                                <MenuItem key={outcome.id} value={outcome.id}>
                                  <Checkbox checked={filterOutcomes.includes(outcome.id)} />
                                  <ListItemText primary={outcome.name} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {(filterReleases.length > 0 || filterOutcomes.length > 0) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setFilterReleases([]);
                                setFilterOutcomes([]);
                              }}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </Box>
                      </Box>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={60}>#</TableCell>
                              <TableCell>Task Name</TableCell>
                              <TableCell width={100}>Weight</TableCell>
                              <TableCell width={150}>Status</TableCell>
                              <TableCell width={120}>Updated Via</TableCell>
                              <TableCell width={120}>Telemetry</TableCell>
                              <TableCell width={100}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredTasks.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} align="center">
                                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    No tasks match the selected filters
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTasks.map((task: any) => (
                                <TableRow 
                                  key={task.id} 
                                  hover
                                  onMouseEnter={() => setHoveredTaskId(task.id)}
                                  onMouseLeave={() => setHoveredTaskId(null)}
                                  onDoubleClick={() => {
                                    setSelectedTask(task);
                                    setTaskDetailsDialogOpen(true);
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                >
                                <TableCell>{task.sequenceNumber}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ mb: 0.5 }}>{task.name}</Typography>
                                  {task.description && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {task.description}
                                    </Typography>
                                  )}
                                  {hoveredTaskId === task.id && (
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                      {task.licenseLevel && (
                                        <Chip label={task.licenseLevel} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                                      )}
                                      {task.releases?.map((release: any) => (
                                        <Chip 
                                          key={release.id} 
                                          label={`${release.name}${release.version ? ` ${release.version}` : ''}`}
                                          size="small" 
                                          variant="outlined" 
                                          color="secondary"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      ))}
                                      {task.outcomes?.map((outcome: any) => (
                                        <Chip 
                                          key={outcome.id} 
                                          label={outcome.name}
                                          size="small" 
                                          variant="outlined" 
                                          color="success"
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                  {task.statusUpdatedAt && (
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                      Updated: {new Date(task.statusUpdatedAt).toLocaleString()}
                                      {task.statusUpdatedBy && ` by ${task.statusUpdatedBy}`}
                                      {task.statusUpdateSource && (
                                        <Chip 
                                          label={task.statusUpdateSource}
                                          size="small"
                                          sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                                          color={
                                            task.statusUpdateSource === 'MANUAL' ? 'primary' :
                                            task.statusUpdateSource === 'TELEMETRY' ? 'success' :
                                            task.statusUpdateSource === 'IMPORT' ? 'info' :
                                            'default'
                                          }
                                        />
                                      )}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>{task.weight}%</TableCell>
                                <TableCell>
                                  <Chip
                                    icon={getStatusIcon(task.status)}
                                    label={task.status.replace('_', ' ')}
                                    color={getStatusColor(task.status) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {task.statusUpdateSource ? (
                                    <Chip 
                                      label={task.statusUpdateSource}
                                      size="small"
                                      color={
                                        task.statusUpdateSource === 'MANUAL' ? 'primary' :
                                        task.statusUpdateSource === 'TELEMETRY' ? 'success' :
                                        task.statusUpdateSource === 'IMPORT' ? 'info' :
                                        'default'
                                      }
                                    />
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">-</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {task.telemetryAttributes?.length > 0 ? (
                                    <Chip label={`${task.telemetryAttributes.length} attrs`} size="small" variant="outlined" />
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">None</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <Select
                                      value={task.status}
                                      onChange={(e) => handleStatusChange(task.id, task.name, e.target.value)}
                                      variant="outlined"
                                      sx={{ 
                                        '& .MuiSelect-select': { 
                                          py: 0.5,
                                          fontSize: '0.875rem'
                                        }
                                      }}
                                    >
                                      <MenuItem value="NOT_STARTED">Not Started</MenuItem>
                                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                      <MenuItem value="DONE">Done</MenuItem>
                                      <MenuItem value="NOT_APPLICABLE">Not Applicable</MenuItem>
                                    </Select>
                                  </FormControl>
                                </TableCell>
                              </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </>
              ) : selectedProductId ? (
                <Alert severity="warning">
                  <strong>No adoption plan found for this product.</strong>
                  <br />
                  Product ID: {selectedProductId}
                  <br />
                  Customer Product: {selectedCustomerProduct ? 'Found' : 'Not Found'}
                  <br />
                  Adoption Plan ID: {adoptionPlanId || 'NULL'}
                  <br />
                  {!selectedCustomerProduct && `Could not find customer product with product.id = ${selectedProductId}`}
                </Alert>
              ) : (
                <Alert severity="info">
                  <strong>No product selected.</strong>
                  <br />
                  Available products: {selectedCustomer?.products?.length || 0}
                  <br />
                  {selectedCustomer?.products?.length > 0 ? 
                    `Products: ${selectedCustomer.products.map((cp: any) => cp.product.name).join(', ')}` :
                    'Assign a product to this customer to get started.'
                  }
                </Alert>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Customer Selected
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a customer from the list or add a new customer
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Status Change Notes Dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ ...statusDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Update Task Status: {statusDialog.taskName}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            Changing status to: <strong>{statusDialog.currentStatus.replace('_', ' ')}</strong>
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            placeholder="Add notes about this status change..."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            helperText="These notes will be recorded with the status change"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ ...statusDialog, open: false })}>Cancel</Button>
          <Button onClick={() => handleStatusSave(statusDialog.currentStatus)} variant="contained" color="primary">
            Confirm Change
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Dialog */}
      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => {
          setCustomerDialogOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      />

      {/* Assign Product Dialog */}
      {selectedCustomerId && (
        <AssignProductDialog
          open={assignProductDialogOpen}
          onClose={() => setAssignProductDialogOpen(false)}
          customerId={selectedCustomerId}
          onAssigned={async () => {
            setAssignProductDialogOpen(false);
            await refetch();
            // Refetch plan data if a product is already selected
            if (adoptionPlanId) {
              await refetchPlan();
            }
            setSuccess('Product assigned successfully');
          }}
        />
      )}

      {/* Edit Entitlements Dialog */}
      {selectedCustomerProduct && (
        <EditEntitlementsDialog
          open={editEntitlementsDialogOpen}
          onClose={() => setEditEntitlementsDialogOpen(false)}
          customerProductId={selectedCustomerProduct.id}
          productId={selectedCustomerProduct.product.id}
          currentLicenseLevel={selectedCustomerProduct.licenseLevel}
          currentSelectedOutcomes={selectedCustomerProduct.selectedOutcomes || []}
          currentSelectedReleases={selectedCustomerProduct.selectedReleases || []}
          onSave={(licenseLevel, selectedOutcomeIds, selectedReleaseIds) => {
            updateCustomerProduct({
              variables: {
                id: selectedCustomerProduct.id,
                input: {
                  licenseLevel,
                  selectedOutcomeIds,
                  selectedReleaseIds,
                },
              },
            });
          }}
        />
      )}

      {/* Delete Product Confirmation Dialog */}
      {selectedCustomerProduct && (
        <Dialog
          open={deleteProductDialogOpen}
          onClose={() => setDeleteProductDialogOpen(false)}
        >
          <DialogTitle>Remove Product from Customer?</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This will permanently remove <strong>{selectedCustomerProduct.product.name}</strong> from this customer, 
              including the adoption plan and all task progress.
            </Alert>
            <Typography>
              Are you sure you want to continue? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteProductDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRemoveProduct}
              color="error"
              variant="contained"
              disabled={removeLoading}
            >
              {removeLoading ? 'Removing...' : 'Remove Product'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Task Details Dialog */}
      <Dialog
        open={taskDetailsDialogOpen}
        onClose={() => setTaskDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Task Details
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedTask.name}
              </Typography>
              
              {selectedTask.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.description}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sequence
                  </Typography>
                  <Chip label={`#${selectedTask.sequenceNumber}`} size="small" />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Weight
                  </Typography>
                  <Chip label={`${selectedTask.weight}%`} size="small" />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedTask.status.replace('_', ' ')}
                    color={getStatusColor(selectedTask.status) as any}
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  License Level
                </Typography>
                <Chip label={selectedTask.licenseLevel} color="primary" size="small" />
              </Box>

              {selectedTask.releases && selectedTask.releases.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Releases
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedTask.releases.map((release: any) => (
                      <Chip 
                        key={release.id} 
                        label={`${release.name}${release.version ? ` ${release.version}` : ''}`}
                        color="secondary"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.outcomes && selectedTask.outcomes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Outcomes
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedTask.outcomes.map((outcome: any) => (
                      <Chip 
                        key={outcome.id} 
                        label={outcome.name}
                        color="success"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedTask.estMinutes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estimated Time
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.estMinutes} minutes
                  </Typography>
                </Box>
              )}

              {selectedTask.priority && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Priority
                  </Typography>
                  <Chip label={selectedTask.priority} size="small" />
                </Box>
              )}

              {selectedTask.howToDoc && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Documentation
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="a" 
                    href={selectedTask.howToDoc}
                    target="_blank"
                    sx={{ color: 'primary.main', textDecoration: 'none' }}
                  >
                    View Documentation →
                  </Typography>
                </Box>
              )}

              {selectedTask.howToVideo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Video Tutorial
                  </Typography>
                  <Typography 
                    variant="body2" 
                    component="a" 
                    href={selectedTask.howToVideo}
                    target="_blank"
                    sx={{ color: 'primary.main', textDecoration: 'none' }}
                  >
                    Watch Video →
                  </Typography>
                </Box>
              )}

              {selectedTask.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedTask.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {selectedTask.statusUpdatedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Last updated: {new Date(selectedTask.statusUpdatedAt).toLocaleString()}
                    {selectedTask.statusUpdatedBy && ` by ${selectedTask.statusUpdatedBy}`}
                    {selectedTask.statusUpdateSource && (
                      <Chip 
                        label={selectedTask.statusUpdateSource}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                        color={
                          selectedTask.statusUpdateSource === 'MANUAL' ? 'primary' :
                          selectedTask.statusUpdateSource === 'TELEMETRY' ? 'success' :
                          selectedTask.statusUpdateSource === 'IMPORT' ? 'info' :
                          'default'
                        }
                      />
                    )}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
