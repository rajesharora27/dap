import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, Sync, Download, Upload, Assessment } from '@mui/icons-material';
import { gql, useQuery, useMutation } from '@apollo/client';
import { AssignSolutionDialog } from './dialogs/AssignSolutionDialog';
import { EditSolutionEntitlementsDialog } from './dialogs/EditSolutionEntitlementsDialog';
import { SolutionAdoptionPlanView } from './solution-adoption/SolutionAdoptionPlanView';

const GET_CUSTOMER_SOLUTIONS = gql`
  query GetCustomerSolutions($customerId: ID!) {
    customer(id: $customerId) {
      id
      name
      solutions {
        id
        name
        licenseLevel
        solution {
          id
          name
        }
        adoptionPlan {
          id
          progressPercentage
          needsSync
          lastSyncedAt
        }
      }
    }
  }
`;

const CREATE_SOLUTION_ADOPTION_PLAN = gql`
  mutation CreateSolutionAdoptionPlan($customerSolutionId: ID!) {
    createSolutionAdoptionPlan(customerSolutionId: $customerSolutionId) {
      id
      progressPercentage
    }
  }
`;

const SYNC_SOLUTION_ADOPTION_PLAN = gql`
  mutation SyncSolutionAdoptionPlan($solutionAdoptionPlanId: ID!) {
    syncSolutionAdoptionPlan(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
    }
  }
`;

const REMOVE_SOLUTION_FROM_CUSTOMER = gql`
  mutation RemoveSolutionFromCustomer($id: ID!) {
    removeSolutionFromCustomerEnhanced(id: $id) {
      success
      message
    }
  }
`;

const GET_SOLUTION_ADOPTION_PLAN = gql`
  query GetSolutionAdoptionPlan($id: ID!) {
    solutionAdoptionPlan(id: $id) {
      id
      progressPercentage
      totalTasks
      completedTasks
      needsSync
      lastSyncedAt
    }
  }
`;

const EXPORT_SOLUTION_TELEMETRY_TEMPLATE = gql`
  mutation ExportSolutionTelemetryTemplate($solutionAdoptionPlanId: ID!) {
    exportSolutionAdoptionPlanTelemetryTemplate(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      url
      filename
      taskCount
      attributeCount
    }
  }
`;

const IMPORT_SOLUTION_TELEMETRY = gql`
  mutation ImportSolutionTelemetry($solutionAdoptionPlanId: ID!, $file: Upload!) {
    importSolutionAdoptionPlanTelemetry(solutionAdoptionPlanId: $solutionAdoptionPlanId, file: $file) {
      success
      batchId
      summary {
        tasksProcessed
        attributesUpdated
        criteriaEvaluated
        errors
      }
      taskResults {
        taskId
        taskName
        attributesUpdated
        criteriaMet
        criteriaTotal
        completionPercentage
        errors
      }
    }
  }
`;

const EVALUATE_ALL_SOLUTION_TASKS_TELEMETRY = gql`
  mutation EvaluateAllSolutionTasksTelemetry($solutionAdoptionPlanId: ID!) {
    evaluateAllSolutionTasksTelemetry(solutionAdoptionPlanId: $solutionAdoptionPlanId) {
      id
      progressPercentage
      totalTasks
      completedTasks
      tasks {
        id
        name
        status
        statusUpdatedAt
        statusUpdatedBy
        statusUpdateSource
        telemetryAttributes {
          id
          isMet
        }
      }
    }
  }
`;

interface Props {
  customerId: string;
}

