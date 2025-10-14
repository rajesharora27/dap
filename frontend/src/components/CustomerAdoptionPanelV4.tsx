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
      tasks {
        id
        name
        description
        status
        weight
        sequenceNumber
        statusUpdatedAt
        statusUpdatedBy
        statusNotes
        telemetryAttributes {
          id
          name
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
      statusNotes
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
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
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

  const { data: planData, refetch: refetchPlan } = useQuery(GET_ADOPTION_PLAN, {
    variables: { id: adoptionPlanId },
    skip: !adoptionPlanId,
    fetchPolicy: 'cache-and-network',
  });

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
    onCompleted: () => {
      refetchPlan();
      refetch(); // Refresh to update progress in customer list
      setSuccess('Task status updated successfully');
      setStatusDialog({ ...statusDialog, open: false });
      setStatusNotes('');
    },
    onError: (err) => setError(err.message),
  });

  const [syncAdoptionPlan] = useMutation(SYNC_ADOPTION_PLAN, {
    onCompleted: () => {
      refetchPlan();
      refetch();
      setSuccess('Adoption plan synced successfully');
    },
    onError: (err) => setError(err.message),
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
                {selectedProductId && planData?.adoptionPlan?.needsSync && (
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
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            label={selectedCustomerProduct.licenseLevel} 
                            color="primary" 
                            size="small" 
                          />
                          {planData.adoptionPlan.needsSync && (
                            <Chip label="Sync Needed" color="warning" icon={<Sync />} size="small" />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {planData.adoptionPlan.completedTasks} / {planData.adoptionPlan.totalTasks} tasks completed
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {planData.adoptionPlan.progressPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={planData.adoptionPlan.progressPercentage}
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
                      <Typography variant="h6" sx={{ mb: 2 }}>Tasks</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={60}>#</TableCell>
                              <TableCell>Task Name</TableCell>
                              <TableCell width={100}>Weight</TableCell>
                              <TableCell width={150}>Status</TableCell>
                              <TableCell width={120}>Telemetry</TableCell>
                              <TableCell width={100}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {planData.adoptionPlan.tasks.map((task: any) => (
                              <TableRow key={task.id} hover>
                                <TableCell>{task.sequenceNumber}</TableCell>
                                <TableCell>
                                  <Typography variant="body2">{task.name}</Typography>
                                  {task.description && (
                                    <Typography variant="caption" color="text.secondary">
                                      {task.description}
                                    </Typography>
                                  )}
                                  {task.statusUpdatedAt && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Updated: {new Date(task.statusUpdatedAt).toLocaleString()}
                                      {task.statusUpdatedBy && ` by ${task.statusUpdatedBy}`}
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
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </>
              ) : selectedProductId ? (
                <Alert severity="info">
                  No adoption plan found for this product. Click Sync to create one.
                </Alert>
              ) : (
                <Alert severity="info">
                  Select a product to view adoption plan, or assign a new product to this customer.
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
          onAssigned={() => {
            setAssignProductDialogOpen(false);
            refetch();
            setSuccess('Product assigned successfully');
          }}
        />
      )}
    </Box>
  );
}