export const CustomerSolutionPanel: React.FC<Props> = ({ customerId }) => {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editEntitlementsDialogOpen, setEditEntitlementsDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CUSTOMER_SOLUTIONS, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: 'network-only'
  });

  // Auto-select last used solution or first available solution
  useEffect(() => {
    if (!data?.customer?.solutions || data.customer.solutions.length === 0) {
      setSelectedSolutionId(null);
      return;
    }

    const solutions = data.customer.solutions;
    
    // Try to load last selected solution from localStorage
    const lastSelectedKey = `lastSolutionAdoptionPlan_${customerId}`;
    const lastSelectedId = localStorage.getItem(lastSelectedKey);
    
    // Check if last selected solution still exists
    if (lastSelectedId && solutions.some((s: any) => s.id === lastSelectedId)) {
      setSelectedSolutionId(lastSelectedId);
    } else if (!selectedSolutionId) {
      // Default to first solution with adoption plan, or just first solution
      const solutionWithPlan = solutions.find((s: any) => s.adoptionPlan);
      setSelectedSolutionId(solutionWithPlan?.id || solutions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.customer?.solutions, customerId]); // Intentionally excluding selectedSolutionId to prevent infinite loop

  // Save selected solution to localStorage when it changes
  useEffect(() => {
    if (selectedSolutionId && customerId) {
      const lastSelectedKey = `lastSolutionAdoptionPlan_${customerId}`;
      localStorage.setItem(lastSelectedKey, selectedSolutionId);
    }
  }, [selectedSolutionId, customerId]);

  // Memoize selected solution and adoption plan ID to prevent unnecessary re-renders
  const selectedSolutionData = React.useMemo(() => 
    data?.customer?.solutions?.find((cs: any) => cs.id === selectedSolutionId),
    [data?.customer?.solutions, selectedSolutionId]
  );

  const adoptionPlanIdForQuery = selectedSolutionData?.adoptionPlan?.id;

  const { data: planData, refetch: refetchPlan } = useQuery(GET_SOLUTION_ADOPTION_PLAN, {
    variables: { id: adoptionPlanIdForQuery },
    skip: !selectedSolutionId || !selectedSolutionData?.adoptionPlan
  });

  const [createAdoptionPlan] = useMutation(CREATE_SOLUTION_ADOPTION_PLAN, {
    refetchQueries: ['GetCustomers', 'GetCustomerSolutions'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      refetch();
    },
    onError: (err) => {
      console.error('Error creating adoption plan:', err);
    }
  });

  const [syncPlan, { loading: syncLoading }] = useMutation(SYNC_SOLUTION_ADOPTION_PLAN, {
    onCompleted: () => {
      refetch();
      refetchPlan();
    },
    onError: (err) => {
      console.error('Error syncing adoption plan:', err);
      alert('Failed to sync: ' + err.message);
    }
  });

  const [removeSolution, { loading: removeLoading }] = useMutation(REMOVE_SOLUTION_FROM_CUSTOMER, {
    refetchQueries: ['GetCustomers', 'GetCustomerSolutions'],
    awaitRefetchQueries: true,
    onCompleted: (result) => {
      if (result.removeSolutionFromCustomerEnhanced.success) {
        setSelectedSolutionId(null);
        refetch();
        setDeleteConfirmDialogOpen(false);
      } else {
        alert('Failed to remove solution: ' + result.removeSolutionFromCustomerEnhanced.message);
      }
    },
    onError: (err) => {
      console.error('Error removing solution:', err);
      alert('Failed to remove solution: ' + err.message);
    }
  });

  const [exportTelemetryTemplate] = useMutation(EXPORT_SOLUTION_TELEMETRY_TEMPLATE, {
    onCompleted: async (data) => {
      const { url, filename } = data.exportSolutionAdoptionPlanTelemetryTemplate;
      
      try {
        // Prepend base path if deployed at subpath (e.g., /dap/)
        const basePath = import.meta.env.BASE_URL || '/';
        const fileUrl = basePath === '/' ? url : `${basePath.replace(/\/$/, '')}${url}`;
        
        // Use relative path for download - works with Vite proxy and production reverse proxy
        const response = await fetch(fileUrl, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        // Get the blob and create download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err: any) {
        console.error('Download error:', err);
        alert('Failed to download telemetry template: ' + err.message);
      }
    },
    onError: (err) => {
      console.error('Export error:', err);
      alert('Failed to export telemetry template: ' + err.message);
    }
  });

  const [evaluateAllTasks] = useMutation(EVALUATE_ALL_SOLUTION_TASKS_TELEMETRY, {
    onCompleted: () => {
      refetch();
      refetchPlan();
      alert('All tasks re-evaluated successfully');
    },
    onError: (err) => {
      console.error('Evaluation error:', err);
      alert('Failed to evaluate tasks: ' + err.message);
    }
  });

  const handleSync = () => {
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;
    if (adoptionPlanId) {
      syncPlan({ variables: { solutionAdoptionPlanId: adoptionPlanId } });
    }
  };

  const handleDelete = () => {
    if (selectedSolutionId) {
      removeSolution({ variables: { id: selectedSolutionId } });
    }
  };

  const handleExportTelemetry = () => {
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;
    if (adoptionPlanId) {
      exportTelemetryTemplate({ variables: { solutionAdoptionPlanId: adoptionPlanId } });
    }
  };

  const handleImportTelemetry = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;
    
    if (!file || !adoptionPlanId) {
      alert('Please select a file and solution');
      return;
    }
    
    try {
      // Use REST API for file upload (simpler than GraphQL file uploads)
      const formData = new FormData();
      formData.append('file', file);
      
      // Prepend BASE_URL for subpath deployment support
      const basePath = import.meta.env.BASE_URL || '/';
      const uploadUrl = basePath === '/' 
        ? `/api/solution-telemetry/import/${adoptionPlanId}`
        : `${basePath.replace(/\/$/, '')}/api/solution-telemetry/import/${adoptionPlanId}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'admin',
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        refetch();
        refetchPlan();
        alert(`Import completed successfully!\nTasks processed: ${result.summary.tasksProcessed}\nAttributes updated: ${result.summary.attributesUpdated}`);
      } else {
        alert(`Import failed: ${result.summary.errors || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      alert(`Failed to import telemetry: ${err.message}`);
    }
    
    // Reset the input so the same file can be re-uploaded
    event.target.value = '';
  };

  const handleEvaluateAll = () => {
    const adoptionPlanId = selectedCustomerSolution?.adoptionPlan?.id;
    if (adoptionPlanId) {
      evaluateAllTasks({ variables: { solutionAdoptionPlanId: adoptionPlanId } });
    }
  };

  if (!customerId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No Customer Selected
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a customer from the dropdown to view their solutions
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load customer solutions: {error.message}
      </Alert>
    );
  }

  const customer = data?.customer;
  const customerSolutions = customer?.solutions || [];
  const selectedCustomerSolution = customerSolutions.find((cs: any) => cs.id === selectedSolutionId);

  return (
    <Box>
      {/* Solution Selector and Actions */}
      <Paper 
        elevation={1}
        sx={{ 
          p: { xs: 1.5, sm: 2, md: 2.5 }, 
          mb: { xs: 2, md: 3 }, 
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: '#E0E0E0'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 2 }, alignItems: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 300, flex: '1 1 300px' }} size="small">
            <InputLabel>Select Solution</InputLabel>
            <Select
              value={selectedSolutionId || ''}
              onChange={(e) => setSelectedSolutionId(e.target.value)}
              label="Select Solution"
            >
              {customerSolutions.map((cs: any) => (
                <MenuItem key={cs.id} value={cs.id}>
                  {cs.name ? `${cs.name} - ${cs.solution.name}` : cs.solution.name} ({cs.licenseLevel})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedSolutionId && (
            <>
              <Tooltip title="Edit solution entitlements">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => setEditEntitlementsDialogOpen(true)}
                  sx={{
                    backgroundColor: '#0070D2',
                    '&:hover': {
                      backgroundColor: '#005FB2'
                    }
                  }}
                >
                  Edit
                </Button>
              </Tooltip>
              {selectedCustomerSolution?.adoptionPlan && (
                <>
              <Tooltip title="Recalculate solution adoption plan progress from underlying product and solution adoption plans">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Sync />}
                  onClick={handleSync}
                  disabled={syncLoading}
                  sx={{
                    borderColor: '#6B778C',
                    color: '#42526E',
                    '&:hover': {
                      borderColor: '#42526E',
                      backgroundColor: 'rgba(66, 82, 110, 0.04)'
                    }
                  }}
                >
                  {syncLoading ? 'Syncing...' : 'Sync Solution Adoption Plan'}
                </Button>
              </Tooltip>
              <Tooltip title="Export Telemetry Template for data entry">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={handleExportTelemetry}
                  sx={{
                    borderColor: '#6B778C',
                    color: '#42526E',
                    '&:hover': {
                      borderColor: '#42526E',
                      backgroundColor: 'rgba(66, 82, 110, 0.04)'
                    }
                  }}
                >
                  Export Template
                </Button>
              </Tooltip>
              <Tooltip title="Import completed Telemetry Template file">
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<Upload />}
                  sx={{
                    borderColor: '#6B778C',
                    color: '#42526E',
                    '&:hover': {
                      borderColor: '#42526E',
                      backgroundColor: 'rgba(66, 82, 110, 0.04)'
                    }
                  }}
                >
                  Import Telemetry
                  <input
                    type="file"
                    hidden
                    accept=".xlsx,.xls"
                    onChange={handleImportTelemetry}
                  />
                </Button>
              </Tooltip>
              <Tooltip title="Re-evaluate all tasks based on telemetry criteria">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Assessment />}
                  onClick={handleEvaluateAll}
                  sx={{
                    borderColor: '#6B778C',
                    color: '#42526E',
                    '&:hover': {
                      borderColor: '#42526E',
                      backgroundColor: 'rgba(66, 82, 110, 0.04)'
                    }
                  }}
                >
                  Re-evaluate
                </Button>
              </Tooltip>
                </>
              )}
            </>
          )}
        </Box>

        {/* Solution Summary Cards */}
        {customerSolutions.length === 0 && (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 6, 
              px: 3,
              backgroundColor: 'background.default',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom fontWeight="500">
              No Solutions Assigned Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Solutions bundle multiple products together for unified adoption tracking and comprehensive progress monitoring
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAssignDialogOpen(true)}
            >
              Assign First Solution
            </Button>
          </Box>
        )}
      </Paper>

      {/* Adoption Plan View */}
      {selectedCustomerSolution?.adoptionPlan && (
        <SolutionAdoptionPlanView
          solutionAdoptionPlanId={selectedCustomerSolution.adoptionPlan.id}
          customerName={customer.name}
        />
      )}

      {selectedSolutionId && !selectedCustomerSolution?.adoptionPlan && (
        <Alert severity="warning" sx={{ mt: 2 }} action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={async () => {
              try {
                await createAdoptionPlan({ 
                  variables: { customerSolutionId: selectedSolutionId } 
                });
                refetch();
              } catch (err: any) {
                console.error('Failed to create adoption plan:', err);
                alert('Failed to create adoption plan: ' + err.message);
              }
            }}
          >
            Create Now
          </Button>
        }>
          This solution does not have an adoption plan yet.
        </Alert>
      )}

      {/* Assign Solution Dialog */}
      <AssignSolutionDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        customerId={customerId}
        onSuccess={() => {
          refetch();
          setAssignDialogOpen(false);
        }}
      />

      {/* Edit Entitlements Dialog */}
      {selectedSolutionId && (
        <EditSolutionEntitlementsDialog
          open={editEntitlementsDialogOpen}
          onClose={() => setEditEntitlementsDialogOpen(false)}
          customerSolutionId={selectedSolutionId}
          onSuccess={() => {
            refetch();
            refetchPlan();
            setEditEntitlementsDialogOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialogOpen}
        onClose={() => setDeleteConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this solution from the customer? This will also remove:
          </Typography>
          <Box component="ul" sx={{ mt: 2 }}>
            <li>The solution adoption plan</li>
            <li>All underlying product assignments created from this solution</li>
            <li>All product adoption plans for those products</li>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={removeLoading}
          >
            {removeLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


